import { describe, it, expect, beforeEach } from 'vitest';
import {
  GAMIFICATION_STORAGE_KEY,
  WEEKLY_DAY_COMPLETION_XP,
  loadGamificationState,
  saveGamificationState,
  recordSessionCompletion,
  recordWeeklyDayCompletion,
  recordRestDay
} from '../../src/db/gamification.js';

describe('Gamification DB State', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('retorna estado padrão quando vazio', () => {
    const state = loadGamificationState();
    expect(state.totalXp).toBe(0);
    expect(state.lifetimeTonnageKg).toBe(0);
    expect(state.weeklyStreak).toBe(0);
    expect(state.shieldsCount).toBe(1);
    expect(state.unlockedBadgeIds).toEqual([]);
  });

  it('salva e recupera o estado', () => {
    saveGamificationState({
      totalXp: 500,
      lifetimeTonnageKg: 3000,
      unlockedBadgeIds: ['century_club'],
      weeklyStreak: 2,
      shieldsCount: 2
    });

    const loaded = loadGamificationState();
    expect(loaded.totalXp).toBe(500);
    expect(loaded.lifetimeTonnageKg).toBe(3000);
    expect(loaded.unlockedBadgeIds).toContain('century_club');
    expect(loaded.weeklyStreak).toBe(2);
    expect(loaded.shieldsCount).toBe(2);
  });

  it('atualiza XP, tonelagem e badges ao registrar sessão concluída', () => {
    const updated = recordSessionCompletion({
      earnedXp: 200,
      tonnageKg: 4000,
      newBadgeIds: ['century_club'],
      currentWeekKey: '2026-W45'
    });

    expect(updated.totalXp).toBe(200);
    expect(updated.lifetimeTonnageKg).toBe(4000);
    expect(updated.unlockedBadgeIds).toContain('century_club');
    expect(updated.weeklyStreak).toBe(1);
    expect(updated.lastActiveWeekKey).toBe('2026-W45');
  });

  it('permite registrar descanso ativo e concede XP uma vez por dia', () => {
    const res1 = recordRestDay('2026-11-06');
    expect(res1.alreadyClaimed).toBe(false);
    expect(res1.xpGained).toBe(25);
    expect(res1.updated.totalXp).toBe(25);

    const res2 = recordRestDay('2026-11-06');
    expect(res2.alreadyClaimed).toBe(true);
  });

  it('concede XP por dia da semana concluído e impede duplicidade de resgate na mesma semana', () => {
    const res1 = recordWeeklyDayCompletion({ dayId: 'seg', weekKey: '2026-W45', xpReward: 50 });
    expect(res1.alreadyClaimed).toBe(false);
    expect(res1.xpGained).toBe(50);
    expect(res1.updated.totalXp).toBe(50);

    // Tentativa repetida no mesmo dia da mesma semana não duplica XP
    const res2 = recordWeeklyDayCompletion({ dayId: 'seg', weekKey: '2026-W45', xpReward: 50 });
    expect(res2.alreadyClaimed).toBe(true);
    expect(res2.xpGained).toBe(0);
    expect(res2.updated.totalXp).toBe(50);

    // Outro dia da semana recebe seu próprio XP
    const resTer = recordWeeklyDayCompletion({ dayId: 'ter', weekKey: '2026-W45', xpReward: 50 });
    expect(resTer.alreadyClaimed).toBe(false);
    expect(resTer.xpGained).toBe(50);
    expect(resTer.updated.totalXp).toBe(100);

    // Mesma segunda-feira em semana futura recebe novo XP
    const resNextWeek = recordWeeklyDayCompletion({ dayId: 'seg', weekKey: '2026-W46', xpReward: 50 });
    expect(resNextWeek.alreadyClaimed).toBe(false);
    expect(resNextWeek.xpGained).toBe(50);
    expect(resNextWeek.updated.totalXp).toBe(150);
  });
});
