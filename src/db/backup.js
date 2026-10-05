import { db } from './index.js';
import { buildSetId } from './sessions.js';
import {
  CUSTOM_ID_PREFIX,
  isCustomExercise,
  validateCustomExercise
} from './customExercises.js';
import { filterSafeExercises } from '../engine/generators/workoutGenerator.js';

// Backup e restauração de todos os dados do usuário.
//
// O export lê de disco, e não dos refs reativos do App: o objetivo do backup
// é ser um retrato do que está realmente salvo, mesmo que a tela ainda não tenha
// chance de "guardar" a última série digitada.
//
// A restauração é uma SUBSTITUIÇÃO, não uma fusão. Um backup descreve um estado
// completo do app; aplicar isso por cima de dados diferentes exigiria inventar
// regras de conflito (qual sessão ganha quando há duas no mesmo dia?) e o
// resultado seria um estado que ninguém escreveu. Substituir é previsível e
// reversível: o usuário guarda o backup antes de trocar de aparelho.

export const BACKUP_KIND = 'treinopro-backup';
export const BACKUP_VERSION = 1;

export const PROFILE_ID = 'current_user';
export const PLAN_ID = 'current_active_plan';

const SESSION_FIELDS = [
  'id', 'dayKey', 'weekKey', 'startedAt', 'finishedAt',
  'splitId', 'goal', 'source', 'note', 'createdAt'
];

const SET_FIELDS = ['id', 'sessionId', 'exerciseId', 'splitId', 'weight', 'reps', 'isDone', 'recordedAt'];

// Perfil: o formato é do onboarding, não do histórico. Coagir cada campo no
// restore é o que impede que um arquivo editado à mão traga `restrictions:
// "joelho"` (string) e faça o filtro articular do app inteiro silenciosamente
// deixar de funcionar.
const PROFILE_FIELDS = {
  userName: str => trimTo(String(str ?? ''), 40),
  goal: str => str,
  gender: str => str,
  ageYears: num => clampInt(num, 10, 100),
  weightKg: num => clampNum(num, 25, 350),
  heightCm: num => clampInt(num, 120, 230),
  daysPerWeek: num => clampInt(num, 1, 7),
  experienceLevel: str => str,
  equipment: str => str,
  restrictions: list => (Array.isArray(list) ? list.filter(r => typeof r === 'string') : [])
};

function trimTo(value, max) {
  return value.length > max ? value.slice(0, max) : value;
}

