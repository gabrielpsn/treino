import { describe, it, expect } from 'vitest';
import { buildWeeklySummary, weeklyLeagueScore, localCoachText, sessionsInWeek } from '../../src/engine/weeklySummary.js';
import { isoWeekKey } from '../../src/engine/deload.js';

const NOW = Date.parse('2026-03-12T12:00:00Z'); // quinta-feira
const DAY = 86_400_000;

function s(daysAgo, sets) {
  return {
    id: daysAgo,
    startedAt: new Date(NOW - daysAgo * DAY).toISOString(),
    sets: sets.map(([exerciseId, weight, reps, rir = '']) => ({ exerciseId, weight, reps, rir, isDone: true }))
  };
}

describe('buildWeeklySummary', () => {
  const sessions = [
    s(9, [['supino', 80, 8, 2]]),              // semana anterior
    s(2, [['supino', 85, 8, 1], ['remada', 60, 10, 3]]),
    s(1, [['supino', 80, 6, 0]])
  ];

  it('conta sessões, séries, volume, RIR e variação da semana', () => {
    const r = buildWeeklySummary({ sessions, now: NOW, plannedSessions: 3, exerciseName: id => id.toUpperCase() });
    expect(r.weekKey).toBe(isoWeekKey(NOW));
    expect(r.sessions).toBe(2);
    expect(r.doneSets).toBe(3);
    expect(r.volumeKg).toBe(85 * 8 + 60 * 10 + 80 * 6);
    expect(r.averageRir).toBe(1.3);
    expect(r.volumeChangePct).toBe(Math.round(((1760 - 640) / 640) * 1000) / 10);
    expect(r.prs).toEqual(['SUPINO (108 kg 1RM est.)']);
  });

  it('pontuação de liga e texto local', () => {
    const r = buildWeeklySummary({ sessions, now: NOW, plannedSessions: 2 });
    expect(weeklyLeagueScore(r)).toBe(3 * 10 + 1 * 50 + 2 * 20);
    expect(localCoachText(r)).toContain('Semana completa');
  });

  it('ignora sessões sem série concluída', () => {
    const empty = [{ id: 1, startedAt: new Date(NOW).toISOString(), sets: [{ exerciseId: 'x', isDone: false }] }];
    expect(sessionsInWeek(empty, isoWeekKey(NOW))).toHaveLength(0);
  });
});
