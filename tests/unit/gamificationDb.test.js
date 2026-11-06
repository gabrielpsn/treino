import { describe, it, expect, beforeEach } from 'vitest';
import {
  GAMIFICATION_STORAGE_KEY,
  loadGamificationState,
  saveGamificationState,
  recordSessionCompletion,
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
});
