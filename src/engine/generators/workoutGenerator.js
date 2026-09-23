import { EXERCISE_CATALOG } from '../knowledge/exercises.js';

/**
 * Filtra exercícios com base nas restrições articulares, equipamento disponível
 * e garante que não repita exercícios já selecionados no split (excludeIds).
 */
export function getSafeExercise(targetMuscle, pattern, restrictions = [], equipment = 'gym', excludeIds = []) {
  // 1. Prioridade exata: músculo + padrão + sem restrições + equipamento correto + não excluído
  const exactMatches = EXERCISE_CATALOG.filter(ex => {
    if (excludeIds.includes(ex.id)) return false;
    if (targetMuscle && ex.muscle !== targetMuscle) return false;
    if (pattern && ex.pattern !== pattern) return false;
    if (equipment === 'home' && ex.equipment === 'gym') return false;
    if (ex.jointStress.some(j => restrictions.includes(j))) return false;
    return true;
  });

  if (exactMatches.length > 0) {
    return exactMatches[0];
  }

  // 2. Se não encontrou pelo pattern exato, busca pelo músculo sem restrições e não excluído
  const muscleMatches = EXERCISE_CATALOG.filter(ex => {
    if (excludeIds.includes(ex.id)) return false;
    if (targetMuscle && ex.muscle !== targetMuscle) return false;
    if (equipment === 'home' && ex.equipment === 'gym') return false;
    if (ex.jointStress.some(j => restrictions.includes(j))) return false;
    return true;
  });

  if (muscleMatches.length > 0) {
    return muscleMatches[0];
  }

  // 3. Fallback flexibilizando equipamento mas respeitando restrições articulares
  const safeFallback = EXERCISE_CATALOG.find(ex =>
    !excludeIds.includes(ex.id) &&
    ex.muscle === targetMuscle &&
    !ex.jointStress.some(j => restrictions.includes(j))
  );

  if (safeFallback) return safeFallback;

  // 4. Último recurso: qualquer um do músculo não excluído
  return EXERCISE_CATALOG.find(ex => !excludeIds.includes(ex.id) && ex.muscle === targetMuscle) || null;
}

/**
 * Helper para preencher uma lista de exercícios acumulando os IDs para evitar duplicatas
 */
function buildExerciseList(configs, restrictions, equipment, seriesCount) {
  const list = [];
  const excludeIds = [];

  for (const cfg of configs) {
    const ex = getSafeExercise(cfg.muscle, cfg.pattern, restrictions, equipment, excludeIds);
    if (ex) {
      excludeIds.push(ex.id);
      list.push({
        ...ex,
        defaultSeries: cfg.customSeries || (cfg.muscle === 'cardio' ? ex.defaultSeries : seriesCount),
        rest: cfg.customRest || ex.rest
      });
    }
  }

  return list;
}

/**
 * Gera os splits e fichas de exercícios de acordo com objetivo e frequência semanal
 */
