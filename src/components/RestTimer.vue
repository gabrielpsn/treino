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
      <div class="flex items-center gap-1.5 mt-1">
        <button
          type="button"
          id="btn-rest-timer-minus-15"
          class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          @click="adjustTime(-15)"
          title="Reduzir 15 segundos"
        >
          -15s
        </button>
        <button
          type="button"
          id="btn-rest-timer-plus-15"
          class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          @click="adjustTime(15)"
          title="Adicionar 15 segundos"
        >
          +15s
        </button>
      </div>
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
    playBeep();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  }, 1000);
}

function adjustTime(deltaSeconds) {
  const next = Math.max(5, Math.min(600, timeLeft.value + deltaSeconds));
  timeLeft.value = next;
  if (next > totalTime.value) {
    totalTime.value = next;
  }
}

function playBeep() {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Ignora se o navegador restringir áudio automático
  }
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
  stopTimer,
  adjustTime
});
</script>