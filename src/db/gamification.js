/**
 * Persistência e gerenciamento do estado de Gamificação do TreinoPro.
 *
 * Utiliza localStorage seguro com fallback em memória para resposta instantânea
 * e sincronização sem fricção no dispositivo.
 */

import { calculateDailyStreak } from '../engine/gamification.js';

export const GAMIFICATION_STORAGE_KEY = 'treinopro_gamification_state';
export const WEEKLY_DAY_COMPLETION_XP = 50;

const DEFAULT_STATE = {
  totalXp: 0,
  lifetimeTonnageKg: 0,
  unlockedBadgeIds: [],
  weeklyStreak: 0,
  dailyStreak: 0,
  lastActiveDate: null,
  shieldsCount: 1, // Começa com 1 escudo de deload de boas-vindas
  lastActiveWeekKey: null,
  lastRestDayDate: null,
  claimedWeeklyDays: [],
  ironCoins: 100, // 100 moedas de ferro de boas-vindas
  rpgBranches: { push: 0, pull: 0, legs: 0, core: 0 },
  unlockedThemes: ['blue', 'orange'],
  equippedTheme: 'blue',
  unlockedTitles: ['iniciante_ferro'],
  equippedTitle: 'iniciante_ferro',
  claimedBossMonths: [],
  leagueTier: 'bronze',
  claimedRaidMilestones: [],
  claimedDietDates: [],
  claimedWalkingDates: []
};

export function loadGamificationState() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_STATE };
  }

  try {
    const raw = window.localStorage.getItem(GAMIFICATION_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return {
      totalXp: Math.max(0, Number(parsed.totalXp) || 0),
      lifetimeTonnageKg: Math.max(0, Number(parsed.lifetimeTonnageKg) || 0),
      unlockedBadgeIds: Array.isArray(parsed.unlockedBadgeIds) ? parsed.unlockedBadgeIds : [],
      weeklyStreak: Math.max(0, Number(parsed.weeklyStreak) || 0),
      dailyStreak: Math.max(0, Number(parsed.dailyStreak) || 0),
      lastActiveDate: parsed.lastActiveDate || null,
      shieldsCount: Math.min(2, Math.max(0, Number(parsed.shieldsCount) || 0)),
      lastActiveWeekKey: parsed.lastActiveWeekKey || null,
      lastRestDayDate: parsed.lastRestDayDate || null,
      claimedWeeklyDays: Array.isArray(parsed.claimedWeeklyDays) ? parsed.claimedWeeklyDays : [],
      ironCoins: typeof parsed.ironCoins === 'number' ? Math.max(0, parsed.ironCoins) : 100,
      rpgBranches: {
        push: Math.max(0, Number(parsed.rpgBranches?.push) || 0),
        pull: Math.max(0, Number(parsed.rpgBranches?.pull) || 0),
        legs: Math.max(0, Number(parsed.rpgBranches?.legs) || 0),
        core: Math.max(0, Number(parsed.rpgBranches?.core) || 0)
      },
      unlockedThemes: Array.isArray(parsed.unlockedThemes) && parsed.unlockedThemes.length > 0 ? parsed.unlockedThemes : ['blue', 'orange'],
      equippedTheme: parsed.equippedTheme || 'blue',
      unlockedTitles: Array.isArray(parsed.unlockedTitles) && parsed.unlockedTitles.length > 0 ? parsed.unlockedTitles : ['iniciante_ferro'],
      equippedTitle: parsed.equippedTitle || 'iniciante_ferro',
      claimedBossMonths: Array.isArray(parsed.claimedBossMonths) ? parsed.claimedBossMonths : [],
      leagueTier: parsed.leagueTier || 'bronze',
      claimedRaidMilestones: Array.isArray(parsed.claimedRaidMilestones) ? parsed.claimedRaidMilestones : [],
      claimedDietDates: Array.isArray(parsed.claimedDietDates) ? parsed.claimedDietDates : [],
      claimedWalkingDates: Array.isArray(parsed.claimedWalkingDates) ? parsed.claimedWalkingDates : []
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveGamificationState(state) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const safeState = {
      totalXp: Math.max(0, Number(state?.totalXp) || 0),
      lifetimeTonnageKg: Math.max(0, Number(state?.lifetimeTonnageKg) || 0),
      unlockedBadgeIds: Array.isArray(state?.unlockedBadgeIds) ? state.unlockedBadgeIds : [],
      weeklyStreak: Math.max(0, Number(state?.weeklyStreak) || 0),
      dailyStreak: Math.max(0, Number(state?.dailyStreak) || 0),
      lastActiveDate: state?.lastActiveDate || null,
      shieldsCount: Math.min(2, Math.max(0, Number(state?.shieldsCount) || 0)),
      lastActiveWeekKey: state?.lastActiveWeekKey || null,
      lastRestDayDate: state?.lastRestDayDate || null,
      claimedWeeklyDays: Array.isArray(state?.claimedWeeklyDays) ? state.claimedWeeklyDays : [],
      ironCoins: Math.max(0, Number(state?.ironCoins) || 0),
      rpgBranches: {
        push: Math.max(0, Number(state?.rpgBranches?.push) || 0),
        pull: Math.max(0, Number(state?.rpgBranches?.pull) || 0),
        legs: Math.max(0, Number(state?.rpgBranches?.legs) || 0),
        core: Math.max(0, Number(state?.rpgBranches?.core) || 0)
      },
      unlockedThemes: Array.isArray(state?.unlockedThemes) ? state.unlockedThemes : ['blue', 'orange'],
      equippedTheme: state?.equippedTheme || 'blue',
      unlockedTitles: Array.isArray(state?.unlockedTitles) ? state.unlockedTitles : ['iniciante_ferro'],
      equippedTitle: state?.equippedTitle || 'iniciante_ferro',
      claimedBossMonths: Array.isArray(state?.claimedBossMonths) ? state.claimedBossMonths : [],
      leagueTier: state?.leagueTier || 'bronze',
      claimedRaidMilestones: Array.isArray(state?.claimedRaidMilestones) ? state.claimedRaidMilestones : [],
      claimedDietDates: Array.isArray(state?.claimedDietDates) ? state.claimedDietDates : [],
      claimedWalkingDates: Array.isArray(state?.claimedWalkingDates) ? state.claimedWalkingDates : []
    };
    window.localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(safeState));
  } catch {
    // Silêncio em caso de cota cheia
  }
}

