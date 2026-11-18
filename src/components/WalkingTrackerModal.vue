<template>
  <div
    v-if="isOpen"
    id="walking-tracker-modal"
    role="dialog"
    aria-modal="true"
    aria-label="Rastreador de Caminhada e Passos"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto safe-overlay"
  >
    <div
      class="w-full max-w-lg bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Cabeçalho -->
      <header class="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-[#0066FF]/10 border border-[#0066FF]/20 flex items-center justify-center text-xl">
            🚶
          </div>
          <div>
            <h3 class="text-base font-black text-[#0F172A] tracking-tight">
              Caminhada & Passos de Hoje
            </h3>
            <p class="text-[11px] text-[#64748B]">
              Pedômetro por acelerômetro e rastreamento de quilometragem
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-close-walking-modal"
          class="tap-btn w-9 h-9 rounded-xl border border-[#CBD5E1] bg-white text-[#64748B] hover:text-[#0F172A] flex items-center justify-center text-sm font-bold transition-colors"
          @click="emit('close')"
          aria-label="Fechar rastreador de caminhada"
        >
          ✕
        </button>
      </header>

      <div class="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
        <!-- Resumo Diário Principal -->
        <div class="p-5 rounded-2xl bg-gradient-to-br from-[#F8FAFC] to-white border border-[#E2E8F0] shadow-xs text-center relative overflow-hidden">
          <div class="flex items-center justify-between text-xs text-[#64748B] mb-2">
            <span class="font-bold">Meta Diária: {{ dailyData.goalSteps.toLocaleString('pt-BR') }} passos</span>
            <span
              id="walking-percent-badge"
              class="font-black px-2 py-0.5 rounded-full text-[10px]"
              :class="progressPercent >= 100
                ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
                : 'bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/20'"
            >
              {{ progressPercent }}% Concluído
            </span>
          </div>

          <!-- Contador Gigante de Passos -->
          <div class="my-2">
            <div
              id="display-total-steps"
              class="text-4xl sm:text-5xl font-black text-[#0F172A] tracking-tight transition-transform duration-150 inline-block font-mono"
              :class="{ 'scale-110 text-[#0066FF]': isSteppingPulse }"
            >
              {{ dailyData.steps.toLocaleString('pt-BR') }}
            </div>
            <p class="text-xs font-bold text-[#64748B] uppercase tracking-wider mt-1">
              Passos Dados Hoje
            </p>
          </div>

          <!-- Barra de Progresso da Meta -->
          <div class="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden my-3">
            <div
              id="walking-progress-bar"
              class="h-full bg-gradient-to-r from-[#0066FF] to-emerald-500 transition-all duration-500 rounded-full"
              :style="{ width: `${Math.min(100, progressPercent)}%` }"
            ></div>
          </div>

          <!-- Métricas Complementares: Km e Kcal -->
          <div class="grid grid-cols-2 gap-3 pt-1 text-xs">
            <div class="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
              <span class="block text-[11px] font-bold text-[#64748B] uppercase">Distância Estimada</span>
              <span id="display-total-km" class="text-xl font-black text-[#0066FF] font-mono">
                {{ dailyData.distanceKm.toFixed(2) }} km
              </span>
            </div>
            <div class="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
              <span class="block text-[11px] font-bold text-[#64748B] uppercase">Queima Estimada</span>
              <span id="display-total-kcal" class="text-xl font-black text-amber-600 font-mono">
                {{ dailyData.caloriesKcal }} kcal
              </span>
            </div>
          </div>
        </div>

        <!-- Painel de Sessão de Caminhada Ativa -->
        <div class="p-4 rounded-2xl border transition-all" :class="isWalkActive ? 'bg-blue-50/50 border-[#0066FF]/40 shadow-sm' : 'bg-white border-[#E2E8F0]'">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="text-lg">{{ isWalkActive ? '🟢' : '⏱️' }}</span>
              <h4 class="text-xs font-black uppercase tracking-wider text-[#0F172A]">
                {{ isWalkActive ? 'Caminhada Ativa em Andamento' : 'Sessão de Caminhada em Tempo Real' }}
              </h4>
            </div>

            <div v-if="isWalkActive" class="flex items-center gap-1.5 text-xs font-mono font-black text-[#0066FF]">
              <span class="w-2 h-2 rounded-full bg-[#0066FF] animate-ping"></span>
              {{ formattedWalkElapsed }}
            </div>
          </div>

          <!-- Métricas da Sessão Ativa -->
          <div v-if="isWalkActive" class="grid grid-cols-3 gap-2 text-center my-3">
            <div class="p-2.5 rounded-xl bg-white border border-[#0066FF]/20 shadow-2xs">
              <span class="block text-[10px] font-bold text-[#64748B] uppercase">Sessão</span>
              <span class="text-base font-black text-[#0F172A] font-mono">
                {{ sessionSteps }}
              </span>
              <span class="text-[9px] text-[#64748B] block">passos</span>
            </div>
            <div class="p-2.5 rounded-xl bg-white border border-[#0066FF]/20 shadow-2xs">
              <span class="block text-[10px] font-bold text-[#64748B] uppercase">Distância</span>
              <span class="text-base font-black text-[#0066FF] font-mono">
                {{ sessionDistanceKm.toFixed(2) }}
              </span>
              <span class="text-[9px] text-[#64748B] block">km</span>
            </div>
            <div class="p-2.5 rounded-xl bg-white border border-[#0066FF]/20 shadow-2xs">
              <span class="block text-[10px] font-bold text-[#64748B] uppercase">Ritmo Médio</span>
              <span class="text-base font-black text-emerald-600 font-mono">
                {{ averagePaceMinKm }}
              </span>
              <span class="text-[9px] text-[#64748B] block">min/km</span>
            </div>
          </div>

          <!-- Botões de Controle de Caminhada -->
          <div class="space-y-2">
            <div v-if="!isWalkActive" class="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                id="btn-start-walking"
                @click="startWalkingSession"
                class="tap-btn flex-1 py-3 px-4 rounded-xl text-xs font-black bg-[#0066FF] text-white hover:bg-[#0052cc] shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>▶ Iniciar Caminhada com Celular</span>
              </button>
            </div>

            <div v-else class="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-pause-walking"
                @click="togglePauseWalking"
                class="tap-btn py-3 px-3 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1.5"
                :class="isPaused
                  ? 'bg-emerald-500 text-white border-emerald-600'
                  : 'bg-white border-[#CBD5E1] text-[#0F172A] hover:bg-[#F8FAFC]'"
              >
                <span>{{ isPaused ? '▶ Retomar' : '⏸ Pausar' }}</span>
              </button>

              <button
                type="button"
                id="btn-finish-walking"
                @click="finishWalkingSession"
                class="tap-btn py-3 px-3 rounded-xl text-xs font-black bg-[#0066FF] text-white hover:bg-[#0052cc] shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>🏁 Concluir Sessão</span>
              </button>
            </div>
          </div>

          <p
            v-if="backgroundNotice"
            id="walking-background-notice"
            role="status"
            class="mt-2.5 text-[11px] font-semibold rounded-xl p-2.5 bg-amber-50 border border-amber-200 text-amber-900 leading-relaxed"
          >
            {{ backgroundNotice }}
          </p>

          <div id="walking-background-tip" class="mt-2.5 text-[11px] text-[#475569] leading-relaxed rounded-xl bg-white border border-[#E2E8F0] p-2.5 space-y-1">
            <p><strong>📱 Para contar todos os passos:</strong> deixe o app aberto e o celular no bolso.
              <template v-if="isWalkActive && hasWakeLock"> A tela vai ficar ligada sozinha durante a caminhada 🔆.</template>
            </p>
            <p>Se você minimizar o app ou bloquear a tela, o celular pausa a contagem (limite do sistema para apps instalados pelo navegador). Ao voltar, estimamos os passos desse intervalo pelo GPS.</p>
          </div>
        </div>

        <!-- Ajuste Rápido de Passos (Manual / Esteira) -->
        <div class="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-black uppercase tracking-wider text-[#0F172A]">
              Adicionar Passos Rapidamente
            </h4>
            <span class="text-[10px] text-[#64748B]">Esteira ou smartwatch</span>
          </div>

          <form class="flex gap-2" @submit.prevent="addTypedSteps">
            <input
              id="input-manual-steps"
              v-model="manualStepsInput"
              type="number"
              inputmode="numeric"
              min="1"
              max="60000"
              placeholder="Passos do app Saúde / Google Fit"
              aria-label="Quantidade de passos para somar"
              class="flex-1 min-w-0 rounded-xl border-2 border-[#CBD5E1] px-3 py-2 text-sm"
            />
            <button id="btn-add-typed-steps" type="submit" class="tap-btn px-4 rounded-xl bg-[#0066FF] text-white text-xs font-black">Somar</button>
          </form>

          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              id="btn-add-500-steps"
              @click="addManualSteps(500)"
              class="tap-btn py-2 px-2 rounded-xl text-xs font-bold bg-white border border-[#CBD5E1] text-[#0F172A] hover:border-[#0066FF] hover:text-[#0066FF] shadow-2xs transition-all text-center"
            >
              +500 <span class="text-[10px] text-[#64748B] block font-normal">(~0.35 km)</span>
            </button>
            <button
              type="button"
              id="btn-add-1000-steps"
              @click="addManualSteps(1000)"
              class="tap-btn py-2 px-2 rounded-xl text-xs font-bold bg-white border border-[#CBD5E1] text-[#0F172A] hover:border-[#0066FF] hover:text-[#0066FF] shadow-2xs transition-all text-center"
            >
              +1.000 <span class="text-[10px] text-[#64748B] block font-normal">(~0.70 km)</span>
            </button>
            <button
              type="button"
              id="btn-add-2000-steps"
              @click="addManualSteps(2000)"
              class="tap-btn py-2 px-2 rounded-xl text-xs font-bold bg-white border border-[#CBD5E1] text-[#0F172A] hover:border-[#0066FF] hover:text-[#0066FF] shadow-2xs transition-all text-center"
            >
              +2.000 <span class="text-[10px] text-[#64748B] block font-normal">(~1.41 km)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import confetti from 'canvas-confetti';
