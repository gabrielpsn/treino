import { describe, it, expect } from 'vitest';
import {
  evaluateDeload,
  detectStalledExercises,
  consecutiveTrainingWeeks,
  failureRatio,
  deloadLoad,
  deloadSets,
  isoWeekKey
} from '../../src/engine/deload.js';

const NOW = Date.parse('2026-03-30T12:00:00Z');
const DAY = 86_400_000;

function session(daysAgo, sets) {
  const t = NOW - daysAgo * DAY;
  return {
    id: daysAgo,
    startedAt: new Date(t).toISOString(),
    sets: sets.map(([exerciseId, weight, reps, rir = '']) => ({ exerciseId, weight, reps, rir, isDone: true }))
  };
}

function stalledHistory() {
  // Três exercícios presos na mesma carga por 5 sessões.
  return [28, 21, 14, 7, 2].map(d => session(d, [
    ['supino', 80, 8, 0], ['agachamento', 100, 6, 0], ['remada', 70, 10, 1]
  ]));
}

describe('detectStalledExercises', () => {
  it('marca exercício sem ganho de 1RM estimado como estagnado', () => {
    const r = detectStalledExercises(stalledHistory(), { now: NOW });
    expect(r).toHaveLength(3);
    expect(r.every(e => e.stalled)).toBe(true);
  });

  it('exercício progredindo não está estagnado', () => {
    const progressing = [21, 14, 7, 2].map((d, i) => session(d, [['supino', 80 + i * 2.5, 8]]));
    const [e] = detectStalledExercises(progressing, { now: NOW });
    expect(e.stalled).toBe(false);
  });
});

describe('evaluateDeload', () => {
  it('recomenda deload com maioria estagnada', () => {
    const r = evaluateDeload(stalledHistory(), { now: NOW });
    expect(r.recommended).toBe(true);
    expect(r.reasons.length).toBeGreaterThan(0);
    expect(r.prescription.loadFactor).toBe(0.6);
  });

  it('não insiste depois de dispensado ou já em deload nesta semana', () => {
    const week = isoWeekKey(NOW);
    expect(evaluateDeload(stalledHistory(), { now: NOW, dismissedWeekKey: week }).recommended).toBe(false);
    const inDeload = evaluateDeload(stalledHistory(), { now: NOW, lastDeloadWeekKey: week });
    expect(inDeload.recommended).toBe(false);
    expect(inDeload.inDeload).toBe(true);
  });

  it('histórico curto não gera recomendação', () => {
    expect(evaluateDeload([session(2, [['supino', 80, 8]])], { now: NOW }).recommended).toBe(false);
  });
});

describe('consecutiveTrainingWeeks', () => {
  it('conta semanas seguidas com treino', () => {
    const weekly = Array.from({ length: 9 }, (_, i) => session(i * 7 + 1, [['supino', 80, 8]]));
    expect(consecutiveTrainingWeeks(weekly, { now: NOW })).toBe(9);
    const withGap = weekly.filter((_, i) => i !== 3);
    expect(consecutiveTrainingWeeks(withGap, { now: NOW })).toBe(3);
  });
});

describe('helpers', () => {
  it('failureRatio exige amostra mínima', () => {
    expect(failureRatio([session(1, [['a', 10, 10, 0]])], { now: NOW })).toBe(0);
    expect(failureRatio(stalledHistory(), { now: NOW })).toBeCloseTo(2 / 3, 2);
  });

  it('carga e séries do deload', () => {
    expect(deloadLoad('100')).toBe(60);
    expect(deloadLoad(42)).toBe(25);
    expect(deloadLoad('')).toBeNull();
    expect(deloadSets(4)).toBe(2);
    expect(deloadSets(1)).toBe(1);
  });
});
