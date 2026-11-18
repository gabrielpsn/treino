import { computed, ref } from 'vue';
import { listBodyEntries } from '../db/bodyProgress.js';
import { weightTrend } from '../engine/bodyProgress.js';
import { isoWeekKey } from '../engine/deload.js';
import { calculateWeeklyMuscleVolume } from '../engine/gamification.js';
import { buildWeeklySummary } from '../engine/weeklySummary.js';
import { loadExerciseVideos } from '../engine/exerciseMedia.js';

/**
 * Medições corporais e resumos derivados do histórico: resumo da semana (coach,
 * ligas), resumo do aluno (modo personal) e a ficha que o personal envia.
 */
export function useWeeklyInsights({
  historySessions, weeklySessions, userProfile, activePlan,
  exerciseNames, exerciseMuscleMap, todayWalkingData, deloadEvaluation
}) {
  const bodyEntries = ref([]);

  // ---------------------------------------------------------------------------
  // Evolução corporal, resumo semanal, coach, ligas reais e modo personal
  // ---------------------------------------------------------------------------

  async function loadBodyEntries() {
    try {
      bodyEntries.value = await listBodyEntries();
    } catch (err) {
      console.error('Não foi possível ler as medições corporais.', err);
      bodyEntries.value = [];
    }
  }

  const bodyTrend = computed(() => weightTrend(bodyEntries.value));
  const latestBodyWeight = computed(() => {
    const withWeight = bodyEntries.value.filter(e => Number.isFinite(e.weightKg));
    return withWeight.length ? withWeight[withWeight.length - 1].weightKg : null;
  });

  const currentIsoWeekKey = computed(() => isoWeekKey(Date.now()));

  const weeklySummary = computed(() => {
    // Grupos "atrasados" só fazem sentido no fim da semana; na segunda-feira
    // todos estariam abaixo da meta.
    const weekday = new Date().getDay();
    const lateWeek = weekday === 0 || weekday >= 5;
    const lagging = lateWeek
      ? calculateWeeklyMuscleVolume({
        weeklySessions: weeklySessions.value,
        liveWorkoutLogs: {},
        exerciseMuscleMap: exerciseMuscleMap.value
      }).laggingGroups.map(g => g.label)
      : [];
    return buildWeeklySummary({
      sessions: historySessions.value,
      now: Date.now(),
      goal: userProfile.value?.goal || 'hypertrophy',
      plannedSessions: Number(userProfile.value?.daysPerWeek) || 0,
      exerciseName: id => exerciseNames.value[id] || id,
      stalledExerciseIds: deloadEvaluation.value.stalledExercises,
      weakMuscles: lagging,
      weightTrendKgPerWeek: bodyTrend.value?.weeklyKg ?? null,
      steps: todayWalkingData.value?.steps ?? null,
      deloadSuggested: deloadEvaluation.value.recommended
    });
  });

  // O que o personal enxerga: só agregados e a ficha atual, nada de nome real,
  // fotos ou histórico bruto.
  const studentSummary = computed(() => {
    const profile = userProfile.value || {};
    const recentWeeks = [3, 2, 1, 0].map(back => {
      const key = isoWeekKey(Date.now() - back * 7 * 86_400_000);
      const sessions = historySessions.value.filter(s => {
        const t = Date.parse(s.startedAt || '');
        return Number.isFinite(t) && isoWeekKey(t) === key && (s.sets || []).some(set => set?.isDone);
      });
      return { weekKey: key, sessions: sessions.length };
    });
    return {
      goal: profile.goal,
      daysPerWeek: profile.daysPerWeek,
      experienceLevel: profile.experienceLevel,
      equipment: profile.equipment,
      restrictions: profile.restrictions || [],
      weekly: weeklySummary.value,
      recentWeeks,
      latestWeightKg: latestBodyWeight.value ?? profile.weightKg ?? null,
      weightTrendKgPerWeek: bodyTrend.value?.weeklyKg ?? null,
      planSplits: (activePlan.value?.workoutSplits || []).map(split => ({
        title: split.title,
        exercises: (split.exercises || []).map(ex => ex.name)
      }))
    };
  });

  // Ficha que o personal envia: a dele, com os vídeos próprios anexados.
  const trainerSplitsToSend = computed(() => {
    const videos = loadExerciseVideos();
    return (activePlan.value?.workoutSplits || []).map(split => ({
      ...JSON.parse(JSON.stringify(split)),
      exercises: (split.exercises || []).map(ex => ({ ...JSON.parse(JSON.stringify(ex)), videoUrl: videos[ex.id] || ex.videoUrl || undefined }))
    }));
  });

  return { bodyEntries, loadBodyEntries, bodyTrend, latestBodyWeight, currentIsoWeekKey, weeklySummary, studentSummary, trainerSplitsToSend };
}
