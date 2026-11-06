/**
 * Engine de Gamificação do TreinoPro.
 *
 * Módulo de lógica pura: calcula XP, patentes, progressão de níveis, equivalência
 * de tonelagem no mundo real e verificação de badges/conquistas.
 * Não depende de DOM nem de Vue, permitindo testes unitários rigorosos.
 */

export const PATENTS = [
  { minLevel: 1, maxLevel: 5, name: 'Ferro Fundido', icon: '⛓️', color: '#94A3B8' },
  { minLevel: 6, maxLevel: 15, name: 'Sobrecarga Progressiva', icon: '🥉', color: '#CD7F32' },
  { minLevel: 16, maxLevel: 30, name: 'Atleta Consistente', icon: '🥈', color: '#94A3B8' },
  { minLevel: 31, maxLevel: 50, name: 'Força Bruta', icon: '🥇', color: '#FBBF04' },
  { minLevel: 51, maxLevel: 75, name: 'Elite da Sala de Pesos', icon: '🔥', color: '#EF4444' },
  { minLevel: 76, maxLevel: 99, name: 'Lenda do Ferro', icon: '👑', color: '#8B5CF6' },
  { minLevel: 100, maxLevel: Infinity, name: 'Titã do Olimpo', icon: '⚡', color: '#007BFF' }
];

export const BADGES_CATALOG = {
  century_club: {
    id: 'century_club',
    title: 'Clube dos Três Dígitos',
    description: 'Levantou 100 kg ou mais em uma série válida.',
    icon: '🏆',
    xpReward: 300
  },
  bodyweight_master: {
    id: 'bodyweight_master',
    title: 'Peso por Peso',
    description: 'Ergueu seu próprio peso corporal no supino ou 1,5x no agachamento.',
    icon: '⚖️',
    xpReward: 250
  },
  leg_day_guardian: {
    id: 'leg_day_guardian',
    title: 'Guardião do Leg Day',
    description: 'Concluiu treinos de pernas sem faltar ao dia de membros inferiores.',
    icon: '🦵',
    xpReward: 200
  },
  airplane_lifter: {
    id: 'airplane_lifter',
    title: 'Erguedor de Aviões',
    description: 'Acumulou 100.000 kg (100 toneladas) levantadas na carreira.',
    icon: '✈️',
    xpReward: 500
  },
  double_progression: {
    id: 'double_progression',
    title: 'Mestre da Sobrecarga Dupla',
    description: 'Bateu o teto de repetições e progrediu carga com sucesso.',
    icon: '📈',
    xpReward: 150
  },
  early_bird: {
    id: 'early_bird',
    title: 'Madrugador do Ferro',
    description: 'Concluiu treino antes das 07:30 ou no turno noturno.',
    icon: '⏰',
    xpReward: 100
  },
  unbreakable_discipline: {
    id: 'unbreakable_discipline',
    title: 'Disciplina Inabalável',
    description: 'Manteve a meta de treinos semanais por semanas consecutivas.',
    icon: '🔥',
    xpReward: 350
  }
};

/**
 * Retorna o XP necessário para passar do nível (n-1) para o nível n.
 * Nível 1 começa com 0 XP.
 */
export function xpRequiredForLevel(level) {
  if (!Number.isFinite(level) || level <= 1) return 0;
  return Math.floor(400 * Math.pow(level, 1.4));
}

/**
 * Retorna a patente correspondente a um dado nível numérico.
 */
export function getPatentForLevel(level) {
  const lvl = Math.max(1, Math.floor(Number(level) || 1));
  const found = PATENTS.find(p => lvl >= p.minLevel && lvl <= p.maxLevel);
  return found || PATENTS[PATENTS.length - 1];
}

/**
 * Calcula o nível, patente e progresso a partir do XP total acumulado.
 */
export function calculateLevelFromXp(totalXp = 0) {
  const xp = Math.max(0, Math.floor(Number(totalXp) || 0));

  let currentLevel = 1;
  let accumulatedXp = 0;

  while (true) {
    const nextLevelCost = xpRequiredForLevel(currentLevel + 1);
    if (xp < accumulatedXp + nextLevelCost) {
      break;
    }
    accumulatedXp += nextLevelCost;
    currentLevel += 1;
    // Teto de segurança para evitar loops infinitos
    if (currentLevel >= 500) break;
  }

  const costForNext = xpRequiredForLevel(currentLevel + 1);
  const xpIntoCurrentLevel = xp - accumulatedXp;
  const progressPercent = costForNext > 0 ? Math.min(100, Math.round((xpIntoCurrentLevel / costForNext) * 100)) : 100;

  const patent = getPatentForLevel(currentLevel);

  return {
    level: currentLevel,
    patent: patent.name,
    patentIcon: patent.icon,
    patentColor: patent.color,
    totalXp: xp,
    xpIntoCurrentLevel,
    costForNextLevel: costForNext,
    progressPercent
  };
}

/**
 * Calcula o XP obtido por uma série concluída.
 */
