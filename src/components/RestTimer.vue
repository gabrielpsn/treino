<template>
  <div v-if="isActive" class="fixed bottom-6 right-6 z-40 bg-slate-900 border border-amber-500/40 rounded-2xl p-4 shadow-2xl flex items-center gap-4 max-w-xs animate-bounce-slow">
    <div class="relative w-12 h-12 flex items-center justify-center">
      <svg class="w-12 h-12 transform -rotate-90">
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

    <button @click="stopTimer" class="text-slate-400 hover:text-white p-1 rounded-lg">
      ✕
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const isActive = ref(false);
const totalTime = ref(60);
const timeLeft = ref(60);
let timerInterval = null;

const radius = 20;
const circumference = 2 * Math.PI * radius;

const strokeDashoffset = computed(() => {
  return circumference - (timeLeft.value / totalTime.value) * circumference;
});

function startTimer(seconds = 60) {
  if (timerInterval) clearInterval(timerInterval);
  totalTime.value = seconds;
  timeLeft.value = seconds;
  isActive.value = true;

  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
    } else {
      stopTimer();
      // Notificação sonora / vibração sutil se suportado no navegador mobile
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  isActive.value = false;
}

defineExpose({
  startTimer,
  stopTimer
});
</script>
