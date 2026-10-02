<template>
  <div
    v-if="isActive"
    id="rest-timer"
    role="timer"
    aria-live="off"
    :aria-label="`Descanso entre séries: ${timeLeft} segundos restantes`"
    class="fixed bottom-6 right-6 z-40 bg-slate-900 border border-amber-500/40 rounded-2xl p-4 shadow-2xl flex items-center gap-4 max-w-xs"
  >
    <div class="relative w-12 h-12 flex items-center justify-center">
      <svg class="w-12 h-12 transform -rotate-90" aria-hidden="true">
        <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="4" class="text-slate-800" fill="transparent" />
        <circle 
          cx="24" 
          cy="24" 
          r="20" 
          stroke="currentColor" 
          stroke-width="4" 
          class="text-amber-500 transition-all duration-1000 ease-linear" 
          fill="transparent" 
          :stroke-dasharray="circumference" 
          :stroke-dashoffset="strokeDashoffset" 
        />
      </svg>
      <span class="absolute text-xs font-black text-amber-400 font-mono">{{ timeLeft }}s</span>
    </div>

    <div>
      <h5 class="text-xs font-bold text-white uppercase tracking-wider">Descanso Entre Séries</h5>
      <p class="text-xs text-slate-400">Recupere o ATP-CP para a próxima carga</p>
    </div>

    <button
      type="button"
      id="btn-rest-timer-stop"
      aria-label="Encerrar o cronômetro de descanso"
      @click="stopTimer"
      class="text-slate-400 hover:text-white p-1 rounded-lg"
    >
      <span aria-hidden="true">✕</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';

const isActive = ref(false);
const totalTime = ref(60);
const timeLeft = ref(60);
let timerInterval = null;

const radius = 20;
const circumference = 2 * Math.PI * radius;

const strokeDashoffset = computed(() => {
  return circumference - (timeLeft.value / totalTime.value) * circumference;
});

// Valores como "Contínuo" viram NaN no parseInt; o fallback evita um anel quebrado.
function parseSeconds(rest) {
  const parsed = parseInt(rest, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 60;
  return Math.min(parsed, 600);
}

function startTimer(seconds = 60) {
  const safeSeconds = parseSeconds(seconds);
  if (timerInterval) clearInterval(timerInterval);

  totalTime.value = safeSeconds;
  timeLeft.value = safeSeconds;
  isActive.value = true;

  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
      return;
    }
    stopTimer();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  isActive.value = false;
}

// Sem isto o interval continua rodando se o componente for desmontado durante
// o descanso, vazando o timer no browser.
onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
});

defineExpose({
  startTimer,
  stopTimer
});
</script>