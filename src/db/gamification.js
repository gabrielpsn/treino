/**
 * Persistência e gerenciamento do estado de Gamificação do TreinoPro.
 *
 * Utiliza localStorage seguro com fallback em memória para resposta instantânea
 * e sincronização sem fricção no dispositivo.
 */

export const GAMIFICATION_STORAGE_KEY = 'treinopro_gamification_state';
export const WEEKLY_DAY_COMPLETION_XP = 50;

const DEFAULT_STATE = {
  totalXp: 0,
  lifetimeTonnageKg: 0,
  unlockedBadgeIds: [],
  weeklyStreak: 0,
  shieldsCount: 1, // Começa com 1 escudo de deload de boas-vindas
  lastActiveWeekKey: null,
  lastRestDayDate: null,
  claimedWeeklyDays: []
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
      shieldsCount: Math.min(2, Math.max(0, Number(parsed.shieldsCount) || 0)),
      lastActiveWeekKey: parsed.lastActiveWeekKey || null,
      lastRestDayDate: parsed.lastRestDayDate || null,
      claimedWeeklyDays: Array.isArray(parsed.claimedWeeklyDays) ? parsed.claimedWeeklyDays : []
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
      shieldsCount: Math.min(2, Math.max(0, Number(state?.shieldsCount) || 0)),
      lastActiveWeekKey: state?.lastActiveWeekKey || null,
      lastRestDayDate: state?.lastRestDayDate || null,
      claimedWeeklyDays: Array.isArray(state?.claimedWeeklyDays) ? state.claimedWeeklyDays : []
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
  currentWeekKey = null
}) {
  const current = loadGamificationState();

  const nextXp = current.totalXp + Math.max(0, Number(earnedXp) || 0);
  const nextTonnage = current.lifetimeTonnageKg + Math.max(0, Number(tonnageKg) || 0);

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

  const updated = {
    ...current,
    totalXp: nextXp,
    lifetimeTonnageKg: nextTonnage,
    unlockedBadgeIds: Array.from(badgeSet),
    weeklyStreak: nextStreak,
    shieldsCount: nextShields,
    lastActiveWeekKey: currentWeekKey || current.lastActiveWeekKey
  };

  saveGamificationState(updated);
  return updated;
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
