<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
    role="dialog"
    aria-modal="true"
    aria-labelledby="exercise-picker-title"
    @click.self="$emit('close')"
    @keydown.esc="$emit('close')"
  >
    <div id="exercise-picker-modal" class="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh]">
      <div class="flex items-center justify-between mb-3">
        <h3 id="exercise-picker-title" class="text-lg font-bold text-white">{{ title }}</h3>
        <button
          type="button"
          id="btn-close-exercise-picker"
          aria-label="Fechar seleção de exercício"
          @click="$emit('close')"
          class="text-slate-400 hover:text-white p-1 rounded-lg"
        >✕</button>
      </div>

      <p class="text-xs text-slate-400 mb-3">
        <template v-if="mode === 'add'">
          Escolha um exercício para <strong class="text-amber-400">{{ groupLabel }}</strong>:
        </template>
        <template v-else>
          Escolha uma alternativa compatível com
          <strong class="text-amber-400">{{ currentExercise?.name }}</strong>:
        </template>
      </p>

      <!-- Barra de Busca Rápida -->
      <div class="relative mb-3">
        <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500 text-xs sm:text-sm">🔍</span>
        <input
          id="input-search-exercise"
          v-model="searchQuery"
          type="text"
          placeholder="Buscar exercício por nome ou grupo..."
          class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
        />
        <button
          v-if="searchQuery"
          type="button"
          id="btn-clear-search-exercise"
          @click="searchQuery = ''"
          class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white text-xs"
          title="Limpar busca"
        >✕</button>
      </div>

      <!-- Filtro por Grupos Musculares -->
      <div class="mb-3 overflow-x-auto pb-1 flex items-center gap-1.5 scrollbar-thin" role="tablist" aria-label="Filtrar por grupo muscular">
        <button
          type="button"
          id="btn-filter-muscle-all"
          @click="selectedMuscle = 'all'"
          :class="selectedMuscle === 'all' ? 'bg-amber-500 text-slate-950 font-bold border-amber-400' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'"
          class="text-xs px-2.5 py-1 rounded-lg border whitespace-nowrap transition-colors"
        >
          Todos
        </button>
        <button
          v-for="muscleKey in MUSCLE_OPTIONS"
          :key="muscleKey"
          :id="`btn-filter-muscle-${muscleKey}`"
          @click="selectedMuscle = muscleKey"
          :class="selectedMuscle === muscleKey ? 'bg-amber-500 text-slate-950 font-bold border-amber-400' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'"
          class="text-xs px-2.5 py-1 rounded-lg border whitespace-nowrap transition-colors"
        >
          {{ MUSCLE_LABELS[muscleKey] || muscleKey }}
        </button>
      </div>

      <p v-if="contextLabel" class="text-[11px] text-slate-500 mb-3 flex items-center gap-1.5">
        <span aria-hidden="true">🛡️</span>
        <span>Filtrando por {{ contextLabel }}</span>
      </p>

      <!-- Lista de Exercícios Filtrados -->
      <div v-if="alternatives.length > 0" class="space-y-2 overflow-y-auto pr-1 flex-1">
        <button
          v-for="alt in alternatives"
          :key="alt.id"
          :id="`btn-alternative-${alt.id}`"
          type="button"
          @click="selectAlternative(alt)"
          class="w-full text-left p-3 rounded-xl border border-slate-800 hover:border-amber-500/50 bg-slate-950/50 hover:bg-amber-500/10 transition-all flex items-center justify-between group"
        >
          <div>
            <div class="flex items-center gap-2">
              <h5 class="text-sm font-semibold text-slate-200 group-hover:text-white">{{ alt.name }}</h5>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                {{ MUSCLE_LABELS[alt.muscle] || alt.muscle }}
              </span>
            </div>
            <span class="text-xs text-slate-500">{{ alt.defaultSeries }} • Descanso {{ alt.rest }}</span>
            <span v-if="alt.isCustom" class="text-[10px] text-cyan-400 ml-1.5">• seu exercício</span>
          </div>
          <span class="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">{{ actionLabel }} →</span>
        </button>
      </div>

      <div v-if="alternatives.length === 0" class="text-center py-6">
        <p class="text-sm font-semibold text-white">Nenhuma alternativa segura</p>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          {{ searchQuery
            ? 'Nenhum exercício corresponde ao termo pesquisado mantendo a segurança articular.'
            : (profile?.restrictions?.length
                ? 'Todas as opções deste grupo conflitam com as restrições articulares informadas ou o equipamento disponível.'
                : 'Nenhum exercício disponível com o equipamento atual.') }}
        </p>
        <div class="flex items-center justify-center gap-2 mt-4">
          <button
            v-if="searchQuery"
            type="button"
            id="btn-reset-filter"
            class="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-colors"
            @click="searchQuery = ''; selectedMuscle = 'all'"
          >
            Limpar filtros
          </button>
          <button
            type="button"
            id="btn-create-from-picker"
            class="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition-colors"
            @click="emitCreate"
          >
            + Criar exercício para este grupo
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { EXERCISE_CATALOG } from '../engine/knowledge/exercises';
import { conflictsWithRestrictions, matchesEquipment } from '../engine/generators/workoutGenerator';
import { MUSCLE_OPTIONS, MUSCLE_LABELS } from '../db/customExercises';

