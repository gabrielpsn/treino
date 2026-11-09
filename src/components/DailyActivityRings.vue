<template>
  <div
    id="widget-daily-activity-rings"
    class="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs text-[#0F172A] flex flex-col md:flex-row items-center gap-4 justify-between"
  >
    <!-- Lado Esquerdo: Título & Anéis Concêntricos -->
    <div class="flex items-center gap-4 w-full md:w-auto">
      <div class="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 flex items-center justify-center">
        <svg
          class="w-full h-full transform -rotate-90"
          viewBox="0 0 140 140"
          aria-label="Anéis de Atividade Diária"
          role="img"
        >
          <!-- Ring 1 (Treino) - Fundo e Progresso -->
          <circle
            cx="70"
            cy="70"
            :r="r1"
            fill="transparent"
            stroke="#0066FF"
            stroke-opacity="0.15"
            stroke-width="9"
          />
          <circle
            id="ring-workout"
            cx="70"
            cy="70"
            :r="r1"
            fill="transparent"
            stroke="#0066FF"
            stroke-width="9"
            stroke-linecap="round"
            :stroke-dasharray="c1"
            :stroke-dashoffset="offset1"
            class="transition-all duration-700 ease-out"
          />

          <!-- Ring 2 (Água) - Fundo e Progresso -->
          <circle
            cx="70"
            cy="70"
            :r="r2"
            fill="transparent"
            stroke="#F59E0B"
            stroke-opacity="0.15"
            stroke-width="9"
          />
          <circle
            id="ring-water"
            cx="70"
            cy="70"
            :r="r2"
            fill="transparent"
            stroke="#F59E0B"
            stroke-width="9"
            stroke-linecap="round"
            :stroke-dasharray="c2"
            :stroke-dashoffset="offset2"
            class="transition-all duration-700 ease-out"
          />

          <!-- Ring 3 (Creatina / Hábitos) - Fundo e Progresso -->
          <circle
            cx="70"
            cy="70"
            :r="r3"
            fill="transparent"
            stroke="#10B981"
            stroke-opacity="0.15"
            stroke-width="9"
          />
          <circle
            id="ring-habits"
            cx="70"
            cy="70"
            :r="r3"
            fill="transparent"
            stroke="#10B981"
            stroke-width="9"
            stroke-linecap="round"
            :stroke-dasharray="c3"
            :stroke-dashoffset="offset3"
            class="transition-all duration-700 ease-out"
          />
        </svg>

        <!-- Ícone Central -->
        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span class="text-xl sm:text-2xl">{{ allRingsClosed ? '🎉' : '🎯' }}</span>
          <span class="text-[9px] font-black uppercase text-[#64748B] tracking-tight">Metas</span>
        </div>
      </div>

      <div class="min-w-0">
        <div class="flex items-center gap-1.5">
          <h4 class="text-xs sm:text-sm font-black text-[#0F172A] uppercase tracking-tight">
            Anéis de Atividade Diária
          </h4>
          <span
            v-if="allRingsClosed"
            class="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
          >
            100% Concluído
          </span>
        </div>
        <p class="text-[11px] text-[#64748B] mt-0.5 leading-tight">
          Feche os 3 anéis todos os dias para manter o ritmo biológico e hipertrófico.
        </p>
      </div>
    </div>

    <!-- Lado Direito: Status dos 3 Anéis em Cards Compactos -->
    <div class="grid grid-cols-3 gap-2 w-full md:w-auto flex-1 max-w-lg">
      <!-- Card Treino (Azul Cobalto) -->
      <div class="p-2.5 rounded-xl bg-[#0066FF]/5 border border-[#0066FF]/20 flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs">🏋️</span>
          <span class="text-[10px] font-black text-[#0066FF]">{{ cleanWorkoutPercent }}%</span>
        </div>
        <div class="mt-1">
          <span class="block text-[9px] font-bold uppercase text-[#64748B] leading-none">Treino</span>
          <span class="text-[11px] font-black text-[#0F172A] truncate block">{{ workoutStatusText }}</span>
        </div>
      </div>

      <!-- Card Água (Âmbar Ouro) -->
      <div class="p-2.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs">💧</span>
          <span class="text-[10px] font-black text-[#B45309]">{{ cleanWaterPercent }}%</span>
        </div>
        <div class="mt-1">
          <span class="block text-[9px] font-bold uppercase text-[#64748B] leading-none">Água</span>
          <span class="text-[11px] font-black text-[#0F172A] truncate block">{{ waterText }}</span>
        </div>
      </div>

      <!-- Card Creatina / Hábitos (Verde Esmeralda) -->
      <div
        class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col justify-between cursor-pointer hover:bg-emerald-500/15 transition-all"
        @click="emit('toggleCreatine')"
        role="button"
        tabindex="0"
        :aria-label="`Creatina: ${creatineTaken ? 'Tomada' : 'Pendente'}. Clique para alternar.`"
        @keydown.enter="emit('toggleCreatine')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs">💊</span>
          <span
            class="text-[9px] font-black px-1.5 py-0.5 rounded-full"
            :class="creatineTaken ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-[#64748B]'"
          >
            {{ creatineTaken ? '✓' : '○' }}
          </span>
        </div>
        <div class="mt-1">
          <span class="block text-[9px] font-bold uppercase text-[#64748B] leading-none">Creatina</span>
          <span class="text-[11px] font-black text-[#0F172A] truncate block">
            {{ creatineTaken ? 'Tomada' : 'Marcar' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  workoutPercent: {
    type: Number,
    default: 0
  },
  workoutStatusText: {
    type: String,
    default: 'Pendente'
  },
  waterPercent: {
    type: Number,
    default: 0
  },
  waterText: {
    type: String,
    default: '0 / 2500 ml'
  },
  creatineTaken: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggleCreatine']);

// Geometria SVG para anéis concêntricos
const r1 = 56;
const r2 = 43;
const r3 = 30;

const c1 = 2 * Math.PI * r1; // ~351.86
const c2 = 2 * Math.PI * r2; // ~270.18
const c3 = 2 * Math.PI * r3; // ~188.50

const cleanWorkoutPercent = computed(() => Math.min(100, Math.max(0, Math.round(props.workoutPercent || 0))));
const cleanWaterPercent = computed(() => Math.min(100, Math.max(0, Math.round(props.waterPercent || 0))));
const habitsPercent = computed(() => (props.creatineTaken ? 100 : 0));

const offset1 = computed(() => c1 - (c1 * cleanWorkoutPercent.value) / 100);
const offset2 = computed(() => c2 - (c2 * cleanWaterPercent.value) / 100);
const offset3 = computed(() => c3 - (c3 * habitsPercent.value) / 100);

const allRingsClosed = computed(() => {
  return cleanWorkoutPercent.value >= 100 && cleanWaterPercent.value >= 100 && props.creatineTaken;
});
</script>
