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
 * 4 Ramos da Árvore de Habilidades por Grupo Muscular (RPG Fit).
 */
export const RPG_BRANCHES = {
  push: {
    id: 'push',
    name: 'Tronco Superior',
    subtitle: 'Push & Desenvolvimento',
    icon: '🛡️',
    color: '#0066FF',
    muscles: ['peito', 'ombro', 'triceps'],
    description: 'Peitoral, Ombros e Tríceps. Potência de empurrar e densidade anterior.'
  },
  pull: {
    id: 'pull',
    name: 'Dorsal & Puxada',
    subtitle: 'Pull & Asas de Titã',
    icon: '🦅',
    color: '#8B5CF6',
    muscles: ['costas', 'trapezio', 'biceps'],
    description: 'Costas completas, Trapézio e Bíceps. Largura dorsal e pegada de aço.'
  },
  legs: {
    id: 'legs',
    name: 'Membros Inferiores',
    subtitle: 'Legs & Pilar de Sustentação',
    icon: '⚡',
    color: '#F59E0B',
    muscles: ['quadriceps', 'posterior', 'gluteos', 'panturrilha'],
    description: 'Quadríceps, Isquiotibiais, Glúteos e Panturrilhas. Base inabalável.'
  },
  core: {
    id: 'core',
    name: 'Blindagem & Centro',
    subtitle: 'Core & Estabilidade',
    icon: '🧱',
    color: '#10B981',
    muscles: ['core', 'cardio'],
    description: 'Reto Abdominal, Oblíquos, Lombar e Condicionamento. Cinturão natural.'
  }
};

/**
 * Mapeia um músculo anatômico para um dos 4 ramos RPG.
 */
export function getBranchForMuscle(muscle = '') {
  const m = String(muscle).toLowerCase();
  if (['peito', 'ombro', 'triceps'].includes(m)) return 'push';
  if (['costas', 'trapezio', 'biceps'].includes(m)) return 'pull';
  if (['quadriceps', 'posterior', 'gluteos', 'panturrilha'].includes(m)) return 'legs';
  return 'core';
}

/**
 * Calcula o nível (1 a 99) para uma árvore de habilidade específica (Branch).
 */
export function calculateBranchLevel(branchXp = 0) {
  const xp = Math.max(0, Number(branchXp) || 0);
  let level = 1;
  let accumulated = 0;

  while (true) {
    const costForNext = level * 150;
    if (xp < accumulated + costForNext) {
      const currentLevelXp = xp - accumulated;
      const progressPercent = Math.min(100, Math.round((currentLevelXp / costForNext) * 100));
      return {
        level,
        progressPercent,
        currentLevelXp,
        costForNextLevel: costForNext,
        totalXp: xp
      };
    }
    accumulated += costForNext;
    level++;
    if (level >= 99) {
      return {
        level: 99,
        progressPercent: 100,
        currentLevelXp: 0,
        costForNextLevel: 0,
        totalXp: xp
      };
    }
  }
}

/**
 * Catálogo de Temas Cosméticos desbloqueáveis na Iron Store.
 */
export const COSMETIC_THEMES = [
  {
    id: 'blue',
    name: 'Azul Cobalto Pro',
    subtitle: 'Padrão Athletic Clean',
    price: 0,
    icon: '🔵',
    primaryColor: '#0066FF',
    accentColor: '#F59E0B',
    bgColor: '#F8FAFC',
    description: 'Design de precisão esportiva com alto contraste.'
  },
  {
    id: 'orange',
    name: 'Laranja Força',
    subtitle: 'Energia Intensa',
    price: 0,
    icon: '🟠',
    primaryColor: '#EA580C',
    accentColor: '#F59E0B',
    bgColor: '#FFF7ED',
    description: 'Paleta hardcore quente inspirada no fisiculturismo clássico.'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    subtitle: 'Futurismo Noturno',
    price: 500,
    icon: '🟣',
    primaryColor: '#00F0FF',
    accentColor: '#FF007F',
    bgColor: '#08070F',
    description: 'Interface noturna com bordas neon ciano e detalhes magenta.'
  },
  {
    id: 'gold',
    name: 'Dark Gold Titã',
    subtitle: 'Luxo e Ouro Olímpico',
    price: 1000,
    icon: '🟡',
    primaryColor: '#D4AF37',
    accentColor: '#F59E0B',
    bgColor: '#0A0A0C',
    description: 'Preto obsidiana com dourado reluzente dos campeões da sobrecarga.'
  },
  {
    id: 'matrix',
    name: 'Matrix Terminal',
    subtitle: 'Hacker Performance',
    price: 750,
    icon: '🟢',
    primaryColor: '#00FF66',
    accentColor: '#10B981',
    bgColor: '#030804',
    description: 'Tema escuro terminal com verde esmeralda bio-mecânico.'
  }
];

