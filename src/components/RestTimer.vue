<template>
  <div
    v-if="isActive"
    id="rest-timer"
    role="timer"
    aria-live="off"
    :aria-label="`Descanso entre séries: ${timeLeft} segundos restantes`"
    class="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xl flex items-center gap-4 max-w-xs text-[#0F172A]"
  >
    <div class="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
      <svg class="w-12 h-12 transform -rotate-90" aria-hidden="true">
        <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="4" class="text-[#F1F5F9]" fill="transparent" />
        <circle 
          cx="24" 
          cy="24" 
          r="20" 
          stroke="currentColor" 
          stroke-width="4" 
          class="transition-all duration-1000 ease-linear"
          :class="timeLeft <= 10 && timeLeft > 0 ? 'text-rose-500 animate-pulse' : 'text-[#F59E0B]'" 
          fill="transparent" 
          :stroke-dasharray="circumference" 
          :stroke-dashoffset="strokeDashoffset" 
        />
      </svg>
      <span class="absolute text-xs font-black font-mono" :class="timeLeft <= 10 && timeLeft > 0 ? 'text-rose-600' : 'text-[#0F172A]'">{{ timeLeft }}s</span>
    </div>

    <div>
      <h5 class="text-xs font-black uppercase tracking-wider flex items-center gap-1" :class="timeLeft <= 10 && timeLeft > 0 ? 'text-rose-600' : 'text-[#0F172A]'">
        <span v-if="timeLeft <= 10 && timeLeft > 0">⚡</span>
        <span>Descanso Entre Séries</span>
      </h5>
      <p v-if="timeLeft <= 10 && timeLeft > 0" class="text-[11px] font-black text-rose-600 animate-pulse">
        Atenção: 10s para a próxima série!
      </p>
      <p v-else class="text-xs text-[#64748B]">Recupere o ATP-CP para a próxima carga</p>
      <div class="flex items-center gap-1.5 mt-1">
        <button
          type="button"
          id="btn-rest-timer-minus-15"
          class="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#0F172A] transition-colors"
          @click="adjustTime(-15)"
          title="Reduzir 15 segundos"
        >
          -15s
        </button>
        <button
          type="button"
          id="btn-rest-timer-plus-15"
          class="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#0F172A] transition-colors"
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
      class="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors"
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
      if (timeLeft.value === 10) {
        playWarningBeep();
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([60, 40, 60]);
        }
      }
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

function playWarningBeep() {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // Ignora se o navegador restringir áudio automático
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