import {
  calculateStrideLength,
  stepsToKilometers,
  estimateWalkingCalories,
  createStepDetector,
  requestDeviceMotionPermission,
  loadDailyWalkingData,
  saveDailyWalkingData,
  calculateHaversineDistanceKm,
  estimateStepsForGap,
  activeElapsedSeconds,
  requestScreenWakeLock
} from '../engine/walkingTracker';
import { formatElapsed } from '../engine/sessionMode';
import { playPlateClick, playPrFanfare, triggerHaptic, speakCoachMessage } from '../engine/audioHaptics';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  userHeightCm: {
    type: [Number, String],
    default: 170
  },
  userWeightKg: {
    type: [Number, String],
    default: 70
  },
  todayDateStr: {
    type: String,
    default: () => new Date().toISOString().slice(0, 10)
  }
});

const emit = defineEmits(['close', 'goal-reached', 'steps-updated', 'active-changed']);

const dailyData = ref(loadDailyWalkingData(props.todayDateStr));

// Sessão de Caminhada Ativa
const isWalkActive = ref(false);
const isPaused = ref(false);
const sessionSteps = ref(0);
const sessionStartTimestamp = ref(null);
const elapsedSeconds = ref(0);
const isSteppingPulse = ref(false);
let sessionTimer = null;
let lastGpsCoords = null;
let gpsWatchId = null;
// Tempo por relógio: o setInterval para em segundo plano, Date.now() não.
let pausedMs = 0;
let pausedSince = null;
// Segundo plano: onde e quando o app foi minimizado.
let hiddenAt = null;
let hiddenCoords = null;
let wakeLock = null;
const backgroundNotice = ref('');
const manualStepsInput = ref('');
const hasWakeLock = ref(false);