function clampInt(value, min, max) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function clampNum(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function pick(source, keys) {
  const out = {};
  for (const key of keys) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
}

function pickDefined(source, keys) {
  const out = {};
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) out[key] = source[key];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export async function buildBackup({ database = db, now = new Date() } = {}) {
  const [profileRow, planRow, customRows, logs, checks, sessions] = await Promise.all([
    database.user_profile.get(PROFILE_ID),
    database.active_plan.get(PLAN_ID),
    database.custom_exercises.toArray(),
    database.workout_logs.toArray(),
    database.weekly_checks.toArray(),
    database.workout_sessions.toArray()
  ]);

  const sessionIds = sessions.map(s => s.id);
  const sets = sessionIds.length > 0
    ? await database.session_sets.where('sessionId').anyOf(sessionIds).toArray()
    : [];

  const setsBySession = new Map(sessionIds.map(id => [id, []]));
  for (const set of sets) {
    if (setsBySession.has(set.sessionId)) setsBySession.get(set.sessionId).push(pick(set, SET_FIELDS));
  }

  return {
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    userProfile: profileRow ? { ...profileRow } : null,
    activePlan: planRow ? { ...planRow } : null,
    customExercises: customRows.map(row => ({ ...row })),
    workoutLogs: logs.map(row => ({ ...row })),
    weeklyChecks: checks.map(row => ({ ...row })),
    sessions: sessions.map(session => ({
      ...pick(session, SESSION_FIELDS),
      sets: setsBySession.get(session.id)
    }))
  };
}

export function backupFileName(date = new Date()) {
  return `treino-backup-${date.toISOString().slice(0, 10)}.json`;
}

/**
 * Contagens para a tela de confirmação. O usuário precisa saber o que vai
 * perder antes de confirmar, não depois.
 */
export function summarizeBackup(backup) {
  return {
    exportedAt: backup.exportedAt ?? null,
    userName: backup.userProfile?.userName ?? null,
    equipment: backup.userProfile?.equipment ?? null,
    daysPerWeek: backup.userProfile?.daysPerWeek ?? null,
    splits: backup.activePlan?.workoutSplits?.length ?? 0,
    exercises: (backup.activePlan?.workoutSplits ?? []).reduce(
      (total, split) => total + (split.exercises?.length ?? 0), 0
    ),
    customExercises: backup.customExercises.length,
    sessions: backup.sessions.length,
    sets: backup.sessions.reduce((total, s) => total + s.sets.length, 0)
  };
}

// ---------------------------------------------------------------------------
// Import: validação
// ---------------------------------------------------------------------------

/**
 * Lê o texto de um arquivo de backup.
 *
 * Devolve `{ ok: true, backup, warnings }` ou `{ ok: false, error }`. Nada é
 * escrito no banco aqui: um arquivo inválido precisa falhar antes de tocar em
 * qualquer dado, porque a operação seguinte substitui tudo.
 */
export function parseBackupText(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'O arquivo não é um JSON válido.' };
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'O arquivo não tem o formato de um backup do app.' };
  }

  const warnings = [];

  // Sem `kind`/`version` não é um backup: é um arquivo qualquer. O formato
  // antigo (exportado antes de existir versão) existia, mas não trazia
  // exercícios próprios e sua validação nunca existiu — restaurá-lo despejaria
  // dados não saneados no aparelho, com o filtro articular do perfil do usuário
  // já aplicado por cima. Recusar é mais honesto do que fingir que voltou tudo.
  if (raw.kind !== BACKUP_KIND) {
    return { ok: false, error: 'Este arquivo não é um backup do TreinoPro.' };
  }
  if (typeof raw.version !== 'number' || !Number.isInteger(raw.version) || raw.version < 1) {
    return { ok: false, error: 'Versão de backup inválida.' };
  }
  if (raw.version > BACKUP_VERSION) {
    return {
      ok: false,
      error: 'O backup veio de uma versão mais nova do app e não pode ser restaurado aqui.'
    };
  }

  const backup = normalizeBackup(raw, warnings);
  return { ok: true, backup, warnings };
}

