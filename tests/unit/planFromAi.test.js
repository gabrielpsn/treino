import { describe, it, expect, vi } from 'vitest';
import {
  AiPlanError,
  requestAiPlan,
  validateAiPlan,
  buildCatalogForModel
} from '../../src/engine/ai/planFromAi.js';
import { EXERCISE_CATALOG } from '../../src/engine/knowledge/exercises.js';
import { buildPersonalizedPlan } from '../../src/engine/generators/planGenerator.js';

const profile = {
  userName: 'Rafael',
  ageYears: 30,
  gender: 'male',
  weightKg: 80,
  heightCm: 178,
  daysPerWeek: 4,
  experienceLevel: 'intermediate',
  equipment: 'gym',
  goal: 'hypertrophy',
  restrictions: ['ombro']
};

// TDEE do perfil acima: 178 cm, 80 kg, 30 anos, 4 dias.
const TDEE = Math.round(Math.round(10 * 80 + 6.25 * 178 - 5 * 30 + 5) * 1.35);

const safeIds = EXERCISE_CATALOG
  .filter(ex => !(ex.jointStress ?? []).includes('ombro') && ex.equipment !== 'gym_only')
  .slice(0, 6)
  .map(ex => ex.id);

function aiSplit(splitId, ids = safeIds.slice(0, 4)) {
  return {
    splitId,
    focus: 'Peito e tríceps',
    exercises: ids.map((id, index) => ({ id, sets: 3 + (index % 2), reps: '8-12', restSeconds: 90 }))
  };
}

function aiPlanFor(splits, overrides = {}) {
  return {
    rationale: 'Comecei pelos compostos.',
    targetCalories: TDEE + 300,
    proteinGrams: 160,
    carbsGrams: 250,
    fatGrams: 72,
    splits,
    ...overrides
  };
}

// O plano da fórmula é a referência de comparação: é ele que a IA não pode
// reescrever (agenda, cardápio, suplementos) e é a base do qual saem as fichas.
const formulaPlan = buildPersonalizedPlan({ ...profile, catalog: EXERCISE_CATALOG });
const splitIds = formulaPlan.workoutSplits.map(split => split.id);

/** Resposta da IA que passaria em qualquer revisão humana. */
function validAiPlan(overrides = {}) {
  return aiPlanFor(splitIds.map(id => aiSplit(id)), overrides);
}

function validate(plan) {
  return validateAiPlan(plan, { profile, catalog: EXERCISE_CATALOG });
}

function reasonOf(run) {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(AiPlanError);
    return error.reason;
  }
  throw new Error('esperava AiPlanError e nada foi lançado');
}

async function asyncReasonOf(run) {
  try {
    await run();
  } catch (error) {
    expect(error).toBeInstanceOf(AiPlanError);
    return error.reason;
  }
  throw new Error('esperava AiPlanError e nada foi lançado');
}

describe('validateAiPlan — o que a IA pode decidir', () => {
  it('aceita uma ficha dentro das regras e marca a origem do plano', () => {
    const plan = validate(validAiPlan());

    expect(plan.planSource).toBe('ai');
    expect(plan.aiRationale).toBe('Comecei pelos compostos.');
    expect(plan.workoutSplits).toHaveLength(4);
    expect(plan.workoutSplits[0].subtitle).toBe('Peito e tríceps');
    expect(plan.workoutSplits[0].exercises.map(ex => ex.id)).toEqual(safeIds.slice(0, 4));
  });

  it('mantém a agenda, o cardápio e os suplementos da fórmula', () => {
    const plan = validate(validAiPlan());

    expect(plan.weekDays).toEqual(formulaPlan.weekDays);
    expect(plan.meals).toEqual(formulaPlan.meals);
    expect(plan.supplements).toEqual(formulaPlan.supplements);
    expect(plan.workoutSplits.map(s => s.id)).toEqual(splitIds);
  });

  it('escreve séries e descanso no mesmo idioma da ficha da fórmula', () => {
    const plan = validate(validAiPlan());
    const [first] = plan.workoutSplits[0].exercises;

    expect(first.defaultSeries).toBe(3);
    expect(first.rest).toBe('90s');
    expect(first.aiReps).toBe('8-12');
    // O card precisa continuar desenhando: o histórico do usuário liga por id.
    expect(first.name).toBeTruthy();
    expect(first.imageUrl).toBeTruthy();
    expect(Array.isArray(first.jointStress)).toBe(true);
  });

  it('limita séries e descanso quando o modelo exagera', () => {
    const plan = aiPlanFor([{
      splitId: splitIds[0],
      focus: 'Peito',
      exercises: safeIds.slice(0, 3).map(id => ({ id, sets: 40, reps: '8', restSeconds: 5000 }))
    }]);
    const validated = validate(plan);

    expect(validated.workoutSplits[0].exercises[0].defaultSeries).toBe(10);
    expect(validated.workoutSplits[0].exercises[0].rest).toBe('300s');
  });

  it('substitui de verdade a escolha de exercício da fórmula', () => {
    const plan = validate(validAiPlan());

    expect(formulaPlan.workoutSplits[0].exercises.map(ex => ex.id)).not.toEqual(safeIds.slice(0, 4));
    expect(plan.workoutSplits[0].exercises.map(ex => ex.id)).toEqual(safeIds.slice(0, 4));
  });
});

