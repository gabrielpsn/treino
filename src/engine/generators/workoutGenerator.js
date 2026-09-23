import { EXERCISE_CATALOG } from '../knowledge/exercises';

/**
 * Filtra exercícios com base nas restrições articulares e equipamento disponível
 */
export function getSafeExercise(targetMuscle, pattern, restrictions = [], equipment = 'gym') {
  const matches = EXERCISE_CATALOG.filter(ex => {
    // 1. Deve corresponder ao músculo ou padrão
    const matchMuscle = ex.muscle === targetMuscle;
    const matchPattern = pattern ? ex.pattern === pattern : true;
    if (!matchMuscle || !matchPattern) return false;

    // 2. Equipamento
    if (equipment === 'home' && ex.equipment === 'gym') return false;

    // 3. Restrições do usuário (ex: se tem dor na lombar, ombro ou joelho)
    const hasConflict = ex.jointStress.some(joint => restrictions.includes(joint));
    if (hasConflict) return false;

    return true;
  });

  if (matches.length > 0) {
    return matches[0];
  }

  // Fallback caso filtro estrito elimine tudo: busca alternativa do mesmo músculo sem o conflito
  const fallback = EXERCISE_CATALOG.find(ex => 
    ex.muscle === targetMuscle && !ex.jointStress.some(joint => restrictions.includes(joint))
  );

  return fallback || EXERCISE_CATALOG.find(ex => ex.muscle === targetMuscle) || null;
}

/**
 * Gera os splits e fichas de exercícios de acordo com a frequência semanal (3 a 6 dias)
 */
