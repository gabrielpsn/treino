<template>
  <div
    id="widget-yearly-heatmap"
    class="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs text-[#0F172A] space-y-4"
  >
    <!-- Topo: Título, Ícone e Estatísticas de Consistência -->
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl shadow-xs flex-shrink-0">
          🗓️
        </div>
        <div>
          <h4 class="text-sm sm:text-base font-black text-[#0F172A] uppercase tracking-tight">
            Mapa de Calor de Consistência
          </h4>
          <p class="text-xs text-[#64748B]">
            Presença e intensidade nos últimos 5 meses (20 semanas).
          </p>
        </div>
      </div>

      <!-- Métricas Resumidas -->
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-xs font-black px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
          🔥 {{ heatmapData.totalActiveDays }} dias ativos
        </span>
        <span class="text-xs font-black px-3 py-1 rounded-full bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/20">
          ⚡ {{ heatmapData.totalSetsInPeriod }} séries
        </span>
      </div>
    </div>

    <!-- Grade do Mapa de Calor (Scroll Horizontal em Mobile) -->
    <div class="overflow-x-auto pb-2">
      <div class="inline-block min-w-full">
        <!-- Rótulos dos Meses -->
        <div class="flex text-[10px] font-bold text-[#64748B] mb-1.5 pl-6 gap-6 sm:gap-8">
          <span
            v-for="month in heatmapData.monthLabels"
            :key="`${month.label}-${month.weekIndex}`"
          >
            {{ month.label }}
          </span>
        </div>

        <div class="flex gap-1.5 items-start">
          <!-- Rótulos dos Dias da Semana -->
          <div class="flex flex-col gap-1 text-[9px] font-bold text-[#94A3B8] pr-1 select-none pt-0.5">
            <span class="h-3 leading-3">Seg</span>
            <span class="h-3 leading-3 opacity-0">Ter</span>
            <span class="h-3 leading-3">Qua</span>
            <span class="h-3 leading-3 opacity-0">Qui</span>
            <span class="h-3 leading-3">Sex</span>
            <span class="h-3 leading-3 opacity-0">Sáb</span>
            <span class="h-3 leading-3">Dom</span>
          </div>

          <!-- Colunas de Semanas -->
          <div class="flex gap-1">
            <div
              v-for="(week, wIdx) in heatmapData.weeks"
              :key="`week-${wIdx}`"
              class="flex flex-col gap-1"
            >
              <button
                v-for="day in week"
                :key="day.date"
                type="button"
                :title="dayTooltip(day)"
                @click="selectedDay = day"
                class="w-3.5 h-3.5 rounded-xs transition-transform hover:scale-125 focus:outline-none focus:ring-1 focus:ring-[#0066FF]"
                :class="cellClass(day)"
              ></button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detalhe do Dia Selecionado ou Legenda -->
    <div class="flex items-center justify-between text-xs pt-1 border-t border-[#F1F5F9] flex-wrap gap-2">
      <div v-if="selectedDay" class="flex items-center gap-2">
        <span class="font-bold text-[#0F172A]">{{ formatDayLabel(selectedDay.date) }}:</span>
        <span v-if="selectedDay.setsCount > 0" class="text-emerald-700 font-black">
          {{ selectedDay.setsCount }} séries • {{ selectedDay.volumeKg.toLocaleString('pt-BR') }} kg
        </span>
        <span v-else class="text-[#94A3B8] italic">Descanso / Nenhum registro</span>
      </div>
      <div v-else class="text-[11px] text-[#64748B]">
        Toque em qualquer quadrado para ver detalhes do treino.
      </div>

      <!-- Legenda de Cores -->
      <div class="flex items-center gap-1.5 text-[10px] text-[#64748B]">
        <span>Menos</span>
        <span class="w-3 h-3 rounded-xs bg-[#F1F5F9] border border-[#E2E8F0]"></span>
        <span class="w-3 h-3 rounded-xs bg-emerald-200"></span>
        <span class="w-3 h-3 rounded-xs bg-emerald-400"></span>
        <span class="w-3 h-3 rounded-xs bg-emerald-600"></span>
        <span class="w-3 h-3 rounded-xs bg-emerald-800"></span>
        <span>Mais</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { calculateActivityHeatmap } from '../engine/gamification.js';

const props = defineProps({
  historySessions: {
    type: Array,
    default: () => []
  }
});

const selectedDay = ref(null);

const heatmapData = computed(() => {
  return calculateActivityHeatmap({
    historySessions: props.historySessions,
    weeksCount: 20
  });
});

function cellClass(day) {
  if (day.isFuture) return 'bg-slate-50 border border-slate-100 opacity-40 cursor-default';
  switch (day.intensity) {
    case 1:
      return 'bg-emerald-200 hover:bg-emerald-300';
    case 2:
      return 'bg-emerald-400 hover:bg-emerald-500';
    case 3:
      return 'bg-emerald-600 hover:bg-emerald-700';
    case 4:
      return 'bg-emerald-800 hover:bg-emerald-900 shadow-xs';
    default:
      return 'bg-[#F1F5F9] hover:bg-slate-200 border border-[#E2E8F0]/60';
  }
}

function dayTooltip(day) {
  if (day.isFuture) return `${day.date} (Futuro)`;
  if (!day.setsCount) return `${day.date}: Descanso`;
  return `${day.date}: ${day.setsCount} séries (${day.volumeKg} kg)`;
}

function formatDayLabel(dateStr) {
  if (!dateStr || dateStr.length !== 10) return dateStr;
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
</script>
