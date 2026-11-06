<template>
  <div
    id="widget-iron-status"
    class="p-3 sm:p-3.5 rounded-2xl bg-[#ECEEFE] border border-[#DCE2FE] text-[#1E293B] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
  >
    <!-- Lado Esquerdo: Patente, Nível e Barra de XP -->
    <div class="flex items-center gap-3 min-w-0 flex-1">
      <!-- Ícone da Patente -->
      <div
        class="w-11 h-11 rounded-xl bg-white border border-[#DCE2FE] flex items-center justify-center text-2xl shadow-xs flex-shrink-0"
        :title="`Patente: ${levelData.patent}`"
      >
        <span>{{ levelData.patentIcon }}</span>
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs font-black tracking-tight text-[#007BFF] uppercase">
            {{ levelData.patent }}
          </span>
          <span class="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FBBF04] text-[#1E293B] shadow-xs">
            Nv. {{ levelData.level }}
          </span>
        </div>

        <!-- Barra de Progresso de XP -->
        <div class="mt-1.5 flex items-center gap-2">
          <div class="flex-1 bg-white h-2 rounded-full overflow-hidden border border-[#DCE2FE]" role="progressbar" :aria-valuenow="levelData.progressPercent" aria-valuemin="0" aria-valuemax="100">
            <div
              class="h-full bg-gradient-to-r from-[#FBBF04] to-[#f5a623] transition-all duration-500 rounded-full"
              :style="{ width: `${levelData.progressPercent}%` }"
            ></div>
          </div>
          <span class="text-[10px] font-bold text-[#64748B] flex-shrink-0">
            {{ levelData.progressPercent }}%
          </span>
        </div>

        <p class="text-[10px] text-[#64748B] mt-0.5">
          {{ levelData.xpIntoCurrentLevel }} / {{ levelData.costForNextLevel }} XP • 
          <span class="font-semibold text-[#1E293B]">Total: {{ levelData.totalXp }} XP</span>
        </p>
      </div>
    </div>

    <!-- Lado Direito: Ofensiva Semanal (Streak) e Escudos -->
    <div class="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-[#DCE2FE] pt-2 sm:pt-0 sm:pl-3 flex-shrink-0">
      <!-- Sequência Semanal -->
      <div
        id="badge-weekly-streak"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-[#DCE2FE] shadow-xs"
        title="Semanas consecutivas cumprindo a meta de treinos"
      >
        <span class="text-sm">🔥</span>
        <div class="text-left">
          <span class="block text-[9px] font-bold uppercase text-[#64748B] leading-none">Ofensiva</span>
          <span class="text-xs font-black text-[#1E293B] leading-none">{{ streak }} sem</span>
        </div>
      </div>

      <!-- Escudos de Deload -->
      <div
        id="badge-deload-shields"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-[#DCE2FE] shadow-xs"
        title="Escudos de recuperação para não perder a sequência em semanas de descanso/deload"
      >
        <span class="text-sm">🛡️</span>
        <div class="text-left">
          <span class="block text-[9px] font-bold uppercase text-[#64748B] leading-none">Escudos</span>
          <span class="text-xs font-black text-[#1E293B] leading-none">{{ shields }}/2</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { calculateLevelFromXp } from '../engine/gamification.js';

const props = defineProps({
  totalXp: {
    type: Number,
    default: 0
  },
  streak: {
    type: Number,
    default: 0
  },
  shields: {
    type: Number,
    default: 1
  }
});

const levelData = computed(() => calculateLevelFromXp(props.totalXp));
</script>