/**
 * Registra a conclusão de uma sessão de treino no progresso de gamificação.
 */
export function recordSessionCompletion({
  earnedXp = 0,
  tonnageKg = 0,
  newBadgeIds = [],
  earnedCoins = 0,
  branchXp = {},
  currentWeekKey = null,
  todayDateStr = new Date().toISOString().slice(0, 10)
}) {
  const current = loadGamificationState();

  const nextXp = current.totalXp + Math.max(0, Number(earnedXp) || 0);
  const nextTonnage = current.lifetimeTonnageKg + Math.max(0, Number(tonnageKg) || 0);
  const nextCoins = current.ironCoins + Math.max(0, Number(earnedCoins) || 0);

  const nextBranches = {
    push: (current.rpgBranches?.push || 0) + (Number(branchXp?.push) || 0),
    pull: (current.rpgBranches?.pull || 0) + (Number(branchXp?.pull) || 0),
    legs: (current.rpgBranches?.legs || 0) + (Number(branchXp?.legs) || 0),
    core: (current.rpgBranches?.core || 0) + (Number(branchXp?.core) || 0)
  };

  const badgeSet = new Set(current.unlockedBadgeIds);
  (newBadgeIds || []).forEach(id => badgeSet.add(id));

  let nextStreak = current.weeklyStreak;
  let nextShields = current.shieldsCount;

  // Atualização de Streak Semanal
  if (currentWeekKey && current.lastActiveWeekKey !== currentWeekKey) {
    nextStreak += 1;
    // A cada 3 semanas de streak, ganha 1 escudo (teto 2)
    if (nextStreak % 3 === 0 && nextShields < 2) {
      nextShields += 1;
    }
  }

  // Atualização de Streak Diário (Chama de Fogo)
  const streakCalc = calculateDailyStreak(current.lastActiveDate, current.dailyStreak, todayDateStr);

  const updated = {
    ...current,
    totalXp: nextXp,
    lifetimeTonnageKg: nextTonnage,
    ironCoins: nextCoins,
    rpgBranches: nextBranches,
    unlockedBadgeIds: Array.from(badgeSet),
    weeklyStreak: nextStreak,
    dailyStreak: streakCalc.streak,
    lastActiveDate: streakCalc.lastActiveDate,
    shieldsCount: nextShields,
    lastActiveWeekKey: currentWeekKey || current.lastActiveWeekKey
  };

  saveGamificationState(updated);
  return updated;
}

/**
 * Concede Moedas de Ferro (ex: bater meta de água/creatina, bônus de streak).
 */