/**
 * Catálogo de Títulos de Status equipáveis no perfil do atleta.
 */
export const TITLES_CATALOG = [
  {
    id: 'iniciante_ferro',
    title: 'Iniciante do Ferro',
    description: 'Dado a todo atleta que dá o primeiro passo na sala de pesos.',
    price: 0,
    icon: '🥉'
  },
  {
    id: 'tita_supino',
    title: 'Titã do Supino',
    description: 'Dominador do supino e do peitoral de aço.',
    price: 300,
    icon: '🛡️'
  },
  {
    id: 'asas_de_tita',
    title: 'Asas de Titã',
    description: 'Dorsal larga e pegada inabalável nas puxadas e remadas.',
    price: 300,
    icon: '🦅'
  },
  {
    id: 'guardiao_leg_day',
    title: 'Guardião do Leg Day',
    description: 'Nunca pula pernas e agacha com carga pesada e amplitude total.',
    price: 350,
    icon: '⚡'
  },
  {
    id: 'blindagem_core',
    title: 'Blindagem de Aço',
    description: 'Estabilidade máxima de core e proteção rígida da coluna.',
    price: 250,
    icon: '🧱'
  },
  {
    id: 'consistencia_ferro',
    title: 'Consistência de Ferro',
    description: 'Mais de 7 dias consecutivos cumprindo o plano sem desculpas.',
    price: 400,
    icon: '🔥'
  },
  {
    id: 'senhor_sobrecarga',
    title: 'Senhor da Sobrecarga',
    description: 'Mestre da progressão constante e tonelagem mecânica massiva.',
    price: 600,
    icon: '👑'
  }
];

export function getThemeById(id = 'blue') {
  return COSMETIC_THEMES.find(t => t.id === id) || COSMETIC_THEMES[0];
}

export function getTitleById(id = 'iniciante_ferro') {
  return TITLES_CATALOG.find(t => t.id === id) || TITLES_CATALOG[0];
}

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
  exerciseMuscleMap = {},
  isFinished = false
}) {
  let tonnageKg = 0;
  let doneSetsCount = 0;
  let totalSetsCount = 0;
  let prsCount = 0;
  let earnedXp = isFinished ? 100 : 0; // 100 XP bônus por finalizar treino
  const branchXp = { push: 0, pull: 0, legs: 0, core: 0 };

  for (const [exId, log] of Object.entries(workoutLogs || {})) {
    if (!log) continue;

    const sets = Array.isArray(log.sets) && log.sets.length > 0
      ? log.sets
      : [{ weight: log.weight, reps: log.reps, rir: log.rir, isDone: !!log.isDone }];

    const muscle = exerciseMuscleMap[exId] || '';
    const branch = getBranchForMuscle(muscle);

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

        const setXp = calculateSetXp({
          weight: w,
          reps: r,
          rir: s.rir,
          isPr
        });

        earnedXp += setXp;
        branchXp[branch] = (branchXp[branch] || 0) + setXp;
      }
    }
  }

  // Moedas de Ferro ganhas na sessão: 10 por série + 50 por PR + 50 por concluir treino
  const earnedCoins = (isFinished ? 50 : 0) + (doneSetsCount * 10) + (prsCount * 50);

  return {
    tonnageKg: Math.round(tonnageKg * 10) / 10,
    doneSetsCount,
    totalSetsCount,
    prsCount,
    earnedXp,
    earnedCoins,
    branchXp,
    realWorldEquivalence: getRealWorldEquivalence(tonnageKg)
  };
}

/**
 * Retorna as informações visuais da chama (emoji, level, label) para um dado streak.
 */
export function getFlameInfo(streak = 0) {
  const s = Math.max(0, Number(streak) || 0);
  if (s === 0) {
    return {
      flameLevel: 0,
      flameEmoji: '🔥',
      flameLabel: 'Inativo'
    };
  }
  return {
    flameLevel: s >= 8 ? 3 : s >= 4 ? 2 : 1,
    flameEmoji: s >= 8 ? '💎🔥' : s >= 4 ? '⚡🔥' : '🔥',
    flameLabel: s >= 8 ? 'Supernova Azul' : s >= 4 ? 'Chama Dourada' : 'Fogo Ativo'
  };
}

