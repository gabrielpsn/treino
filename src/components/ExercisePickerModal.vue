<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
    <div class="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-white">Substituir Exercício</h3>
        <button @click="$emit('close')" class="text-slate-400 hover:text-white p-1 rounded-lg">✕</button>
      </div>

      <p class="text-xs text-slate-400 mb-4">
        Escolha uma alternativa compatível com <strong class="text-amber-400">{{ currentExercise?.name }}</strong>:
      </p>

      <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
        <button 
          v-for="alt in alternatives" 
          :key="alt.id"
          @click="selectAlternative(alt)"
          class="w-full text-left p-3 rounded-xl border border-slate-800 hover:border-amber-500/50 bg-slate-950/50 hover:bg-amber-500/10 transition-all flex items-center justify-between group"
        >
          <div>
            <h5 class="text-sm font-semibold text-slate-200 group-hover:text-white">{{ alt.name }}</h5>
            <span class="text-xs text-slate-500">{{ alt.defaultSeries }} • Descanso {{ alt.rest }}</span>
          </div>
          <span class="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">Trocar →</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { EXERCISE_CATALOG } from '../engine/knowledge/exercises';

const props = defineProps({
  isOpen: Boolean,
  currentExercise: Object
});

const emit = defineEmits(['close', 'select']);

const alternatives = computed(() => {
  if (!props.currentExercise) return [];
  return EXERCISE_CATALOG.filter(ex => 
    ex.muscle === props.currentExercise.muscle && ex.id !== props.currentExercise.id
  );
});

function selectAlternative(alt) {
  emit('select', alt);
  emit('close');
}
</script>
