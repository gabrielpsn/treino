import { filterSafeExercises } from '../generators/workoutGenerator.js';
import { buildPersonalizedPlan } from '../generators/planGenerator.js';
import { calculateBMR, calculateTDEE } from '../calculators/tdee.js';

/**
 * Plano gerado por IA, com a fórmula ainda no comando.
 *
 * A IA escolhe *quais* exercícios e *quais* metas. Ela não decide a estrutura
 * do plano, não cria exercício e não passa por cima da segurança articular.
 *
 * O motivo é concreto: o histórico do usuário é guardado por id de exercício
 * (IndexedDB). Se um modelo devolvesse "Supino reto" enquanto o catálogo tem
 * "supino_reto_halteres", o treino antigo ficaria órfão e a série que ele fez
 * simplesmente sumiria da evolução. E se o modelo escolhesse um exercício que
 * mexe no ombro de quem declarou o ombro lesionado, nenhum teste de tela
 * impediria aquilo de chegar ao treino.
 *
 * Então a resposta da IA é tratada como sugestão não confiável: passa por
 * validação contra o catálogo e pelo mesmo filtro de restrição que a fórmula
 * usa. Qualquer violação descarta a sugestão inteira, e o app continua com o
 * plano da fórmula.
 */

const MIN_EXERCISES_PER_SPLIT = 3;
const MAX_EXERCISES_PER_SPLIT = 8;
const MIN_SETS = 1;
const MAX_SETS = 10;

// A IA pode discordar da fórmula, mas não por muito: abaixo de 70% do TDEE a
// "recomendação" vira fome, e acima de 130% vira ganho de gordura.
const MIN_CALORIE_RATIO = 0.7;
const MAX_CALORIE_RATIO = 1.3;

export class AiPlanError extends Error {
  constructor(reason, message) {
    super(message);
    this.name = 'AiPlanError';
    this.reason = reason;
  }
}

function assert(condition, reason, message) {
  if (!condition) throw new AiPlanError(reason, message);
}

function round(value) {
  return Math.round(Number(value) || 0);
}

/**
 * Só o que o modelo precisa para escolher: id, nome, músculo, padrão,
 * equipamento, articulação estressada, séries e descanso de referência.
 * A dica e o músculo-alvo não vão porque não ajudam a escolher e aumentam a chance
 * de o modelo copiar texto em vez de raciocinar sobre o id.
 */
export function buildCatalogForModel(catalog) {
  return catalog.map(ex => ({
    id: ex.id,
    name: ex.name,
    muscle: ex.muscle,
    pattern: ex.pattern,
    equipment: ex.equipment,
    jointStress: ex.jointStress,
    referenceSets: ex.defaultSeries,
    referenceRestSeconds: ex.rest
  }));
}

/**
 * Monta o plano final: a fórmula continua sendo a base (perfil, agenda,
 * antropometria, cardápio, suplementos) e a IA sobrescreve só os exercícios de
 * cada ficha e as metas de macro.
 */
function assemblePlan(basePlan, aiPlan, { profile, catalog }) {
  const { restrictions = [], equipment = 'gym' } = profile;
  const catalogById = new Map(catalog.map(ex => [ex.id, ex]));

  const workoutSplits = basePlan.workoutSplits.map((split, index) => {
    const aiSplit = aiPlan.splits.find(s => s.splitId === split.id) ?? aiPlan.splits[index];
    if (!aiSplit) return split;

    const chosenIds = [];
    const exercises = [];

    for (const item of aiSplit.exercises) {
      const exercise = catalogById.get(item.id);

      // Id que não existe no catálogo é alucinação. Descarta a ficha inteira:
      // escolher a dedo os válidos deixaria buraco silencioso no meio do treino.
      assert(
        exercise,
        'unknown_exercise',
        `A IA escolheu um exercício que não existe no catálogo: ${item.id}`
      );

      // Mesmo portão de segurança da fórmula: restrição articular e equipamento.
      const [safe] = filterSafeExercises([exercise], { restrictions, equipment });
      assert(
        safe,
        'unsafe_exercise',
        `A IA escolheu um exercício inseguro para este perfil: ${exercise.name}`
      );

      assert(
        !chosenIds.includes(exercise.id),
        'duplicate_exercise',
        `A IA repetiu o exercício ${exercise.name} na mesma ficha`
      );
      chosenIds.push(exercise.id);

      exercises.push({
        ...exercise,
        defaultSeries: Math.min(MAX_SETS, Math.max(MIN_SETS, round(item.sets))),
        // O app usa "90s" em toda a ficha, então a IA precisa falar o mesmo
        // idioma: um número solto apareceria como "Descanso: 90" no card.
        rest: `${Math.min(300, Math.max(30, round(item.restSeconds)))}s`,
        aiReps: String(item.reps ?? '').trim() || undefined,
        aiNote: typeof item.note === 'string' ? item.note.trim().slice(0, 140) || undefined : undefined
      });
    }

    assert(
      exercises.length >= MIN_EXERCISES_PER_SPLIT && exercises.length <= MAX_EXERCISES_PER_SPLIT,
      'split_size',
      `A ficha ${split.title} ficou com ${exercises.length} exercícios`
    );

    return {
      ...split,
      subtitle: typeof aiSplit.focus === 'string' && aiSplit.focus.trim()
        ? aiSplit.focus.trim().slice(0, 80)
        : split.subtitle,
      exercises
    };
  });

  return {
    ...basePlan,
    workoutSplits,
    planSource: 'ai',
    aiRationale: typeof aiPlan.rationale === 'string' ? aiPlan.rationale.trim().slice(0, 300) : '',
    physiology: {
      ...basePlan.physiology,
      targetCalories: round(aiPlan.targetCalories),
      macros: {
        protein: round(aiPlan.proteinGrams),
        carbs: round(aiPlan.carbsGrams),
        fat: round(aiPlan.fatGrams)
      }
    }
  };
}

