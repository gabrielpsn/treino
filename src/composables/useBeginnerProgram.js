import { computed, ref } from 'vue';
import { getDayKey } from '../db/index.js';
import { awardXpAndCoins } from '../db/gamification.js';
import {
  normalizeProgramState,
  programReview,
  programStatus,
  weekPrescription
} from '../engine/beginnerProgram.js';

export const PROGRAM_STORAGE_KEY = 'overload_beginner_program';
export const PROGRAM_REWARD = { xp: 300, coins: 100 };

function readState() {
  try {
    return normalizeProgramState(JSON.parse(localStorage.getItem(PROGRAM_STORAGE_KEY) || '{}'));
  } catch {
    return normalizeProgramState({});
  }
}

/**
 * Programa guiado de 4 semanas: estado (início/conclusão), semana atual,
 * prescrição exibida em cada exercício e recompensa ao concluir.
 */
export function useBeginnerProgram({ historySessions, userProfile, gamificationState, exerciseNames }) {
  const programState = ref(readState());
  const isProgramOpen = ref(false);

  function save(next) {
    programState.value = normalizeProgramState(next);
    try {
      localStorage.setItem(PROGRAM_STORAGE_KEY, JSON.stringify(programState.value));
    } catch {
      // Sem storage o programa vale só nesta sessão.
    }
  }

  const programInfo = computed(() => programStatus(programState.value, historySessions.value, {
    daysPerWeek: Number(userProfile.value?.daysPerWeek) || 3,
    today: getDayKey()
  }));

  const isProgramActive = computed(() => ['active', 'review'].includes(programInfo.value.phase));

  // Oferecido a quem se declarou iniciante e ainda não começou nem dispensou.
  const shouldOfferProgram = computed(() =>
    programInfo.value.phase === 'not_started' && userProfile.value?.experienceLevel === 'beginner'
  );

  const programReviewData = computed(() =>
    programInfo.value.phase === 'review'
      ? programReview(programState.value, historySessions.value, { exerciseName: id => exerciseNames.value[id] || id })
      : null
  );

  function programHint() {
    return programInfo.value.phase === 'active' ? weekPrescription(programInfo.value.current) : '';
  }

  // Séries da semana no lugar das da ficha, para não haver duas prescrições.
  function programSeriesLabel(defaultSeries) {
    const week = programInfo.value.phase === 'active' ? programInfo.value.current : null;
    return week ? `${week.sets}x ${week.reps} reps` : defaultSeries;
  }

  function startProgram() {
    save({ startedOn: getDayKey() });
    isProgramOpen.value = true;
  }

  function dismissProgram() {
    save({ dismissed: true });
  }

  function abandonProgram() {
    save({ dismissed: true });
    isProgramOpen.value = false;
  }

  function completeProgram() {
    save({ ...programState.value, completedOn: getDayKey() });
    const updated = awardXpAndCoins(PROGRAM_REWARD.xp, PROGRAM_REWARD.coins);
    if (updated) gamificationState.value = updated;
  }

  function reloadProgramState() {
    programState.value = readState();
  }

  return {
    programState, programInfo, isProgramActive, shouldOfferProgram, programReviewData,
    isProgramOpen, programHint, programSeriesLabel, startProgram, dismissProgram, abandonProgram, completeProgram,
    reloadProgramState
  };
}