describe('validateAiPlan — o que a IA não pode decidir', () => {
  it('recusa exercício que não existe no catálogo', () => {
    const plan = aiPlanFor([{
      splitId: splitIds[0],
      focus: 'Peito',
      exercises: [{ id: 'supino_reto_de_barra_que_nao_existe', sets: 3, reps: '8', restSeconds: 90 }, ...safeIds.slice(0, 3).map(id => ({ id, sets: 3, reps: '8', restSeconds: 90 }))]
    }]);

    expect(reasonOf(() => validateAiPlan(plan, { profile, catalog: EXERCISE_CATALOG }))).toBe('unknown_exercise');
  });

  it('recusa exercício que mexe no ombro lesionado', () => {
    const shoulderId = EXERCISE_CATALOG.find(ex => (ex.jointStress ?? []).includes('ombro'))?.id;
    expect(shoulderId).toBeTruthy();

    const plan = aiPlanFor([{
      splitId: splitIds[0],
      focus: 'Peito',
      exercises: [{ id: shoulderId, sets: 3, reps: '8', restSeconds: 90 }, ...safeIds.slice(0, 3).map(id => ({ id, sets: 3, reps: '8', restSeconds: 90 }))]
    }]);

    expect(reasonOf(() => validateAiPlan(plan, { profile, catalog: EXERCISE_CATALOG }))).toBe('unsafe_exercise');
  });

  it('recusa exercício repetido na mesma ficha', () => {
    const [first] = safeIds;
    const plan = aiPlanFor([{
      splitId: splitIds[0],
      focus: 'Peito',
      exercises: [first, first, safeIds[1], safeIds[2]].map(id => ({ id, sets: 3, reps: '8', restSeconds: 90 }))
    }]);

    expect(reasonOf(() => validateAiPlan(plan, { profile, catalog: EXERCISE_CATALOG }))).toBe('duplicate_exercise');
  });

  it('recusa ficha curta ou gigante demais', () => {
    const [splitId] = splitIds;
    const tooSmall = aiPlanFor([{ splitId, focus: 'Peito', exercises: safeIds.slice(0, 2).map(id => ({ id, sets: 3, reps: '8', restSeconds: 90 })) }]);
    expect(reasonOf(() => validate(tooSmall))).toBe('split_size');

    const tooBig = aiPlanFor([{ splitId, focus: 'Peito', exercises: Array.from({ length: 12 }, (_, i) => ({ id: `ex-${i}`, sets: 3, reps: '8', restSeconds: 90 })) }]);
    expect(reasonOf(() => validate(tooBig))).toBe('unknown_exercise');
  });

  it('recusa macro incoerente com o peso e com o TDEE', () => {
    expect(reasonOf(() => validate(aiPlanFor([], { targetCalories: 900 })))).toBe('nutrition_out_of_range');

    expect(reasonOf(() => validate(aiPlanFor([], { targetCalories: TDEE + 4000 })))).toBe('nutrition_out_of_range');

    expect(reasonOf(() => validate(aiPlanFor([], { proteinGrams: 20 })))).toBe('nutrition_out_of_range');

    expect(reasonOf(() => validate(aiPlanFor([], { fatGrams: 4 })))).toBe('nutrition_out_of_range');

    expect(reasonOf(() => validate(aiPlanFor([], { carbsGrams: 10 })))).toBe('nutrition_out_of_range');

    expect(reasonOf(() => validate(aiPlanFor([], { proteinGrams: 0 })))).toBe('nutrition_invalid');
  });

  it('aceixa a faixa de calorie que a fórmula também usa', () => {
    const plan = validate(aiPlanFor([], {
      targetCalories: Math.round(TDEE * 0.75),
      proteinGrams: 100,
      carbsGrams: 130,
      fatGrams: 45
    }));

    expect(plan.physiology.targetCalories).toBe(Math.round(TDEE * 0.75));
    expect(plan.physiology.macros).toEqual({ protein: 100, carbs: 130, fat: 45 });
  });

  it('descarta resposta sem fichas ou sem forma de plano', () => {
    expect(reasonOf(() => validate(null))).toBe('malformed');
    expect(reasonOf(() => validate({ rationale: 'oi' }))).toBe('malformed');
  });

  it('descarta a ficha inteira em vez de aceitar os exercícios válidos', () => {
    const plan = aiPlanFor([
      { splitId: splitIds[0], focus: 'Peito', exercises: safeIds.slice(0, 4).map(id => ({ id, sets: 3, reps: '8', restSeconds: 90 })) },
      { splitId: splitIds[1], focus: 'Perna', exercises: [{ id: 'inventado', sets: 3, reps: '8', restSeconds: 90 }] }
    ]);

    expect(reasonOf(() => validateAiPlan(plan, { profile, catalog: EXERCISE_CATALOG }))).toBe('unknown_exercise');
  });
});

