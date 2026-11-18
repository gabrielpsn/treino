<template>
  <section
    v-show="currentMainTab === 'history'"
    id="screen-history"
    role="tabpanel"
    aria-labelledby="tab-btn-history"
    tabindex="0"
    class="focus:outline-none space-y-6"
  >
    <!-- Coach da semana (texto local + análise opcional por IA) -->
    <WeeklyCoachCard :summary="weeklySummary" />
  
    <!-- Boss Fight Mensal (Dano por Tonelagem) -->
    <MonthlyBossWidget
      :monthly-tonnage-kg="monthlyTonnageKg"
      :claimed-months="gamificationState.claimedBossMonths || []"
      @claim-reward="handleClaimBossReward"
    />
  
    <!-- Radar de Séries Semanais por Músculo (Alvo: 10 a 20 séries) -->
    <WeeklyVolumeRadar
      :weekly-sessions="weeklySessions"
      :live-workout-logs="workoutLogs"
      :exercise-muscle-map="exerciseMuscleMap"
    />
  
    <!-- Mapa de Calor de Consistência Anual (20 semanas) -->
    <YearlyHeatmapWidget :history-sessions="historySessions" />
  
    <HistoryPanel
      :sessions="historySessions"
      :split-titles="splitTitles"
      :exercise-names="exerciseNames"
      :is-weight-loss="isWeightLoss"
    />
  </section>
</template>

<script setup>
// Aba extraída do App.vue. O estado continua no App e chega por provide/inject
// ('appContext'): esta divisão é estrutural, sem mudar comportamento.
import { inject } from 'vue';
import WeeklyCoachCard from '../WeeklyCoachCard.vue';
import MonthlyBossWidget from '../MonthlyBossWidget.vue';
import WeeklyVolumeRadar from '../WeeklyVolumeRadar.vue';
import YearlyHeatmapWidget from '../YearlyHeatmapWidget.vue';
import HistoryPanel from '../HistoryPanel.vue';

const {
  currentMainTab,
  workoutLogs,
  gamificationState,
  historySessions,
  handleClaimBossReward,
  isWeightLoss,
  splitTitles,
  exerciseNames,
  exerciseMuscleMap,
  monthlyTonnageKg,
  weeklySessions,
  weeklySummary
} = inject('appContext');
</script>
