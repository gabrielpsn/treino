<template>
  <div
    v-if="isOpen && exercise"
    id="exercise-details-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="detail-exercise-name"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
    @click.self="emit('close')"
  >
    <div
      class="bg-white border border-[#E2E8F0] w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl relative my-auto text-[#0F172A] animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Cabeçalho (Detalhes do Exercício) -->
      <div class="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4">
        <button
          type="button"
          id="btn-close-exercise-details"
          @click="emit('close')"
          aria-label="Voltar para a ficha de treino"
          class="tap-btn px-2.5 py-1.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0066FF] font-bold text-xs flex items-center gap-1 transition-colors shadow-xs"
        >
          <span aria-hidden="true">❮</span>
          <span>Voltar</span>
        </button>

        <span class="text-xs font-extrabold uppercase tracking-widest text-[#64748B]">
          Detalhes do Exercício
        </span>

        <button
          type="button"
          id="btn-close-exercise-details-x"
          @click="emit('close')"
          aria-label="Fechar"
          class="tap-btn text-[#64748B] hover:text-[#0F172A] p-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-colors shadow-xs"
        >
          ✕
        </button>
      </div>

      <!-- Título Principal do Exercício e Músculo Alvo -->
      <div class="text-center mb-4 space-y-1">
        <h3 id="detail-exercise-name" class="text-lg sm:text-xl font-black text-[#0F172A] tracking-tight">
          {{ exercise.name }}
        </h3>
        <div class="flex items-center justify-center gap-2">
          <span
            id="detail-exercise-muscle-badge"
            class="text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-blue-50 text-[#0066FF] border border-blue-200 inline-flex items-center gap-1.5"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-[#0066FF]"></span>
            {{ muscleLabels[exercise.muscle] || exercise.muscle }}
          </span>
          <span v-if="patternLabel" class="text-[11px] text-[#64748B] font-semibold">
            • {{ patternLabel }}
          </span>
        </div>
      </div>

      <!-- Abas de Navegação (Imagem | Músculo | Descrição) -->
      <div class="grid grid-cols-3 gap-1 bg-[#F1F5F9] p-1 rounded-2xl border border-[#E2E8F0] mb-4 text-xs font-bold" role="tablist">
        <button
          type="button"
          id="tab-btn-detail-image"
          role="tab"
          :aria-selected="currentTab === 'image'"
          @click="currentTab = 'image'"
          class="tap-btn py-2 rounded-xl transition-all text-center"
          :class="currentTab === 'image'
            ? 'bg-[#F59E0B] text-[#0F172A] font-bold shadow-xs'
            : 'text-[#64748B] hover:text-[#0F172A]'"
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
            ? 'bg-[#F59E0B] text-[#0F172A] font-bold shadow-xs'
            : 'text-[#64748B] hover:text-[#0F172A]'"
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
            ? 'bg-[#F59E0B] text-[#0F172A] font-bold shadow-xs'
            : 'text-[#64748B] hover:text-[#0F172A]'"
        >
          📝 Descrição
        </button>
      </div>

      <!-- Conteúdo da Aba 1: IMAGEM (Demonstração Visual) -->
      <div v-if="currentTab === 'image'" id="detail-panel-image" class="space-y-4">
        <div class="relative w-full h-56 sm:h-64 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] overflow-hidden flex items-center justify-center p-2 group shadow-inner">
          <img
            v-if="exercise.imageUrl && !imageError"
            :src="exercise.imageUrl"
            :alt="`Demonstração de execução: ${exercise.name}`"
            class="w-full h-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
            @error="imageError = true"
          />
          <!-- Fallback Ilustrativo caso a imagem externa falhe ou não exista -->
          <div v-else class="flex flex-col items-center justify-center text-center p-4">
            <div class="w-16 h-16 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center text-3xl mb-2 border border-blue-200">
              🏋️
            </div>
            <p class="text-sm font-bold text-[#0F172A]">{{ exercise.name }}</p>
            <p class="text-xs text-[#64748B] mt-1 max-w-xs">
              {{ patternLabel || 'Movimento direcionado para' }} {{ muscleLabels[exercise.muscle] || exercise.muscle }}
            </p>
          </div>

          <!-- Badge flutuante de Equipamento -->
          <span class="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/95 border border-[#E2E8F0] text-[#0F172A] shadow-xs">
            {{ equipmentLabels[exercise.equipment] || 'Academia / Livre' }}
          </span>
        </div>

        <!-- Sugestões de Séries & Repetições -->
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="p-2.5 rounded-xl bg-white border border-[#E2E8F0] flex items-center gap-2 shadow-xs">
            <span class="text-base">🔁</span>
            <div>
              <p class="text-[10px] uppercase font-bold text-[#64748B]">Séries Recomendadas</p>
              <p class="font-extrabold text-[#0F172A]">{{ exercise.defaultSeries || '3-4 séries' }}</p>
            </div>
          </div>
          <div class="p-2.5 rounded-xl bg-white border border-[#E2E8F0] flex items-center gap-2 shadow-xs">
            <span class="text-base">⏱️</span>
            <div>
              <p class="text-[10px] uppercase font-bold text-[#64748B]">Descanso Sugerido</p>
              <p class="font-extrabold text-[#0F172A]">{{ exercise.rest || '60s a 90s' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Conteúdo da Aba 2: MÚSCULO (Mapa Anatômico) -->
      <div v-if="currentTab === 'muscle'" id="detail-panel-muscle" class="space-y-4">
        <div class="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center shadow-xs">
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
          <div class="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2.5">
            <span class="w-3 h-3 rounded-full bg-[#0066FF] mt-0.5 flex-shrink-0"></span>
            <div>
              <p class="font-bold text-[#0066FF]">Músculo Primário (Agonista):</p>
              <p class="text-[#0F172A] font-semibold">{{ muscleLabels[exercise.muscle] || exercise.muscle }}</p>
            </div>
          </div>

          <div v-if="secondaryMuscles.length" class="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-2.5">
            <span class="w-3 h-3 rounded-full bg-[#F59E0B] mt-0.5 flex-shrink-0"></span>
            <div>
              <p class="font-bold text-[#B45309]">Músculos Secundários (Sinergistas):</p>
              <p class="text-[#0F172A]">{{ secondaryMuscles.map(m => muscleLabels[m] || m).join(', ') }}</p>
            </div>
          </div>

          <div v-if="exercise.jointStress && exercise.jointStress.length" class="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5">
            <span class="text-rose-600 text-sm">⚠️</span>
            <div>
              <p class="font-bold text-rose-700">Atenção às Articulações:</p>
              <p class="text-rose-900">Maior solicitação em {{ exercise.jointStress.join(', ') }}. Aqueça bem antes de colocar altas cargas.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Conteúdo da Aba 3: DESCRIÇÃO (Biomecânica & Dicas) -->
      <div v-if="currentTab === 'description'" id="detail-panel-description" class="space-y-3 text-xs">
        <div class="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
          <h4 class="font-bold text-sm text-[#0F172A] flex items-center gap-1.5">
            <span>💡</span> Dica de Execução do Especialista
          </h4>
          <p id="detail-exercise-tips" class="text-[#0F172A] leading-relaxed font-medium">
            {{ exercise.tips || exercise.notes || 'Mantenha a postura ereta, abdômen contraído e controle a fase excêntrica do movimento para máxima hipertrofia.' }}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div class="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
            <p class="font-bold text-[#64748B] mb-1">🎯 Padrão Biomecânico</p>
            <p class="font-bold text-[#0F172A]">{{ patternLabel || exercise.pattern || 'Personalizado' }}</p>
          </div>
          <div class="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
            <p class="font-bold text-[#64748B] mb-1">🏋️ Equipamento Necessário</p>
            <p class="font-bold text-[#0F172A]">{{ equipmentLabels[exercise.equipment] || 'Livre' }}</p>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <p class="font-bold text-[#64748B] mb-1">🔄 Cadência e Respiração</p>
          <p class="text-[#0F172A] text-[11px] leading-relaxed">
            Inspire na fase excêntrica (ao descer a carga) e expire na fase concêntrica (ao aplicar força máxima). Mantenha ritmo controlado (2s descida, 1s explosão).
          </p>
        </div>
      </div>

      <!-- Rodapé -->
      <div class="mt-5 pt-3 border-t border-[#E2E8F0] flex items-center justify-end">
        <button
          type="button"
          id="btn-close-detail-footer"
          @click="emit('close')"
          class="tap-btn px-5 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#0F172A] font-bold text-xs transition-colors shadow-xs"
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