export function generateWorkoutSplit(profile) {
  const {
    goal = 'hypertrophy',
    daysPerWeek = 4,
    restrictions = [],
    equipment = 'gym',
    experienceLevel = 'intermediate'
  } = profile;

  const splits = [];
  const seriesCount = experienceLevel === 'beginner' ? '3x 8-10 reps' : experienceLevel === 'advanced' ? '4x 8-12 reps' : '3x 10-12 reps';

  // ==========================================
  // CENÁRIO 1: OBJETIVO PERDA DE PESO / EMAGRECIMENTO & PROTEÇÃO ARTICULAR
  // Baseado no prototype_mulher.html
  // ==========================================
  if (goal === 'weight_loss') {
    // Treino A: Inferiores & Glúteos (Proteção Joelhos/Coluna)
    const femaleExercisesA = [
      { muscle: 'quadriceps', pattern: 'leg_press', customSeries: '3x 12-15 reps', customRest: '60s' },
      { muscle: 'quadriceps', pattern: 'leg_extension', customSeries: '3x 12-15 reps', customRest: '60s' },
      { muscle: 'posterior', pattern: 'leg_curl', customSeries: '3x 12-15 reps', customRest: '60s' },
      { muscle: 'gluteos', pattern: 'hip_thrust', customSeries: '3x 12-15 reps', customRest: '60s' },
      { muscle: 'gluteos', pattern: 'abduction', customSeries: '3x 15-20 reps', customRest: '45s' },
      { muscle: 'panturrilha', pattern: 'calf_raise', customSeries: '3x 15 reps', customRest: '45s' },
      { muscle: 'core', pattern: 'crunch', customSeries: '3x 15 reps', customRest: '45s' }
    ];

    splits.push({
      id: 'treino-a',
      title: 'Treino A (Inferiores & Glúteos)',
      subtitle: 'Pernas completas, glúteos e abdômen com foco em queima calórica basal',
      color: 'rose',
      accentBg: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
      exercises: buildExerciseList(femaleExercisesA, restrictions, equipment, '3x 12-15 reps')
    });

    // Treino B: Superiores & Costas (Postura, Lombar & Firmeza)
    const femaleExercisesB = [
      { muscle: 'costas', pattern: 'pull_vertical', customSeries: '3x 12-15 reps', customRest: '60s' },
      { muscle: 'costas', pattern: 'pull_horizontal', customSeries: '3x 12-15 reps', customRest: '60s' },
      { muscle: 'peito', pattern: 'push_incline', customSeries: '3x 12 reps', customRest: '60s' },
      { muscle: 'ombro', pattern: 'lateral_raise', customSeries: '3x 12-15 reps', customRest: '45s' },
      { muscle: 'triceps', pattern: 'triceps_extension', customSeries: '3x 12-15 reps', customRest: '45s' },
      { muscle: 'biceps', pattern: 'biceps_curl', customSeries: '3x 12 reps', customRest: '45s' },
      { muscle: 'core', pattern: 'plank', customSeries: '3x 20-35s', customRest: '45s' }
    ];

    splits.push({
      id: 'treino-b',
      title: 'Treino B (Superiores & Costas)',
      subtitle: 'Costas, Ombros e Braços firmes. Melhora postura e alivia lombar',
      color: 'indigo',
      accentBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
      exercises: buildExerciseList(femaleExercisesB, restrictions, equipment, '3x 12-15 reps')
    });

    // Treino C / Cardio Estratégico (Sem impacto)
    const femaleExercisesCardio = [
      { muscle: 'cardio', pattern: 'cardio_incline', customSeries: '25-35 min', customRest: 'Contínuo' },
      { muscle: 'cardio', pattern: 'cardio_bike', customSeries: '20-30 min', customRest: 'Contínuo' },
      { muscle: 'cardio', pattern: 'cardio_eliptico', customSeries: '20-25 min', customRest: 'Contínuo' },
      { muscle: 'cardio', pattern: 'steps', customSeries: '7.000 a 9.000 passos', customRest: 'Ao longo do dia' }
    ];

    splits.push({
      id: 'treino-c',
      title: 'Cardio Estratégico',
      subtitle: 'Gasto calórico aeróbico sem impacto prejudicial para os joelhos e articulações',
      color: 'sky',
      accentBg: 'bg-sky-500/10 border-sky-500/20 text-sky-300',
      exercises: buildExerciseList(femaleExercisesCardio, restrictions, equipment, '20-30 min')
    });

    const weekDays = generateWeightLossSchedule(daysPerWeek, splits);
    return { splits, weekDays };
  }

  // ==========================================
  // CENÁRIO 2: OBJETIVO HIPERTROFIA PRO
  // ==========================================
  if (daysPerWeek <= 3) {
    // ABC Clássico (Push / Pull / Legs)
    splits.push({
      id: 'treino-a',
      title: 'Treino A (Push)',
      subtitle: 'Peito, Deltóide Anterior/Lateral e Tríceps',
      color: 'amber',
      accentBg: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
      exercises: buildExerciseList([
        { muscle: 'peito', pattern: 'push_horizontal' },
        { muscle: 'peito', pattern: 'push_incline' },
        { muscle: 'peito', pattern: 'fly' },
        { muscle: 'ombro', pattern: 'push_vertical' },
        { muscle: 'ombro', pattern: 'lateral_raise' },
        { muscle: 'triceps', pattern: 'triceps_extension' },
        { muscle: 'triceps', pattern: 'triceps_overhead' }
      ], restrictions, equipment, seriesCount)
    });

    splits.push({
      id: 'treino-b',
      title: 'Treino B (Pull)',
      subtitle: 'Costas, Deltóide Posterior e Bíceps',
      color: 'blue',
      accentBg: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
      exercises: buildExerciseList([
        { muscle: 'costas', pattern: 'pull_vertical' },
        { muscle: 'costas', pattern: 'pull_horizontal' },
        { muscle: 'costas', pattern: 'lat_isolation' },
        { muscle: 'ombro', pattern: 'rear_delt' },
        { muscle: 'biceps', pattern: 'biceps_curl' },
        { muscle: 'biceps', pattern: 'biceps_curl' } // O excludeIds garante variação (ex: martelo vs direta)
      ], restrictions, equipment, seriesCount)
    });

    splits.push({
      id: 'treino-c',
      title: 'Treino C (Legs & Core)',
      subtitle: 'Quadríceps, Isquiotibiais, Glúteos e Panturrilhas',
      color: 'emerald',
      accentBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
      exercises: buildExerciseList([
        { muscle: 'quadriceps', pattern: 'squat' },
        { muscle: 'quadriceps', pattern: 'leg_extension' },
        { muscle: 'posterior', pattern: 'leg_curl' },
        { muscle: 'gluteos', pattern: 'hip_thrust' },
        { muscle: 'panturrilha', pattern: 'calf_raise' },
        { muscle: 'core', pattern: 'crunch' }
      ], restrictions, equipment, seriesCount)
    });

  } else if (daysPerWeek === 4) {
    // Upper / Lower (2x semana)
    splits.push({
      id: 'treino-a',
      title: 'Treino A (Upper 1 - Força e Base)',
      subtitle: 'Peitoral Pesado, Costas e Ombros',
      color: 'amber',
      accentBg: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
      exercises: buildExerciseList([
        { muscle: 'peito', pattern: 'push_horizontal' },
        { muscle: 'costas', pattern: 'pull_horizontal' },
        { muscle: 'peito', pattern: 'push_incline' },
        { muscle: 'costas', pattern: 'pull_vertical' },
        { muscle: 'ombro', pattern: 'lateral_raise' },
        { muscle: 'biceps', pattern: 'biceps_curl' },
        { muscle: 'triceps', pattern: 'triceps_extension' }
      ], restrictions, equipment, seriesCount)
    });

    splits.push({
      id: 'treino-b',
      title: 'Treino B (Lower 1 - Foco Anterior)',
      subtitle: 'Quadríceps, Panturrilhas e Core',
      color: 'blue',
      accentBg: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
      exercises: buildExerciseList([
        { muscle: 'quadriceps', pattern: 'squat' },
        { muscle: 'quadriceps', pattern: 'leg_press' },
        { muscle: 'quadriceps', pattern: 'leg_extension' },
        { muscle: 'posterior', pattern: 'leg_curl' },
        { muscle: 'panturrilha', pattern: 'calf_raise' },
        { muscle: 'core', pattern: 'crunch' }
      ], restrictions, equipment, seriesCount)
    });

    splits.push({
      id: 'treino-c',
      title: 'Treino C (Upper 2 - Foco Hipertrofia)',
      subtitle: 'Volume de Costas, Deltoides e Braços',
      color: 'purple',
      accentBg: 'bg-purple-500/10 border-purple-500/20 text-purple-300',
      exercises: buildExerciseList([
        { muscle: 'costas', pattern: 'pull_vertical' },
        { muscle: 'peito', pattern: 'fly' },
        { muscle: 'costas', pattern: 'lat_isolation' },
        { muscle: 'ombro', pattern: 'push_vertical' },
        { muscle: 'ombro', pattern: 'rear_delt' },
        { muscle: 'triceps', pattern: 'triceps_overhead' },
        { muscle: 'biceps', pattern: 'biceps_curl' }
      ], restrictions, equipment, seriesCount)
    });

    splits.push({
      id: 'treino-d',
      title: 'Treino D (Lower 2 - Foco Posterior & Glúteo)',
      subtitle: 'Isquiotibiais, Glúteos e Cadeia Posterior',
      color: 'emerald',
      accentBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
      exercises: buildExerciseList([
        { muscle: 'gluteos', pattern: 'hip_thrust' },
        { muscle: 'posterior', pattern: 'hinge' },
        { muscle: 'posterior', pattern: 'leg_curl' },
        { muscle: 'quadriceps', pattern: 'leg_press' },
        { muscle: 'panturrilha', pattern: 'calf_raise' },
        { muscle: 'core', pattern: 'plank' }
      ], restrictions, equipment, seriesCount)
    });

  } else {
    // 5 ou 6 dias: PPL
    splits.push({
      id: 'treino-a',
      title: 'Treino A (Push - Empurrar)',
      subtitle: 'Peito, Ombro Frontal/Lateral e Tríceps',
      color: 'amber',
      accentBg: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
      exercises: buildExerciseList([
        { muscle: 'peito', pattern: 'push_horizontal' },
        { muscle: 'peito', pattern: 'push_incline' },
        { muscle: 'peito', pattern: 'fly' },
        { muscle: 'ombro', pattern: 'push_vertical' },
        { muscle: 'ombro', pattern: 'lateral_raise' },
        { muscle: 'triceps', pattern: 'triceps_extension' },
        { muscle: 'triceps', pattern: 'triceps_overhead' }
      ], restrictions, equipment, seriesCount)
    });

    splits.push({
      id: 'treino-b',
      title: 'Treino B (Pull - Puxar)',
      subtitle: 'Costas Completa, Deltóide Posterior e Bíceps',
      color: 'blue',
      accentBg: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
      exercises: buildExerciseList([
        { muscle: 'costas', pattern: 'pull_vertical' },
        { muscle: 'costas', pattern: 'pull_horizontal' },
        { muscle: 'costas', pattern: 'lat_isolation' },
        { muscle: 'ombro', pattern: 'rear_delt' },
        { muscle: 'biceps', pattern: 'biceps_curl' },
        { muscle: 'biceps', pattern: 'biceps_curl' }
      ], restrictions, equipment, seriesCount)
    });

    splits.push({
      id: 'treino-c',
      title: 'Treino C (Legs - Pernas Completas)',
      subtitle: 'Quadríceps, Isquiotibiais, Glúteos e Panturrilhas',
      color: 'emerald',
      accentBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
      exercises: buildExerciseList([
        { muscle: 'quadriceps', pattern: 'squat' },
        { muscle: 'quadriceps', pattern: 'leg_press' },
        { muscle: 'posterior', pattern: 'leg_curl' },
        { muscle: 'gluteos', pattern: 'hip_thrust' },
        { muscle: 'panturrilha', pattern: 'calf_raise' },
        { muscle: 'core', pattern: 'crunch' }
      ], restrictions, equipment, seriesCount)
    });
  }

  const weekDays = generateWeekSchedule(daysPerWeek, splits);
  return { splits, weekDays };
}