// Detector de passos
let stepDetector = null;

const progressPercent = computed(() => {
  const goal = dailyData.value.goalSteps || 8000;
  return Math.min(100, Math.round((dailyData.value.steps / goal) * 100));
});

const sessionDistanceKm = computed(() => {
  return stepsToKilometers(sessionSteps.value, props.userHeightCm);
});

const formattedWalkElapsed = computed(() => {
  return formatElapsed(elapsedSeconds.value * 1000);
});

const averagePaceMinKm = computed(() => {
  const km = sessionDistanceKm.value;
  if (km <= 0.05 || elapsedSeconds.value <= 10) return '--\'--"';
  const paceSeconds = Math.round(elapsedSeconds.value / km);
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = paceSeconds % 60;
  return `${String(minutes).padStart(2, '0')}'${String(seconds).padStart(2, '0')}"`;
});

function handleStepDetected() {
  if (isPaused.value) return;

  sessionSteps.value += 1;
  dailyData.value.steps += 1;

  // Atualiza distância e calorias recalculadas
  dailyData.value.distanceKm = stepsToKilometers(dailyData.value.steps, props.userHeightCm);
  dailyData.value.caloriesKcal = estimateWalkingCalories(
    dailyData.value.steps,
    props.userWeightKg,
    props.userHeightCm
  );

  saveDailyWalkingData(props.todayDateStr, dailyData.value);
  emit('steps-updated', dailyData.value);

  // Pulso visual sutil e haptic
  isSteppingPulse.value = true;
  setTimeout(() => {
    isSteppingPulse.value = false;
  }, 120);

  // Alerta de cada 1000 passos na sessão
  if (sessionSteps.value > 0 && sessionSteps.value % 1000 === 0) {
    triggerHaptic('click');
    speakCoachMessage(
      'start',
      `Mais mil passos concluídos! Total da sessão: ${sessionSteps.value} passos.`
    );
  }

  // Verifica se bateu a meta diária durante a caminhada
  checkGoalAchievement();
}