export function generateWorkoutSplit(profile) {
  const { daysPerWeek = 4, focusArea = 'general', restrictions = [], equipment = 'gym', experienceLevel = 'intermediate' } = profile;

  const splits = [];

  // Fator de ajuste de volume por nível
  const seriesCount = experienceLevel === 'beginner' ? '3x 8-10 reps' : experienceLevel === 'advanced' ? '4x 8-12 reps' : '3x 10-12 reps';

  if (daysPerWeek <= 3) {
    // Split ABC Clássico (Push / Pull / Legs)
    splits.push({
      id: 'treino-a',
      title: 'Treino A (Push)',
      subtitle: 'Peito, Deltóide Anterior/Lateral e Tríceps',
      color: 'amber',
      accentBg: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
      exercises: [
        getSafeExercise('peito', 'push_horizontal', restrictions, equipment),
        getSafeExercise('peito', 'push_incline', restrictions, equipment),
        getSafeExercise('peito', 'fly', restrictions, equipment),
        getSafeExercise('ombro', 'push_vertical', restrictions, equipment),
        getSafeExercise('ombro', 'lateral_raise', restrictions, equipment),
        getSafeExercise('triceps', 'triceps_extension', restrictions, equipment),
        getSafeExercise('triceps', 'triceps_overhead', restrictions, equipment)
      ].filter(Boolean)
    });

    splits.push({
      id: 'treino-b',
      title: 'Treino B (Pull)',
      subtitle: 'Costas, Deltóide Posterior e Bíceps',
      color: 'blue',
      accentBg: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
      exercises: [
        getSafeExercise('costas', 'pull_vertical', restrictions, equipment),
        getSafeExercise('costas', 'pull_horizontal', restrictions, equipment),
        getSafeExercise('costas', 'lat_isolation', restrictions, equipment),
        getSafeExercise('ombro', 'rear_delt', restrictions, equipment),
        getSafeExercise('biceps', 'biceps_curl', restrictions, equipment),
        getSafeExercise('biceps', null, restrictions, equipment)
      ].filter(Boolean)
    });

    splits.push({
      id: 'treino-c',
      title: 'Treino C (Legs & Core)',
      subtitle: 'Quadríceps, Isquiotibiais, Glúteos e Panturrilhas',
      color: 'emerald',
      accentBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
      exercises: [
        getSafeExercise('quadriceps', 'squat', restrictions, equipment) || getSafeExercise('quadriceps', 'leg_press', restrictions, equipment),
        getSafeExercise('quadriceps', 'leg_extension', restrictions, equipment),
        getSafeExercise('posterior', 'leg_curl', restrictions, equipment),
        getSafeExercise('gluteos', 'hip_thrust', restrictions, equipment),
        getSafeExercise('panturrilha', 'calf_raise', restrictions, equipment),
        getSafeExercise('core', 'crunch', restrictions, equipment)
      ].filter(Boolean)
    });

  } else if (daysPerWeek === 4) {
    // Split Upper / Lower (2x por semana) - Padrão-ouro em hipertrofia para 4 dias
    splits.push({
      id: 'treino-a',
      title: 'Treino A (Upper 1 - Força e Base)',
      subtitle: 'Peitoral Pesado, Costas e Ombros',
      color: 'amber',
      accentBg: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
      exercises: [
        getSafeExercise('peito', 'push_horizontal', restrictions, equipment),
        getSafeExercise('costas', 'pull_horizontal', restrictions, equipment),
        getSafeExercise('peito', 'push_incline', restrictions, equipment),
        getSafeExercise('costas', 'pull_vertical', restrictions, equipment),
        getSafeExercise('ombro', 'lateral_raise', restrictions, equipment),
        getSafeExercise('biceps', 'biceps_curl', restrictions, equipment),
        getSafeExercise('triceps', 'triceps_extension', restrictions, equipment)
      ].filter(Boolean)
    });

    splits.push({
      id: 'treino-b',
      title: 'Treino B (Lower 1 - Foco Anterior)',
      subtitle: 'Quadríceps, Panturrilhas e Core',
      color: 'blue',
      accentBg: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
      exercises: [
        getSafeExercise('quadriceps', 'squat', restrictions, equipment),
        getSafeExercise('quadriceps', 'leg_press', restrictions, equipment),
        getSafeExercise('quadriceps', 'leg_extension', restrictions, equipment),
        getSafeExercise('posterior', 'leg_curl', restrictions, equipment),
        getSafeExercise('panturrilha', 'calf_raise', restrictions, equipment),
        getSafeExercise('core', 'crunch', restrictions, equipment)
      ].filter(Boolean)
    });

    splits.push({
      id: 'treino-c',
      title: 'Treino C (Upper 2 - Foco Hipertrofia)',
      subtitle: 'Volume de Costas, Deltoides e Braços',
      color: 'purple',
      accentBg: 'bg-purple-500/10 border-purple-500/20 text-purple-300',
      exercises: [
        getSafeExercise('costas', 'pull_vertical', restrictions, equipment),
        getSafeExercise('peito', 'fly', restrictions, equipment),
        getSafeExercise('costas', 'lat_isolation', restrictions, equipment),
        getSafeExercise('ombro', 'push_vertical', restrictions, equipment),
        getSafeExercise('ombro', 'rear_delt', restrictions, equipment),
        getSafeExercise('triceps', 'triceps_overhead', restrictions, equipment),
        getSafeExercise('biceps', 'biceps_curl', restrictions, equipment)
      ].filter(Boolean)
    });

    splits.push({
      id: 'treino-d',
      title: 'Treino D (Lower 2 - Foco Posterior & Glúteo)',
      subtitle: 'Isquiotibiais, Glúteos e Cadeia Posterior',
      color: 'emerald',
      accentBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
      exercises: [
        getSafeExercise('gluteos', 'hip_thrust', restrictions, equipment),
        getSafeExercise('posterior', 'hinge', restrictions, equipment) || getSafeExercise('posterior', 'leg_curl', restrictions, equipment),
        getSafeExercise('posterior', 'leg_curl', restrictions, equipment),
        getSafeExercise('quadriceps', 'squat', restrictions, equipment),
        getSafeExercise('panturrilha', 'calf_raise', restrictions, equipment),
        getSafeExercise('core', 'plank', restrictions, equipment)
      ].filter(Boolean)
    });

  } else {
    // 5 ou 6 dias: Push / Pull / Legs (PPL) ciclado
    splits.push({
      id: 'treino-a',
      title: 'Treino A (Push - Empurrar)',
      subtitle: 'Peito, Ombro Frontal/Lateral e Tríceps',
      color: 'amber',
      accentBg: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
      exercises: [
        getSafeExercise('peito', 'push_horizontal', restrictions, equipment),
        getSafeExercise('peito', 'push_incline', restrictions, equipment),
        getSafeExercise('peito', 'fly', restrictions, equipment),
        getSafeExercise('ombro', 'push_vertical', restrictions, equipment),
        getSafeExercise('ombro', 'lateral_raise', restrictions, equipment),
        getSafeExercise('triceps', 'triceps_extension', restrictions, equipment),
        getSafeExercise('triceps', 'triceps_overhead', restrictions, equipment)
      ].filter(Boolean)
    });

    splits.push({
      id: 'treino-b',
      title: 'Treino B (Pull - Puxar)',
      subtitle: 'Costas Completa, Deltóide Posterior e Bíceps',
      color: 'blue',
      accentBg: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
      exercises: [
        getSafeExercise('costas', 'pull_vertical', restrictions, equipment),
        getSafeExercise('costas', 'pull_horizontal', restrictions, equipment),
        getSafeExercise('costas', 'lat_isolation', restrictions, equipment),
        getSafeExercise('ombro', 'rear_delt', restrictions, equipment),
        getSafeExercise('biceps', 'biceps_curl', restrictions, equipment),
        getSafeExercise('biceps', null, restrictions, equipment)
      ].filter(Boolean)
    });

    splits.push({
      id: 'treino-c',
      title: 'Treino C (Legs - Pernas Completas)',
      subtitle: 'Quadríceps, Isquiotibiais, Glúteos e Panturrilhas',
      color: 'emerald',
      accentBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
      exercises: [
        getSafeExercise('quadriceps', 'squat', restrictions, equipment),
        getSafeExercise('quadriceps', 'leg_press', restrictions, equipment),
        getSafeExercise('posterior', 'leg_curl', restrictions, equipment),
        getSafeExercise('gluteos', 'hip_thrust', restrictions, equipment),
        getSafeExercise('panturrilha', 'calf_raise', restrictions, equipment),
        getSafeExercise('core', 'crunch', restrictions, equipment)
      ].filter(Boolean)
    });
  }

  // Gera agenda semanal sugerida
  const weekDays = generateWeekSchedule(daysPerWeek, splits);

  return { splits, weekDays };
}

