import { EXERCISE_CATALOG } from '../knowledge/exercises.js';

/**
 * Um exercício é inseguro quando ele sobrecarrega uma articulação que o usuário
 * declarou estar lesionada. Este é o filtro mais importante do engine: splits
 * gerados nunca devem sugerir movimento contra uma restrição declarada.
 */
export function conflictsWithRestrictions(exercise, restrictions = []) {
  if (!exercise) return true;
  if (!Array.isArray(restrictions) || restrictions.length === 0) return false;
  return exercise.jointStress.some(j => restrictions.includes(j));
}

/**
 * Verifica se o exercício pode ser executado com o equipamento informado.
 * Quem treina em casa não deve receber máquinas exclusivas de academia.
 */
export function matchesEquipment(exercise, equipment = 'gym') {
  if (!exercise) return false;
  if (equipment === 'home' && exercise.equipment === 'gym') return false;
  return true;
}

/**
 * Verdadeiro quando o exercício é seguro e executável no contexto do usuário.
 */
export function isExerciseSafe(exercise, { restrictions = [], equipment = 'gym' } = {}) {
  return matchesEquipment(exercise, equipment) && !conflictsWithRestrictions(exercise, restrictions);
}

/**
 * Filtra uma lista de candidatos devolvendo apenas os seguros para o usuário,
 * preservando a ordem original. É a base compartilhada entre o gerador de planos
 * e o modal de substituição de exercícios, para que as duas telas nunca divirjam.
 */
export function filterSafeExercises(candidates = [], { restrictions = [], equipment = 'gym' } = {}) {
  return candidates.filter(ex => isExerciseSafe(ex, { restrictions, equipment }));
}

/**
 * Filtra exercícios com base nas restrições articulares, equipamento disponível
 * e garante que não repita exercícios já selecionados no split (excludeIds).
 *
 * A cascata vai do match mais específico ao mais flexível, mas NUNCA entrega um
 * exercício que conflite com uma restrição articular declarada: nesse caso
 * retorna null e o chamador registra a ausência no lugar de inventar um
 * movimento inseguro.
 */
export function getSafeExercise(targetMuscle, pattern, restrictions = [], equipment = 'gym', excludeIds = [], catalog = EXERCISE_CATALOG) {
  // 1. Prioridade exata: músculo + padrão + sem restrições + equipamento correto + não excluído
  const exactMatches = catalog.filter(ex => {
    if (excludeIds.includes(ex.id)) return false;
    if (targetMuscle && ex.muscle !== targetMuscle) return false;
    if (pattern && ex.pattern !== pattern) return false;
    if (!isExerciseSafe(ex, { restrictions, equipment })) return false;
    return true;
  });

  if (exactMatches.length > 0) {
    return exactMatches[0];
  }

  // 2. Se não encontrou pelo pattern exato, busca pelo músculo sem restrições e não excluído
  const muscleMatches = catalog.filter(ex => {
    if (excludeIds.includes(ex.id)) return false;
    if (targetMuscle && ex.muscle !== targetMuscle) return false;
    if (!isExerciseSafe(ex, { restrictions, equipment })) return false;
    return true;
  });

  if (muscleMatches.length > 0) {
    return muscleMatches[0];
  }

  // 3. Fallback flexibilizando o equipamento, mas NUNCA as restrições articulares.
  // Exige o equipamento no trecho final para não empurrar máquina de academia
  // para quem só tem peso de casa.
  const restrictedToEquipment = catalog.find(ex =>
    !excludeIds.includes(ex.id) &&
    ex.muscle === targetMuscle &&
    matchesEquipment(ex, equipment) &&
    !conflictsWithRestrictions(ex, restrictions)
  );

  return restrictedToEquipment || null;
}

/**
 * Helper para preencher uma lista de exercícios acumulando os IDs para evitar duplicatas
 */