const props = defineProps({
  isOpen: Boolean,
  currentExercise: Object,
  profile: { type: Object, default: () => ({}) },
  catalog: { type: Array, default: null },
  mode: { type: String, default: 'swap' }
});

const emit = defineEmits(['close', 'select', 'create']);

const restrictions = computed(() => props.profile?.restrictions ?? []);
const equipment = computed(() => props.profile?.equipment ?? 'gym');

const selectedMuscle = ref('all');
const searchQuery = ref('');

watch(
  () => [props.isOpen, props.currentExercise],
  ([open, curr]) => {
    if (open) {
      searchQuery.value = '';
      selectedMuscle.value = curr?.muscle || 'all';
    }
  },
  { immediate: true }
);

const title = computed(() =>
  props.mode === 'add' ? 'Adicionar Exercício' : 'Substituir Exercício'
);

const actionLabel = computed(() =>
  props.mode === 'add' ? 'Adicionar' : 'Trocar'
);

const groupLabel = computed(() => {
  if (selectedMuscle.value && selectedMuscle.value !== 'all') {
    return MUSCLE_LABELS[selectedMuscle.value] ?? selectedMuscle.value;
  }
  return MUSCLE_LABELS[props.currentExercise?.muscle] ?? 'seu treino';
});

function normalize(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const safeExercises = computed(() => {
  if (!props.currentExercise) return [];
  const catalog = props.catalog ?? EXERCISE_CATALOG;
  return catalog.filter(ex => {
    if (selectedMuscle.value && selectedMuscle.value !== 'all') {
      if (ex.muscle !== selectedMuscle.value) return false;
    }

    if (props.mode !== 'add' && props.currentExercise && ex.id === props.currentExercise.id) {
      return false;
    }

    return matchesEquipment(ex, equipment.value) && !conflictsWithRestrictions(ex, restrictions.value);
  });
});

const alternatives = computed(() => {
  const query = normalize(searchQuery.value.trim());
  if (!query) return safeExercises.value;

  return safeExercises.value.filter(ex => {
    const nameNorm = normalize(ex.name);
    const muscleNorm = normalize(MUSCLE_LABELS[ex.muscle] || ex.muscle);
    return nameNorm.includes(query) || muscleNorm.includes(query);
  });
});

const contextLabel = computed(() => {
  const parts = [];
  if (restrictions.value.length) parts.push(restrictions.value.join(', '));
  if (equipment.value === 'home') parts.push('sem academia');
  return parts.join(' • ');
});

function selectAlternative(alt) {
  emit('select', alt);
  emit('close');
}

function emitCreate() {
  const muscle = (selectedMuscle.value && selectedMuscle.value !== 'all')
    ? selectedMuscle.value
    : (props.currentExercise?.muscle || null);
  emit('create', muscle);
}
</script>
