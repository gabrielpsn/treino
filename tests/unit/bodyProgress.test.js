import { describe, it, expect } from 'vitest';
import {
  normalizeBodyEntry,
  weightTrend,
  movingAverage,
  weightSeries,
  measurementChanges,
  suggestCalorieAdjustment
} from '../../src/engine/bodyProgress.js';

function series(startDate, weights, stepDays = 3) {
  const start = Date.parse(`${startDate}T12:00:00Z`);
  return weights.map((w, i) => normalizeBodyEntry({
    date: new Date(start + i * stepDays * 86_400_000).toISOString().slice(0, 10),
    weightKg: w
  }));
}

describe('normalizeBodyEntry', () => {
  it('aceita vírgula, descarta valores absurdos e linha vazia', () => {
    const e = normalizeBodyEntry({ date: '2026-03-01', weightKg: '80,4', waistCm: 900 });
    expect(e.weightKg).toBe(80.4);
    expect(e.waistCm).toBeNull();
    expect(normalizeBodyEntry({ date: '2026-03-01' })).toBeNull();
    expect(normalizeBodyEntry({ date: 'ontem', weightKg: 80 })).toBeNull();
  });
});

describe('weightTrend', () => {
  it('calcula ~ -0,5 kg/semana numa queda constante', () => {
    // 0,5 kg a cada 7 dias, pesando a cada 3,5 -> passo de 3 dias com 0,2143
    const entries = series('2026-03-01', [90, 89.79, 89.57, 89.36, 89.14, 88.93, 88.71], 3);
    const t = weightTrend(entries);
    expect(t.weeklyKg).toBeCloseTo(-0.5, 1);
    expect(t.spanDays).toBe(18);
  });

  it('sem duas pesagens não há tendência', () => {
    expect(weightTrend(series('2026-03-01', [80]))).toBeNull();
  });
});

describe('movingAverage', () => {
  it('suaviza dentro da janela de 7 dias', () => {
    const avg = movingAverage(weightSeries(series('2026-03-01', [80, 82, 80], 2)));
    expect(avg.map(p => p.weightKg)).toEqual([80, 81, 80.7]);
  });
});

describe('measurementChanges', () => {
  it('compara primeira e última medição de cada campo', () => {
    const changes = measurementChanges([
      normalizeBodyEntry({ date: '2026-03-01', weightKg: 80, waistCm: 90 }),
      normalizeBodyEntry({ date: '2026-03-20', weightKg: 78.5, waistCm: 87 })
    ]);
    expect(changes.weightKg.delta).toBe(-1.5);
    expect(changes.waistCm.delta).toBe(-3);
  });
});

describe('suggestCalorieAdjustment', () => {
  const flat = series('2026-03-01', [80, 80.1, 79.9, 80, 80.05, 79.95], 3);

  it('pede mais dados antes de 14 dias', () => {
    const r = suggestCalorieAdjustment({ entries: series('2026-03-01', [80, 80, 80], 2), goal: 'weight_loss', targetCalories: 2000 });
    expect(r.status).toBe('insufficient_data');
    expect(r.newTargetCalories).toBe(2000);
  });

  it('emagrecimento estagnado reduz 150 kcal', () => {
    const r = suggestCalorieAdjustment({ entries: flat, goal: 'weight_loss', targetCalories: 2000 });
    expect(r.status).toBe('decrease');
    expect(r.newTargetCalories).toBe(1850);
  });

  it('hipertrofia sem ganho aumenta 150 kcal', () => {
    const r = suggestCalorieAdjustment({ entries: flat, goal: 'hypertrophy', targetCalories: 2800 });
    expect(r.status).toBe('increase');
    expect(r.deltaKcal).toBe(150);
  });

  it('manutenção estável fica como está', () => {
    expect(suggestCalorieAdjustment({ entries: flat, goal: 'maintenance', targetCalories: 2400 }).status).toBe('on_track');
  });

  it('nunca desce abaixo do piso seguro', () => {
    const r = suggestCalorieAdjustment({ entries: flat, goal: 'weight_loss', targetCalories: 1250, gender: 'female', bmr: 1300 });
    expect(r.status).toBe('at_floor');
    expect(r.newTargetCalories).toBe(1250);
  });
});
