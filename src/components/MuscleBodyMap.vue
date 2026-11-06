<template>
  <div class="muscle-body-map flex flex-col items-center select-none">
    <!-- Seletor de Visão (Frente / Costas / Ambos) -->
    <div v-if="showControls" class="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl mb-3 text-xs">
      <button
        type="button"
        :id="`${idPrefix}btn-view-both`"
        @click="activeView = 'both'"
        class="tap-btn px-2.5 py-1 rounded-lg font-bold transition-all"
        :class="activeView === 'both' ? 'bg-orange-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'"
      >
        Frente & Costas
      </button>
      <button
        type="button"
        :id="`${idPrefix}btn-view-front`"
        @click="activeView = 'front'"
        class="tap-btn px-2.5 py-1 rounded-lg font-bold transition-all"
        :class="activeView === 'front' ? 'bg-orange-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'"
      >
        Frente
      </button>
      <button
        type="button"
        :id="`${idPrefix}btn-view-back`"
        @click="activeView = 'back'"
        class="tap-btn px-2.5 py-1 rounded-lg font-bold transition-all"
        :class="activeView === 'back' ? 'bg-orange-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'"
      >
        Costas
      </button>
    </div>

    <!-- Diagrama Anatômico SVG -->
    <div class="flex items-center justify-center gap-4 sm:gap-8 flex-wrap">
      
      <!-- FRENTE (Anterior) -->
      <div v-if="activeView === 'both' || activeView === 'front'" class="flex flex-col items-center">
        <span class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">Frente</span>
        <svg
          :id="`${idPrefix}body-front`"
          viewBox="0 0 160 300"
          class="w-32 sm:w-36 h-60 drop-shadow-md transition-all"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- Silhueta Base / Fundo Neutro -->
          <g class="fill-slate-800/80 stroke-slate-700/60" stroke-width="1.2" stroke-linejoin="round">
            <!-- Cabeça e Pescoço -->
            <ellipse cx="80" cy="22" rx="14" ry="17" />
            <path d="M72 38 L88 38 L92 48 L68 48 Z" />
            
            <!-- Tronco e Braços base -->
            <path d="M68 48 L92 48 L108 58 L114 96 L118 136 L114 165 L108 170 L104 150 L102 110 L94 135 L66 135 L58 110 L56 150 L52 170 L46 165 L42 136 L46 96 L52 58 Z" />

            <!-- Pernas base -->
            <path d="M66 135 L78 142 L82 142 L94 135 L96 185 L94 240 L92 285 L84 290 L80 286 L80 152 L76 286 L72 290 L64 285 L62 240 L64 185 Z" />
          </g>

          <!-- GRUPOS MUSCULARES FRONTAIS ATIVÁVEIS -->
          
          <!-- Ombros / Deltoide Anterior -->
          <path
            :id="`${idPrefix}muscle-front-ombro-left`"
            d="M52 58 C52 58 46 68 46 80 C46 88 50 94 54 95 C55 88 56 75 60 66 Z"
            :class="getMuscleClass('ombro')"
            @click="emitMuscleClick('ombro')"
            v-bind="getMuscleProps('ombro', 'Deltoides Anteriores')"
          />
          <path
            :id="`${idPrefix}muscle-front-ombro-right`"
            d="M108 58 C108 58 114 68 114 80 C114 88 110 94 106 95 C105 88 104 75 100 66 Z"
            :class="getMuscleClass('ombro')"
            @click="emitMuscleClick('ombro')"
            v-bind="getMuscleProps('ombro', 'Deltoides Anteriores')"
          />

          <!-- Peitoral (Maior e Menor) -->
          <path
            :id="`${idPrefix}muscle-front-peito-left`"
            d="M62 55 L78 55 C78 55 78 78 77 84 C72 85 64 83 58 76 C56 68 58 60 62 55 Z"
            :class="getMuscleClass('peito')"
            @click="emitMuscleClick('peito')"
            v-bind="getMuscleProps('peito', 'Peitoral')"
          />
          <path
            :id="`${idPrefix}muscle-front-peito-right`"
            d="M98 55 L82 55 C82 55 82 78 83 84 C88 85 96 83 102 76 C104 68 102 60 98 55 Z"
            :class="getMuscleClass('peito')"
            @click="emitMuscleClick('peito')"
            v-bind="getMuscleProps('peito', 'Peitoral')"
          />

          <!-- Bíceps -->
          <path
            :id="`${idPrefix}muscle-front-biceps-left`"
            d="M47 88 C45 98 46 110 49 116 C53 115 56 110 55 100 C54 94 51 90 47 88 Z"
            :class="getMuscleClass('biceps')"
            @click="emitMuscleClick('biceps')"
            v-bind="getMuscleProps('biceps', 'Bíceps')"
          />
          <path
            :id="`${idPrefix}muscle-front-biceps-right`"
            d="M113 88 C115 98 114 110 111 116 C107 115 104 110 105 100 C106 94 109 90 113 88 Z"
            :class="getMuscleClass('biceps')"
            @click="emitMuscleClick('biceps')"
            v-bind="getMuscleProps('biceps', 'Bíceps')"
          />

          <!-- Antebraço Anterior -->
          <path
            :id="`${idPrefix}muscle-front-antebraco-left`"
            d="M48 120 C45 130 44 145 47 156 C50 156 53 148 54 138 C54 130 52 122 48 120 Z"
            :class="getMuscleClass('antebraco')"
            @click="emitMuscleClick('antebraco')"
            v-bind="getMuscleProps('antebraco', 'Antebraços')"
          />
          <path
            :id="`${idPrefix}muscle-front-antebraco-right`"
            d="M112 120 C115 130 116 145 113 156 C110 156 107 148 106 138 C106 130 108 122 112 120 Z"
            :class="getMuscleClass('antebraco')"
            @click="emitMuscleClick('antebraco')"
            v-bind="getMuscleProps('antebraco', 'Antebraços')"
          />

          <!-- Abdômen / Linha Central e Oblíquos -->
          <path
            :id="`${idPrefix}muscle-front-abdomen`"
            d="M68 88 L92 88 L90 126 C88 132 84 136 80 136 C76 136 72 132 70 126 Z"
            :class="getMuscleClass('abdomen')"
            @click="emitMuscleClick('abdomen')"
            v-bind="getMuscleProps('abdomen', 'Abdômen & Core')"
          />

          <!-- Quadríceps (Vasto Lateral, Medial, Reto Femoral) -->
          <path
            :id="`${idPrefix}muscle-front-quadriceps-left`"
            d="M65 144 C63 170 65 198 68 214 C73 214 77 202 78 185 C79 166 77 148 74 144 Z"
            :class="getMuscleClass('quadriceps')"
            @click="emitMuscleClick('quadriceps')"
            v-bind="getMuscleProps('quadriceps', 'Quadríceps')"
          />
          <path
            :id="`${idPrefix}muscle-front-quadriceps-right`"
            d="M95 144 C97 170 95 198 92 214 C87 214 83 202 82 185 C81 166 83 148 86 144 Z"
            :class="getMuscleClass('quadriceps')"
            @click="emitMuscleClick('quadriceps')"
            v-bind="getMuscleProps('quadriceps', 'Quadríceps')"
          />

          <!-- Panturrilhas Anteriores / Tibial -->
          <path
            :id="`${idPrefix}muscle-front-panturrilha-left`"
            d="M66 226 C64 240 66 262 70 274 C73 274 76 264 76 248 C76 235 73 226 68 226 Z"
            :class="getMuscleClass('panturrilha')"
            @click="emitMuscleClick('panturrilha')"
            v-bind="getMuscleProps('panturrilha', 'Panturrilhas')"
          />
          <path
            :id="`${idPrefix}muscle-front-panturrilha-right`"
            d="M94 226 C96 240 94 262 90 274 C87 274 84 264 84 248 C84 235 87 226 92 226 Z"
            :class="getMuscleClass('panturrilha')"
            @click="emitMuscleClick('panturrilha')"
            v-bind="getMuscleProps('panturrilha', 'Panturrilhas')"
          />
        </svg>
      </div>

      <!-- COSTAS (Posterior) -->
      <div v-if="activeView === 'both' || activeView === 'back'" class="flex flex-col items-center">
        <span class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">Costas</span>
        <svg
          :id="`${idPrefix}body-back`"
          viewBox="0 0 160 300"
          class="w-32 sm:w-36 h-60 drop-shadow-md transition-all"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- Silhueta Base / Fundo Neutro -->
          <g class="fill-slate-800/80 stroke-slate-700/60" stroke-width="1.2" stroke-linejoin="round">
            <!-- Cabeça e Pescoço -->
            <ellipse cx="80" cy="22" rx="14" ry="17" />
            <path d="M72 38 L88 38 L94 48 L66 48 Z" />

            <!-- Tronco e Braços base -->
            <path d="M66 48 L94 48 L110 58 L114 96 L118 136 L114 165 L108 170 L104 150 L102 110 L94 135 L66 135 L58 110 L56 150 L52 170 L46 165 L42 136 L46 96 L50 58 Z" />

            <!-- Pernas base -->
            <path d="M66 135 L78 142 L82 142 L94 135 L96 185 L94 240 L92 285 L84 290 L80 286 L80 152 L76 286 L72 290 L64 285 L62 240 L64 185 Z" />
          </g>

          <!-- GRUPOS MUSCULARES DORSAL / POSTERIOR ATIVÁVEIS -->

          <!-- Trapézio & Costas Superiores -->
          <path
            :id="`${idPrefix}muscle-back-trapezio`"
            d="M68 44 L92 44 L96 64 L80 78 L64 64 Z"
            :class="getMuscleClass('costas')"
            @click="emitMuscleClick('costas')"
            v-bind="getMuscleProps('costas', 'Trapézio & Dorsais Superiores')"
          />

          <!-- Deltoide Posterior / Ombros -->
          <path
            :id="`${idPrefix}muscle-back-ombro-left`"
            d="M52 56 C48 64 47 74 48 84 C52 84 56 78 58 70 C58 64 56 58 52 56 Z"
            :class="getMuscleClass('ombro')"
            @click="emitMuscleClick('ombro')"
            v-bind="getMuscleProps('ombro', 'Deltoides Posteriores')"
          />
          <path
            :id="`${idPrefix}muscle-back-ombro-right`"
            d="M108 56 C112 64 113 74 112 84 C108 84 104 78 102 70 C102 64 104 58 108 56 Z"
            :class="getMuscleClass('ombro')"
            @click="emitMuscleClick('ombro')"
            v-bind="getMuscleProps('ombro', 'Deltoides Posteriores')"
          />

          <!-- Tríceps -->
          <path
            :id="`${idPrefix}muscle-back-triceps-left`"
            d="M46 84 C44 94 44 106 48 114 C52 112 55 106 55 96 C55 90 52 86 46 84 Z"
            :class="getMuscleClass('triceps')"
            @click="emitMuscleClick('triceps')"
            v-bind="getMuscleProps('triceps', 'Tríceps')"
          />
          <path
            :id="`${idPrefix}muscle-back-triceps-right`"
            d="M114 84 C116 94 116 106 112 114 C108 112 105 106 105 96 C105 90 108 86 114 84 Z"
            :class="getMuscleClass('triceps')"
            @click="emitMuscleClick('triceps')"
            v-bind="getMuscleProps('triceps', 'Tríceps')"
          />

          <!-- Costas / Grande Dorsal -->
          <path
            :id="`${idPrefix}muscle-back-costas`"
            d="M62 66 L98 66 L94 106 C88 112 80 114 80 114 C80 114 72 112 66 106 Z"
            :class="getMuscleClass('costas')"
            @click="emitMuscleClick('costas')"
            v-bind="getMuscleProps('costas', 'Grandes Dorsais / Costas')"
          />

          <!-- Lombar -->
          <path
            :id="`${idPrefix}muscle-back-lombar`"
            d="M68 108 L92 108 L90 128 L70 128 Z"
            :class="getMuscleClass('lombar')"
            @click="emitMuscleClick('lombar')"
            v-bind="getMuscleProps('lombar', 'Lombar')"
          />

          <!-- Glúteos -->
          <path
            :id="`${idPrefix}muscle-back-gluteo-left`"
            d="M65 130 C64 145 66 160 76 162 C78 152 78 138 78 130 Z"
            :class="getMuscleClass('gluteo')"
            @click="emitMuscleClick('gluteo')"
            v-bind="getMuscleProps('gluteo', 'Glúteos')"
          />
          <path
            :id="`${idPrefix}muscle-back-gluteo-right`"
            d="M95 130 C96 145 94 160 84 162 C82 152 82 138 82 130 Z"
            :class="getMuscleClass('gluteo')"
            @click="emitMuscleClick('gluteo')"
            v-bind="getMuscleProps('gluteo', 'Glúteos')"
          />

          <!-- Posterior de Coxa (Isquiotibiais) -->
          <path
            :id="`${idPrefix}muscle-back-posterior-left`"
            d="M66 165 C64 185 66 205 68 216 C73 216 77 205 78 188 C79 174 78 165 76 165 Z"
            :class="getMuscleClass('posterior')"
            @click="emitMuscleClick('posterior')"
            v-bind="getMuscleProps('posterior', 'Posteriores de Coxa')"
          />
          <path
            :id="`${idPrefix}muscle-back-posterior-right`"
            d="M94 165 C96 185 94 205 92 216 C87 216 83 205 82 188 C81 174 82 165 84 165 Z"
            :class="getMuscleClass('posterior')"
            @click="emitMuscleClick('posterior')"
            v-bind="getMuscleProps('posterior', 'Posteriores de Coxa')"
          />

          <!-- Panturrilhas Dorsais (Gastrocnêmio & Sóleo) -->
          <path
            :id="`${idPrefix}muscle-back-panturrilha-left`"
            d="M65 224 C62 242 64 264 68 274 C73 274 76 260 76 242 C76 230 73 224 67 224 Z"
            :class="getMuscleClass('panturrilha')"
            @click="emitMuscleClick('panturrilha')"
            v-bind="getMuscleProps('panturrilha', 'Panturrilhas')"
          />
          <path
            :id="`${idPrefix}muscle-back-panturrilha-right`"
            d="M95 224 C98 242 96 264 92 274 C87 274 84 260 84 242 C84 230 87 224 93 224 Z"
            :class="getMuscleClass('panturrilha')"
            @click="emitMuscleClick('panturrilha')"
            v-bind="getMuscleProps('panturrilha', 'Panturrilhas')"
          />
        </svg>
      </div>

    </div>

    <!-- Legenda dos Músculos Ativos do Treino -->
    <div v-if="showLegend && activeMusclesList.length > 0" class="mt-3 flex items-center justify-center flex-wrap gap-1.5 max-w-sm">
      <span
        v-for="m in activeMusclesList"
        :key="m"
        class="text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm transition-transform hover:scale-105"
        :class="isSecondaryMuscle(m)
          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          : 'bg-orange-500/25 text-orange-300 border border-orange-500/50 font-black'"
      >
        <span class="w-1.5 h-1.5 rounded-full" :class="isSecondaryMuscle(m) ? 'bg-amber-400' : 'bg-orange-500 animate-pulse'"></span>
        {{ muscleLabels[m] || m }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { MUSCLE_LABELS } from '../db/customExercises';

const props = defineProps({
  highlightedMuscles: {
    type: Array,
    default: () => []
  },
  secondaryMuscles: {
    type: Array,
    default: () => []
  },
  idPrefix: {
    type: String,
    default: ''
  },
  showControls: {
    type: Boolean,
    default: false
  },
  showLegend: {
    type: Boolean,
    default: true
  },
  interactive: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['select-muscle']);

const activeView = ref('both'); // 'both' | 'front' | 'back'
const muscleLabels = MUSCLE_LABELS;

const normalizedPrimary = computed(() => {
  return (props.highlightedMuscles || []).map(m => String(m).toLowerCase().trim());
});

const normalizedSecondary = computed(() => {
  return (props.secondaryMuscles || []).map(m => String(m).toLowerCase().trim());
});

const activeMusclesList = computed(() => {
  const set = new Set([...normalizedPrimary.value, ...normalizedSecondary.value]);
  return Array.from(set);
});

function isPrimaryMuscle(muscle) {
  return normalizedPrimary.value.includes(muscle.toLowerCase());
}

function isSecondaryMuscle(muscle) {
  return normalizedSecondary.value.includes(muscle.toLowerCase()) && !isPrimaryMuscle(muscle);
}

function getMuscleClass(muscle) {
  const primary = isPrimaryMuscle(muscle);
  const secondary = isSecondaryMuscle(muscle);

  if (primary) {
    return 'fill-orange-500 stroke-orange-300 opacity-95 transition-all duration-300 filter drop-shadow(0 0 3px rgba(249,115,22,0.8)) ' + (props.interactive ? 'cursor-pointer hover:opacity-100 hover:scale-105' : '');
  }
  if (secondary) {
    return 'fill-amber-400/80 stroke-amber-300 opacity-80 transition-all duration-300 ' + (props.interactive ? 'cursor-pointer hover:opacity-95' : '');
  }
  return 'fill-slate-800/60 stroke-slate-700/40 opacity-40 transition-all duration-300 ' + (props.interactive ? 'cursor-pointer hover:opacity-75 hover:fill-slate-700' : '');
}

function getMuscleProps(muscle, title) {
  return {
    'aria-label': `${title}${isPrimaryMuscle(muscle) ? ' (Músculo Primário)' : isSecondaryMuscle(muscle) ? ' (Músculo Secundário)' : ''}`,
    role: props.interactive ? 'button' : 'img',
    title
  };
}

function emitMuscleClick(muscle) {
  if (props.interactive) {
    emit('select-muscle', muscle);
  }
}
</script>
