import {
    calculateBMR,
    calculateCreatineDose,
    calculateMacros,
    calculateTargetCalories,
    calculateTDEE,
    calculateWaterRequirement
} from '../calculators/tdee.js';
import { generateWorkoutSplit } from './workoutGenerator.js';
import { MEAL_TEMPLATES, WEIGHT_LOSS_MEAL_TEMPLATES, NATURAL_SUPPLEMENTS } from '../knowledge/foodTemplates.js';

/**
 * Soma aproximada das tags do cardápio padrão de déficit (320+450+220+350).
 * Serve de denominador para escalar as porções do cardápio de emagrecimento.
 */
const DEFICIT_MEAL_BASE_CALORIES = 1340;

/**
 * Orquestrador Geral: Recebe as respostas do usuário e gera o Plano Completo
 */
export function buildPersonalizedPlan(userProfile) {
  const goal = userProfile.goal || 'hypertrophy';
  const defaultName = userProfile.gender === 'female' ? 'Maria' : 'João';
  const userName = userProfile.userName || defaultName;

  // 1. Cálculos Fisiológicos
  const bmr = calculateBMR(userProfile);
  const tdee = calculateTDEE(bmr, userProfile.daysPerWeek);
  const targetCalories = calculateTargetCalories(tdee, userProfile.experienceLevel, goal);
  const macros = calculateMacros(targetCalories, userProfile.weightKg, userProfile.experienceLevel, goal);
  const water = calculateWaterRequirement(userProfile.weightKg);
  const creatine = calculateCreatineDose(userProfile.weightKg);

  // 2. Geração da Divisão e Fichas de Treino
  // `catalog` (embutido + exercícios próprios) é repassado intacto: o plano
  // gerado precisa refletir os exercícios que o usuário criou, não o catálogo
  // de fábrica.
  const { splits, weekDays } = generateWorkoutSplit({ ...userProfile, goal });

  // 3. Montagem do Plano de Refeições
  let meals = [];
  const caloriesRatio = Math.max(0.7, Math.min(1.6, targetCalories / 2400));

  if (goal === 'weight_loss') {
    // No déficit, o cardápio base é ~1640 kcal (320+450+220+350) e não 2400,
    // então a proporção precisa ser calculada contra essa base. Sem isso, um
    // usuário de 1400 kcal e um de 2400 viam exatamente o mesmo cardápio.
    const deficitRatio = Math.max(0.7, Math.min(1.5, targetCalories / DEFICIT_MEAL_BASE_CALORIES));
    meals = WEIGHT_LOSS_MEAL_TEMPLATES.map(template => ({
      id: `meal-${template.order}`,
      title: template.title,
      tag: template.tag,
      objective: template.description,
      items: template.buildText(deficitRatio, creatine)
    }));
  } else {
    // Base de cálculo para o cardápio padrão de hipertrofia (~2400 kcal)
    meals = MEAL_TEMPLATES.map(template => ({
      id: `meal-${template.order}`,
      title: template.title,
      tag: template.tag,
      objective: template.description,
      items: template.buildText(caloriesRatio, creatine)
    }));
  }

  // 4. Diagnóstico Antropométrico & Metas (especialmente útil no emagrecimento)
  const heightCm = Number(userProfile.heightCm) || 170;
  const weightKg = Number(userProfile.weightKg) || 0;
  const heightM = heightCm / 100;
  const imc = parseFloat((weightKg / (heightM * heightM)).toFixed(1));
  let imcStatus = 'Peso Normal';
  if (!Number.isFinite(imc)) imcStatus = 'Indefinido';
  else if (imc < 18.5) imcStatus = 'Abaixo do peso';
  else if (imc < 25) imcStatus = 'Peso Normal';
  else if (imc < 30) imcStatus = 'Sobrepeso';
  else if (imc < 35) imcStatus = 'Obesidade Grau I';
  else imcStatus = 'Obesidade Grau II+';

  const healthyMinWeight = Math.round(18.5 * heightM * heightM);
  const healthyMaxWeight = Math.round(24.9 * heightM * heightM);

  // targetWeightDiff: quanto há a perder até o limite superior da faixa saudável (OMS).
  // Quando a pessoa já está dentro da faixa, o objetivo passa a ser manutenção e o
  // valor precisa ser 0 - exibir um "-10 kg" inventado seria incorreto e desmotivador.
  const targetWeightDiff = Math.max(0, Math.round(weightKg - healthyMaxWeight));
  const isWithinHealthyRange = weightKg <= healthyMaxWeight;
  const weightGoal = targetWeightDiff > 0 ? 'lose' : 'maintain';
  const targetWeightText = targetWeightDiff > 0
    ? `-${targetWeightDiff} kg`
    : 'Manter';

  return {
    id: 'current_active_plan',
    createdAt: new Date().toISOString(),
    profile: { ...userProfile, userName, goal },
    physiology: {
      bmr,
      tdee,
      targetCalories,
      macros,
      water,
      creatine,
      imc,
      imcStatus,
      healthyWeightRange: `${healthyMinWeight} a ${healthyMaxWeight} kg`,
      targetWeightDiff,
      isWithinHealthyRange,
      weightGoal,
      targetWeightText
    },
    workoutSplits: splits,
    weekSchedule: weekDays,
    meals,
    naturalSupplements: goal === 'weight_loss' ? NATURAL_SUPPLEMENTS : []
  };
}
