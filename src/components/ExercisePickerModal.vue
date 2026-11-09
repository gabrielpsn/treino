<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-labelledby="exercise-picker-title"
    @click.self="$emit('close')"
    @keydown.esc="$emit('close')"
  >
    <div id="exercise-picker-modal" class="relative w-full max-w-lg bg-white border border-[#E2E8F0] rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] text-[#0F172A]">
      <div class="flex items-center justify-between mb-3">
        <h3 id="exercise-picker-title" class="text-lg font-black text-[#0F172A]">{{ title }}</h3>
        <button
          type="button"
          id="btn-close-exercise-picker"
          aria-label="Fechar seleção de exercício"
          @click="$emit('close')"
          class="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded-xl hover:bg-[#F1F5F9] transition-colors"
        >✕</button>
      </div>

      <p class="text-xs text-[#64748B] mb-3">
        <template v-if="mode === 'add'">
          Escolha um exercício para <strong class="text-[#0066FF] font-bold">{{ groupLabel }}</strong>:
        </template>
        <template v-else>
          Escolha uma alternativa compatível com
          <strong class="text-[#0066FF] font-bold">{{ currentExercise?.name }}</strong>:
        </template>
      </p>

      <!-- Barra de Busca Rápida -->
      <div class="relative mb-3">
        <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#94A3B8] text-xs sm:text-sm">🔍</span>
        <input
          id="input-search-exercise"
          v-model="searchQuery"
          type="text"
          placeholder="Buscar exercício por nome ou grupo..."
          class="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl pl-9 pr-8 py-2 text-xs md:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/20 transition-colors"
        />
        <button
          v-if="searchQuery"
          type="button"
          id="btn-clear-search-exercise"
          @click="searchQuery = ''"
          class="absolute inset-y-0 right-0 flex items-center pr-3 text-[#94A3B8] hover:text-[#0F172A] text-xs"
          title="Limpar busca"
        >✕</button>
      </div>

      <!-- Filtro por Grupos Musculares -->
      <div class="mb-3 overflow-x-auto pb-1 flex items-center gap-1.5 scrollbar-thin" role="tablist" aria-label="Filtrar por grupo muscular">
        <button
          type="button"
          id="btn-filter-muscle-all"
          @click="selectedMuscle = 'all'"
          :class="selectedMuscle === 'all' ? 'bg-[#0066FF] text-white font-bold border-[#0066FF] shadow-xs' : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1] hover:text-[#0F172A]'"
          class="text-xs px-2.5 py-1 rounded-lg border whitespace-nowrap transition-colors"
        >
          Todos
        </button>
        <button
          v-for="muscleKey in MUSCLE_OPTIONS"
          :key="muscleKey"
          :id="`btn-filter-muscle-${muscleKey}`"
          @click="selectedMuscle = muscleKey"
          :class="selectedMuscle === muscleKey ? 'bg-[#0066FF] text-white font-bold border-[#0066FF] shadow-xs' : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1] hover:text-[#0F172A]'"
          class="text-xs px-2.5 py-1 rounded-lg border whitespace-nowrap transition-colors"
        >
          {{ MUSCLE_LABELS[muscleKey] || muscleKey }}
        </button>
      </div>

      <p v-if="contextLabel" class="text-[11px] text-[#64748B] mb-3 flex items-center gap-1.5">
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
          class="w-full text-left p-3 rounded-xl border border-[#E2E8F0] hover:border-[#0066FF]/40 bg-[#F8FAFC] hover:bg-blue-50/40 transition-all flex items-center justify-between group"
        >
          <div>
            <div class="flex items-center gap-2">
              <h5 class="text-sm font-bold text-[#0F172A] group-hover:text-[#0066FF] transition-colors">{{ alt.name }}</h5>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-white text-[#64748B] border border-[#E2E8F0] font-medium">
                {{ MUSCLE_LABELS[alt.muscle] || alt.muscle }}
              </span>
            </div>
            <span class="text-xs text-[#64748B]">{{ alt.defaultSeries }} • Descanso {{ alt.rest }}</span>
            <span v-if="alt.isCustom" class="text-[10px] text-[#0066FF] font-semibold ml-1.5">• seu exercício</span>
          </div>
          <span class="text-[#0066FF] font-bold opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">{{ actionLabel }} →</span>
        </button>
      </div>

      <div v-if="alternatives.length === 0" class="text-center py-6">
        <p class="text-sm font-bold text-[#0F172A]">Nenhuma alternativa segura</p>
        <p class="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
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
            class="px-3 py-1.5 rounded-lg border border-[#CBD5E1] text-[#0F172A] text-xs font-bold hover:bg-[#F8FAFC] transition-colors"
            @click="searchQuery = ''; selectedMuscle = 'all'"
          >
            Limpar filtros
          </button>
          <button
            type="button"
            id="btn-create-from-picker"
            class="px-3 py-1.5 rounded-lg bg-[#F59E0B] text-[#0F172A] text-xs font-bold hover:bg-[#D97706] transition-colors"
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
