import { describe, it, expect } from 'vitest';
import { buildPersonalizedPlan } from '../../src/engine/generators/planGenerator.js';

const maleProfile = {
  userName: 'Rafael',
  goal: 'hypertrophy',
  gender: 'male',
  ageYears: 30,
  weightKg: 80,
  heightCm: 180,
  daysPerWeek: 4,
  experienceLevel: 'intermediate',
  equipment: 'gym',
  restrictions: []
};

const femaleProfile = {
  userName: 'Mariana',
  goal: 'weight_loss',
  gender: 'female',
  ageYears: 39,
  weightKg: 86,
  heightCm: 156,
  daysPerWeek: 3,
  experienceLevel: 'beginner',
  equipment: 'gym',
  restrictions: []
};

describe('buildPersonalizedPlan — estrutura', () => {
  it('devolve o contrato completo esperado pela UI', () => {
    const plan = buildPersonalizedPlan(maleProfile);

    expect(plan.id).toBe('current_active_plan');
    expect(plan.physiology).toBeDefined();
    expect(Array.isArray(plan.workoutSplits)).toBe(true);
    expect(Array.isArray(plan.weekSchedule)).toBe(true);
    expect(Array.isArray(plan.meals)).toBe(true);
    expect(Array.isArray(plan.naturalSupplements)).toBe(true);
    expect(plan.createdAt).toBeTruthy();
  });

  it('gerou um plano serializável (persistência em IndexedDB exige JSON puro)', () => {
    const plan = buildPersonalizedPlan(maleProfile);
    expect(() => JSON.parse(JSON.stringify(plan))).not.toThrow();
  });

  it('mantém o objetivo e o nome no perfil embutido', () => {
    const plan = buildPersonalizedPlan(femaleProfile);
    expect(plan.profile.goal).toBe('weight_loss');
    expect(plan.profile.userName).toBe('Mariana');
  });

  it('cai no nome padrão quando nenhum nome é informado', () => {
    expect(buildPersonalizedPlan({ ...maleProfile, userName: '' }).profile.userName).toBe('João');
    expect(buildPersonalizedPlan({ ...femaleProfile, userName: undefined }).profile.userName).toBe('Maria');
  });
});

describe('buildPersonalizedPlan — fisiologia', () => {
  it('calcula IMC e faixa saudável coerentes', () => {
    const { physiology } = buildPersonalizedPlan(maleProfile);
    // 80 / 1.8^2 = 24.7
    expect(physiology.imc).toBe(24.7);
    expect(physiology.imcStatus).toBe('Peso Normal');
    expect(physiology.healthyWeightRange).toBe('60 a 81 kg');
  });

  it('classifica IMC entre 30 e 35 como obesidade grau I', () => {
    // 100 / 1.7^2 = 34.6
    const { physiology } = buildPersonalizedPlan({
      ...maleProfile, goal: 'weight_loss', weightKg: 100, heightCm: 170
    });
    expect(physiology.imc).toBe(34.6);
    expect(physiology.imcStatus).toBe('Obesidade Grau I');
  });

  it('classifica IMC acima de 35 como grau II ou mais', () => {
    const { physiology } = buildPersonalizedPlan({
      ...maleProfile, goal: 'weight_loss', weightKg: 120, heightCm: 170
    });
    expect(physiology.imcStatus).toBe('Obesidade Grau II+');
  });

  it('marca objetivo de emagregar quando está acima da faixa', () => {
    const { physiology } = buildPersonalizedPlan({
      ...femaleProfile, weightKg: 86, heightCm: 156
    });
    expect(physiology.targetWeightDiff).toBeGreaterThan(0);
    expect(physiology.weightGoal).toBe('lose');
    expect(physiology.targetWeightText).toMatch(/^-\d+ kg$/);
  });

  it('não inventa meta de perda quando já está na faixa saudável', () => {
    const { physiology } = buildPersonalizedPlan({
      ...maleProfile, goal: 'weight_loss', weightKg: 70, heightCm: 180
    });
    // Regressão do bug: exibia "-10 kg" para quem não precisava perder nada.
    expect(physiology.targetWeightDiff).toBe(0);
    expect(physiology.weightGoal).toBe('maintain');
    expect(physiology.targetWeightText).toBe('Manter');
    expect(physiology.isWithinHealthyRange).toBe(true);
  });

  it('mantém o piso calórico no déficit mesmo com biometria extrema', () => {
    const { physiology } = buildPersonalizedPlan({
      ...femaleProfile, ageYears: 55, weightKg: 55, heightCm: 155
    });
    expect(physiology.targetCalories).toBeGreaterThanOrEqual(1400);
  });

  it('não produz NaN com altura ou peso inválido', () => {
    const { physiology } = buildPersonalizedPlan({ ...maleProfile, heightCm: 0, weightKg: 0 });
    expect(Number.isNaN(physiology.imc)).toBe(false);
    expect(Number.isFinite(physiology.targetCalories)).toBe(true);
  });
});