function addStepsToSession(count) {
  if (count <= 0) return;
  sessionSteps.value += count;
  dailyData.value.steps += count;
  dailyData.value.distanceKm = stepsToKilometers(dailyData.value.steps, props.userHeightCm);
  dailyData.value.caloriesKcal = estimateWalkingCalories(dailyData.value.steps, props.userWeightKg, props.userHeightCm);
  saveDailyWalkingData(props.todayDateStr, dailyData.value);
  emit('steps-updated', dailyData.value);
  checkGoalAchievement();
}

function currentPosition(timeout = 8000) {
  return new Promise(resolve => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos.coords.accuracy && pos.coords.accuracy > 60 ? null : { lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, maximumAge: 0, timeout }
    );
  });
}

async function acquireWakeLock() {
  if (wakeLock) return;
  wakeLock = await requestScreenWakeLock();
  hasWakeLock.value = !!wakeLock;
  wakeLock?.addEventListener?.('release', () => {
    wakeLock = null;
    hasWakeLock.value = false;
  });
}

function releaseWakeLock() {
  wakeLock?.release?.().catch?.(() => {});
  wakeLock = null;
  hasWakeLock.value = false;
}

// Intervalo minimizado aguardando a primeira posição de GPS após voltar.
let pendingGap = null;
let pendingGapTimer = null;