export function awardCoins(amount = 0) {
  const current = loadGamificationState();
  const nextCoins = current.ironCoins + Math.max(0, Number(amount) || 0);
  const updated = { ...current, ironCoins: nextCoins };
  saveGamificationState(updated);
  return updated;
}

/**
 * Gasta moedas de ferro se houver saldo suficiente.
 */
export function spendCoins(amount = 0) {
  const current = loadGamificationState();
  const cost = Math.max(0, Number(amount) || 0);
  if (current.ironCoins < cost) {
    return { success: false, updated: current, error: 'Saldo insuficiente de moedas' };
  }
  const updated = { ...current, ironCoins: current.ironCoins - cost };
  saveGamificationState(updated);
  return { success: true, updated };
}

/**
 * Desbloqueia e equipa um tema cosmético na Iron Store.
 */
export function unlockAndEquipTheme(themeId, price = 0) {
  const current = loadGamificationState();
  const unlocked = new Set(current.unlockedThemes || ['blue', 'orange']);

  if (unlocked.has(themeId)) {
    const updated = { ...current, equippedTheme: themeId };
    saveGamificationState(updated);
    return { success: true, updated, alreadyUnlocked: true };
  }

  const cost = Math.max(0, Number(price) || 0);
  if (current.ironCoins < cost) {
    return { success: false, updated: current, error: 'Moedas insuficientes' };
  }

  unlocked.add(themeId);
  const updated = {
    ...current,
    ironCoins: current.ironCoins - cost,
    unlockedThemes: Array.from(unlocked),
    equippedTheme: themeId
  };
  saveGamificationState(updated);
  return { success: true, updated, alreadyUnlocked: false };
}

/**
 * Equipa um tema já desbloqueado.
 */
export function equipTheme(themeId) {
  const current = loadGamificationState();
  const unlocked = new Set(current.unlockedThemes || ['blue', 'orange']);
  if (!unlocked.has(themeId)) {
    return { success: false, updated: current, error: 'Tema ainda não desbloqueado' };
  }
  const updated = { ...current, equippedTheme: themeId };
  saveGamificationState(updated);
  return { success: true, updated };
}

/**
 * Desbloqueia e equipa um título na Iron Store.
 */
export function unlockAndEquipTitle(titleId, price = 0) {
  const current = loadGamificationState();
  const unlocked = new Set(current.unlockedTitles || ['iniciante_ferro']);

  if (unlocked.has(titleId)) {
    const updated = { ...current, equippedTitle: titleId };
    saveGamificationState(updated);
    return { success: true, updated, alreadyUnlocked: true };
  }

  const cost = Math.max(0, Number(price) || 0);
  if (current.ironCoins < cost) {
    return { success: false, updated: current, error: 'Moedas insuficientes' };
  }

  unlocked.add(titleId);
  const updated = {
    ...current,
    ironCoins: current.ironCoins - cost,
    unlockedTitles: Array.from(unlocked),
    equippedTitle: titleId
  };
  saveGamificationState(updated);
  return { success: true, updated, alreadyUnlocked: false };
}

/**
 * Equipa um título já desbloqueado.
 */
export function equipTitle(titleId) {
  const current = loadGamificationState();
  const unlocked = new Set(current.unlockedTitles || ['iniciante_ferro']);
  if (!unlocked.has(titleId)) {
    return { success: false, updated: current, error: 'Título ainda não desbloqueado' };
  }
  const updated = { ...current, equippedTitle: titleId };
  saveGamificationState(updated);
  return { success: true, updated };
}

/**
 * Registra a conclusão de um dia da semana no Quadro Semanal e concede XP de consistência.
 */
export function recordWeeklyDayCompletion({
  dayId,
  weekKey,
  xpReward = WEEKLY_DAY_COMPLETION_XP
}) {
  const current = loadGamificationState();
  const claimKey = `day_xp_${weekKey || 'current'}_${dayId}`;
  const claimedWeeklyDays = Array.isArray(current.claimedWeeklyDays) ? current.claimedWeeklyDays : [];

  if (claimedWeeklyDays.includes(claimKey)) {
    return { updated: current, alreadyClaimed: true, xpGained: 0 };
  }

  const reward = Math.max(0, Number(xpReward) || WEEKLY_DAY_COMPLETION_XP);
  const nextXp = current.totalXp + reward;
  const updated = {
    ...current,
    totalXp: nextXp,
    claimedWeeklyDays: [...claimedWeeklyDays, claimKey]
  };

  saveGamificationState(updated);
  return { updated, alreadyClaimed: false, xpGained: reward };
}