/**
 * Calcula a progressão da Chama de Streak (dias consecutivos de consistência).
 * Retorna { streak, lastActiveDate, flameLevel, flameEmoji, flameLabel }.
 */
export function calculateDailyStreak(lastActiveDate, currentStreak = 0, todayStr = new Date().toISOString().slice(0, 10)) {
  if (!lastActiveDate) {
    return {
      streak: 1,
      lastActiveDate: todayStr,
      flameLevel: 1,
      flameEmoji: '🔥',
      flameLabel: 'Fogo Ativo'
    };
  }

  if (lastActiveDate === todayStr) {
    const s = Math.max(1, currentStreak);
    return {
      streak: s,
      lastActiveDate: todayStr,
      flameLevel: s >= 8 ? 3 : s >= 4 ? 2 : 1,
      flameEmoji: s >= 8 ? '💎🔥' : s >= 4 ? '⚡🔥' : '🔥',
      flameLabel: s >= 8 ? 'Supernova Azul' : s >= 4 ? 'Chama Dourada' : 'Fogo Ativo'
    };
  }

  const last = new Date(lastActiveDate + 'T00:00:00');
  const today = new Date(todayStr + 'T00:00:00');
  const diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    const s = Math.max(1, currentStreak) + 1;
    return {
      streak: s,
      lastActiveDate: todayStr,
      flameLevel: s >= 8 ? 3 : s >= 4 ? 2 : 1,
      flameEmoji: s >= 8 ? '💎🔥' : s >= 4 ? '⚡🔥' : '🔥',
      flameLabel: s >= 8 ? 'Supernova Azul' : s >= 4 ? 'Chama Dourada' : 'Fogo Ativo'
    };
  } else if (diffDays <= 0) {
    const s = Math.max(1, currentStreak);
    return {
      streak: s,
      lastActiveDate: todayStr,
      flameLevel: s >= 8 ? 3 : s >= 4 ? 2 : 1,
      flameEmoji: s >= 8 ? '💎🔥' : s >= 4 ? '⚡🔥' : '🔥',
      flameLabel: s >= 8 ? 'Supernova Azul' : s >= 4 ? 'Chama Dourada' : 'Fogo Ativo'
    };
  } else {
    // Quebrou o streak (mais de 1 dia sem atividade)
    return {
      streak: 1,
      lastActiveDate: todayStr,
      flameLevel: 1,
      flameEmoji: '🔥',
      flameLabel: 'Fogo Ativo'
    };
  }
}

/**
 * ---------------------------------------------------------------------------
 * FASE 3: Boss Fight Mensal, Volume Semanal por Músculo, Ligas e Wrapped
 * ---------------------------------------------------------------------------
 */

export const MONTHLY_BOSSES = [
  {
    id: 'colosso_ferro',
    name: 'Colosso de Ferro',
    title: 'O Guardião das Anilhas Primordiais',
    icon: '👹',
    maxHp: 40000, // 40 toneladas no mês
    rewardCoins: 500,
    rewardXp: 1000,
    description: 'Um gigante forjado com o peso de mil barras. Cada kg erguido no mês abate seu HP.'
  },
  {
    id: 'tita_aco',
    name: 'Titã Forjado em Aço',
    title: 'O Flagelo dos Halteres',
    icon: '🤖',
    maxHp: 50000, // 50 toneladas no mês
    rewardCoins: 600,
    rewardXp: 1200,
    description: 'Armadura impenetrável que só cede à sobrecarga progressiva inabalável.'
  },
  {
    id: 'dragao_sobrecarga',
    name: 'Dragão da Sobrecarga',
    title: 'Soberano das Séries Pesadas',
    icon: '🐉',
    maxHp: 60000, // 60 toneladas no mês
    rewardCoins: 800,
    rewardXp: 1500,
    description: 'A fera mística do ferro que cospe fogo para quem mantém a constância absoluta.'
  }
];

export function getActiveMonthlyBoss(date = new Date()) {
  const monthIdx = date.getMonth();
  return MONTHLY_BOSSES[monthIdx % MONTHLY_BOSSES.length];
}