function normalizeBackup(raw, warnings) {
  const sessions = [];
  const seenSessionIds = new Set();

  for (const row of asArray(raw.sessions)) {
    if (!row || typeof row !== 'object' || row.id === undefined || row.id === null) continue;
    const id = row.id;
    if (seenSessionIds.has(id)) continue;
    seenSessionIds.add(id);

    sessions.push({
      // `pick` e não `pickDefined`: uma sessão legítima tem `goal: null`, e
      // descartar o campo mudaria o backup na volta.
      ...pick(row, SESSION_FIELDS.filter(field => field !== 'id')),
      id,
      sets: []
    });
  }

  const sessionById = new Map(sessions.map(s => [s.id, s]));

  // Sets sem sessão correspondente são descartados: a tela de histórico soma por
  // sessão, então uma linha órfã viraria volume fantasma na estatística.
  let orphanSets = 0;
  for (const row of asArray(allSets(raw))) {
    if (!row || typeof row !== 'object') continue;
    const session = sessionById.get(row.sessionId);
    if (!session || !row.exerciseId) {
      orphanSets++;
      continue;
    }
    session.sets.push({
      ...pick(row, SET_FIELDS.filter(field => field !== 'id')),
      // O id é derivado de (sessão, exercício): recalcular garante que um id
      // adulterado no arquivo não crie duas linhas para o mesmo par.
      id: buildSetId(session.id, row.exerciseId),
      sessionId: session.id,
      exerciseId: row.exerciseId,
      isDone: !!row.isDone,
      weight: row.weight ?? '',
      reps: row.reps ?? '',
      recordedAt: row.recordedAt ?? session.startedAt ?? new Date().toISOString()
    });
  }

  if (orphanSets > 0) {
    warnings.push(`${orphanSets} séries sem sessão correspondente foram descartadas.`);
  }

  const customExercises = normalizeCustomExercises(raw.customExercises, warnings);

  const profile = normalizeProfile(raw.userProfile);

  const plan = normalizePlan(raw.activePlan, profile, warnings);

  return {
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : null,
    userProfile: profile,
    activePlan: plan,
    customExercises,
    // O export antigo gravava um objeto (exerciseId -> log); a tabela é uma
    // lista. Aceitar os dois formatos evita invalidar backups já baixados.
    workoutLogs: normalizeLogs(raw.workoutLogs),
    weeklyChecks: normalizeChecks(raw.weeklyChecks),
    sessions
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function allSets(raw) {
  const fromSessions = asArray(raw.sessions)
    .filter(s => s && typeof s === 'object' && Array.isArray(s.sets))
    .flatMap(s => s.sets);
  return [...fromSessions, ...asArray(raw.sessionSets)];
}

function normalizeCustomExercises(value, warnings) {
  const rows = Array.isArray(value) ? value : [];
  const out = [];
  const seen = new Set();
  let invalid = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row || typeof row !== 'object') {
      invalid++;
      continue;
    }

    // Um id de fábrica vindo do arquivo poderia sobrescrever um exercício
    // embutido na tabela do usuário. Só o prefixo custom_ é aceito como id
    // preservado; o resto do id é recalculado a partir do nome.
    const keepId = isCustomExercise(row) ? row.id : null;
    const result = validateCustomExercise(row, { existingId: keepId });

    if (!result.ok) {
      invalid++;
      continue;
    }

    if (seen.has(result.value.id)) {
      skipped++;
      continue;
    }
    seen.add(result.value.id);
    // createdAt ordena a lista do usuário e updatedAt alimenta o "editado em".
    // Preservar os dois do arquivo mantém o restore fiel e o round-trip estável:
    // sem isso, importar um backup marcaria todo exercício como recém-editado.
    out.push({
      ...result.value,
      createdAt: typeof row.createdAt === 'string' ? row.createdAt : result.value.createdAt,
      updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : result.value.updatedAt
    });
  }

  if (invalid > 0) {
    warnings.push(`${invalid} exercícios próprios do arquivo foram descartados por serem inválidos.`);
  }
  if (skipped > 0) {
    warnings.push(`${skipped} exercícios próprios repetidos foram descartados.`);
  }

  return out;
}

function normalizeProfile(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const profile = {};
  for (const [key, sanitize] of Object.entries(PROFILE_FIELDS)) {
    const raw = value[key];
    if (raw === undefined || raw === null) continue;
    profile[key] = sanitize(raw);
  }
  if (Object.keys(profile).length === 0) return null;

  return { id: PROFILE_ID, ...profile };
}

function normalizeLogs(value) {
  // Formato antigo: objeto indexado por exerciseId.
  const rows = Array.isArray(value) ? value : Object.values(value ?? {});
  const out = [];
  const seen = new Set();

  for (const row of rows) {
    if (!row || typeof row !== 'object' || !row.exerciseId || seen.has(row.exerciseId)) continue;
    seen.add(row.exerciseId);
    // Só os campos que o app realmente escreve recebem valor padrão. Injetar
    // `date: null` numa linha que nunca teve data poluiria o banco restaurado e
    // quebraria a comparação entre o backup e o que voltou do banco.
    out.push({
      ...pickDefined(row, ['date', 'updatedAt']),
      id: row.id ?? row.exerciseId,
      exerciseId: row.exerciseId,
      workoutId: row.workoutId ?? null,
      weight: row.weight ?? '',
      reps: row.reps ?? '',
      isDone: !!row.isDone
    });
  }
  return out;
}

function normalizeChecks(value) {
  const out = [];
  const seen = new Set();
  for (const row of asArray(value)) {
    if (!row || typeof row !== 'object' || !row.id || seen.has(row.id)) continue;
    seen.add(row.id);
    out.push({ ...pick(row, ['id', 'weekKey', 'dayId', 'date', 'createdAt']) });
  }
  return out;
}