/**
 * Registra o descanso ativo (Rest Day) e concede XP de recuperação.
 */
export function recordRestDay(todayDateStr) {
  const current = loadGamificationState();

  if (current.lastRestDayDate === todayDateStr) {
    return { updated: current, alreadyClaimed: true, xpGained: 0 };
  }

  const restXp = 25; // XP de regeneração muscular
  const updated = {
    ...current,
    totalXp: current.totalXp + restXp,
    lastRestDayDate: todayDateStr
  };

  saveGamificationState(updated);
  return { updated, alreadyClaimed: false, xpGained: restXp };
}

/**
 * Reivindica as recompensas de derrotar o Boss Mensal (Coins + XP).
 */
export function claimBossVictory({
  monthKey,
  rewardCoins = 500,
  rewardXp = 1000
}) {
  const current = loadGamificationState();
  const claimedList = Array.isArray(current.claimedBossMonths) ? current.claimedBossMonths : [];

  if (claimedList.includes(monthKey)) {
    return { success: false, updated: current, alreadyClaimed: true };
  }

  const updated = {
    ...current,
    totalXp: current.totalXp + rewardXp,
    ironCoins: current.ironCoins + rewardCoins,
    claimedBossMonths: [...claimedList, monthKey]
  };

  saveGamificationState(updated);
  return { success: true, updated, alreadyClaimed: false };
}

/**
 * Promove o atleta para o próximo elo da Liga Semanal.
 */
export function promoteLeague(nextTier, bonusCoins = 150) {
  const current = loadGamificationState();
  const updated = {
    ...current,
    leagueTier: nextTier,
    ironCoins: current.ironCoins + Math.max(0, Number(bonusCoins) || 0)
  };

  saveGamificationState(updated);
  return updated;
}

/**
 * Resgata a recompensa de um marco da Raid Coletiva.
 */
export function claimRaidMilestone({
  milestonePercent,
  rewardCoins = 100,
  rewardXp = 200,
  unlockTitleId = null
}) {
  const current = loadGamificationState();
  const claimed = Array.isArray(current.claimedRaidMilestones) ? current.claimedRaidMilestones : [];

  if (claimed.includes(milestonePercent)) {
    return { success: false, updated: current, alreadyClaimed: true };
  }

  const titles = Array.isArray(current.unlockedTitles) ? [...current.unlockedTitles] : ['iniciante_ferro'];
  if (unlockTitleId && !titles.includes(unlockTitleId)) {
    titles.push(unlockTitleId);
  }

  const updated = {
    ...current,
    totalXp: current.totalXp + rewardXp,
    ironCoins: current.ironCoins + rewardCoins,
    claimedRaidMilestones: [...claimed, milestonePercent],
    unlockedTitles: titles
  };

  saveGamificationState(updated);
  return { success: true, updated, alreadyClaimed: false };
}

/**
 * Concede XP e Moedas de Ferro ao completar 100% das refeições prescritas do dia.
 */
export function recordDailyDietCompletion(dateStr) {
  const current = loadGamificationState();
  const claimed = Array.isArray(current.claimedDietDates) ? current.claimedDietDates : [];

  if (claimed.includes(dateStr)) {
    return { alreadyClaimed: true, updated: current };
  }

  const updated = {
    ...current,
    totalXp: current.totalXp + 50,
    ironCoins: current.ironCoins + 30,
    claimedDietDates: [...claimed, dateStr]
  };

  saveGamificationState(updated);
  return { alreadyClaimed: false, updated };
}

/**
 * Concede XP (+50 XP), Moedas de Ferro (+30 Coins) e XP de RPG (Membros Inferiores & Core)
 * ao bater a meta diária de passos de caminhada.
 */
export function recordDailyWalkingGoalCompletion(dateStr) {
  const current = loadGamificationState();
  const claimed = Array.isArray(current.claimedWalkingDates) ? current.claimedWalkingDates : [];

  if (claimed.includes(dateStr)) {
    return { alreadyClaimed: true, updated: current };
  }

  const currentBranches = current.rpgBranches || { push: 0, pull: 0, legs: 0, core: 0 };
  const updated = {
    ...current,
    totalXp: current.totalXp + 50,
    ironCoins: current.ironCoins + 30,
    claimedWalkingDates: [...claimed, dateStr],
    rpgBranches: {
      ...currentBranches,
      legs: (currentBranches.legs || 0) + 30,
      core: (currentBranches.core || 0) + 20
    }
  };

  saveGamificationState(updated);
  return { alreadyClaimed: false, updated };
}