describe('buildPersonalizedPlan — treino', () => {
  it('respeita restrição articular em todos os splits', () => {
    const plan = buildPersonalizedPlan({ ...maleProfile, restrictions: ['joelho'] });
    for (const split of plan.workoutSplits) {
      for (const ex of split.exercises) {
        expect(ex.jointStress).not.toContain('joelho');
      }
    }
  });

  it('respeita equipamento "home" em todos os splits', () => {
    const plan = buildPersonalizedPlan({ ...maleProfile, equipment: 'home' });
    for (const split of plan.workoutSplits) {
      for (const ex of split.exercises) {
        expect(ex.equipment).not.toBe('gym');
      }
    }
  });

  it('não duplica exercício dentro da mesma ficha', () => {
    const plan = buildPersonalizedPlan(maleProfile);
    for (const split of plan.workoutSplits) {
      const ids = split.exercises.map(e => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('todos os dias do calendário têm id e label', () => {
    const plan = buildPersonalizedPlan(maleProfile);
    expect(plan.weekSchedule.length).toBe(7);
    for (const day of plan.weekSchedule) {
      expect(day.id).toBeTruthy();
      expect(day.label).toBeTruthy();
      expect(day.workout).toBeTruthy();
    }
  });

  it('cada split tem título parseável em duas palavras pela UI', () => {
    // App.vue faz split.title.split(' ')[0] + [1] para o label da aba.
    for (const days of [3, 4, 5, 6]) {
      const plan = buildPersonalizedPlan({ ...maleProfile, daysPerWeek: days });
      for (const split of plan.workoutSplits) {
        expect(split.title.split(' ').length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('cada split tem accentBg, campo que a UI usa na coloração', () => {
    const plan = buildPersonalizedPlan(maleProfile);
    for (const split of plan.workoutSplits) {
      expect(split.accentBg).toBeTruthy();
    }
  });
});

describe('buildPersonalizedPlan — refeições', () => {
  it('escala o cardápio de hipertrofia com as calorias alvo', () => {
    const leve = buildPersonalizedPlan({ ...maleProfile, weightKg: 60, ageYears: 22 });
    const pesado = buildPersonalizedPlan({ ...maleProfile, weightKg: 95, ageYears: 22 });

    expect(leve.physiology.targetCalories).toBeLessThan(pesado.physiology.targetCalories);
    expect(leve.meals[1].items).not.toBe(pesado.meals[1].items);
  });

  it('escala o cardápio de déficit com as calorias alvo', () => {
    // Regressão: o buildText de déficit ignorava o ratio e devolvia o texto fixo.
    const leve = buildPersonalizedPlan({
      ...femaleProfile, weightKg: 55, ageYears: 25, heightCm: 160, daysPerWeek: 3
    });
    const pesado = buildPersonalizedPlan({
      ...femaleProfile, weightKg: 105, ageYears: 25, heightCm: 160, daysPerWeek: 3
    });

    expect(leve.physiology.targetCalories).toBeLessThan(pesado.physiology.targetCalories);
    expect(leve.meals[1].items).not.toBe(pesado.meals[1].items);
    expect(leve.meals[2].items).not.toBe(pesado.meals[2].items);
  });

  it('mantem a creatina calculada dentro da faixa clínica nas refeições', () => {
    const plan = buildPersonalizedPlan({ ...maleProfile, weightKg: 120 });
    const expected = plan.physiology.creatine;
    expect(expected).toBeGreaterThanOrEqual(3);
    expect(expected).toBeLessThanOrEqual(8);
    expect(plan.meals[1].items.toUpperCase()).toContain(`CREATINA`);
    expect(plan.meals[1].items).toContain(`${expected}g`);
  });

  it('inclui suplementos naturais apenas no emagrecimento', () => {
    expect(buildPersonalizedPlan(maleProfile).naturalSupplements).toEqual([]);
    expect(buildPersonalizedPlan(femaleProfile).naturalSupplements.length).toBeGreaterThan(0);
  });

  it('toda refeição tem id, título, tag, itens e objetivo', () => {
    for (const profile of [maleProfile, femaleProfile]) {
      for (const meal of buildPersonalizedPlan(profile).meals) {
        expect(meal.id).toBeTruthy();
        expect(meal.title).toBeTruthy();
        expect(meal.tag).toBeTruthy();
        expect(meal.items).toBeTruthy();
        expect(meal.objective).toBeTruthy();
      }
    }
  });

  it('gera ids de refeição únicos', () => {
    const ids = buildPersonalizedPlan(maleProfile).meals.map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('buildPersonalizedPlan — determinismo', () => {
  it('gera o mesmo plano para a mesma entrada (exceto createdAt)', () => {
    const a = buildPersonalizedPlan(maleProfile);
    const b = buildPersonalizedPlan(maleProfile);

    delete a.createdAt;
    delete b.createdAt;
    expect(a).toEqual(b);
  });
});