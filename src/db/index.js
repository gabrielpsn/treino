import Dexie from 'dexie';

export const WEEK_KEY_PREFIX = 'week';

// Chave de semana no formato YYYY-Www (ISO 8601), usada para separar o histórico
// de cada semana e fazer o calendário "virar" sozinho sem perder o histórico anterior.
export function getCurrentWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function buildWeekCheckId(dayId, weekKey = getCurrentWeekKey()) {
  return `${WEEK_KEY_PREFIX}:${weekKey}:${dayId}`;
}

// Dia local no formato YYYY-MM-DD. Usa as partes locais de propósito: a sessão
// de treino pertence ao dia em que a pessoa treinou, não ao dia UTC, que pode
// ser o anterior para quem treina à noite.
export function getDayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const DB_NAME = 'TreinoProDB';

// Marcador da migração de workout_logs para uma sessão inicial. Permite saber
// se a migração já rodou sem depender de contador ou timestamp.
export const LEGACY_SESSION_SOURCE = 'legacy-workout-logs';

export class TreinoDatabase extends Dexie {
  constructor(name = DB_NAME) {
    super(name);
    this.version(1).stores({
      user_profile: 'id',                 // Perfil único: biometria, preferências, nível, foco
      active_plan: 'id',                  // Plano de treino e dieta atualmente gerado
      workout_logs: 'id, date, workoutId, exerciseId', // Estado atual da carga por exercício
      weekly_checks: 'id, weekKey',       // Registro de dias concluídos na semana
      custom_exercises: 'id, muscleGroup' // Exercícios adicionados manualmente pelo usuário
    });

    // v2: weekly_checks passa a ser chaveado por semana (week:YYYY-Www:dayId),
    // permitindo o calendário reiniciar sozinho a cada semana.
    this.version(2).stores({
      user_profile: 'id',
      active_plan: 'id',
      workout_logs: 'id, date, workoutId, exerciseId',
      weekly_checks: 'id, weekKey, [weekKey+dayId]',
      custom_exercises: 'id, muscleGroup'
    });

    // v3: histórico de verdade. workout_logs guarda só o último estado de cada
    // exercício (uma linha por exerciseId, sobrescrita a cada treino), o que
    // torna impossível reconstruir sessões passadas. As duas tabelas novas
    // gravam o histórico append-only:
    //   workout_sessions -> um treino executado (split, início, fim)
    //   session_sets     -> as séries registradas dentro daquela sessão
    this.version(3).stores({
      user_profile: 'id',
      active_plan: 'id',
      workout_logs: 'id, date, workoutId, exerciseId',
      weekly_checks: 'id, weekKey, [weekKey+dayId]',
      custom_exercises: 'id, muscleGroup',
      workout_sessions: '++id, dayKey, startedAt, splitId, source, [dayKey+splitId]',
      session_sets: 'id, sessionId, exerciseId, [sessionId+exerciseId]'
    });

    // v4: custom_exercises sai de inércia. Desde a v1 a tabela existia com um
    // índice em "muscleGroup", campo que nenhum código escrevia — o CRUD real
    // usa "muscle", o mesmo nome do catálogo embutido, para o exercício do
    // usuário passar pelos mesmos filtros sem traducción. Nenhum dado precisa ser
    // migrado: a tabela estava vazia.
    this.version(4).stores({
      user_profile: 'id',
      active_plan: 'id',
      workout_logs: 'id, date, workoutId, exerciseId',
      weekly_checks: 'id, weekKey, [weekKey+dayId]',
      custom_exercises: 'id, muscle, [muscle+pattern]',
      workout_sessions: '++id, dayKey, startedAt, splitId, source, [dayKey+splitId]',
      session_sets: 'id, sessionId, exerciseId, [sessionId+exerciseId]'
    });
  }
}

export const db = new TreinoDatabase();

// Migração de dados: registros antigos de weekly_checks usavam apenas o id do dia
// ("seg", "ter", ...) e acabavam reaproveitando na semana seguinte. Reescrevemos o id
// com a semana corrente para que o passe semanal volte a fazer sentido.
export async function migrateLegacyWeeklyChecks(database = db) {
  const rows = await database.weekly_checks.toArray();
  const weekKey = getCurrentWeekKey();
  const legacy = rows.filter(r => !r.weekKey && typeof r.id === 'string' && !r.id.startsWith(`${WEEK_KEY_PREFIX}:`));

  if (legacy.length === 0) return 0;

  // Se o usuário já registrou dias no formato novo, o legado perde: sobrescrever
  // aqui apagaria a marcação que ele acabou de fazer.
  const existingCurrent = await database.weekly_checks.where('weekKey').equals(weekKey).toArray();
  const alreadyMigratedDays = new Set(existingCurrent.map(r => r.dayId));

  let migrated = 0;

  for (const row of legacy) {
    if (!alreadyMigratedDays.has(row.id)) {
      await database.weekly_checks.put({
        ...row,
        id: buildWeekCheckId(row.id, weekKey),
        weekKey,
        dayId: row.id,
        migratedAt: new Date().toISOString()
      });
      migrated++;
    }
    await database.weekly_checks.delete(row.id);
  }

  return migrated;
}

// Migração v2 -> v3: os registros de workout_logs viram uma sessão única para
// que as cargas já anotadas não sumam quando o histórico passar a existir.
// Os logs originais NÃO são apagados: eles continuam sendo o estado atual lido
// pela tela de treino. A migração é idempotente, então rodar em todo boot é
// seguro e barato (uma consulta e, no caso comum, nada).
export async function migrateLegacyLogsToSession(database = db) {
  // `source` é indexado só para esta consulta: assim o boot não precisa varrer
  // todas as sessões já registradas para saber se a migração rodou.
  const alreadyDone = await database.workout_sessions
    .where('source')
    .equals(LEGACY_SESSION_SOURCE)
    .first();

  if (alreadyDone) return null;

  // Se já existe QUALQUER sessão, os logs não são mais legado: estão sendo
  // mantidos em paralelo pelo caminho novo. Migrar de novo criaria uma sessão
  // duplicada com as mesmas cargas a cada abertura do app.
  const hasAnySession = await database.workout_sessions.limit(1).count();
  if (hasAnySession > 0) return null;

  const logs = await database.workout_logs.toArray();
  if (logs.length === 0) return null;

  const now = new Date();
  const dayKey = getDayKey(now);
  const timestamp = now.toISOString();

  return database.transaction('rw', database.workout_sessions, database.session_sets, async () => {
    const sessionId = await database.workout_sessions.add({
      dayKey,
      weekKey: getCurrentWeekKey(now),
      startedAt: timestamp,
      finishedAt: timestamp,
      splitId: logs.find(l => l.workoutId)?.workoutId || null,
      goal: null,
      source: LEGACY_SESSION_SOURCE,
      note: 'Sessão reconstruída a partir das cargas já registradas no app.',
      createdAt: timestamp
    });

    // Um set por exercício, preservando carga, reps e conclusão exatamente como
    // estavam. updatedAt do log vira o timestamp do set.
    await database.session_sets.bulkPut(
      logs.map(log => ({
        id: `${sessionId}:${log.exerciseId}`,
        sessionId,
        exerciseId: log.exerciseId,
        splitId: log.workoutId || null,
        weight: log.weight ?? '',
        reps: log.reps ?? '',
        isDone: !!log.isDone,
        recordedAt: log.updatedAt || timestamp
      }))
    );

    return sessionId;
  });
}