export function calculateMonthlyBossStatus({
  monthlyTonnageKg = 0,
  date = new Date()
}) {
  const boss = getActiveMonthlyBoss(date);
  const damage = Math.max(0, Math.round(Number(monthlyTonnageKg) || 0));
  const currentHp = Math.max(0, boss.maxHp - damage);
  const damagePercent = Math.min(100, Math.round((damage / boss.maxHp) * 100));
  const isDefeated = damage >= boss.maxHp;

  // Dias restantes no mês
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = date.getDate();
  const daysRemaining = Math.max(1, lastDayOfMonth - currentDay);

  const neededPerDay = isDefeated ? 0 : Math.ceil(currentHp / daysRemaining);

  return {
    boss,
    monthKey: `${year}-${String(month + 1).padStart(2, '0')}`,
    totalDamageKg: damage,
    currentHp,
    maxHp: boss.maxHp,
    damagePercent,
    isDefeated,
    daysRemaining,
    neededKgPerDay: neededPerDay
  };
}

/**
 * Análise de Séries Semanais por Grupo Muscular vs Zona Ótima (10 a 20 séries).
 */
export const MUSCLE_GROUPS_CONFIG = [
  { id: 'peito', label: 'Peitoral', icon: '🛡️', targetMin: 10, targetMax: 20 },
  { id: 'costas', label: 'Costas / Dorsal', icon: '🦅', targetMin: 10, targetMax: 20 },
  { id: 'ombro', label: 'Ombros / Deltoides', icon: '🎯', targetMin: 10, targetMax: 20 },
  { id: 'quadriceps', label: 'Quadríceps', icon: '🦵', targetMin: 10, targetMax: 20 },
  { id: 'posterior', label: 'Posterior de Coxa', icon: '⚡', targetMin: 10, targetMax: 20 },
  { id: 'gluteos', label: 'Glúteos', icon: '🍑', targetMin: 8, targetMax: 18 },
  { id: 'biceps', label: 'Bíceps', icon: '💪', targetMin: 8, targetMax: 16 },
  { id: 'triceps', label: 'Tríceps', icon: '🔨', targetMin: 8, targetMax: 16 },
  { id: 'core', label: 'Core / Abdômen', icon: '🧱', targetMin: 8, targetMax: 16 }
];

export function calculateWeeklyMuscleVolume({
  weeklySessions = [],
  liveWorkoutLogs = {},
  exerciseMuscleMap = {}
}) {
  const setsCountByMuscle = {};
  for (const group of MUSCLE_GROUPS_CONFIG) {
    setsCountByMuscle[group.id] = 0;
  }

  // 1. Conta séries das sessões concluídas na semana
  for (const session of weeklySessions) {
    for (const set of session.sets || []) {
      if (set.isDone || set.weight > 0) {
        const muscle = exerciseMuscleMap[set.exerciseId] || '';
        if (muscle && setsCountByMuscle[muscle] !== undefined) {
          setsCountByMuscle[muscle]++;
        }
      }
    }
  }

  // 2. Conta séries da sessão ao vivo
  for (const [exId, log] of Object.entries(liveWorkoutLogs || {})) {
    if (!log) continue;
    const muscle = exerciseMuscleMap[exId] || '';
    if (!muscle || setsCountByMuscle[muscle] === undefined) continue;

    const sets = Array.isArray(log.sets) && log.sets.length > 0
      ? log.sets
      : [{ isDone: !!log.isDone, weight: log.weight }];

    for (const s of sets) {
      if (s.isDone) setsCountByMuscle[muscle]++;
    }
  }

  // 3. Monta o diagnóstico por grupo
  const breakdown = MUSCLE_GROUPS_CONFIG.map((group) => {
    const count = setsCountByMuscle[group.id] || 0;
    const percent = Math.min(100, Math.round((count / group.targetMin) * 100));
    let status = 'low'; // low | optimal | max
    let statusLabel = 'Abaixo da meta (manutenção)';

    if (count >= group.targetMin && count <= group.targetMax) {
      status = 'optimal';
      statusLabel = 'Zona Ótima de Hipertrofia 🎯';
    } else if (count > group.targetMax) {
      status = 'max';
      statusLabel = 'Volume Máximo Recuperável (MRV)';
    }

    return {
      ...group,
      doneSets: count,
      percent,
      status,
      statusLabel,
      setsNeeded: Math.max(0, group.targetMin - count)
    };
  });

  const optimalCount = breakdown.filter(b => b.status === 'optimal' || b.status === 'max').length;
  const laggingGroups = breakdown.filter(b => b.status === 'low' && b.setsNeeded > 0);

  return {
    breakdown,
    optimalCount,
    totalGroups: breakdown.length,
    laggingGroups
  };
}

/**
 * Ligas Competitivas Semanais por Elo (Estilo RPG / Ranking PWA).
 */
