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

// 3. Calorias Alvo (Superávit para Hipertrofia ou Déficit Saudável para Perda de Peso)
export function calculateTargetCalories(tdee, experienceLevel = 'intermediate', goal = 'hypertrophy') {
  if (goal === 'weight_loss') {
    // Déficit seguro de 400 a 500 kcal para perder de 2 a 3 kg por mês sem efeito sanfona
    // Piso seguro mínimo para mulheres/homens (~1400 kcal)
    const deficit = experienceLevel === 'beginner' ? 400 : 480;
    return Math.max(1400, tdee - deficit);
  }

  // Hipertrofia Limpa (Lean Bulk)
  let surplus = 300;
  if (experienceLevel === 'beginner') surplus = 380;
  else if (experienceLevel === 'intermediate') surplus = 300;
  else if (experienceLevel === 'advanced') surplus = 220;

  return tdee + surplus;
}

// Mantém retrocompatibilidade caso algo ainda chame calculateSurplusCalories
export const calculateSurplusCalories = calculateTargetCalories;

// 4. Divisão de Macronutrientes (Hipertrofia ou Perda de Peso)
export function calculateMacros(targetCalories, weightKg, experienceLevel = 'intermediate', goal = 'hypertrophy') {
  // Proteína: 2.0g a 2.2g/kg (fundamental tanto para construir músculo quanto para preservar massa magra em déficit)
  const proteinMultiplier = goal === 'weight_loss' ? 2.0 : 2.0;
  const proteinGrams = Math.round(weightKg * proteinMultiplier);
  const proteinKcal = proteinGrams * 4;

  // Gorduras: 0.8g/kg em déficit, 0.9g/kg em superávit
  const fatMultiplier = goal === 'weight_loss' ? 0.8 : 0.9;
  const fatGrams = Math.round(weightKg * fatMultiplier);
  const fatKcal = fatGrams * 9;

  // Carboidratos: Restante calórico
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
