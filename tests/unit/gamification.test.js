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
  calculateSessionGamification
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
});