function buildExerciseList(configs, restrictions, equipment, seriesCount, catalog) {
  const list = [];
  const excludeIds = [];

  for (const cfg of configs) {
    const ex = getSafeExercise(cfg.muscle, cfg.pattern, restrictions, equipment, excludeIds, catalog);
    if (ex) {
      excludeIds.push(ex.id);
      list.push({
        ...ex,
        defaultSeries: cfg.customSeries || (cfg.muscle === 'cardio' ? ex.defaultSeries : seriesCount),
        rest: cfg.customRest || ex.rest
      });
    } else {
      // Não substitui por movimento inseguro: registra e segue sem o slot.
      console.warn(
        `[workoutGenerator] Nenhum exercício seguro para "${cfg.muscle}/${cfg.pattern}" ` +
        `com equipamento="${equipment}" e restrições=[${restrictions.join(', ')}]. Slot omitido.`
      );
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
    experienceLevel = 'intermediate',
    // Catálogo já mesclado (embutido + exercícios do usuário). Quando não vem,
    // usa só o embutido — o comportamento de fábrica continua idêntico.
    catalog = EXERCISE_CATALOG
  } = profile;

  const splits = [];
  const seriesCount = goal === 'strength'
    ? '4x 4-6 reps'
    : (experienceLevel === 'beginner' ? '3x 8-10 reps' : experienceLevel === 'advanced' ? '4x 8-12 reps' : '3x 10-12 reps');

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
      accentBg: 'bg-rose-50 border-rose-200 text-rose-800',
      exercises: buildExerciseList(femaleExercisesA, restrictions, equipment, '3x 12-15 reps', catalog)
    });

    // Treino B: Superiores Sinergistas (Costas & Bíceps / Peito & Tríceps)
    const femaleExercisesB = [
      { muscle: 'costas', pattern: 'pull_vertical', customSeries: '3x 12-15 reps', customRest: '60s' },
      { muscle: 'costas', pattern: 'pull_horizontal', customSeries: '3x 12-15 reps', customRest: '60s' },
      { muscle: 'biceps', pattern: 'biceps_curl', customSeries: '3x 12 reps', customRest: '45s' },
      { muscle: 'peito', pattern: 'push_incline', customSeries: '3x 12 reps', customRest: '60s' },
      { muscle: 'triceps', pattern: 'triceps_extension', customSeries: '3x 12-15 reps', customRest: '45s' },
      { muscle: 'ombro', pattern: 'lateral_raise', customSeries: '3x 12-15 reps', customRest: '45s' },
      { muscle: 'core', pattern: 'plank', customSeries: '3x 20-35s', customRest: '45s' }
    ];

    splits.push({
      id: 'treino-b',
      title: 'Treino B (Costas & Bíceps / Peito & Tríceps)',
      subtitle: 'Superiores sinergistas para melhora postural, tônus muscular e alívio lombar',
      color: 'indigo',
      accentBg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
      exercises: buildExerciseList(femaleExercisesB, restrictions, equipment, '3x 12-15 reps', catalog)
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
      accentBg: 'bg-sky-50 border-sky-200 text-sky-800',
      exercises: buildExerciseList(femaleExercisesCardio, restrictions, equipment, '20-30 min', catalog)
    });

    const weekDays = generateWeightLossSchedule(daysPerWeek);
    return { splits, weekDays };
  }

  // ==========================================
  // CENÁRIO 2: OBJETIVO HIPERTROFIA PRO
  // ==========================================
  if (daysPerWeek <= 3) {
    // ABC Clássico Sinergista (Peito/Tríceps/Ombro, Costas/Bíceps, Pernas/Core)
    splits.push({
      id: 'treino-a',
      title: 'Treino A (Peito, Ombros & Tríceps - Push)',
      subtitle: 'Padrão Push: Peito, ombros e tríceps em sinergia biomecânica de empurrar',
      color: 'amber',
      accentBg: 'bg-amber-50 border-amber-200 text-amber-800',
      exercises: buildExerciseList([
        { muscle: 'peito', pattern: 'push_horizontal' },
        { muscle: 'peito', pattern: 'push_incline' },
        { muscle: 'peito', pattern: 'fly' },
        { muscle: 'ombro', pattern: 'push_vertical' },
        { muscle: 'ombro', pattern: 'lateral_raise' },
        { muscle: 'triceps', pattern: 'triceps_extension' },
        { muscle: 'triceps', pattern: 'triceps_overhead' }
      ], restrictions, equipment, seriesCount, catalog)
    });

    splits.push({
      id: 'treino-b',
      title: 'Treino B (Costas & Bíceps - Pull)',
      subtitle: 'Padrão Pull: Costas, bíceps e posterior de ombro em sinergia biomecânica de puxar',
      color: 'blue',
      accentBg: 'bg-blue-50 border-blue-200 text-blue-800',
      exercises: buildExerciseList([
        { muscle: 'costas', pattern: 'pull_vertical' },
        { muscle: 'costas', pattern: 'pull_horizontal' },
        { muscle: 'costas', pattern: 'lat_isolation' },
        { muscle: 'ombro', pattern: 'rear_delt' },
        { muscle: 'biceps', pattern: 'biceps_curl' },
        { muscle: 'biceps', pattern: 'biceps_curl' }
      ], restrictions, equipment, seriesCount, catalog)
    });

    splits.push({
      id: 'treino-c',
      title: 'Treino C (Pernas & Abdômen - Legs)',
      subtitle: 'Padrão Legs & Core: Quadríceps, isquiotibiais, glúteos e estabilização do core',
      color: 'emerald',
      accentBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      exercises: buildExerciseList([
        { muscle: 'quadriceps', pattern: 'squat' },
        { muscle: 'quadriceps', pattern: 'leg_extension' },
        { muscle: 'posterior', pattern: 'leg_curl' },
        { muscle: 'gluteos', pattern: 'hip_thrust' },
        { muscle: 'panturrilha', pattern: 'calf_raise' },
        { muscle: 'core', pattern: 'crunch' }
      ], restrictions, equipment, seriesCount, catalog)
    });

  } else if (daysPerWeek === 4) {
    // ABCD Tradicional Sinergista: Peito & Tríceps / Costas & Bíceps / Pernas / Ombros & Core
    splits.push({
      id: 'treino-a',
      title: 'Treino A (Peito & Tríceps)',
      subtitle: 'Peitoral completo e isolamento de tríceps em sinergia anatômica',
      color: 'amber',
      accentBg: 'bg-amber-50 border-amber-200 text-amber-800',
      exercises: buildExerciseList([
        { muscle: 'peito', pattern: 'push_horizontal' },
        { muscle: 'peito', pattern: 'push_incline' },
        { muscle: 'peito', pattern: 'fly' },
        { muscle: 'triceps', pattern: 'triceps_extension' },
        { muscle: 'triceps', pattern: 'triceps_overhead' },
        { muscle: 'triceps', pattern: 'triceps_extension' }
      ], restrictions, equipment, seriesCount, catalog)
    });

    splits.push({
      id: 'treino-b',
      title: 'Treino B (Costas & Bíceps)',
      subtitle: 'Largura e espessura de dorsais com finalização isolada de bíceps',
      color: 'blue',
      accentBg: 'bg-blue-50 border-blue-200 text-blue-800',
      exercises: buildExerciseList([
        { muscle: 'costas', pattern: 'pull_vertical' },
        { muscle: 'costas', pattern: 'pull_horizontal' },
        { muscle: 'costas', pattern: 'pull_horizontal' },
        { muscle: 'costas', pattern: 'lat_isolation' },
        { muscle: 'biceps', pattern: 'biceps_curl' },
        { muscle: 'biceps', pattern: 'biceps_curl' }
      ], restrictions, equipment, seriesCount, catalog)
    });

    splits.push({
      id: 'treino-c',
      title: 'Treino C (Pernas Completas & Panturrilhas)',
      subtitle: 'Cadeia anterior e posterior de pernas com foco em força e hipertrofia',
      color: 'emerald',
      accentBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      exercises: buildExerciseList([
        { muscle: 'quadriceps', pattern: 'squat' },
        { muscle: 'quadriceps', pattern: 'leg_extension' },
        { muscle: 'posterior', pattern: 'hinge' },
        { muscle: 'posterior', pattern: 'leg_curl' },
        { muscle: 'gluteos', pattern: 'hip_thrust' },
        { muscle: 'panturrilha', pattern: 'calf_raise' }
      ], restrictions, equipment, seriesCount, catalog)
    });

    splits.push({
      id: 'treino-d',
      title: 'Treino D (Ombros, Trapézio & Abdômen)',
      subtitle: 'Deltóides completos (anterior, lateral e posterior) e fortalecimento do core',
      color: 'purple',
      accentBg: 'bg-purple-50 border-purple-200 text-purple-800',
      exercises: buildExerciseList([
        { muscle: 'ombro', pattern: 'push_vertical' },
        { muscle: 'ombro', pattern: 'lateral_raise' },
        { muscle: 'ombro', pattern: 'rear_delt' },
        { muscle: 'panturrilha', pattern: 'calf_raise' },
        { muscle: 'core', pattern: 'crunch' },
        { muscle: 'core', pattern: 'plank' }
      ], restrictions, equipment, seriesCount, catalog)
    });

  } else {
    // 5 ou 6 dias: PPL (Push / Pull / Legs) com combinações sinergistas
    splits.push({
      id: 'treino-a',
      title: 'Treino A (Peito, Ombros & Tríceps - Push)',
      subtitle: 'Padrão de empurrar: peito, ombro frontal/lateral e tríceps',
      color: 'amber',
      accentBg: 'bg-amber-50 border-amber-200 text-amber-800',
      exercises: buildExerciseList([
        { muscle: 'peito', pattern: 'push_horizontal' },
        { muscle: 'peito', pattern: 'push_incline' },
        { muscle: 'peito', pattern: 'fly' },
        { muscle: 'ombro', pattern: 'push_vertical' },
        { muscle: 'ombro', pattern: 'lateral_raise' },
        { muscle: 'triceps', pattern: 'triceps_extension' },
        { muscle: 'triceps', pattern: 'triceps_overhead' }
      ], restrictions, equipment, seriesCount, catalog)
    });

    splits.push({
      id: 'treino-b',
      title: 'Treino B (Costas & Bíceps - Pull)',
      subtitle: 'Padrão de puxar: dorsais completas, deltóide posterior e bíceps',
      color: 'blue',
      accentBg: 'bg-blue-50 border-blue-200 text-blue-800',
      exercises: buildExerciseList([
        { muscle: 'costas', pattern: 'pull_vertical' },
        { muscle: 'costas', pattern: 'pull_horizontal' },
        { muscle: 'costas', pattern: 'lat_isolation' },
        { muscle: 'ombro', pattern: 'rear_delt' },
        { muscle: 'biceps', pattern: 'biceps_curl' },
        { muscle: 'biceps', pattern: 'biceps_curl' }
      ], restrictions, equipment, seriesCount, catalog)
    });

    splits.push({
      id: 'treino-c',
      title: 'Treino C (Pernas & Abdômen - Legs)',
      subtitle: 'Quadríceps, isquiotibiais, glúteos, panturrilha e core',
      color: 'emerald',
      accentBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      exercises: buildExerciseList([
        { muscle: 'quadriceps', pattern: 'squat' },
        { muscle: 'quadriceps', pattern: 'leg_press' },
        { muscle: 'posterior', pattern: 'leg_curl' },
        { muscle: 'gluteos', pattern: 'hip_thrust' },
        { muscle: 'panturrilha', pattern: 'calf_raise' },
        { muscle: 'core', pattern: 'crunch' }
      ], restrictions, equipment, seriesCount, catalog)
    });
  }

  const weekDays = generateWeekSchedule(daysPerWeek, splits);
  return { splits, weekDays };
}

function generateWeightLossSchedule(daysPerWeek) {
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
  } else if (daysPerWeek === 5) {
    schedule[0].workout = 'Treino A (Inferiores) + Cardio';
    schedule[1].workout = 'Treino B (Superiores) + Cardio';
    schedule[2].workout = 'Caminhada Livre (40 min)';
    schedule[3].workout = 'Treino C (Cardio Estratégico)';
    schedule[4].workout = 'Treino A (Inferiores) + Cardio';
    schedule[5].workout = 'Treino B (Superiores)';
    schedule[6].workout = 'Descanso';
  } else {
    // 6+ dias: alterna os 3 splits com um dia de descanso no domingo.
    schedule[0].workout = 'Treino A (Inferiores) + Cardio';
    schedule[1].workout = 'Treino B (Superiores) + Cardio';
    schedule[2].workout = 'Treino C (Cardio Estratégico)';
    schedule[3].workout = 'Treino A (Inferiores) + Cardio';
    schedule[4].workout = 'Treino B (Superiores) + Cardio';
    schedule[5].workout = 'Treino C (Cardio Estratégico)';
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
