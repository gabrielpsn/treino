import { describe, it, expect } from 'vitest';
import {
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacros,
  calculateWaterRequirement,
  calculateCreatineDose
} from '../../src/engine/calculators/tdee.js';

describe('calculateBMR (Mifflin-St Jeor)', () => {
  it('aplica o fator masculino', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 1780
    expect(calculateBMR({ gender: 'male', weightKg: 80, heightCm: 180, ageYears: 30 })).toBe(1780);
  });

  it('aplica o fator feminino', () => {
    // 10*60 + 6.25*165 - 5*30 - 161 = 1320.25 -> 1320
    expect(calculateBMR({ gender: 'female', weightKg: 60, heightCm: 165, ageYears: 30 })).toBe(1320);
  });

  it('usa o fator masculino quando o gênero é desconhecido', () => {
    const unknown = calculateBMR({ weightKg: 80, heightCm: 180, ageYears: 30 });
    const male = calculateBMR({ gender: 'male', weightKg: 80, heightCm: 180, ageYears: 30 });
    expect(unknown).toBe(male);
  });

  it('retorna inteiro', () => {
    const bmr = calculateBMR({ gender: 'female', weightKg: 63.5, heightCm: 172, ageYears: 27 });
    expect(Number.isInteger(bmr)).toBe(true);
  });
});

describe('calculateTDEE', () => {
  it('escala o multiplicador com a frequência semanal', () => {
    const bmr = 2000;
    expect(calculateTDEE(bmr, 2)).toBe(2500); // 1.25
    expect(calculateTDEE(bmr, 4)).toBe(2700); // 1.35
    expect(calculateTDEE(bmr, 5)).toBe(2900); // 1.45
    expect(calculateTDEE(bmr, 6)).toBe(3100); // 1.55
  });

  it('nunca gasta menos que treinar 2x', () => {
    expect(calculateTDEE(2000, 1)).toBe(calculateTDEE(2000, 3));
  });

  it('nunca gasta mais que treinar 7x', () => {
    expect(calculateTDEE(2000, 7)).toBe(calculateTDEE(2000, 6));
  });
});

describe('calculateTargetCalories', () => {
  it('gera superávit na hipertrofia, decrescendo com a experiência', () => {
    const tdee = 2800;
    expect(calculateTargetCalories(tdee, 'beginner', 'hypertrophy')).toBe(3180);
    expect(calculateTargetCalories(tdee, 'intermediate', 'hypertrophy')).toBe(3100);
    expect(calculateTargetCalories(tdee, 'advanced', 'hypertrophy')).toBe(3020);
  });

  it('gera déficit no emagrecimento', () => {
    expect(calculateTargetCalories(2800, 'beginner', 'weight_loss')).toBe(2400);
    expect(calculateTargetCalories(2800, 'advanced', 'weight_loss')).toBe(2320);
  });

  it('respeita o piso de 1400 kcal mesmo com TDEE baixo', () => {
    // TDEE 1500 - 480 = 1020, mas o piso de segurança é 1400.
    expect(calculateTargetCalories(1500, 'advanced', 'weight_loss')).toBe(1400);
  });

  it('nunca gera déficit acima do piso com TDEE minúsculo', () => {
    expect(calculateTargetCalories(1200, 'beginner', 'weight_loss')).toBeGreaterThanOrEqual(1400);
  });

  it('usa hipertrofia como padrão quando o objetivo não é informado', () => {
    expect(calculateTargetCalories(2800, 'intermediate')).toBe(3100);
  });
});

describe('calculateMacros', () => {
  it('mantém a soma dos macros consistente com as calorias alvo', () => {
    const target = 2800;
    const macros = calculateMacros(target, 80, 'intermediate', 'hypertrophy');
    const total = macros.proteinKcal + macros.fatKcal + macros.carbsKcal;

    expect(macros.totalCalories).toBe(target);
    // Carboidrato é o resto, então a soma bate exatamente (tolerância de arredondamento).
    expect(Math.abs(total - target)).toBeLessThanOrEqual(4);
  });

  it('usa 2.0g/kg de proteína nos dois objetivos', () => {
    expect(calculateMacros(3000, 85, 'intermediate', 'hypertrophy').proteinGrams).toBe(170);
    expect(calculateMacros(1800, 85, 'intermediate', 'weight_loss').proteinGrams).toBe(170);
  });

  it('usa gordura mais baixa no déficit que no superávit', () => {
    const bulk = calculateMacros(3000, 80, 'intermediate', 'hypertrophy');
    const cut = calculateMacros(1800, 80, 'intermediate', 'weight_loss');
    expect(cut.fatGrams).toBeLessThan(bulk.fatGrams);
    expect(cut.fatGrams).toBe(64); // 0.8 * 80
  });

  it('nunca produz carboidrato negativo', () => {
    const macros = calculateMacros(1200, 150, 'advanced', 'weight_loss');
    expect(macros.carbsGrams).toBe(0);
  });
});

describe('calculateWaterRequirement', () => {
  it('usa 40ml por kg', () => {
    expect(calculateWaterRequirement(80).ml).toBe(3200);
  });

  it('formata os litros com uma casa decimal', () => {
    expect(calculateWaterRequirement(75).liters).toBe('3.0');
    expect(calculateWaterRequirement(82.5).liters).toBe('3.3');
  });
});

describe('calculateCreatineDose', () => {
  it('usa 0.06g/kg dentro da faixa', () => {
    expect(calculateCreatineDose(75)).toBe(5); // 4.5 -> 5
  });

  it('nunca desce de 3g nem passa de 8g', () => {
    expect(calculateCreatineDose(40)).toBe(3);
    expect(calculateCreatineDose(200)).toBe(8);
  });
});