/**
 * Valida os números antes de aceitar. Macro incoerente com o TDEE é erro de
 * geração, não opinião: aqui a IA não tem voto.
 */
function validateNutrition(aiPlan, profile) {
  const weightKg = Number(profile.weightKg) || 0;
  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(bmr, profile.daysPerWeek);

  const calories = round(aiPlan.targetCalories);
  const protein = round(aiPlan.proteinGrams);
  const carbs = round(aiPlan.carbsGrams);
  const fat = round(aiPlan.fatGrams);

  assert(calories > 0 && carbs >= 0 && fat >= 0, 'nutrition_invalid', 'Macros inválidos');
  assert(protein > 0, 'nutrition_invalid', 'Proteína inválida');

  if (tdee > 0) {
    assert(
      calories >= tdee * MIN_CALORIE_RATIO && calories <= tdee * MAX_CALORIE_RATIO,
      'nutrition_out_of_range',
      `A IA sugeriu ${calories} kcal, fora da faixa segura para este perfil`
    );
  }

  if (weightKg > 0) {
    assert(
      protein >= weightKg * 1.2 && protein <= weightKg * 2.6,
      'nutrition_out_of_range',
      `A IA sugeriu ${protein}g de proteína, incompatível com ${weightKg}kg`
    );
    assert(fat >= weightKg * 0.5, 'nutrition_out_of_range', 'Gordura abaixo do mínimo saudável');
    assert(carbs >= weightKg * 1.5, 'nutrition_out_of_range', 'Carboidrato abaixo do mínimo saudável');
  }
}

/**
 * Valida a estrutura completa. Lança AiPlanError com o motivo — o chamador usa
 * esse motivo para explicar ao usuário que a ficha atual continua valendo.
 */
export function validateAiPlan(aiPlan, { profile, catalog }) {
  assert(aiPlan && typeof aiPlan === 'object', 'malformed', 'Resposta da IA vazia');
  assert(Array.isArray(aiPlan.splits), 'malformed', 'A IA não devolveu fichas');

  validateNutrition(aiPlan, profile);

  const basePlan = buildPersonalizedPlan({ ...profile, catalog });
  return assemblePlan(basePlan, aiPlan, { profile, catalog });
}

/**
 * Chama o proxy e devolve o plano pronto para salvar. `fetchImpl` existe para os
 * testes: o app offline não tem `fetch` disponível por decisão de produto, e o
 * caminho do erro precisa ser testável.
 */
export async function requestAiPlan({ profile, catalog, splitIds, fetchImpl, timeoutMs = 30000 }) {
  const doFetch = fetchImpl ?? (typeof fetch === 'function' ? fetch : null);

  // Sem proxy (dev sem `wrangler dev`, app aberto por file://) a geração por IA
  // simplesmente não existe. Não é erro de usuário nem de plano.
  if (!doFetch) {
    throw new AiPlanError('unavailable', 'Sem conexão com o servidor de IA.');
  }

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  // TDEE vai junto porque o modelo não deve fazer conta de fórmula dentro da
  // chamada: ele calibra em torno de um número já calculado e o app valida
  // contra a mesma conta depois.
  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(bmr, profile.daysPerWeek);

  let response;
  try {
    response = await doFetch('/api/gemini/plan', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        profile: {
          goal: profile.goal,
          ageYears: profile.ageYears,
          gender: profile.gender,
          weightKg: profile.weightKg,
          heightCm: profile.heightCm,
          experienceLevel: profile.experienceLevel,
          equipment: profile.equipment,
          restrictions: profile.restrictions ?? [],
          daysPerWeek: profile.daysPerWeek
        },
        bmr,
        tdee,
        catalog: buildCatalogForModel(catalog),
        splits: splitIds.map(id => ({ id }))
      }),
      signal: controller?.signal
    });
  } catch (error) {
    if (controller?.signal.aborted) {
      throw new AiPlanError('timeout', 'A IA demorou demais para responder.');
    }
    throw new AiPlanError('network', 'Não consegui falar com o servidor de IA.');
  } finally {
    if (timeout) clearTimeout(timeout);
  }

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new AiPlanError(detail.code ?? 'http_error', detail.error ?? 'A geração por IA falhou.');
  }

  const payload = await response.json().catch(() => null);
  assert(payload?.plan, 'malformed', 'A resposta da IA não trouxe plano.');

  return validateAiPlan(payload.plan, { profile, catalog });
}