function resolvePendingGap(to) {
  if (!pendingGap) return;
  const { from, gapSeconds } = pendingGap;
  pendingGap = null;
  clearTimeout(pendingGapTimer);
  const minutes = Math.max(1, Math.round(gapSeconds / 60));
  if (!to) {
    backgroundNotice.value = `O app ficou minimizado por ${minutes} min e o GPS não respondeu para estimar os passos desse intervalo.`;
    return;
  }
  const distanceKm = calculateHaversineDistanceKm(from.lat, from.lon, to.lat, to.lon);
  const estimate = estimateStepsForGap({ distanceKm, gapSeconds, heightCm: props.userHeightCm });
  if (estimate.steps > 0) {
    addStepsToSession(estimate.steps);
    backgroundNotice.value = `Enquanto o app esteve minimizado (${minutes} min), estimamos +${estimate.steps.toLocaleString('pt-BR')} passos pela distância do GPS.`;
  } else if (estimate.reason === 'too_fast') {
    backgroundNotice.value = 'Você se deslocou rápido demais para ser caminhada enquanto o app estava minimizado (carro ou ônibus?). Esse trecho não foi contado.';
  } else {
    backgroundNotice.value = `O app ficou minimizado por ${minutes} min sem deslocamento detectado.`;
  }
}

function handleVisibilityChange() {
  if (!isWalkActive.value) return;
  if (document.visibilityState === 'hidden') {
    hiddenAt = Date.now();
    hiddenCoords = lastGpsCoords;
    return;
  }

  // Voltou para o app: o wake lock é liberado pelo sistema ao minimizar.
  acquireWakeLock();
  if (!hiddenAt) return;
  const gapSeconds = Math.round((Date.now() - hiddenAt) / 1000);
  const from = hiddenCoords;
  hiddenAt = null;
  hiddenCoords = null;
  if (isPaused.value || gapSeconds < 20) return;

  if (!from) {
    const minutes = Math.max(1, Math.round(gapSeconds / 60));
    backgroundNotice.value = `O app ficou minimizado por ${minutes} min e o celular pausou a contagem. Sem GPS não deu para estimar: some os passos do app Saúde/Google Fit abaixo, se quiser.`;
    return;
  }

  // A primeira posição nova vence: a do pedido direto ou a do watchPosition.
  pendingGap = { from, gapSeconds };
  clearTimeout(pendingGapTimer);
  pendingGapTimer = setTimeout(() => resolvePendingGap(null), 15000);
  currentPosition().then(to => { if (to) resolvePendingGap(to); });
}

function checkGoalAchievement() {
  if (dailyData.value.steps >= dailyData.value.goalSteps) {
    emit('goal-reached', {
      date: props.todayDateStr,
      steps: dailyData.value.steps
    });
  }
}

function handleDeviceMotion(event) {
  if (!isWalkActive.value || isPaused.value || !stepDetector) return;

  const acc = event.acceleration || event.accelerationIncludingGravity;
  if (!acc) return;

  stepDetector.processAcceleration(acc.x || 0, acc.y || 0, acc.z || 0);
}

