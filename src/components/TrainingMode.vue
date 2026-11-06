<template>
  <div
    v-if="split"
    id="training-mode"
    role="dialog"
    aria-modal="true"
    aria-label="Modo Treino"
    class="fixed inset-0 z-30 bg-slate-950 flex flex-col"
  >
    <!-- Topo: saída, identificação da ficha, cronômetro da sessão e progresso -->
    <header class="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900 flex-shrink-0">
      <button
        type="button"
        id="btn-exit-training-mode"
        aria-label="Sair do modo treino"
        class="tap-btn w-11 h-11 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 text-sm font-bold"
        @click="$emit('close')"
      >
        ✕
      </button>

      <div class="text-center min-w-0">
        <p class="text-[10px] uppercase tracking-widest text-amber-400 font-bold">Modo Treino</p>
        <p class="text-xs font-bold text-white truncate max-w-[40vw]">{{ split.title }}</p>
      </div>

      <div class="text-right">
        <p
          id="training-timer"
          role="timer"
          aria-label="Tempo de treino decorrido"
          class="font-mono text-lg font-black text-amber-400 leading-none"
        >
          {{ formattedElapsed }}
        </p>
        <p id="training-progress" class="text-[11px] text-slate-400 mt-1">{{ queue.doneCount }}/{{ queue.totalCount }} concluídos</p>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      <!-- Foco atual: o app conduz a pessoa de um exercício pendente ao próximo -->
      <section
        v-if="focusExercise"
        class="p-4 rounded-2xl border border-amber-500/30 bg-slate-900 space-y-3"
      >
        <div>
          <div class="flex items-center justify-between gap-2">
            <p class="text-[10px] uppercase tracking-widest text-amber-400 font-bold">Exercício atual</p>
            <span
              v-if="focusExercise.muscle"
              :class="getMuscleBadgeClass(focusExercise.muscle)"
              class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="getMuscleDotColor(focusExercise.muscle)"></span>
              {{ MUSCLE_LABELS[focusExercise.muscle] || focusExercise.muscle }}
            </span>
          </div>
          <h2 class="text-lg font-extrabold text-white leading-tight">{{ focusExercise.name }}</h2>
          <p class="text-xs text-slate-400 mt-0.5">
            {{ focusExercise.defaultSeries }}
            <template v-if="focusExercise.aiReps"> • {{ focusExercise.aiReps }} reps</template>
            • Descanso: {{ focusExercise.rest }}
          </p>
          <p v-if="focusExercise.tips" class="text-[11px] text-slate-500 italic mt-1">💡 {{ focusExercise.tips }}</p>
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
              :class="activeSetNumber === s.setNumber ? 'bg-amber-500 text-slate-950 font-black' : (s.isDone ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-950 text-slate-400 border border-slate-800')"
              class="px-2.5 py-1 rounded-lg text-xs transition-colors flex items-center gap-1 flex-shrink-0"
            >
              <span>Série {{ s.setNumber }}</span>
              <span v-if="s.isDone" class="text-[10px]" :class="activeSetNumber === s.setNumber ? 'text-slate-950 font-bold' : 'text-amber-400'">✓</span>
            </button>
            <button
              type="button"
              id="btn-training-add-set"
              @click="$emit('add-set', focusExercise.id)"
              class="px-2 py-1 rounded-lg text-xs font-bold border border-slate-800 bg-slate-950 text-slate-400 hover:text-white transition-colors flex-shrink-0"
              title="Adicionar mais uma série"
            >
              + Série
            </button>
          </div>

          <div class="flex gap-3">
            <div class="flex items-center gap-2 bg-slate-950 px-3 py-2.5 rounded-xl border border-slate-800 flex-1">
              <label for="training-input-weight" class="text-xs text-slate-500 font-medium">Carga:</label>
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
                class="w-full min-w-0 bg-transparent text-amber-300 text-base font-bold text-right focus:outline-none"
              />
              <span class="text-xs text-slate-500">kg</span>
            </div>

            <div class="flex items-center gap-2 bg-slate-950 px-3 py-2.5 rounded-xl border border-slate-800 flex-1">
              <label for="training-input-reps" class="text-xs text-slate-500 font-medium">Reps:</label>
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
                class="w-full min-w-0 bg-transparent text-amber-300 text-base font-bold text-right focus:outline-none"
              />
            </div>

            <div class="flex items-center gap-2 bg-slate-950 px-3 py-2.5 rounded-xl border border-slate-800 w-24">
              <label for="training-input-rir" class="text-xs text-slate-500 font-medium">RIR:</label>
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
                class="w-full min-w-0 bg-transparent text-amber-300 text-base font-bold text-right focus:outline-none"
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
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              : 'bg-amber-500 text-slate-950 hover:bg-amber-400'"
            @click="$emit('toggle', focusExercise.id)"
          >
            {{ focusIsDone ? '↺ Marcar como pendente' : '✓ Concluir exercício' }}
          </button>
          <button
            type="button"
            id="btn-training-rest"
            class="tap-btn px-4 py-3 rounded-xl text-sm font-bold border border-slate-700 text-slate-300 hover:text-white hover:border-amber-500/60"
            :aria-label="`Iniciar descanso de ${focusExercise.rest}`"
            @click="$emit('rest', focusExercise.rest)"
          >
            ⏱️ Descanso
          </button>
          <button
            type="button"
            id="btn-training-swap"
            class="tap-btn px-3 py-3 rounded-xl text-xs font-bold border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-slate-700 transition-colors flex items-center gap-1"
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
            class="tap-btn w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border text-left"
            :class="item.isDone
              ? 'bg-slate-900/40 border-slate-800 opacity-70'
              : (item.exerciseId === effectiveFocusId ? 'bg-slate-900 border-amber-500/50' : 'bg-slate-900 border-slate-800 hover:border-slate-700')"
            @click="manualFocusId = item.exerciseId"
          >
            <span
              class="text-sm font-bold min-w-0 truncate"
              :class="item.isDone ? 'line-through text-slate-500' : 'text-white'"
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
              <span v-if="item.isDone" class="text-amber-400 font-black flex-shrink-0" aria-hidden="true">✓</span>
              <span v-else class="text-[11px] text-slate-500 flex-shrink-0" aria-hidden="true">○</span>
            </div>
          </button>
        </li>
      </ul>

      <p
        v-if="queue.allDone"
        id="training-all-done"
        role="status"
        class="text-center text-sm font-black text-emerald-400 py-2"
      >
        Todos os exercícios concluídos! 🎉
      </p>
    </main>

    <footer class="px-4 py-3 border-t border-slate-800 bg-slate-900 flex-shrink-0">
      <button
        type="button"
        id="btn-training-finish"
        class="tap-btn w-full px-4 py-3.5 rounded-xl text-sm font-black bg-slate-800 text-white hover:bg-slate-700 transition-colors"
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
