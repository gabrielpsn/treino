import { db, getDayKey, getCurrentWeekKey } from './index';

// Sessão = um treino efetivamente executado. Conjuntos de séries = as linhas
// registradas dentro dela. Este módulo concentra toda a leitura/escrita do
// histórico para que o App.vue não precise conhecer detalhes de chave.

// Id determinístico por (sessão, exercício). Permite reescrever a mesma série
// quantas vezes for necessário sem nunca duplicá-la.
export function buildSetId(sessionId, exerciseId) {
  return `${sessionId}:${exerciseId}`;
}

// Uma sessão fica "aberta" enquanto não tem finishedAt. O usuário pode
// reabrir a mesma sessão ao longo do dia sem criar registros duplicados.
export async function findOpenSession(splitId, { database = db, now = new Date() } = {}) {
  const dayKey = getDayKey(now);
  const rows = await database.workout_sessions
    .where('[dayKey+splitId]')
    .equals([dayKey, splitId])
    .toArray();

  const open = rows.filter(r => !r.finishedAt).sort((a, b) => b.id - a.id)[0];
  if (open) return open;

  // Não achou sessão aberta hoje: qualquer sessão deste split que ficou sem
  // finishedAt e é de um dia anterior precisa ser encerrada. Sem isso ela
  // ficaria "aberta" para sempre, sem duração calculável no histórico.
  // Sessões de hoje ou de data futura são preservadas: um relógio ajustado
  // para trás não deve apagar um treino que ainda está em andamento.
  const stale = await database.workout_sessions.where('splitId').equals(splitId).toArray();
  for (const session of stale) {
    if (session.finishedAt) continue;
    if (session.dayKey && session.dayKey >= dayKey) continue;
    await database.workout_sessions.update(session.id, { finishedAt: now.toISOString() });
  }

  return null;
}

export async function openSession(splitId, { database = db, now = new Date() } = {}) {
  const existing = await findOpenSession(splitId, { database, now });
  if (existing) return existing;

  const timestamp = now.toISOString();
  const id = await database.workout_sessions.add({
    dayKey: getDayKey(now),
    weekKey: getCurrentWeekKey(now),
    startedAt: timestamp,
    finishedAt: null,
    splitId,
    goal: null,
    source: 'live',
    createdAt: timestamp
  });

  return database.workout_sessions.get(id);
}

// Grava (ou sobrescreve) a série do exercício na sessão aberta do split.
// Retorna o id da sessão usada, ou null se nada foi gravado.
export async function recordSet(
  { splitId, exerciseId, weight = '', reps = '', rir = '', isDone = false, sessionId = null },
  { database = db, now = new Date() } = {}
) {
  if (!splitId || !exerciseId) return null;

  const timestamp = now.toISOString();
  const resolvedSessionId = sessionId ?? (await openSession(splitId, { database, now }))?.id;
  if (!resolvedSessionId) return null;

  await database.session_sets.put({
    id: buildSetId(resolvedSessionId, exerciseId),
    sessionId: resolvedSessionId,
    exerciseId,
    splitId,
    weight,
    reps,
    rir,
    isDone,
    recordedAt: timestamp
  });

  return resolvedSessionId;
}

export async function closeSession(sessionId, { database = db, now = new Date() } = {}) {
  if (!sessionId) return;
  await database.workout_sessions.update(sessionId, { finishedAt: now.toISOString() });
}

export async function getSetsForSession(sessionId, { database = db } = {}) {
  if (!sessionId) return [];
  return database.session_sets.where('sessionId').equals(sessionId).toArray();
}

// Sessões mais recentes primeiro. `includeSets` evita a consulta extra quando
// o chamador só precisa dos metadados (ex.: contar treinos no mês).
export async function listSessions({ limit = 50, includeSets = false, database = db } = {}) {
  const sessions = await database.workout_sessions.orderBy('startedAt').reverse().limit(limit).toArray();

  if (!includeSets) return sessions;

  return Promise.all(
    sessions.map(async session => ({
      ...session,
      sets: await getSetsForSession(session.id, { database })
    }))
  );
}

// Última série registrada de um exercício, para mostrar "última carga" na ficha.
export async function getLastSetForExercise(exerciseId, { database = db } = {}) {
  if (!exerciseId) return null;

  const sets = await database.session_sets.where('exerciseId').equals(exerciseId).toArray();
  return sets.sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1))[0] || null;
}

// Projeção exerciseId -> última série de um treino ANTERIOR, para renderizar a
// ficha inteira sem disparar uma consulta por exercício.
//
// `excludeSessionIds` importa: o selo "último treino" precisa mostrar a última
// sessão concluída, não a série que a pessoa está digitando agora. Sem a
// exclusão, limpar o campo de carga faria o selo sumir em vez de revelar o
// valor do treino anterior.
export async function getLastSetsForExercises(exerciseIds, { excludeSessionIds = [], database = db } = {}) {
  const ids = [...new Set((exerciseIds || []).filter(Boolean))];
  if (ids.length === 0) return {};

  const excluded = new Set(excludeSessionIds.filter(id => id !== null && id !== undefined));
  const sets = await database.session_sets.where('exerciseId').anyOf(ids).toArray();

  const latest = {};
  for (const set of sets) {
    if (excluded.has(set.sessionId)) continue;
    const current = latest[set.exerciseId];
    if (!current || set.recordedAt > current.recordedAt) latest[set.exerciseId] = set;
  }
  return latest;
}

// Sessões ainda em andamento hoje. Lidas do banco (e não do cache em memória)
// porque o selo de "último treino" também é calculado no boot, antes de existir
// qualquer cache.
export async function getOpenSessionIds({ database = db, now = new Date() } = {}) {
  const rows = await database.workout_sessions.where('dayKey').equals(getDayKey(now)).toArray();
  return rows.filter(r => !r.finishedAt).map(r => r.id);
}

// Todas as séries de um exercício, em ordem cronológica. Base da progressão
// de carga e dos gráficos.
export async function getExerciseTimeline(exerciseId, { database = db } = {}) {
  if (!exerciseId) return [];
  const sets = await database.session_sets.where('exerciseId').equals(exerciseId).toArray();
  return sets.sort((a, b) => (a.recordedAt > b.recordedAt ? 1 : -1));
}

export async function deleteSession(sessionId, { database = db } = {}) {
  if (!sessionId) return;
  await database.transaction('rw', database.workout_sessions, database.session_sets, async () => {
    await database.session_sets.where('sessionId').equals(sessionId).delete();
    await database.workout_sessions.delete(sessionId);
  });
}