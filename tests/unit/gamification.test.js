import { describe, it, expect } from 'vitest';
import {
  PATENTS,
  BADGES_CATALOG,
  xpRequiredForLevel,
  getPatentForLevel,
  calculateLevelFromXp,
  calculateSetXp,
  getRealWorldEquivalence,
  checkBadges,
  calculateSessionGamification,
  calculateDailyStreak,
  getFlameInfo,
  getBranchForMuscle,
  calculateBranchLevel,
  getThemeById,
  getTitleById,
  RPG_BRANCHES,
  COSMETIC_THEMES,
  TITLES_CATALOG
} from '../../src/engine/gamification.js';

describe('Gamification Engine', () => {
  describe('xpRequiredForLevel e Patentes', () => {
    it('retorna 0 para nível 1', () => {
      expect(xpRequiredForLevel(1)).toBe(0);
      expect(xpRequiredForLevel(0)).toBe(0);
    });

    it('calcula XP crescente para níveis superiores', () => {
      const xp2 = xpRequiredForLevel(2);
      const xp3 = xpRequiredForLevel(3);
      expect(xp2).toBeGreaterThan(0);
      expect(xp3).toBeGreaterThan(xp2);
    });

    it('atribui patentes corretas de acordo com a faixa de nível', () => {
      expect(getPatentForLevel(1).name).toBe('Ferro Fundido');
      expect(getPatentForLevel(5).name).toBe('Ferro Fundido');
      expect(getPatentForLevel(6).name).toBe('Sobrecarga Progressiva');
      expect(getPatentForLevel(15).name).toBe('Sobrecarga Progressiva');
      expect(getPatentForLevel(16).name).toBe('Atleta Consistente');
      expect(getPatentForLevel(35).name).toBe('Força Bruta');
      expect(getPatentForLevel(60).name).toBe('Elite da Sala de Pesos');
      expect(getPatentForLevel(80).name).toBe('Lenda do Ferro');
      expect(getPatentForLevel(110).name).toBe('Titã do Olimpo');
    });
  });

  describe('calculateLevelFromXp', () => {
    it('inicia no nível 1 com 0 XP', () => {
      const res = calculateLevelFromXp(0);
      expect(res.level).toBe(1);
      expect(res.patent).toBe('Ferro Fundido');
      expect(res.progressPercent).toBe(0);
    });

    it('avança de nível ao acumular XP suficiente', () => {
      const costForLvl2 = xpRequiredForLevel(2);
      const res = calculateLevelFromXp(costForLvl2 + 50);
      expect(res.level).toBe(2);
      expect(res.xpIntoCurrentLevel).toBe(50);
    });
  });

  describe('calculateSetXp', () => {
    it('retorna 0 se carga ou reps forem zero', () => {
      expect(calculateSetXp({ weight: 0, reps: 10 })).toBe(0);
      expect(calculateSetXp({ weight: 50, reps: 0 })).toBe(0);
    });

    it('computa volume XP e bônus de RIR', () => {
      // 100kg x 10 = 1000kg. 1000 / 100 = 10 volume XP.
      // RIR 0 dá +5 bonus. Total = 15.
      expect(calculateSetXp({ weight: 100, reps: 10, rir: 0 })).toBe(15);
      // RIR 2 dá +3 bonus. Total = 13.
      expect(calculateSetXp({ weight: 100, reps: 10, rir: 2 })).toBe(13);
    });

    it('acrescenta +150 XP se for recorde pessoal (PR)', () => {
      const xpNormal = calculateSetXp({ weight: 100, reps: 10, rir: 0, isPr: false });
      const xpPr = calculateSetXp({ weight: 100, reps: 10, rir: 0, isPr: true });
      expect(xpPr - xpNormal).toBe(150);
    });
  });

  describe('getRealWorldEquivalence', () => {
    it('retorna anilhas para tonelagens pequenas', () => {
      expect(getRealWorldEquivalence(100)).toContain('anilhas');
    });

    it('retorna carro popular para ~1.000 kg', () => {
      expect(getRealWorldEquivalence(1200)).toContain('carro popular');
    });

    it('retorna elefantes ou avião para tonelagens massivas', () => {
      expect(getRealWorldEquivalence(7000)).toContain('elefantes');
      expect(getRealWorldEquivalence(95000)).toContain('avião');
    });
  });

  describe('checkBadges', () => {
    it('desbloqueia Century Club com 100 kg', () => {
      const badges = checkBadges({
        sets: [{ weight: 100, reps: 5, isDone: true }],
        unlockedBadgeIds: []
      });
      expect(badges.some(b => b.id === 'century_club')).toBe(true);
    });

    it('desbloqueia Peso por Peso ao levantar o peso corporal', () => {
      const badges = checkBadges({
        sets: [{ weight: 80, reps: 8, isDone: true }],
        userProfile: { weightKg: 80 },
        unlockedBadgeIds: []
      });
      expect(badges.some(b => b.id === 'bodyweight_master')).toBe(true);
    });

    it('não duplica badges já desbloqueados', () => {
      const badges = checkBadges({
        sets: [{ weight: 120, reps: 5, isDone: true }],
        unlockedBadgeIds: ['century_club']
      });
      expect(badges.some(b => b.id === 'century_club')).toBe(false);
    });
  });

  describe('calculateSessionGamification', () => {
    it('agrega tonelagem e XP dos logs da sessão', () => {
      const logs = {
        ex1: {
          sets: [
            { weight: 80, reps: 10, isDone: true, rir: 2 },
            { weight: 80, reps: 10, isDone: true, rir: 1 }
          ]
        },
        ex2: {
          sets: [
            { weight: 50, reps: 10, isDone: false }
          ]
        }
      };

      const res = calculateSessionGamification({
        workoutLogs: logs,
        existingPrs: {},
        isFinished: true
      });

      // Volume = (80*10) + (80*10) = 1600 kg
      expect(res.tonnageKg).toBe(1600);
      expect(res.doneSetsCount).toBe(2);
      expect(res.totalSetsCount).toBe(3);
      expect(res.earnedXp).toBeGreaterThan(100); // 100 de finish + XP das séries
    });
  });

  describe('calculateDailyStreak', () => {
    it('inicia o streak em 1 dia para o primeiro dia ativo', () => {
      const res = calculateDailyStreak(null, 0, '2026-11-09');
      expect(res.streak).toBe(1);
      expect(res.flameLevel).toBe(1);
      expect(res.flameEmoji).toBe('🔥');
      expect(res.lastActiveDate).toBe('2026-11-09');
    });

    it('mantém o streak no mesmo dia sem duplicar contagem', () => {
      const res = calculateDailyStreak('2026-11-09', 3, '2026-11-09');
      expect(res.streak).toBe(3);
      expect(res.flameLevel).toBe(1);
    });

    it('avança o streak em dias consecutivos e aumenta o nível da chama', () => {
      // Dia 3 -> Dia 4 (Chama Dourada)
      const res1 = calculateDailyStreak('2026-11-08', 3, '2026-11-09');
      expect(res1.streak).toBe(4);
      expect(res1.flameLevel).toBe(2);
      expect(res1.flameEmoji).toBe('⚡🔥');

      // Dia 7 -> Dia 8 (Supernova Azul)
      const res2 = calculateDailyStreak('2026-11-08', 7, '2026-11-09');
      expect(res2.streak).toBe(8);
      expect(res2.flameLevel).toBe(3);
      expect(res2.flameEmoji).toBe('💎🔥');
    });

    it('reinicia o streak para 1 se houver intervalo maior que 1 dia', () => {
      const res = calculateDailyStreak('2026-11-05', 10, '2026-11-09');
      expect(res.streak).toBe(1);
      expect(res.flameLevel).toBe(1);
    });
  });

  describe('getFlameInfo', () => {
    it('retorna informações visuais corretas para cada patamar de dias', () => {
      expect(getFlameInfo(0).flameLevel).toBe(0);
      expect(getFlameInfo(1).flameEmoji).toBe('🔥');
      expect(getFlameInfo(4).flameEmoji).toBe('⚡🔥');
      expect(getFlameInfo(8).flameEmoji).toBe('💎🔥');
      expect(getFlameInfo(8).flameLevel).toBe(3);
    });
  });

  describe('RPG Branches & Skill Tree', () => {
    it('mapeia corretamente músculos anatômicos para os 4 ramos RPG', () => {
      expect(getBranchForMuscle('peito')).toBe('push');
      expect(getBranchForMuscle('ombro')).toBe('push');
      expect(getBranchForMuscle('triceps')).toBe('push');

      expect(getBranchForMuscle('costas')).toBe('pull');
      expect(getBranchForMuscle('biceps')).toBe('pull');
      expect(getBranchForMuscle('trapezio')).toBe('pull');

      expect(getBranchForMuscle('quadriceps')).toBe('legs');
      expect(getBranchForMuscle('posterior')).toBe('legs');
      expect(getBranchForMuscle('gluteos')).toBe('legs');
      expect(getBranchForMuscle('panturrilha')).toBe('legs');

      expect(getBranchForMuscle('core')).toBe('core');
      expect(getBranchForMuscle('cardio')).toBe('core');
      expect(getBranchForMuscle('outro')).toBe('core');
    });

    it('calcula níveis de branch e progresso percentual corretamente', () => {
      const b0 = calculateBranchLevel(0);
      expect(b0.level).toBe(1);
      expect(b0.progressPercent).toBe(0);

      // Nível 1 precisa de 150 XP. Com 75 XP está em 50%.
      const b1 = calculateBranchLevel(75);
      expect(b1.level).toBe(1);
      expect(b1.progressPercent).toBe(50);

      // Com 150 XP passa para o nível 2
      const b2 = calculateBranchLevel(150);
      expect(b2.level).toBe(2);
      expect(b2.progressPercent).toBe(0);
    });

    it('distribui XP por ramo e calcula moedas ganhas na sessão', () => {
      const logs = {
        ex_push: {
          sets: [{ weight: 100, reps: 10, isDone: true }]
        },
        ex_legs: {
          sets: [{ weight: 120, reps: 8, isDone: true }]
        }
      };

      const muscleMap = {
        ex_push: 'peito',
        ex_legs: 'quadriceps'
      };

      const res = calculateSessionGamification({
        workoutLogs: logs,
        existingPrs: {},
        exerciseMuscleMap: muscleMap,
        isFinished: true
      });

      expect(res.branchXp.push).toBeGreaterThan(0);
      expect(res.branchXp.legs).toBeGreaterThan(0);
      expect(res.branchXp.pull).toBe(0);
      expect(res.branchXp.core).toBe(0);
      expect(res.earnedCoins).toBeGreaterThanOrEqual(70); // 50 finish + 20 séries
    });
  });

  describe('Cosmetics & Titles Catalog', () => {
    it('retorna temas válidos por ID', () => {
      expect(getThemeById('blue').name).toBe('Azul Cobalto Pro');
      expect(getThemeById('cyberpunk').primaryColor).toBe('#00F0FF');
      expect(getThemeById('inexistente').id).toBe('blue');
    });

    it('retorna títulos válidos por ID', () => {
      expect(getTitleById('iniciante_ferro').title).toBe('Iniciante do Ferro');
      expect(getTitleById('tita_supino').icon).toBe('🛡️');
      expect(getTitleById('inexistente').id).toBe('iniciante_ferro');
    });
  });
});
