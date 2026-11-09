import { describe, it, expect, beforeEach } from 'vitest';
import {
  GAMIFICATION_STORAGE_KEY,
  WEEKLY_DAY_COMPLETION_XP,
  loadGamificationState,
  saveGamificationState,
  recordSessionCompletion,
  recordWeeklyDayCompletion,
  recordRestDay,
  awardCoins,
  spendCoins,
  unlockAndEquipTheme,
  equipTheme,
  unlockAndEquipTitle,
  equipTitle,
  claimRaidMilestone,
  recordDailyDietCompletion
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

  it('gerencia saldo de moedas de ferro, concede e gasta com validação de saldo', () => {
    const s1 = awardCoins(50);
    expect(s1.ironCoins).toBe(150); // 100 inicial + 50

    const spendRes = spendCoins(120);
    expect(spendRes.success).toBe(true);
    expect(spendRes.updated.ironCoins).toBe(30);

    const failSpend = spendCoins(100);
    expect(failSpend.success).toBe(false);
    expect(failSpend.updated.ironCoins).toBe(30);
  });

  it('permite desbloquear e equipar temas cosméticos', () => {
    // Tenta desbloquear tema caro sem saldo
    saveGamificationState({ ironCoins: 200, unlockedThemes: ['blue', 'orange'], equippedTheme: 'blue' });
    const failRes = unlockAndEquipTheme('cyberpunk', 500);
    expect(failRes.success).toBe(false);

    // Concede moedas e desbloqueia com sucesso
    awardCoins(600); // 200 + 600 = 800
    const successRes = unlockAndEquipTheme('cyberpunk', 500);
    expect(successRes.success).toBe(true);
    expect(successRes.updated.ironCoins).toBe(300);
    expect(successRes.updated.unlockedThemes).toContain('cyberpunk');
    expect(successRes.updated.equippedTheme).toBe('cyberpunk');

    // Troca de volta para tema já desbloqueado
    const equipRes = equipTheme('orange');
    expect(equipRes.success).toBe(true);
    expect(equipRes.updated.equippedTheme).toBe('orange');
  });

  it('permite desbloquear e equipar títulos de status do atleta', () => {
    awardCoins(500);
    const res = unlockAndEquipTitle('tita_supino', 300);
    expect(res.success).toBe(true);
    expect(res.updated.unlockedTitles).toContain('tita_supino');
    expect(res.updated.equippedTitle).toBe('tita_supino');

    const equipRes = equipTitle('iniciante_ferro');
    expect(equipRes.success).toBe(true);
    expect(equipRes.updated.equippedTitle).toBe('iniciante_ferro');
  });

  it('atualiza moedas e ramos de habilidade (RPG Branches) ao registrar sessão', () => {
    const updated = recordSessionCompletion({
      earnedXp: 300,
      tonnageKg: 5000,
      earnedCoins: 90,
      branchXp: { push: 180, core: 120 }
    });

    expect(updated.ironCoins).toBe(190); // 100 inicial + 90
    expect(updated.rpgBranches.push).toBe(180);
    expect(updated.rpgBranches.core).toBe(120);
    expect(updated.rpgBranches.pull).toBe(0);
  });

  it('permite resgatar marcos da Raid Coletiva sem duplicar recompensas', () => {
    const res1 = claimRaidMilestone({
      milestonePercent: 25,
      rewardCoins: 100,
      rewardXp: 200
    });
    expect(res1.success).toBe(true);
    expect(res1.updated.ironCoins).toBe(200); // 100 inicial + 100
    expect(res1.updated.totalXp).toBe(200);
    expect(res1.updated.claimedRaidMilestones).toContain(25);

    // Resgate repetido é bloqueado
    const resDup = claimRaidMilestone({
      milestonePercent: 25,
      rewardCoins: 100,
      rewardXp: 200
    });
    expect(resDup.success).toBe(false);
    expect(resDup.alreadyClaimed).toBe(true);
    expect(resDup.updated.ironCoins).toBe(200);

    // Marco de 100% desbloqueia título heroi_raid
    const res100 = claimRaidMilestone({
      milestonePercent: 100,
      rewardCoins: 400,
      rewardXp: 1000,
      unlockTitleId: 'heroi_raid'
    });
    expect(res100.success).toBe(true);
    expect(res100.updated.unlockedTitles).toContain('heroi_raid');
    expect(res100.updated.ironCoins).toBe(600);
  });

  it('concede bônus de moedas e XP ao completar dieta diária sem duplicar no mesmo dia', () => {
    const res1 = recordDailyDietCompletion('2026-11-09');
    expect(res1.alreadyClaimed).toBe(false);
    expect(res1.updated.ironCoins).toBe(130); // 100 inicial + 30
    expect(res1.updated.totalXp).toBe(50);
    expect(res1.updated.claimedDietDates).toContain('2026-11-09');

    // Tentativa duplicada no mesmo dia
    const resDup = recordDailyDietCompletion('2026-11-09');
    expect(resDup.alreadyClaimed).toBe(true);
    expect(resDup.updated.ironCoins).toBe(130);

    // Novo dia concede novo bônus
    const resNext = recordDailyDietCompletion('2026-11-10');
    expect(resNext.alreadyClaimed).toBe(false);
    expect(resNext.updated.ironCoins).toBe(160);
    expect(resNext.updated.totalXp).toBe(100);
  });
});