export function calculateSetXp({ weight = 0, reps = 0, rir = null, isPr = false }) {
  const w = Math.max(0, Number(weight) || 0);
  const r = Math.max(0, Math.floor(Number(reps) || 0));

  if (w <= 0 || r <= 0) return 0;

  // Volume XP: tonelagem da série / 100, mínimo 1
  const volumeXp = Math.max(1, Math.floor((w * r) / 100));

  // Intensidade por RIR
  let rirBonus = 1;
  if (rir !== null && rir !== undefined && rir !== '') {
    const parsedRir = Number(rir);
    if (parsedRir === 0) rirBonus = 5;
    else if (parsedRir <= 2) rirBonus = 3;
    else rirBonus = 1;
  }

  // PR Bônus
  const prBonus = isPr ? 150 : 0;

  return volumeXp + rirBonus + prBonus;
}

/**
 * Retorna uma equivalência tangível no mundo real para uma dada tonelagem (kg).
 */
export function getRealWorldEquivalence(tonnageKg = 0) {
  const kg = Math.max(0, Math.round(Number(tonnageKg) || 0));

  if (kg < 200) {
    return `${Math.max(1, Math.round(kg / 20))} anilhas olímpicas levantadas`;
  }
  if (kg < 800) {
    return `1 moto esportiva (${kg} kg levantados)`;
  }
  if (kg < 1800) {
    return '1 carro popular (Fiat Uno de 1.000 kg)';
  }
  if (kg < 5000) {
    const cars = (kg / 1000).toFixed(1);
    return `${cars} carros populares levantados`;
  }
  if (kg < 12000) {
    const elephants = (kg / 6000).toFixed(1);
    return `${elephants} elefantes africanos erguidos`;
  }
  if (kg < 30000) {
    return '1 caminhão de carga pesada';
  }
  if (kg < 90000) {
    return '1 tanque de combate blindado (55 toneladas)';
  }
  return '1 avião comercial Boeing 737 lotado!';
}

/**
 * Verifica se um conjunto de séries ou dados satisfaz os critérios de novas badges.
 */
export function checkBadges({
  sets = [],
  userProfile = null,
  lifetimeTonnageKg = 0,
  completedLegWorkoutsCount = 0,
  unlockedBadgeIds = []
}) {
  const alreadyUnlocked = new Set(unlockedBadgeIds);
  const newlyUnlocked = [];

  const weightKg = Number(userProfile?.weightKg) || 75;

  for (const set of sets) {
    const w = Number(set.weightKg ?? set.weight ?? 0);
    const r = Number(set.reps ?? 0);
    const done = set.isDone !== false;

    if (!done || w <= 0 || r <= 0) continue;

    // 1. Clube dos 100 kg
    if (w >= 100 && !alreadyUnlocked.has('century_club')) {
      newlyUnlocked.push(BADGES_CATALOG.century_club);
      alreadyUnlocked.add('century_club');
    }

    // 2. Peso por Peso
    if (w >= weightKg && !alreadyUnlocked.has('bodyweight_master')) {
      newlyUnlocked.push(BADGES_CATALOG.bodyweight_master);
      alreadyUnlocked.add('bodyweight_master');
    }
  }

  // 3. Erguedor de Aviões (100 toneladas na carreira)
  if (lifetimeTonnageKg >= 100000 && !alreadyUnlocked.has('airplane_lifter')) {
    newlyUnlocked.push(BADGES_CATALOG.airplane_lifter);
    alreadyUnlocked.add('airplane_lifter');
  }

  // 4. Guardião do Leg Day (8 ou mais treinos de pernas)
  if (completedLegWorkoutsCount >= 8 && !alreadyUnlocked.has('leg_day_guardian')) {
    newlyUnlocked.push(BADGES_CATALOG.leg_day_guardian);
    alreadyUnlocked.add('leg_day_guardian');
  }

  return newlyUnlocked;
}

/**
 * Agrega dados de gamificação da sessão atual (ao vivo ou ao encerrar).
 */
export function calculateSessionGamification({
  workoutLogs = {},
  existingPrs = {},
  isFinished = false
}) {
  let tonnageKg = 0;
  let doneSetsCount = 0;
  let totalSetsCount = 0;
  let prsCount = 0;
  let earnedXp = isFinished ? 100 : 0; // 100 XP bônus por finalizar treino

  for (const [exId, log] of Object.entries(workoutLogs || {})) {
    if (!log) continue;

    const sets = Array.isArray(log.sets) && log.sets.length > 0
      ? log.sets
      : [{ weight: log.weight, reps: log.reps, rir: log.rir, isDone: !!log.isDone }];

    for (const s of sets) {
      totalSetsCount++;
      if (s.isDone) {
        doneSetsCount++;
        const w = Number(s.weight) || 0;
        const r = Number(s.reps) || 0;
        const volume = w * r;
        tonnageKg += volume;

        const pr = existingPrs[exId];
        const isPr = pr && w > (pr.maxWeightKg || 0) && volume > 0;
        if (isPr) prsCount++;

        earnedXp += calculateSetXp({
          weight: w,
          reps: r,
          rir: s.rir,
          isPr
        });
      }
    }
  }

  return {
    tonnageKg: Math.round(tonnageKg * 10) / 10,
    doneSetsCount,
    totalSetsCount,
    prsCount,
    earnedXp,
    realWorldEquivalence: getRealWorldEquivalence(tonnageKg)
  };
}
