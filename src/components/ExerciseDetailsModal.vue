<template>
  <div
    v-if="isOpen && exercise"
    id="exercise-details-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="detail-exercise-name"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
    @click.self="emit('close')"
  >
    <div
      class="bg-slate-900 border-2 border-slate-700 w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl relative my-auto text-slate-100 animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Cabeçalho (Inspirado na Imagem 1 - Detalhes do Exercício) -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <button
          type="button"
          id="btn-close-exercise-details"
          @click="emit('close')"
          aria-label="Voltar para a ficha de treino"
          class="tap-btn px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-orange-400 font-bold text-xs flex items-center gap-1 transition-colors"
        >
          <span aria-hidden="true">❮</span>
          <span>Voltar</span>
        </button>

        <span class="text-xs font-extrabold uppercase tracking-widest text-slate-400">
          Detalhes do Exercício
        </span>

        <button
          type="button"
          id="btn-close-exercise-details-x"
          @click="emit('close')"
          aria-label="Fechar"
          class="tap-btn text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700 transition-colors"
        >
          ✕
        </button>
      </div>

      <!-- Título Principal do Exercício e Músculo Alvo -->
      <div class="text-center mb-4 space-y-1">
        <h3 id="detail-exercise-name" class="text-lg sm:text-xl font-black text-white tracking-tight">
          {{ exercise.name }}
        </h3>
        <div class="flex items-center justify-center gap-2">
          <span
            id="detail-exercise-muscle-badge"
            class="text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/40 inline-flex items-center gap-1.5"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
            {{ muscleLabels[exercise.muscle] || exercise.muscle }}
          </span>
          <span v-if="patternLabel" class="text-[11px] text-slate-400 font-semibold">
            • {{ patternLabel }}
          </span>
        </div>
      </div>

      <!-- Abas de Navegação (Imagem | Músculo | Descrição) - Como na Imagem 1 -->
      <div class="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-4 text-xs font-bold" role="tablist">
        <button
          type="button"
          id="tab-btn-detail-image"
          role="tab"
          :aria-selected="currentTab === 'image'"
          @click="currentTab = 'image'"
          class="tap-btn py-2 rounded-xl transition-all text-center"
          :class="currentTab === 'image'
            ? 'bg-orange-500 text-slate-950 font-black shadow-md'
            : 'text-slate-400 hover:text-white'"
        >
          🖼️ Imagem
        </button>
        <button
          type="button"
          id="tab-btn-detail-muscle"
          role="tab"
          :aria-selected="currentTab === 'muscle'"
          @click="currentTab = 'muscle'"
          class="tap-btn py-2 rounded-xl transition-all text-center"
          :class="currentTab === 'muscle'
            ? 'bg-orange-500 text-slate-950 font-black shadow-md'
            : 'text-slate-400 hover:text-white'"
        >
          💪 Músculo
        </button>
        <button
          type="button"
          id="tab-btn-detail-description"
          role="tab"
          :aria-selected="currentTab === 'description'"
          @click="currentTab = 'description'"
          class="tap-btn py-2 rounded-xl transition-all text-center"
          :class="currentTab === 'description'
            ? 'bg-orange-500 text-slate-950 font-black shadow-md'
            : 'text-slate-400 hover:text-white'"
        >
          📝 Descrição
        </button>
      </div>

      <!-- Conteúdo da Aba 1: IMAGEM (Demonstração Visual) -->
      <div v-if="currentTab === 'image'" id="detail-panel-image" class="space-y-4">
        <div class="relative w-full h-56 sm:h-64 rounded-2xl bg-slate-950 border-2 border-slate-800 overflow-hidden flex items-center justify-center p-2 group">
          <img
            v-if="exercise.imageUrl && !imageError"
            :src="exercise.imageUrl"
            :alt="`Demonstração de execução: ${exercise.name}`"
            class="w-full h-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
            @error="imageError = true"
          />
          <!-- Fallback Ilustrativo caso a imagem externa falhe ou não exista -->
          <div v-else class="flex flex-col items-center justify-center text-center p-4">
            <div class="w-16 h-16 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-3xl mb-2 border border-orange-500/40">
              🏋️
            </div>
            <p class="text-sm font-bold text-white">{{ exercise.name }}</p>
            <p class="text-xs text-slate-400 mt-1 max-w-xs">
              {{ patternLabel || 'Movimento direcionado para' }} {{ muscleLabels[exercise.muscle] || exercise.muscle }}
            </p>
          </div>

          <!-- Badge flutuante de Equipamento -->
          <span class="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-700 text-slate-200">
            {{ equipmentLabels[exercise.equipment] || 'Academia / Livre' }}
          </span>
        </div>

        <!-- Sugestões de Séries & Repetições -->
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
            <span class="text-base">🔁</span>
            <div>
              <p class="text-[10px] uppercase font-bold text-slate-400">Séries Recomendadas</p>
              <p class="font-extrabold text-white">{{ exercise.defaultSeries || '3-4 séries' }}</p>
            </div>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
            <span class="text-base">⏱️</span>
            <div>
              <p class="text-[10px] uppercase font-bold text-slate-400">Descanso Sugerido</p>
              <p class="font-extrabold text-white">{{ exercise.rest || '60s a 90s' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Conteúdo da Aba 2: MÚSCULO (Mapa Anatômico - Imagem 1) -->
      <div v-if="currentTab === 'muscle'" id="detail-panel-muscle" class="space-y-4">
        <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center">
          <MuscleBodyMap
            :highlighted-muscles="[exercise.muscle]"
            :secondary-muscles="secondaryMuscles"
            id-prefix="detail-"
            :show-controls="true"
            :show-legend="true"
          />
        </div>

        <!-- Músculos Ativados -->
        <div class="space-y-2 text-xs">
          <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
            <span class="w-3 h-3 rounded-full bg-orange-500 mt-0.5 flex-shrink-0 animate-pulse"></span>
            <div>
              <p class="font-bold text-orange-300">Músculo Primário (Agonista):</p>
              <p class="text-slate-200 font-semibold">{{ muscleLabels[exercise.muscle] || exercise.muscle }}</p>
            </div>
          </div>

          <div v-if="secondaryMuscles.length" class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
            <span class="w-3 h-3 rounded-full bg-amber-400 mt-0.5 flex-shrink-0"></span>
            <div>
              <p class="font-bold text-amber-300">Músculos Secundários (Sinergistas):</p>
              <p class="text-slate-300">{{ secondaryMuscles.map(m => muscleLabels[m] || m).join(', ') }}</p>
            </div>
          </div>

          <div v-if="exercise.jointStress && exercise.jointStress.length" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5">
            <span class="text-rose-400 text-sm">⚠️</span>
            <div>
              <p class="font-bold text-rose-300">Atenção às Articulações:</p>
              <p class="text-slate-300">Maior solicitação em {{ exercise.jointStress.join(', ') }}. Aqueça bem antes de colocar altas cargas.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Conteúdo da Aba 3: DESCRIÇÃO (Biomecânica & Dicas) -->
      <div v-if="currentTab === 'description'" id="detail-panel-description" class="space-y-3 text-xs">
        <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <h4 class="font-black text-sm text-white flex items-center gap-1.5">
            <span>💡</span> Dica de Execução do Especialista
          </h4>
          <p id="detail-exercise-tips" class="text-slate-300 leading-relaxed font-medium">
            {{ exercise.tips || exercise.notes || 'Mantenha a postura ereta, abdômen contraído e controle a fase excêntrica do movimento para máxima hipertrofia.' }}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div class="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <p class="font-bold text-slate-400 mb-1">🎯 Padrão Biomecânico</p>
            <p class="font-bold text-white">{{ patternLabel || exercise.pattern || 'Personalizado' }}</p>
          </div>
          <div class="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <p class="font-bold text-slate-400 mb-1">🏋️ Equipamento Necessário</p>
            <p class="font-bold text-white">{{ equipmentLabels[exercise.equipment] || 'Livre' }}</p>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
          <p class="font-bold text-slate-400 mb-1">🔄 Cadência e Respiração</p>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            Inspire na fase excêntrica (ao descer a carga) e expire na fase concêntrica (ao aplicar força máxima). Mantenha ritmo controlado (2s descida, 1s explosão).
          </p>
        </div>
      </div>

      <!-- Rodapé -->
      <div class="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end">
        <button
          type="button"
          id="btn-close-detail-footer"
          @click="emit('close')"
          class="tap-btn px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
        >
          Entendido
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import MuscleBodyMap from './MuscleBodyMap.vue';
import {
  MUSCLE_LABELS,
  PATTERN_LABELS,
  EQUIPMENT_LABELS
} from '../db/customExercises';

const props = defineProps({
  isOpen: Boolean,
  exercise: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close']);

const currentTab = ref('image'); // 'image' | 'muscle' | 'description'
const imageError = ref(false);

const muscleLabels = MUSCLE_LABELS;
const patternLabels = PATTERN_LABELS;
const equipmentLabels = EQUIPMENT_LABELS;

watch(
  () => props.exercise,
  () => {
    currentTab.value = 'image';
    imageError.value = false;
  }
);

const patternLabel = computed(() => {
  if (!props.exercise?.pattern) return '';
  return patternLabels[props.exercise.pattern] || props.exercise.pattern;
});

// Calcula músculos secundários sinergistas baseados no grupo muscular principal
const secondaryMuscles = computed(() => {
  if (!props.exercise?.muscle) return [];
  const muscle = props.exercise.muscle;

  const synergyMap = {
    peito: ['triceps', 'ombro'],
    costas: ['biceps', 'lombar', 'antebraco'],
    ombro: ['triceps', 'costas'],
    quadriceps: ['gluteo', 'panturrilha'],
    posterior: ['gluteo', 'lombar'],
    gluteo: ['posterior', 'quadriceps'],
    biceps: ['antebraco'],
    triceps: ['peito', 'ombro'],
    abdomen: ['lombar'],
    panturrilha: ['quadriceps']
  };

  return synergyMap[muscle] || [];
});
</script>
