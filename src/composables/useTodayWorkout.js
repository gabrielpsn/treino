import { computed, nextTick } from 'vue';
import { getDayKey } from '../db/index.js';
import { pickTodaySplit, estimateMinutes } from '../engine/todayPlan.js';

/** Card "Treino de hoje" e checklist de primeiros passos. */
export function useTodayWorkout({
  activePlan, historySessions, bodyEntries, uiPrefs, saveUiPrefs,
  currentMainTab, currentSplitTab, openTrainingMode, getSplitMuscleGroups, MUSCLE_LABELS
}) {
  const todayPlan = computed(() => pickTodaySplit(activePlan.value?.workoutSplits || [], historySessions.value, getDayKey()));
  const todayMinutes = computed(() => estimateMinutes(todayPlan.value.split));
  const todayMuscles = computed(() =>
    getSplitMuscleGroups(todayPlan.value.split).slice(0, 4).map(m => MUSCLE_LABELS[m] || m).join(', ')
  );

  const firstStepsDone = computed(() => ({
    glossary: !!uiPrefs.value.seenGlossary,
    workout: historySessions.value.some(s => (s.sets || []).some(set => set?.isDone)),
    weight: bodyEntries.value.length > 0
  }));
  const showFirstSteps = computed(() =>
    !uiPrefs.value.firstStepsDismissed && !Object.values(firstStepsDone.value).every(Boolean)
  );
  function dismissFirstSteps() {
    saveUiPrefs({ firstStepsDismissed: true });
  }

  function startTodayWorkout() {
    const split = todayPlan.value.split;
    if (!split) return;
    currentMainTab.value = 'workout';
    currentSplitTab.value = split.id;
    openTrainingMode();
  }

  function viewTodayWorkout() {
    const split = todayPlan.value.split;
    if (!split) return;
    currentMainTab.value = 'workout';
    currentSplitTab.value = split.id;
    nextTick(() => document.getElementById('workout-sheet-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  return { todayPlan, todayMinutes, todayMuscles, firstStepsDone, showFirstSteps, dismissFirstSteps, startTodayWorkout, viewTodayWorkout };
}