/**
 * O plano importado passa pelo mesmo filtro de segurança do gerador.
 *
 * Um arquivo é texto: ele pode ter sido editado, vir de outra versão do app ou
 * simplesmente estar corrompido. Aceitar a lista de exercícios como veio seria
 * um contorno do filtro articular — justamente a garantia que o app promete.
 * Exercícios conflitantes são removidos e contados, em vez de o restore inteiro
 * ser recusado.
 */
function normalizePlan(value, profile, warnings) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const splits = asArray(value.workoutSplits).filter(s => s && typeof s === 'object' && s.id);
  if (splits.length === 0) return null;

  let dropped = 0;
  const safeSplits = [];

  for (const split of splits) {
    const exercises = asArray(split.exercises).filter(e => e && typeof e === 'object' && e.id);
    const safe = filterSafeExercises(exercises, {
      restrictions: profile?.restrictions ?? [],
      equipment: profile?.equipment ?? 'gym'
    });
    dropped += exercises.length - safe.length;
    // Spread em vez de lista fixa de campos: o plano tem chaves que o App usa
    // (title, focus, estimatedMinutes) e uma lista fixa de campos aqui apagaria
    // silenciosamente as próximas. Só a lista de exercícios é substituída.
    safeSplits.push({ ...split, exercises: safe });
  }

  if (dropped > 0) {
    warnings.push(
      `${dropped} exercícios do plano conflitavam com o perfil do backup e foram removidos.`
    );
  }

  return {
    ...value,
    id: PLAN_ID,
    generatedAt: value.generatedAt ?? null,
    workoutSplits: safeSplits.filter(split => split.exercises.length > 0)
  };
}

// ---------------------------------------------------------------------------
// Import: escrita
// ---------------------------------------------------------------------------

/**
 * Substitui todos os dados do usuário pelo conteúdo do backup, numa transação.
 *
 * Uma transação só: se qualquer escrita falhar, o banco volta ao estado
 * anterior. Sem isso, um erro no meio da importação deixaria o usuário sem
 * perfil, sem plano ou sem histórico — justamente o que ele estava tentando
 * recuperar.
 */
export async function restoreBackup(backup, { database = db } = {}) {
  const sets = backup.sessions.flatMap(session => session.sets);
  const logRows = backup.workoutLogs;
  const checkRows = backup.weeklyChecks;
  const customRows = backup.customExercises;

  await database.transaction(
    'rw',
    database.user_profile,
    database.active_plan,
    database.workout_logs,
    database.weekly_checks,
    database.custom_exercises,
    database.workout_sessions,
    database.session_sets,
    async () => {
      await database.user_profile.clear();
      await database.active_plan.clear();
      await database.workout_logs.clear();
      await database.weekly_checks.clear();
      await database.custom_exercises.clear();
      await database.workout_sessions.clear();
      await database.session_sets.clear();

      if (backup.userProfile) await database.user_profile.put(backup.userProfile);
      if (backup.activePlan) await database.active_plan.put(backup.activePlan);
      if (customRows.length > 0) await database.custom_exercises.bulkPut(customRows);
      if (logRows.length > 0) await database.workout_logs.bulkPut(logRows);
      if (checkRows.length > 0) await database.weekly_checks.bulkPut(checkRows);
      if (backup.sessions.length > 0) {
        await database.workout_sessions.bulkPut(backup.sessions);
        await database.session_sets.bulkPut(sets);
      }
    }
  );

  return {
    userProfile: Boolean(backup.userProfile),
    activePlan: Boolean(backup.activePlan),
    customExercises: customRows.length,
    workoutLogs: logRows.length,
    weeklyChecks: checkRows.length,
    sessions: backup.sessions.length,
    sets: sets.length
  };
}

export function hasBackupData(backup) {
  return Boolean(
    backup.userProfile ||
    backup.activePlan ||
    backup.customExercises.length > 0 ||
    backup.sessions.length > 0
  );
}