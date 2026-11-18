import { describe, it, expect } from 'vitest';
import { pickTodaySplit, estimateMinutes } from '../../src/engine/todayPlan.js';

const splits = [{ id: 'a', exercises: [] }, { id: 'b', exercises: [] }, { id: 'c', exercises: [] }];
const s = (splitId, dayKey, done = true) => ({ splitId, dayKey, startedAt: `${dayKey}T10:00:00`, sets: [{ isDone: done }] });

describe('pickTodaySplit', () => {
  it('sem histórico começa pela primeira ficha', () => {
    expect(pickTodaySplit(splits, [], '2026-03-10')).toEqual({ split: splits[0], doneToday: false });
  });
  it('segue o rodízio a partir da última treinada e volta ao início', () => {
    expect(pickTodaySplit(splits, [s('a', '2026-03-08')], '2026-03-10').split.id).toBe('b');
    expect(pickTodaySplit(splits, [s('a', '2026-03-06'), s('c', '2026-03-08')], '2026-03-10').split.id).toBe('a');
  });
  it('treino de hoje concluído mostra a ficha feita hoje', () => {
    expect(pickTodaySplit(splits, [s('b', '2026-03-10')], '2026-03-10')).toEqual({ split: splits[1], doneToday: true });
  });
  it('ignora sessões sem série concluída', () => {
    expect(pickTodaySplit(splits, [s('a', '2026-03-08', false)], '2026-03-10').split.id).toBe('a');
  });
});

describe('estimateMinutes', () => {
  it('soma ~2,5 min por série mais aquecimento', () => {
    expect(estimateMinutes({ exercises: [{ defaultSeries: '4x 8' }, { defaultSeries: '3x 12' }] })).toBe(Math.round(7 * 2.5 + 5));
  });
});