export const LEAGUE_TIERS = {
  bronze: { id: 'bronze', name: 'Liga Bronze', icon: '🥉', color: '#CD7F32', nextTier: 'silver' },
  silver: { id: 'silver', name: 'Liga Prata', icon: '🥈', color: '#94A3B8', nextTier: 'gold' },
  gold: { id: 'gold', name: 'Liga Ouro', icon: '🥇', color: '#F59E0B', nextTier: 'diamond' },
  diamond: { id: 'diamond', name: 'Liga Diamante', icon: '💎', color: '#00F0FF', nextTier: null }
};

export function calculateLeagueLeaderboard({
  userScore = 0,
  currentTier = 'bronze',
  userName = 'Você'
}) {
  const tier = LEAGUE_TIERS[currentTier] || LEAGUE_TIERS.bronze;
  const cleanScore = Math.max(0, Number(userScore) || 0);

  // Rivais com pontuações dinâmicas calculadas de acordo com o elo
  const baseOpponents = [
    { name: 'Alexandre Titan', score: Math.round(cleanScore * 1.25) + 80, avatar: '🦁' },
    { name: 'Renata Foco', score: Math.round(cleanScore * 1.1) + 40, avatar: '⚡' },
    { name: 'Marcos Sobrecarga', score: Math.round(cleanScore * 0.95) + 20, avatar: '🛡️' },
    { name: 'Carla Cross', score: Math.round(cleanScore * 0.85) + 10, avatar: '🔥' },
    { name: 'Bruno Supino', score: Math.round(cleanScore * 0.75), avatar: '🦾' },
    { name: 'Juliana Puxada', score: Math.round(cleanScore * 0.65), avatar: '🦅' },
    { name: 'Felipe LegDay', score: Math.round(cleanScore * 0.5), avatar: '🦵' },
    { name: 'Lucas Iron', score: Math.round(cleanScore * 0.35), avatar: '⛓️' },
    { name: 'Camila Core', score: Math.round(cleanScore * 0.2), avatar: '🧱' }
  ];

  const all = [
    ...baseOpponents,
    { name: userName, score: cleanScore, avatar: '👑', isUser: true }
  ];

  all.sort((a, b) => b.score - a.score);

  const leaderboard = all.map((entry, idx) => ({
    ...entry,
    position: idx + 1,
    inPromotionZone: idx < 3
  }));

  const userEntry = leaderboard.find(e => e.isUser);

  return {
    tier,
    userPosition: userEntry ? userEntry.position : 1,
    isPromoted: userEntry ? userEntry.inPromotionZone : false,
    leaderboard
  };
}

/**
 * Retrospectiva da Carreira do Atleta (Estilo Wrapped).
 */
export function calculateCareerWrapped({
  historySessions = [],
  gamificationState = {},
  userProfile = {}
}) {
  let totalSets = 0;
  let totalReps = 0;
  let heaviestSet = { weight: 0, reps: 0, exerciseName: 'Nenhum' };
  const exerciseCounts = {};

  for (const session of historySessions) {
    for (const set of session.sets || []) {
      if (set.isDone || set.weight > 0) {
        totalSets++;
        const reps = Number(set.reps) || 0;
        const weight = Number(set.weight) || 0;
        totalReps += reps;

        if (weight > heaviestSet.weight) {
          heaviestSet = { weight, reps, exerciseName: set.exerciseId };
        }

        exerciseCounts[set.exerciseId] = (exerciseCounts[set.exerciseId] || 0) + 1;
      }
    }
  }

  // Encontra o exercício mais executado
  let topExerciseId = 'supino_reto_barra';
  let maxCount = 0;
  for (const [id, count] of Object.entries(exerciseCounts)) {
    if (count > maxCount) {
      maxCount = count;
      topExerciseId = id;
    }
  }

  const tonnage = gamificationState.lifetimeTonnageKg || 0;

  return {
    athleteName: userProfile?.userName || 'Atleta',
    totalTonnageKg: tonnage,
    realWorldEquivalence: getRealWorldEquivalence(tonnage),
    totalSessions: historySessions.length,
    totalSets,
    totalReps,
    heaviestWeightKg: heaviestSet.weight,
    favoriteExerciseId: topExerciseId,
    favoriteExerciseSetsCount: maxCount,
    maxStreak: gamificationState.dailyStreak || 1,
    ironCoins: gamificationState.ironCoins || 0,
    totalXp: gamificationState.totalXp || 0
  };
}
