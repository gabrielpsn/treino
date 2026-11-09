<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop com Blur -->
    <div
      id="wrapped-backdrop"
      class="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
      @click="emit('close')"
      aria-hidden="true"
    ></div>

    <!-- Modal Card (Wrapped Estilo Cartão Cyberpunk / Ouro) -->
    <div
      id="modal-career-wrapped"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wrapped-title"
      class="relative w-full max-w-lg bg-gradient-to-b from-[#0B132B] via-[#080914] to-[#04050A] text-white border border-[#0066FF]/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-5 animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Topo: Logo & Badge Wrapped -->
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div class="flex items-center gap-2.5">
          <span class="text-2xl">✨</span>
          <div>
            <h3 id="wrapped-title" class="text-base sm:text-lg font-black tracking-tight uppercase text-white">
              Overload AI • Retrospectiva
            </h3>
            <p class="text-xs text-white/60">Sua jornada de evolução mecânica consolidada</p>
          </div>
        </div>

        <button
          type="button"
          id="btn-close-wrapped"
          @click="emit('close')"
          aria-label="Fechar Retrospectiva"
          class="tap-btn p-2 rounded-xl text-white/60 hover:text-white bg-white/10 hover:bg-white/20 transition-colors"
        >
          ✕
        </button>
      </div>

      <!-- Slide 1: Tonelagem Mecânica Total -->
      <div class="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1 relative overflow-hidden">
        <div class="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-[#0066FF]/20 blur-xl pointer-events-none"></div>
        <span class="text-[10px] font-bold uppercase tracking-widest text-[#38BDF8]">
          Volume Total Erguido na Carreira
        </span>
        <div class="text-3xl sm:text-4xl font-black text-[#F59E0B]">
          {{ wrappedData.totalTonnageKg.toLocaleString('pt-BR') }} <span class="text-base text-white/70">kg</span>
        </div>
        <p class="text-xs text-white/90 font-bold pt-1">
          ⚡ {{ wrappedData.realWorldEquivalence }}
        </p>
      </div>

      <!-- Slide 2: Grid de Séries, Repetições e Sessões -->
      <div class="grid grid-cols-3 gap-2 text-center">
        <div class="p-3 rounded-xl bg-white/5 border border-white/10">
          <span class="block text-[9px] font-bold uppercase text-white/60">Treinos</span>
          <span class="text-lg font-black text-white">{{ wrappedData.totalSessions }}</span>
        </div>
        <div class="p-3 rounded-xl bg-white/5 border border-white/10">
          <span class="block text-[9px] font-bold uppercase text-white/60">Séries</span>
          <span class="text-lg font-black text-white">{{ wrappedData.totalSets }}</span>
        </div>
        <div class="p-3 rounded-xl bg-white/5 border border-white/10">
          <span class="block text-[9px] font-bold uppercase text-white/60">Repetições</span>
          <span class="text-lg font-black text-[#F59E0B]">{{ wrappedData.totalReps }}</span>
        </div>
      </div>

      <!-- Slide 3: Força Máxima & Consistência -->
      <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
        <div class="flex items-center justify-between">
          <span class="text-white/60">Maior Carga Levantada:</span>
          <span class="font-black text-[#F59E0B]">{{ wrappedData.heaviestWeightKg }} kg</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-white/60">Sequência Máxima de Dias:</span>
          <span class="font-black text-white">🔥 {{ wrappedData.maxStreak }} dias</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-white/60">Moedas de Ferro Acumuladas:</span>
          <span class="font-black text-amber-400">🪙 {{ wrappedData.ironCoins }}</span>
        </div>
      </div>

      <!-- Frase de Impacto -->
      <p class="text-center text-xs text-white/80 italic">
        "O ferro nunca mente. Cada quilo erguido moldou a sua versão mais forte."
      </p>

      <!-- Botão Fechar -->
      <div>
        <button
          type="button"
          id="btn-confirm-wrapped"
          @click="emit('close')"
          class="tap-btn w-full py-3 px-4 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-black text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>Continuar Jornada</span>
          <span>→</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { calculateCareerWrapped } from '../engine/gamification.js';

const props = defineProps({
  isOpen: Boolean,
  historySessions: {
    type: Array,
    default: () => []
  },
  gamificationState: {
    type: Object,
    default: () => ({})
  },
  userProfile: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['close']);

const wrappedData = computed(() => {
  return calculateCareerWrapped({
    historySessions: props.historySessions,
    gamificationState: props.gamificationState,
    userProfile: props.userProfile
  });
});
</script>
