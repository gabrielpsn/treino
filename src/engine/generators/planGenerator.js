import {
    calculateBMR,
    calculateCreatineDose,
    calculateMacros,
    calculateSurplusCalories,
    calculateTDEE,
    calculateWaterRequirement
} from '../calculators/tdee.js';
import { generateWorkoutSplit } from './workoutGenerator.js';
import { MEAL_TEMPLATES } from '../knowledge/foodTemplates.js';

/**
 * Orquestrador Geral: Recebe as respostas do usuário e gera o Plano Completo
 */
export function buildPersonalizedPlan(userProfile) {
  // 1. Cálculos Fisiológicos
  const bmr = calculateBMR(userProfile);
  const tdee = calculateTDEE(bmr, userProfile.daysPerWeek);
  const targetCalories = calculateSurplusCalories(tdee, userProfile.experienceLevel);
  const macros = calculateMacros(targetCalories, userProfile.weightKg, userProfile.experienceLevel);
  const water = calculateWaterRequirement(userProfile.weightKg);
  const creatine = calculateCreatineDose(userProfile.weightKg);

  // 2. Geração da Divisão e Fichas de Treino
  const { splits, weekDays } = generateWorkoutSplit(userProfile);

  // 3. Montagem do Plano de Refeições Proporcional
  // Base de cálculo para o cardápio padrão (~2400 kcal)
  const caloriesRatio = Math.max(0.7, Math.min(1.6, targetCalories / 2400));
  const meals = MEAL_TEMPLATES.map(template => ({
    id: `meal-${template.order}`,
    title: template.title,
    tag: template.tag,
    objective: template.description,
    items: template.buildText(caloriesRatio, creatine)
  }));

  return {
    id: 'current_active_plan',
    createdAt: new Date().toISOString(),
    profile: { ...userProfile },
    physiology: {
      bmr,
      tdee,
      targetCalories,
      macros,
      water,
      creatine
    },
    workoutSplits: splits,
    weekSchedule: weekDays,
    meals
  };
}
