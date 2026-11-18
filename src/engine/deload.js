/**
 * Detecção de estagnação e sugestão de semana de deload.
 *
 * Lê o histórico de sessões (com séries) e responde: vale a pena aliviar a
 * próxima semana? Os critérios são conservadores de propósito — sugerir deload
 * cedo demais custa uma semana de treino; tarde demais, só um pouco de
 * cansaço. Por isso a sugestão é opcional e o usuário aceita ou dispensa.
 */

import { parseReps, parseWeight } from './history.js';

const DAY_MS = 86_400_000;
export const DELOAD_LOOKBACK_DAYS = 35;
export const STALL_MIN_SESSIONS = 3;
export const STALL_IMPROVEMENT_PCT = 1;
export const LONG_BLOCK_WEEKS = 8;
export const DELOAD_PRESCRIPTION = {
  loadFactor: 0.6,
  setsFactor: 0.5,
  durationDays: 7,
  targetRir: 4
};

function toDate(session) {
  const raw = session?.startedAt || (session?.dayKey ? `${session.dayKey}T12:00:00` : null);
  const t = raw ? Date.parse(raw) : NaN;
  return Number.isFinite(t) ? t : null;
}

function bestE1rm(sets) {
  let best = 0;
  for (const s of sets) {
    const w = parseWeight(s.weight);
    const r = parseReps(s.reps);
    if (w && r && w > 0 && r > 0) best = Math.max(best, w * (1 + r / 30));
  }
  return best;
}

/** Semana ISO (YYYY-Www) de um timestamp, para contar semanas seguidas. */
export function isoWeekKey(ms) {
  const d = new Date(ms);
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / DAY_MS + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Quantas semanas seguidas (até a atual) tiveram pelo menos um treino. */
export function consecutiveTrainingWeeks(sessions = [], { now = Date.now(), lastDeloadWeekKey = null } = {}) {
  const weeks = new Set();
  for (const s of sessions) {
    const t = toDate(s);
    if (t !== null && (s.sets || []).some(set => set?.isDone)) weeks.add(isoWeekKey(t));
  }
  let cursor = now;
  // A semana atual pode ainda não ter treino: começa a contar da anterior.
  if (!weeks.has(isoWeekKey(cursor))) cursor -= 7 * DAY_MS;
  let count = 0;
  while (count < 104) {
    const key = isoWeekKey(cursor);
    if (!weeks.has(key) || key === lastDeloadWeekKey) break;
    count++;
    cursor -= 7 * DAY_MS;
  }
  return count;
}

/**
 * Para cada exercício com pelo menos 3 sessões na janela, compara o melhor
 * 1RM estimado das 2 sessões mais recentes com o melhor das anteriores.
 */
export function detectStalledExercises(sessions = [], { now = Date.now(), lookbackDays = DELOAD_LOOKBACK_DAYS } = {}) {
  const since = now - lookbackDays * DAY_MS;
  const byExercise = new Map();

  const ordered = [...sessions]
    .map(s => ({ s, t: toDate(s) }))
    .filter(x => x.t !== null && x.t >= since && x.t <= now)
    .sort((a, b) => a.t - b.t);

  for (const { s, t } of ordered) {
    const done = (s.sets || []).filter(set => set?.isDone && set.exerciseId);
    const perExercise = new Map();
    for (const set of done) {
      if (!perExercise.has(set.exerciseId)) perExercise.set(set.exerciseId, []);
      perExercise.get(set.exerciseId).push(set);
    }
    for (const [exerciseId, sets] of perExercise) {
      const e1rm = bestE1rm(sets);
      if (e1rm <= 0) continue;
      if (!byExercise.has(exerciseId)) byExercise.set(exerciseId, []);
      byExercise.get(exerciseId).push({ t, e1rm });
    }
  }

  const evaluated = [];
  for (const [exerciseId, points] of byExercise) {
    if (points.length < STALL_MIN_SESSIONS) continue;
    const recent = points.slice(-2);
    const earlier = points.slice(0, -2);
    const recentBest = Math.max(...recent.map(p => p.e1rm));
    const earlierBest = Math.max(...earlier.map(p => p.e1rm));
    const changePct = ((recentBest - earlierBest) / earlierBest) * 100;
    evaluated.push({
      exerciseId,
      sessions: points.length,
      changePct: Math.round(changePct * 10) / 10,
      stalled: changePct < STALL_IMPROVEMENT_PCT
    });
  }
  return evaluated;
}

/** Fração das séries recentes feitas até a falha (RIR 0). */
export function failureRatio(sessions = [], { now = Date.now(), days = 14 } = {}) {
  const since = now - days * DAY_MS;
  let withRir = 0;
  let atFailure = 0;
  for (const s of sessions) {
    const t = toDate(s);
    if (t === null || t < since || t > now) continue;
    for (const set of s.sets || []) {
      if (!set?.isDone || set.rir === '' || set.rir === null || set.rir === undefined) continue;
      const rir = Number(set.rir);
      if (!Number.isFinite(rir)) continue;
      withRir++;
      if (rir <= 0) atFailure++;
    }
  }
  return withRir >= 6 ? atFailure / withRir : 0;
}

/**
 * Decide se sugere deload. `dismissedWeekKey` / `lastDeloadWeekKey` evitam
 * insistir na mesma semana depois que o usuário respondeu.
 */
export function evaluateDeload(sessions = [], {
  now = Date.now(),
  lastDeloadWeekKey = null,
  dismissedWeekKey = null
} = {}) {
  const currentWeek = isoWeekKey(now);
  const evaluated = detectStalledExercises(sessions, { now });
  const stalled = evaluated.filter(e => e.stalled);
  const stalledRatio = evaluated.length ? stalled.length / evaluated.length : 0;
  const weeks = consecutiveTrainingWeeks(sessions, { now, lastDeloadWeekKey });
  const failure = failureRatio(sessions, { now });

  const reasons = [];
  if (evaluated.length >= 3 && stalledRatio >= 0.5) {
    reasons.push(`${stalled.length} de ${evaluated.length} exercícios sem evolução nas últimas sessões.`);
  }
  if (weeks >= LONG_BLOCK_WEEKS) {
    reasons.push(`${weeks} semanas seguidas de treino sem pausa.`);
  }
  if (failure >= 0.5 && stalledRatio >= 0.3) {
    reasons.push(`${Math.round(failure * 100)}% das séries recentes foram até a falha.`);
  }

  const inDeload = lastDeloadWeekKey === currentWeek;
  const dismissed = dismissedWeekKey === currentWeek;
  return {
    recommended: reasons.length > 0 && !inDeload && !dismissed,
    inDeload,
    reasons,
    stalledExercises: stalled.map(e => e.exerciseId),
    evaluatedCount: evaluated.length,
    consecutiveWeeks: weeks,
    failureRatio: Math.round(failure * 100) / 100,
    weekKey: currentWeek,
    prescription: DELOAD_PRESCRIPTION
  };
}

/** Carga sugerida durante o deload, arredondada para 0,5 kg. */
export function deloadLoad(weight, factor = DELOAD_PRESCRIPTION.loadFactor) {
  const w = parseWeight(weight);
  if (!w || w <= 0) return null;
  return Math.round((w * factor) / 0.5) * 0.5;
}

/** Séries no deload: metade, nunca menos que 1. */
export function deloadSets(sets, factor = DELOAD_PRESCRIPTION.setsFactor) {
  const n = Number(sets);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.max(1, Math.round(n * factor));
}
