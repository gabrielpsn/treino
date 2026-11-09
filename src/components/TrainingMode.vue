<template>
  <div
    v-if="split"
    id="training-mode"
    role="dialog"
    aria-modal="true"
    aria-label="Modo Treino"
    class="fixed inset-0 z-30 bg-[#F8FAFC] flex flex-col text-[#0F172A]"
  >
    <!-- Topo: saída, identificação da ficha, cronômetro da sessão e progresso -->
    <header class="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#E2E8F0] bg-white flex-shrink-0 shadow-xs">
      <button
        type="button"
        id="btn-exit-training-mode"
        aria-label="Sair do modo treino"
        class="tap-btn w-11 h-11 rounded-xl border border-[#CBD5E1] bg-white text-[#0F172A] hover:bg-[#F8FAFC] text-sm font-bold flex items-center justify-center transition-colors"
        @click="$emit('close')"
      >
        ✕
      </button>

      <div class="text-center min-w-0">
        <p class="text-[10px] uppercase tracking-widest text-[#0066FF] font-black">Modo Treino</p>
        <p class="text-xs font-black text-[#0F172A] truncate max-w-[40vw]">{{ split.title }}</p>
      </div>

      <div class="text-right">
        <p
          id="training-timer"
          role="timer"
          aria-label="Tempo de treino decorrido"
          class="font-mono text-lg font-black text-[#0066FF] leading-none"
        >
          {{ formattedElapsed }}
        </p>
        <p id="training-progress" class="text-[11px] text-[#64748B] mt-1">{{ queue.doneCount }}/{{ queue.totalCount }} concluídos</p>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      <!-- Foco atual: o app conduz a pessoa de um exercício pendente ao próximo -->
      <section
        v-if="focusExercise"
        class="p-4 sm:p-5 rounded-2xl border border-[#0066FF]/30 bg-white shadow-sm space-y-3"
      >
        <div>
          <div class="flex items-center justify-between gap-2">
            <p class="text-[10px] uppercase tracking-widest text-[#0066FF] font-black">Exercício atual</p>
            <span
              v-if="focusExercise.muscle"
              :class="getMuscleBadgeClass(focusExercise.muscle)"
              class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="getMuscleDotColor(focusExercise.muscle)"></span>
              {{ MUSCLE_LABELS[focusExercise.muscle] || focusExercise.muscle }}
            </span>
          </div>
          <h2 class="text-lg font-black text-[#0F172A] leading-tight">{{ focusExercise.name }}</h2>
          <p class="text-xs text-[#64748B] mt-0.5">
            {{ focusExercise.defaultSeries }}
            <template v-if="focusExercise.aiReps"> • {{ focusExercise.aiReps }} reps</template>
            • Descanso: {{ focusExercise.rest }}
          </p>
          <p v-if="focusExercise.tips" class="text-[11px] text-[#64748B] italic mt-1">💡 {{ focusExercise.tips }}</p>
        </div>

        <div v-if="focusExercise.muscle !== 'cardio'" class="space-y-3">
          <!-- Abas de Séries do Exercício Atual -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              v-for="s in focusSets"
              :key="s.setNumber"
              type="button"
              :id="`btn-training-set-${s.setNumber}`"
              @click="activeSetNumber = s.setNumber"
              :class="activeSetNumber === s.setNumber
                ? 'bg-[#0066FF] text-white font-black shadow-xs'
                : (s.isDone ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] hover:text-[#0F172A]')"
              class="px-2.5 py-1 rounded-lg text-xs transition-colors flex items-center gap-1 flex-shrink-0"
            >
              <span>Série {{ s.setNumber }}</span>
              <span v-if="s.isDone" class="text-[10px]" :class="activeSetNumber === s.setNumber ? 'text-white font-bold' : 'text-emerald-600 font-bold'">✓</span>
            </button>
            <button
              type="button"
              id="btn-training-add-set"
              @click="$emit('add-set', focusExercise.id)"
              class="px-2 py-1 rounded-lg text-xs font-bold border border-[#CBD5E1] bg-white text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors flex-shrink-0"
              title="Adicionar mais uma série"
            >
              + Série
            </button>
          </div>

          <div class="flex gap-3">
            <div class="flex items-center gap-2 bg-[#F8FAFC] px-3 py-2.5 rounded-xl border-2 border-[#CBD5E1] focus-within:border-[#0066FF] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0066FF]/20 flex-1 transition-all">
              <label for="training-input-weight" class="text-xs text-[#64748B] font-bold uppercase tracking-wider">Carga:</label>
              <input
                id="training-input-weight"
                type="number"
                step="0.5"
                min="0"
                inputmode="decimal"
                placeholder="0"
                aria-label="Carga em kg do exercício atual"
                :value="activeSetWeight"
                @input="onWeightInput"
                class="w-full min-w-0 bg-transparent text-[#0F172A] text-base font-black text-right focus:outline-none"
              />
              <span class="text-xs text-[#64748B] font-bold">kg</span>
            </div>

            <div class="flex items-center gap-2 bg-[#F8FAFC] px-3 py-2.5 rounded-xl border-2 border-[#CBD5E1] focus-within:border-[#0066FF] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0066FF]/20 flex-1 transition-all">
              <label for="training-input-reps" class="text-xs text-[#64748B] font-bold uppercase tracking-wider">Reps:</label>
              <input
                id="training-input-reps"
                type="number"
                min="0"
                max="500"
                inputmode="numeric"
                placeholder="12"
                aria-label="Repetições do exercício atual"
                :value="activeSetReps"
                @input="onRepsInput"
                class="w-full min-w-0 bg-transparent text-[#0F172A] text-base font-black text-right focus:outline-none"
              />
            </div>

            <div class="flex items-center gap-2 bg-[#F8FAFC] px-3 py-2.5 rounded-xl border-2 border-[#CBD5E1] focus-within:border-[#0066FF] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0066FF]/20 w-24 transition-all">
              <label for="training-input-rir" class="text-xs text-[#64748B] font-bold uppercase tracking-wider">RIR:</label>
              <input
                id="training-input-rir"
                type="number"
                min="0"
                max="10"
                inputmode="numeric"
                placeholder="—"
                aria-label="RIR (reps em reserva) do exercício atual"
                :value="activeSetRir"
                @input="onRirInput"
                class="w-full min-w-0 bg-transparent text-[#0F172A] text-base font-black text-right focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            type="button"
            id="btn-training-check"
            class="tap-btn flex-1 px-4 py-3 rounded-xl text-sm font-black transition-colors"
            :class="focusIsDone
              ? 'bg-[#F1F5F9] border border-[#CBD5E1] text-[#64748B] hover:bg-[#E2E8F0]'
              : 'bg-[#F59E0B] text-[#0F172A] hover:bg-[#D97706] shadow-sm'"
            @click="$emit('toggle', focusExercise.id)"
          >
            {{ focusIsDone ? '↺ Marcar como pendente' : '✓ Concluir exercício' }}
          </button>
          <button
            type="button"
            id="btn-training-rest"
            class="tap-btn px-4 py-3 rounded-xl text-sm font-bold border border-[#CBD5E1] bg-white text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#0066FF]/50 transition-colors"
            :aria-label="`Iniciar descanso de ${focusExercise.rest}`"
            @click="$emit('rest', focusExercise.rest)"
          >
            ⏱️ Descanso
          </button>
          <button
            type="button"
            id="btn-training-swap"
            class="tap-btn px-3 py-3 rounded-xl text-xs font-bold border border-[#CBD5E1] bg-white text-[#64748B] hover:text-[#0066FF] hover:border-[#0066FF]/40 transition-colors flex items-center gap-1"
            title="Aparelho ocupado? Trocar por variação equivalente"
            @click="$emit('swap', focusExercise)"
          >
            <span aria-hidden="true">🔄</span>
            <span class="hidden sm:inline">Trocar</span>
          </button>
        </div>
      </section>

      <!-- Fila completa da ficha: tocar leva o exercício para o cartão atual -->
      <ul class="space-y-2">
        <li v-for="item in queue.items" :key="item.exerciseId">
          <button
            type="button"
            :id="`training-item-${item.exerciseId}`"
            class="tap-btn w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border text-left transition-all"
            :class="item.isDone
              ? 'bg-[#F8FAFC]/60 border-[#E2E8F0] opacity-75'
              : (item.exerciseId === effectiveFocusId ? 'bg-white border-[#0066FF] ring-2 ring-[#0066FF]/10 shadow-xs' : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] shadow-xs')"
            @click="manualFocusId = item.exerciseId"
          >
            <span
              class="text-sm font-bold min-w-0 truncate"
              :class="item.isDone ? 'line-through text-[#94A3B8]' : 'text-[#0F172A]'"
            >
              {{ item.name }}
            </span>
            <div class="flex items-center gap-2 flex-shrink-0">
              <span
                v-if="item.muscle"
                :class="getMuscleBadgeClass(item.muscle)"
                class="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider hidden sm:inline-block"
              >
                {{ MUSCLE_LABELS[item.muscle] || item.muscle }}
              </span>
              <span v-if="item.isDone" class="text-[#10B981] font-black flex-shrink-0" aria-hidden="true">✓</span>
              <span v-else class="text-[11px] text-[#94A3B8] flex-shrink-0" aria-hidden="true">○</span>
            </div>
          </button>
        </li>
      </ul>

      <p
        v-if="queue.allDone"
        id="training-all-done"
        role="status"
        class="text-center text-sm font-black text-emerald-600 py-2"
      >
        Todos os exercícios concluídos! 🎉
      </p>
    </main>

    <footer class="px-4 py-3 border-t border-[#E2E8F0] bg-white flex-shrink-0 shadow-xs">
      <button
        type="button"
        id="btn-training-finish"
        class="tap-btn w-full px-4 py-3.5 rounded-xl text-sm font-black bg-[#0066FF] text-white hover:bg-[#0052CC] shadow-md transition-all active:scale-[0.99]"
        @click="$emit('finish')"
      >
        🏁 Concluir treino e salvar no histórico
      </button>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { formatElapsed, elapsedSince, buildTrainingQueue } from '../engine/sessionMode';
import { MUSCLE_LABELS, getMuscleBadgeClass, getMuscleDotColor } from '../db/customExercises';

const props = defineProps({
  split: { type: Object, default: null },
  logs: { type: Object, default: () => ({}) },
  startedAt: { type: String, default: null }
});

const emit = defineEmits(['close', 'toggle', 'update', 'rest', 'finish', 'swap', 'add-set', 'update-set', 'toggle-set']);

const manualFocusId = ref(null);
const activeSetNumber = ref(1);
const now = ref(Date.now());
let tick = null;

const queue = computed(() => buildTrainingQueue(props.split?.exercises || [], props.logs));

// Foco manual só vale enquanto o exercício escolhido ainda estiver pendente;
// concluído ele, a fila volta a conduzir automaticamente para o próximo.
const effectiveFocusId = computed(() => {
  const manual = manualFocusId.value;
  const manualPending = queue.value.items.some(item => item.exerciseId === manual && !item.isDone);
  return manualPending ? manual : queue.value.focusId;
});

const focusExercise = computed(() =>
  props.split?.exercises?.find(ex => ex.id === effectiveFocusId.value) || null
);

watch(
  () => focusExercise.value?.id,
  () => {
    activeSetNumber.value = 1;
  }
);

const focusSets = computed(() => {
  const exId = focusExercise.value?.id;
  if (!exId) return [];
  const log = props.logs[exId];
  if (log?.sets && Array.isArray(log.sets) && log.sets.length > 0) {
    return log.sets;
  }
  return [{ setNumber: 1, weight: log?.weight || '', reps: log?.reps || '', rir: log?.rir || '', isDone: !!log?.isDone }];
});

const currentSet = computed(() => {
  return focusSets.value.find(s => s.setNumber === activeSetNumber.value) || focusSets.value[0] || {};
});

const activeSetWeight = computed(() => currentSet.value.weight ?? '');
const activeSetReps = computed(() => currentSet.value.reps ?? '');
const activeSetRir = computed(() => currentSet.value.rir ?? '');

function onWeightInput(e) {
  const val = e.target.value;
  if (activeSetNumber.value === 1) {
    emit('update', focusExercise.value.id, 'weight', val);
  } else {
    emit('update-set', focusExercise.value.id, activeSetNumber.value, 'weight', val);
  }
}

function onRepsInput(e) {
  const val = e.target.value;
  if (activeSetNumber.value === 1) {
    emit('update', focusExercise.value.id, 'reps', val);
  } else {
    emit('update-set', focusExercise.value.id, activeSetNumber.value, 'reps', val);
  }
}

function onRirInput(e) {
  const val = e.target.value;
  if (activeSetNumber.value === 1) {
    emit('update', focusExercise.value.id, 'rir', val);
  } else {
    emit('update-set', focusExercise.value.id, activeSetNumber.value, 'rir', val);
  }
}

const focusIsDone = computed(() => !!props.logs[focusExercise.value?.id]?.isDone);

const elapsedMs = computed(() => elapsedSince(props.startedAt, now.value));
const formattedElapsed = computed(() => formatElapsed(elapsedMs.value));

// Tick de 1s apenas enquanto o modo está montado; sem o clear aqui o interval
// viveria para sempre depois de sair do treino.
onMounted(() => {
  now.value = Date.now();
  tick = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onBeforeUnmount(() => {
  if (tick) clearInterval(tick);
  tick = null;
});
</script>