function generateWeightLossSchedule(daysPerWeek, splits) {
  const schedule = [
    { id: 'seg', label: 'Segunda', workout: 'Treino A (Pernas) + 20m Cardio' },
    { id: 'ter', label: 'Terça', workout: 'Treino B (Superiores) + 20m Cardio' },
    { id: 'qua', label: 'Quarta', workout: 'Caminhada Livre (40 min)' },
    { id: 'qui', label: 'Quinta', workout: 'Treino A (Pernas) + 20m Cardio' },
    { id: 'sex', label: 'Sexta', workout: 'Treino B (Superiores) + 20m Cardio' },
    { id: 'sab', label: 'Sábado', workout: 'Cardio Leve / Passeio ao Ar Livre' },
    { id: 'dom', label: 'Domingo', workout: 'Descanso Total & Recuperação' }
  ];

  if (daysPerWeek === 3) {
    schedule[0].workout = 'Treino A (Pernas) + Cardio';
    schedule[1].workout = 'Descanso / Alongamento';
    schedule[2].workout = 'Treino B (Superiores) + Cardio';
    schedule[3].workout = 'Descanso';
    schedule[4].workout = 'Cardio Estratégico (40m)';
    schedule[5].workout = 'Caminhada Livre';
    schedule[6].workout = 'Descanso';
  } else if (daysPerWeek === 4) {
    schedule[0].workout = 'Treino A (Inferiores)';
    schedule[1].workout = 'Treino B (Superiores)';
    schedule[2].workout = 'Descanso Ativo (Passos)';
    schedule[3].workout = 'Treino A (Inferiores)';
    schedule[4].workout = 'Treino B (Superiores)';
    schedule[5].workout = 'Cardio Estratégico';
    schedule[6].workout = 'Descanso';
  }

  return schedule;
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
