import { describe, it, expect } from 'vitest';
import {
  calculatePersonalRecords,
  estimate1RM,
  suggestNextLoad,
  getLastSetsForExercise
} from '../../src/engine/progression.js';

const SESSIONS = [
  {
    date: '2026-09-01',
    sets: [
      { exerciseId: 'supino_reto_halteres', weightKg: 20, reps: 10, isDone: true },
      { exerciseId: 'supino_reto_halteres', weightKg: 20, reps: 9, isDone: true },
      { exerciseId: 'supino_reto_halteres', weightKg: 20, reps: 8, isDone: true }
    ]
  },
  {
    date: '2026-09-08',
    sets: [
      { exerciseId: 'supino_reto_halteres', weightKg: 22, reps: 8, isDone: true },
      { exerciseId: 'supino_reto_halteres', weightKg: 22, reps: 8, isDone: true },
      { exerciseId: 'supino_reto_halteres', weightKg: 22, reps: 7, isDone: true }
    ]
  },
  {
    date: '2026-09-15',
    sets: [
      { exerciseId: 'supino_reto_halteres', weightKg: 22, reps: 10, isDone: true },
      { exerciseId: 'supino_reto_halteres', weightKg: 22, reps: 10, isDone: true }
    ]
  }
];

describe('estimate1RM', () => {
  it('calcula 1RM estimado com Epley', () => {
    expect(estimate1RM(100, 10)).toBeCloseTo(133.3, 1);
    expect(estimate1RM(0, 5)).toBe(0);
    expect(estimate1RM(20, 0)).toBe(0);
  });
});

describe('calculatePersonalRecords', () => {
  it('calcula PRs por exercício', () => {
    const prs = calculatePersonalRecords(SESSIONS);
    const pr = prs.get('supino_reto_halteres');

    expect(pr).toBeTruthy();
    expect(pr.maxWeightKg).toBe(22);
    expect(pr.maxReps).toBe(10);
    expect(pr.bestSet.reps).toBe(10);
    expect(pr.bestSet.weightKg).toBe(22);
    expect(pr.maxVolumeKg).toBeGreaterThan(0);
    expect(pr.bestEstimated1RM).toBeGreaterThan(0);
  });

  it('ignora séries não concluídas ou inválidas', () => {
    const prs = calculatePersonalRecords([
      { sets: [{ exerciseId: 'a', weightKg: 10, reps: 5, isDone: false }] },
      { sets: [{ exerciseId: 'a', weightKg: 0, reps: 5 }] },
      { sets: [{ exerciseId: 'a', weightKg: 10, reps: 0 }] }
    ]);
    expect(prs.size).toBe(0);
  });
});

describe('getLastSetsForExercise', () => {
  it('recupera últimos sets concluídos ordenados por sessão recente', () => {
    const last = getLastSetsForExercise(SESSIONS, 'supino_reto_halteres');
    expect(last.length).toBeGreaterThan(0);
    expect(last[0].weightKg).toBe(22);
    expect(last[0].reps).toBe(10);
  });

  it('retorna array vazio quando não há histórico', () => {
    expect(getLastSetsForExercise([], 'x')).toEqual([]);
  });
});

describe('suggestNextLoad', () => {
  it('sugere aumento de reps quando dentro da faixa', () => {
    const suggestion = suggestNextLoad({
      exerciseId: 'supino_reto_halteres',
      exercise: { pattern: 'push_horizontal', equipment: 'gym' },
      lastSets: [
        { weightKg: 20, reps: 8, isDone: true },
        { weightKg: 20, reps: 9, isDone: true },
        { weightKg: 20, reps: 9, isDone: true }
      ],
      targetRepsRange: [8, 12]
    });

    expect(suggestion.suggestedWeightKg).toBe(20);
    expect(suggestion.suggestedReps).toBe(10);
    expect(suggestion.confidence).toBe('medium');
  });

  it('sugere aumento de peso quando atinge topo da faixa', () => {
    const suggestion = suggestNextLoad({
      exerciseId: 'supino_reto_halteres',
      exercise: { pattern: 'push_horizontal', equipment: 'gym' },
      lastSets: [
        { weightKg: 22, reps: 12, isDone: true },
        { weightKg: 22, reps: 12, isDone: true },
        { weightKg: 22, reps: 11, isDone: true }
      ],
      targetRepsRange: [8, 12]
    });

    expect(suggestion.suggestedWeightKg).toBeGreaterThan(22);
    expect(suggestion.suggestedReps).toBe(8);
  });

  it('mantém conservador quando abaixo da faixa', () => {
    const suggestion = suggestNextLoad({
      exerciseId: 'supino_reto_halteres',
      exercise: { pattern: 'isolation', muscle: 'bíceps', equipment: 'dumbbells' },
      lastSets: [
        { weightKg: 10, reps: 6, isDone: true },
        { weightKg: 10, reps: 5, isDone: true }
      ],
      targetRepsRange: [8, 12]
    });

    expect(suggestion.suggestedWeightKg).toBe(10);
    expect(suggestion.suggestedReps).toBeGreaterThanOrEqual(8);
  });

  it('usa defaults quando não há histórico', () => {
    const suggestion = suggestNextLoad({
      exerciseId: 'x',
      exercise: {},
      lastSets: [],
      defaultWeightKg: 15,
      defaultReps: 10,
      targetRepsRange: [8, 12]
    });

    expect(suggestion.suggestedWeightKg).toBe(15);
    expect(suggestion.suggestedReps).toBe(10);
    expect(suggestion.confidence).toBe('low');
  });
});