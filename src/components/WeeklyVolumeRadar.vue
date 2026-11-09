<template>
  <div
    id="widget-weekly-volume-radar"
    class="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs text-[#0F172A] space-y-4"
  >
    <!-- Topo: Título, Ícone e Status de Conclusão -->
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-2xl bg-[#0066FF]/10 border border-[#0066FF]/30 flex items-center justify-center text-2xl shadow-xs flex-shrink-0">
          📊
        </div>
        <div>
          <h4 class="text-sm sm:text-base font-black text-[#0F172A] uppercase tracking-tight">
            Volume Semanal por Grupo Muscular
          </h4>
          <p class="text-xs text-[#64748B]">
            Zona científica de hipertrofia: 10 a 20 séries semanais por grupo.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span
          class="text-xs font-black px-3 py-1 rounded-full shadow-xs"
          :class="volumeAnalysis.optimalCount === volumeAnalysis.totalGroups
            ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
            : 'bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/20'"
        >
          {{ volumeAnalysis.optimalCount }}/{{ volumeAnalysis.totalGroups }} Grupos na Meta
        </span>
      </div>
    </div>

    <!-- Alerta de Grupos Atrasados na Semana -->
    <div
      v-if="volumeAnalysis.laggingGroups.length > 0"
      id="alert-lagging-muscles"
      class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-xs text-[#0F172A] space-y-1.5"
    >
      <div class="flex items-center gap-1.5 font-black text-amber-800 uppercase tracking-tight">
        <span>⚠️</span>
        <span>Atenção ao Volume Semanal:</span>
      </div>
      <p class="text-[11px] text-[#64748B] leading-relaxed">
        Os seguintes grupos ainda não atingiram o volume mínimo de manutenção e hipertrofia (10 séries) para a semana:
      </p>
      <div class="flex items-center gap-1.5 flex-wrap pt-0.5">
        <span
          v-for="group in volumeAnalysis.laggingGroups"
          :key="group.id"
          class="px-2 py-0.5 rounded-md bg-white border border-amber-400/40 text-[10px] font-bold text-amber-900 shadow-xs"
        >
          {{ group.icon }} {{ group.label }}: <strong>faltam {{ group.setsNeeded }} séries</strong>
        </span>
      </div>
    </div>

    <!-- Lista de Barras de Volume por Grupo Muscular -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
      <div
        v-for="group in volumeAnalysis.breakdown"
        :key="group.id"
        class="p-3 rounded-xl border bg-[#F8FAFC] border-[#E2E8F0] space-y-1.5 transition-all"
        :class="group.status === 'optimal' ? 'border-emerald-500/40 bg-emerald-500/5' : ''"
      >
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <span>{{ group.icon }}</span>
            <span class="font-black text-[#0F172A]">{{ group.label }}</span>
          </div>
          <span
            class="text-[10px] font-black px-2 py-0.5 rounded-full"
            :class="group.status === 'optimal'
              ? 'bg-emerald-500 text-white'
              : group.status === 'max'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-200 text-[#64748B]'"
          >
            {{ group.doneSets }} séries
          </span>
        </div>

        <!-- Barra com Marcador da Faixa de 10 a 20 -->
        <div class="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden relative" role="progressbar" :aria-valuenow="group.percent" aria-valuemin="0" aria-valuemax="100">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="group.status === 'optimal' ? 'bg-emerald-500' : group.status === 'max' ? 'bg-amber-500' : 'bg-[#0066FF]'"
            :style="{ width: `${group.percent}%` }"
          ></div>
        </div>

        <div class="flex items-center justify-between text-[9px] text-[#64748B]">
          <span>Meta: {{ group.targetMin }}-{{ group.targetMax }} séries</span>
          <span class="font-bold" :class="group.status === 'optimal' ? 'text-emerald-700' : 'text-[#64748B]'">
            {{ group.statusLabel }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { calculateWeeklyMuscleVolume } from '../engine/gamification.js';

const props = defineProps({
  weeklySessions: {
    type: Array,
    default: () => []
  },
  liveWorkoutLogs: {
    type: Object,
    default: () => ({})
  },
  exerciseMuscleMap: {
    type: Object,
    default: () => ({})
  }
});

const volumeAnalysis = computed(() => {
  return calculateWeeklyMuscleVolume({
    weeklySessions: props.weeklySessions,
    liveWorkoutLogs: props.liveWorkoutLogs,
    exerciseMuscleMap: props.exerciseMuscleMap
  });
});
</script>
