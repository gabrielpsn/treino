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
    <div id="exercise-picker-modal" class="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
      <div class="flex items-center justify-between mb-4">
<h3 id="exercise-picker-title" class="text-lg font-bold text-white">{{ title }}</h3>
        <button
          type="button"
          id="btn-close-exercise-picker"
          aria-label="Fechar seleção de exercício"
          @click="$emit('close')"
          class="text-slate-400 hover:text-white p-1 rounded-lg"
        >✕</button>
      </div>

      <p class="text-xs text-slate-400 mb-4">
        <template v-if="mode === 'add'">
          Escolha um exercício para <strong class="text-amber-400">{{ groupLabel }}</strong>:
        </template>
        <template v-else>
          Escolha uma alternativa compatível com
          <strong class="text-amber-400">{{ currentExercise?.name }}</strong>:
        </template>
      </p>

      <p v-if="contextLabel" class="text-[11px] text-slate-500 mb-4 flex items-center gap-1.5">
        <span aria-hidden="true">🛡️</span>
        <span>Filtrando por {{ contextLabel }}</span>
      </p>

      <div v-if="alternatives.length > 0" class="space-y-2 max-h-72 overflow-y-auto pr-1">
        <button
          v-for="alt in alternatives"
          :key="alt.id"
          :id="`btn-alternative-${alt.id}`"
          type="button"
          @click="selectAlternative(alt)"
          class="w-full text-left p-3 rounded-xl border border-slate-800 hover:border-amber-500/50 bg-slate-950/50 hover:bg-amber-500/10 transition-all flex items-center justify-between group"
        >
          <div>
            <h5 class="text-sm font-semibold text-slate-200 group-hover:text-white">{{ alt.name }}</h5>
            <span class="text-xs text-slate-500">{{ alt.defaultSeries }} • Descanso {{ alt.rest }}</span>
            <span v-if="alt.isCustom" class="text-[10px] text-cyan-400">• seu exercício</span>
          </div>
          <span class="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">{{ actionLabel }} →</span>
        </button>
      </div>

      <div v-if="alternatives.length === 0" class="text-center py-6">
        <p class="text-sm font-semibold text-white">Nenhuma alternativa segura</p>
        <p class="text-xs text-slate-400 mt-1">
          Todas as opções deste grupo conflitam com
          {{ profile?.restrictions?.length ? 'as restrições articulares informadas' : 'o equipamento disponível' }}.
          Ajuste o perfil para liberar novas opções.
        </p>
        <button
          type="button"
          id="btn-create-from-picker"
          class="mt-4 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition-colors"
          @click="$emit('create')"
        >
          + Criar exercício para este grupo
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { EXERCISE_CATALOG } from '../engine/knowledge/exercises';
import { conflictsWithRestrictions, matchesEquipment } from '../engine/generators/workoutGenerator';
import { MUSCLE_LABELS } from '../db/customExercises';

const props = defineProps({
  isOpen: Boolean,
  currentExercise: Object,
  profile: { type: Object, default: () => ({}) },
  // Catálogo já mesclado (embutido + exercícios do usuário). Sem este prop o
  // modal usa só o catálogo de fábrica, que é o comportamento antigo.
  catalog: { type: Array, default: null },
  // Quando informado, o modal deixa de ser "substituir" e passa a listar
  // exercícios de um grupo para adicionar à ficha. `currentExercise` continua
  // definindo o grupo nesse caso.
  mode: { type: String, default: 'swap' }
});

const emit = defineEmits(['close', 'select', 'create']);

const restrictions = computed(() => props.profile?.restrictions ?? []);
const equipment = computed(() => props.profile?.equipment ?? 'gym');

const title = computed(() =>
  props.mode === 'add' ? 'Adicionar Exercício' : 'Substituir Exercício'
);

const actionLabel = computed(() =>
  props.mode === 'add' ? 'Adicionar' : 'Trocar'
);

const groupLabel = computed(() => MUSCLE_LABELS[props.currentExercise?.muscle] ?? 'seu treino');

// Mesmas regras de segurança usadas pelo gerador de planos: mesmaarticulação
// lesionada e mesmo equipamento disponível. Sem isso, a tela de substituição
// podia sugerir um exercício que o gerador jamais entregaria.
const alternatives = computed(() => {
  if (!props.currentExercise) return [];
  const catalog = props.catalog ?? EXERCISE_CATALOG;
  return catalog.filter(ex =>
    ex.muscle === props.currentExercise.muscle &&
    // Ao adicionar, o exercício atual não é excluído: ele está na ficha e o
    // filtro de duplicidade é responsabilidade de quem aplica a mudança.
    (props.mode === 'add' || ex.id !== props.currentExercise.id) &&
    matchesEquipment(ex, equipment.value) &&
    !conflictsWithRestrictions(ex, restrictions.value)
  );
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
</script>