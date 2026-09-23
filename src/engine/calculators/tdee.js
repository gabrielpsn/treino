/**
 * Fórmulas Fisiológicas Especialistas para Hipertrofia
 */

// 1. Taxa Metabólica Basal (TMB) - Equação de Mifflin-St Jeor (padrão-ouro clínico)
export function calculateBMR({ gender, weightKg, heightCm, ageYears }) {
  if (gender === 'female') {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161);
  }
  // male / default
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5);
}

// 2. Gasto Calórico Diário Total (TDEE) com fator de atividade física
export function calculateTDEE(bmr, daysPerWeek = 4) {
  let activityMultiplier = 1.35; // Moderadamente ativo (3-4x treino com pesos)
  if (daysPerWeek <= 3) activityMultiplier = 1.25;
  else if (daysPerWeek === 4) activityMultiplier = 1.35;
  else if (daysPerWeek === 5) activityMultiplier = 1.45;
  else if (daysPerWeek >= 6) activityMultiplier = 1.55;

  return Math.round(bmr * activityMultiplier);
}

// 3. Superávit para Hipertrofia Limpa (Lean Bulk)
export function calculateSurplusCalories(tdee, experienceLevel) {
  // Iniciantes aproveitam mais superávit sem ganho excessivo de gordura (+350 a +400 kcal)
  // Avançados necessitam superávit mais controlado (+200 a +250 kcal)
  let surplus = 300;
  if (experienceLevel === 'beginner') surplus = 380;
  else if (experienceLevel === 'intermediate') surplus = 300;
  else if (experienceLevel === 'advanced') surplus = 220;

  return tdee + surplus;
}

// 4. Divisão de Macronutrientes para Hipertrofia (g/kg e kcal)
export function calculateMacros(targetCalories, weightKg, experienceLevel) {
  // Proteína: 2.0g/kg de peso corporal (4 kcal/g)
  const proteinGrams = Math.round(weightKg * 2.0);
  const proteinKcal = proteinGrams * 4;

  // Gorduras: 0.9g/kg de peso corporal (9 kcal/g) para suporte hormonal saudável
  const fatGrams = Math.round(weightKg * 0.9);
  const fatKcal = fatGrams * 9;

  // Carboidratos: Restante calórico para maximizar estoques de glicogênio e performance (4 kcal/g)
  const remainingKcal = Math.max(0, targetCalories - (proteinKcal + fatKcal));
  const carbsGrams = Math.round(remainingKcal / 4);

  return {
    proteinGrams,
    proteinKcal,
    fatGrams,
    fatKcal,
    carbsGrams,
    carbsKcal: carbsGrams * 4,
    totalCalories: targetCalories
  };
}

// 5. Hidratação Diária Personalizada (ml)
export function calculateWaterRequirement(weightKg) {
  // 35ml a 40ml de água por kg de peso corporal para usuários de creatina e treino resistido
  const ml = Math.round(weightKg * 40);
  return {
    ml,
    liters: (ml / 1000).toFixed(1)
  };
}

// 6. Dose Recomendada de Creatina (g/dia)
export function calculateCreatineDose(weightKg) {
  // 0.05g a 0.07g por kg ou mínimo de 3g a 5g padrão
  const dose = Math.max(3, Math.min(8, Math.round(weightKg * 0.06)));
  return dose;
}