describe('requestAiPlan', () => {
  function okResponse(plan = validAiPlan()) {
    return new Response(JSON.stringify({ plan }), { status: 200 });
  }

  it('envia perfil sem nome, com TDEE e catálogo enxuto', async () => {
    const fetchImpl = vi.fn(async () => okResponse());
    await requestAiPlan({ profile, catalog: EXERCISE_CATALOG, splitIds, fetchImpl });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('/api/gemini/plan');
    expect(init.method).toBe('POST');

    const sent = JSON.parse(init.body);
    expect(sent.profile.userName).toBeUndefined();
    expect(sent.profile.ageYears).toBe(30);
    expect(sent.profile.restrictions).toEqual(['ombro']);
    expect(sent.tdee).toBe(TDEE);
    expect(sent.bmr).toBeGreaterThan(0);
    expect(sent.splits).toEqual(splitIds.map(id => ({ id })));
    expect(sent.catalog.length).toBe(EXERCISE_CATALOG.length);
    expect(JSON.stringify(sent)).not.toContain('dica');
  });

  it('devolve o plano validado quando o Worker responde certo', async () => {
    const fetchImpl = vi.fn(async () => okResponse());
    const plan = await requestAiPlan({ profile, catalog: EXERCISE_CATALOG, splitIds, fetchImpl });

    expect(plan.planSource).toBe('ai');
    expect(plan.workoutSplits[0].exercises.length).toBe(4);
  });

  it('traduz erro do Worker com o motivo que a tela usa', async () => {
    const fetchImpl = async () => new Response(
      JSON.stringify({ error: 'A IA demorou demais para responder.', code: 'ai_timeout' }),
      { status: 504 }
    );

    expect(await asyncReasonOf(() => requestAiPlan({ profile, catalog: EXERCISE_CATALOG, splitIds, fetchImpl }))).toBe('ai_timeout');
  });

  it('traduz falha de rede', async () => {
    const fetchImpl = async () => { throw new TypeError('failed to fetch'); };
    expect(await asyncReasonOf(() => requestAiPlan({ profile, catalog: EXERCISE_CATALOG, splitIds, fetchImpl }))).toBe('network');
  });

  it('traduz timeout do próprio cliente', async () => {
    const fetchImpl = (_url, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(new Error('aborted')));
    });

    expect(await asyncReasonOf(() => requestAiPlan({ profile, catalog: EXERCISE_CATALOG, splitIds, fetchImpl, timeoutMs: 20 }))).toBe('timeout');
  });

  it('recusa resposta sem plano', async () => {
    const fetchImpl = async () => new Response(JSON.stringify({ ok: true }), { status: 200 });
    expect(await asyncReasonOf(() => requestAiPlan({ profile, catalog: EXERCISE_CATALOG, splitIds, fetchImpl }))).toBe('malformed');
  });

  it('recusa plano inválido vindo do Worker — o proxy não é confiança', async () => {
    const fetchImpl = async () => new Response(JSON.stringify({
      plan: aiPlanFor([{ splitId: splitIds[0], focus: 'Peito', exercises: [{ id: 'nao_existe', sets: 3, reps: '8', restSeconds: 90 }] }])
    }), { status: 200 });

    expect(await asyncReasonOf(() => requestAiPlan({ profile, catalog: EXERCISE_CATALOG, splitIds, fetchImpl }))).toBe('unknown_exercise');
  });
});

describe('buildCatalogForModel', () => {
  it('manda o essencial e nada de texto que o modelo copiaria', () => {
    const [first] = buildCatalogForModel(EXERCISE_CATALOG);
    const expected = EXERCISE_CATALOG[0];

    expect(first.id).toBe(expected.id);
    expect(first.jointStress).toEqual(expected.jointStress);
    expect(Object.keys(first).sort()).toEqual(
      ['equipment', 'id', 'jointStress', 'muscle', 'name', 'pattern', 'referenceRestSeconds', 'referenceSets'].sort()
    );
  });
});