async function startWalkingSession() {
  const hasPermission = await requestDeviceMotionPermission();
  isWalkActive.value = true;
  isPaused.value = false;
  sessionSteps.value = 0;
  elapsedSeconds.value = 0;
  sessionStartTimestamp.value = Date.now();
  pausedMs = 0;
  pausedSince = null;
  backgroundNotice.value = '';

  stepDetector = createStepDetector({
    onStep: handleStepDetected
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }
  acquireWakeLock();
  emit('active-changed', true);

  // Inicia rastreamento por GPS se disponível para refinar distância
  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    try {
      gpsWatchId = navigator.geolocation.watchPosition(
        position => {
          if (!isWalkActive.value || isPaused.value) return;
          const { latitude, longitude, accuracy } = position.coords;
          if (accuracy && accuracy <= 35) {
            if (pendingGap) {
              const to = { lat: latitude, lon: longitude };
              resolvePendingGap(to);
              lastGpsCoords = to;
              return;
            }
            if (lastGpsCoords) {
              const deltaKm = calculateHaversineDistanceKm(
                lastGpsCoords.lat,
                lastGpsCoords.lon,
                latitude,
                longitude
              );
              // Ignora pequenas oscilações de GPS menores que 4 metros
              if (deltaKm >= 0.004) {
                dailyData.value.distanceKm =
                  Math.round((dailyData.value.distanceKm + deltaKm) * 100) / 100;
                saveDailyWalkingData(props.todayDateStr, dailyData.value);
              }
            }
            lastGpsCoords = { lat: latitude, lon: longitude };
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    } catch {
      // GPS indisponível, mantém cálculo por pedômetro
    }
  }

  clearInterval(sessionTimer);
  sessionTimer = setInterval(() => {
    elapsedSeconds.value = activeElapsedSeconds({
      startedAt: sessionStartTimestamp.value,
      pausedMs,
      pausedSince
    });
  }, 1000);

  triggerHaptic('click');
  speakCoachMessage(
    'start',
    'Caminhada iniciada! Mantenha a postura ereta e o ritmo constante.'
  );
}

function togglePauseWalking() {
  isPaused.value = !isPaused.value;
  if (isPaused.value) {
    pausedSince = Date.now();
  } else if (pausedSince) {
    pausedMs += Date.now() - pausedSince;
    pausedSince = null;
  }
  triggerHaptic('click');
  if (isPaused.value) {
    speakCoachMessage('start', 'Caminhada pausada.');
  } else {
    speakCoachMessage('start', 'Caminhada retomada! Em frente.');
  }
}

function finishWalkingSession() {
  elapsedSeconds.value = activeElapsedSeconds({ startedAt: sessionStartTimestamp.value, pausedMs, pausedSince });
  stopSensors();
  isWalkActive.value = false;
  isPaused.value = false;
  emit('active-changed', false);

  dailyData.value.activeMinutes += Math.round(elapsedSeconds.value / 60);
  saveDailyWalkingData(props.todayDateStr, dailyData.value);
  emit('steps-updated', dailyData.value);

  playPlateClick();
  triggerHaptic('celebrate');
  speakCoachMessage(
    'finish',
    `Caminhada concluída! Você deu ${sessionSteps.value} passos e percorreu ${sessionDistanceKm.value} quilômetros.`
  );
}

function stopSensors() {
  if (typeof window !== 'undefined') {
    window.removeEventListener('devicemotion', handleDeviceMotion);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  }
  releaseWakeLock();
  hiddenAt = null;
  hiddenCoords = null;
  pendingGap = null;
  clearTimeout(pendingGapTimer);
  if (typeof navigator !== 'undefined' && 'geolocation' in navigator && gpsWatchId !== null) {
    navigator.geolocation.clearWatch(gpsWatchId);
    gpsWatchId = null;
  }
  lastGpsCoords = null;
  clearInterval(sessionTimer);
  sessionTimer = null;
  if (stepDetector) {
    stepDetector.reset();
  }
}

function addTypedSteps() {
  const value = Math.round(Number(String(manualStepsInput.value).replace(/\D/g, '')));
  if (!Number.isFinite(value) || value <= 0 || value > 60000) return;
  addManualSteps(value);
  manualStepsInput.value = '';
}

function addManualSteps(amount) {
  const stepsToAdd = Math.max(0, Number(amount) || 0);
  dailyData.value.steps += stepsToAdd;
  dailyData.value.distanceKm = stepsToKilometers(dailyData.value.steps, props.userHeightCm);
  dailyData.value.caloriesKcal = estimateWalkingCalories(
    dailyData.value.steps,
    props.userWeightKg,
    props.userHeightCm
  );

  saveDailyWalkingData(props.todayDateStr, dailyData.value);
  emit('steps-updated', dailyData.value);

  playPlateClick();
  triggerHaptic('click');

  if (dailyData.value.steps >= dailyData.value.goalSteps) {
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 }
    });
    playPrFanfare();
    checkGoalAchievement();
  }
}

watch(
  () => props.todayDateStr,
  newDate => {
    dailyData.value = loadDailyWalkingData(newDate);
  }
);

watch(
  () => props.isOpen,
  isOpen => {
    // Fechar o modal NÃO encerra a caminhada: ela segue enquanto o app estiver
    // aberto, e o resumo na tela inicial mostra que está em andamento.
    if (isOpen && !isWalkActive.value) {
      dailyData.value = loadDailyWalkingData(props.todayDateStr);
    }
  }
);

onBeforeUnmount(() => {
  stopSensors();
});
</script>