function generateWeekSchedule(daysPerWeek, splits) {
  const days = [
    { id: 'seg', label: 'Segunda', workout: 'Descanso' },
    { id: 'ter', label: 'Terça', workout: 'Descanso' },
    { id: 'qua', label: 'Quarta', workout: 'Descanso' },
    { id: 'qui', label: 'Quinta', workout: 'Descanso' },
    { id: 'sex', label: 'Sexta', workout: 'Descanso' },
    { id: 'sab', label: 'Sábado', workout: 'Descanso' },
    { id: 'dom', label: 'Domingo', workout: 'Descanso' }
  ];

  if (daysPerWeek === 3) {
    days[0].workout = splits[0].title;
    days[2].workout = splits[1].title;
    days[4].workout = splits[2].title;
  } else if (daysPerWeek === 4) {
    days[0].workout = splits[0].title;
    days[1].workout = splits[1].title;
    days[3].workout = splits[2].title;
    days[4].workout = splits[3].title;
  } else if (daysPerWeek === 5) {
    days[0].workout = splits[0].title;
    days[1].workout = splits[1].title;
    days[2].workout = splits[2].title;
    days[4].workout = splits[0].title;
    days[5].workout = splits[1].title;
  } else if (daysPerWeek >= 6) {
    days[0].workout = splits[0].title;
    days[1].workout = splits[1].title;
    days[2].workout = splits[2].title;
    days[3].workout = splits[0].title;
    days[4].workout = splits[1].title;
    days[5].workout = splits[2].title;
  }

  return days;
}
