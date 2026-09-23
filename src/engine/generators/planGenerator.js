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
  const { splits, weekDays } = generateWorkoutSplit({ ...userProfile, goal });

  // 3. Montagem do Plano de Refeições
  let meals = [];
  if (goal === 'weight_loss') {
    meals = WEIGHT_LOSS_MEAL_TEMPLATES.map(template => ({
      id: `meal-${template.order}`,
      title: template.title,
      tag: template.tag,
      objective: template.description,
      items: template.buildText(1, creatine)
    }));
  } else {
    // Base de cálculo para o cardápio padrão de hipertrofia (~2400 kcal)
    const caloriesRatio = Math.max(0.7, Math.min(1.6, targetCalories / 2400));
    meals = MEAL_TEMPLATES.map(template => ({
      id: `meal-${template.order}`,
      title: template.title,
      tag: template.tag,
      objective: template.description,
      items: template.buildText(caloriesRatio, creatine)
    }));
  }

  // 4. Diagnóstico Antropométrico & Metas (especialmente útil no emagrecimento)
  const heightM = (userProfile.heightCm || 170) / 100;
  const imc = parseFloat((userProfile.weightKg / (heightM * heightM)).toFixed(1));
  let imcStatus = 'Peso Normal';
  if (imc < 18.5) imcStatus = 'Abaixo do peso';
  else if (imc < 25) imcStatus = 'Peso Normal';
  else if (imc < 30) imcStatus = 'Sobrepeso';
  else if (imc < 35) imcStatus = 'Obesidade Grau I';
  else imcStatus = 'Obesidade Grau II+';

  const healthyMinWeight = Math.round(18.5 * heightM * heightM);
  const healthyMaxWeight = Math.round(24.9 * heightM * heightM);
  const targetWeightDiff = Math.max(0, Math.round(userProfile.weightKg - healthyMaxWeight));

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
      targetWeightDiff
    },
    workoutSplits: splits,
    weekSchedule: weekDays,
    meals,
    naturalSupplements: goal === 'weight_loss' ? NATURAL_SUPPLEMENTS : []
  };
}
