/**
 * Resumo da semana de treino: base do coach por IA, do resumo enviado ao
 * personal e da pontuação das ligas reais. Só números agregados — nada que
 * identifique a pessoa.
 */

import { sessionSetStats, parseReps, parseWeight } from './history.js';
import { isoWeekKey } from './deload.js';

const DAY_MS = 86_400_000;

function sessionTime(session) {
  const t = Date.parse(session?.startedAt || (session?.dayKey ? `${session.dayKey}T12:00:00` : ''));
  return Number.isFinite(t) ? t : null;
}

export function sessionsInWeek(sessions = [], weekKey) {
  return sessions.filter(s => {
    const t = sessionTime(s);
    return t !== null && isoWeekKey(t) === weekKey && (s.sets || []).some(set => set?.isDone);
  });
}

function bestByExercise(sessions) {
  const best = new Map();
  for (const s of sessions) {
    for (const set of s.sets || []) {
      if (!set?.isDone || !set.exerciseId) continue;
      const w = parseWeight(set.weight);
      const r = parseReps(set.reps);
      if (!w || !r || w <= 0 || r <= 0) continue;
      const e1rm = w * (1 + r / 30);
      if (e1rm > (best.get(set.exerciseId) ?? 0)) best.set(set.exerciseId, e1rm);
    }
  }
  return best;
}

/**
 * @param {object} p
 * @param {Array} p.sessions sessões com `sets`
 * @param {number} p.now
 * @param {(id: string) => string} p.exerciseName
 */
export function buildWeeklySummary({
  sessions = [],
  now = Date.now(),
  goal = 'hypertrophy',
  plannedSessions = 0,
  exerciseName = id => id,
  stalledExerciseIds = [],
  weakMuscles = [],
  weightTrendKgPerWeek = null,
  steps = null,
  deloadSuggested = false
} = {}) {
  const weekKey = isoWeekKey(now);
  const previousKey = isoWeekKey(now - 7 * DAY_MS);
  const current = sessionsInWeek(sessions, weekKey);
  const previous = sessionsInWeek(sessions, previousKey);

  let doneSets = 0;
  let volumeKg = 0;
  let rirSum = 0;
  let rirCount = 0;
  for (const s of current) {
    const stats = sessionSetStats(s.sets || []);
    doneSets += stats.doneSets;
    volumeKg += stats.volume;
    for (const set of s.sets || []) {
      if (!set?.isDone || set.rir === '' || set.rir === null || set.rir === undefined) continue;
      const rir = Number(set.rir);
      if (Number.isFinite(rir)) {
        rirSum += rir;
        rirCount++;
      }
    }
  }
  const previousVolume = previous.reduce((sum, s) => sum + sessionSetStats(s.sets || []).volume, 0);

  // Recorde da semana = melhor 1RM estimado acima de tudo que veio antes dela.
  const before = sessions.filter(s => {
    const t = sessionTime(s);
    return t !== null && isoWeekKey(t) < weekKey;
  });
  const bestBefore = bestByExercise(before);
  const prs = [];
  for (const [exerciseId, e1rm] of bestByExercise(current)) {
    const old = bestBefore.get(exerciseId);
    if (old && e1rm > old + 0.01) prs.push(`${exerciseName(exerciseId)} (${Math.round(e1rm)} kg 1RM est.)`);
  }

  return {
    weekKey,
    goal,
    sessions: current.length,
    plannedSessions,
    doneSets,
    volumeKg: Math.round(volumeKg),
    volumeChangePct: previousVolume > 0 ? Math.round(((volumeKg - previousVolume) / previousVolume) * 1000) / 10 : null,
    averageRir: rirCount ? Math.round((rirSum / rirCount) * 10) / 10 : null,
    prs: prs.slice(0, 6),
    stalled: stalledExerciseIds.slice(0, 6).map(exerciseName),
    weakMuscles: weakMuscles.slice(0, 6),
    weightTrendKgPerWeek,
    steps,
    deloadSuggested
  };
}

/**
 * Pontuação da liga real na semana: mesmas regras exibidas na liga virtual
 * (+10 por série válida, +50 por recorde, +20 por dia treinado).
 */
export function weeklyLeagueScore(summary) {
  if (!summary) return 0;
  return summary.doneSets * 10 + summary.prs.length * 50 + summary.sessions * 20;
}

/** Feedback local, usado quando o coach por IA está indisponível. */
export function localCoachText(summary) {
  if (!summary) return '';
  const lines = [];
  if (summary.sessions === 0) {
    lines.push('Semana sem treinos registrados. Que tal começar com um treino curto hoje?');
  } else if (summary.plannedSessions && summary.sessions >= summary.plannedSessions) {
    lines.push(`Semana completa: ${summary.sessions} de ${summary.plannedSessions} treinos. Excelente constância!`);
  } else {
    lines.push(`${summary.sessions} treino(s) feito(s)${summary.plannedSessions ? ` de ${summary.plannedSessions} planejados` : ''}.`);
  }
  if (summary.volumeChangePct !== null) {
    lines.push(`- Volume ${summary.volumeChangePct >= 0 ? 'subiu' : 'caiu'} ${Math.abs(summary.volumeChangePct)}% em relação à semana passada.`);
  }
  if (summary.prs.length) lines.push(`- Recordes: ${summary.prs.join(', ')}.`);
  if (summary.stalled.length) lines.push(`- Sem evolução: ${summary.stalled.join(', ')}. Tente variar reps ou a técnica.`);
  if (summary.weakMuscles.length) lines.push(`- Pouco volume em: ${summary.weakMuscles.join(', ')}.`);
  if (summary.deloadSuggested) lines.push('- Seu corpo pode estar pedindo uma semana de deload.');
  return lines.join('\n');
}
