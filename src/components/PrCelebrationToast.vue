<template>
  <Transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-[-100%] opacity-0 scale-95"
    enter-to-class="translate-y-0 opacity-100 scale-100"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-90"
  >
    <div
      v-if="isOpen"
      id="toast-pr-celebration"
      role="alert"
      aria-live="assertive"
      @click="emit('close')"
      class="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 p-4 rounded-2xl shadow-2xl border-2 border-amber-300 cursor-pointer select-none"
    >
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-xl bg-slate-950/20 border border-slate-950/30 flex items-center justify-center text-2xl flex-shrink-0 animate-bounce">
          ⚡
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950 text-amber-300">
              Novo Recorde Pessoal (PR)
            </span>
            <span class="text-[10px] font-bold text-slate-900">+150 XP</span>
          </div>
          <h4 class="text-sm font-black text-slate-950 truncate mt-0.5">
            {{ exerciseName }}
          </h4>
          <p class="text-xs font-black text-slate-900">
            {{ weightKg }} kg {{ reps ? `× ${reps} reps` : '' }}
            <span v-if="diffKg > 0" class="text-slate-950 font-extrabold ml-1">
              (▲ +{{ diffKg }} kg)
            </span>
          </p>
        </div>
        <button
          type="button"
          aria-label="Fechar"
          class="text-slate-950 hover:opacity-75 font-black text-sm p-1"
        >
          ✕
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { watch } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  exerciseName: {
    type: String,
    default: 'Exercício'
  },
  weightKg: {
    type: Number,
    default: 0
  },
  reps: {
    type: Number,
    default: 0
  },
  diffKg: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['close']);

let timer = null;

watch(
  () => props.isOpen,
  (open) => {
    if (timer) clearTimeout(timer);
    if (open) {
      timer = setTimeout(() => {
        emit('close');
      }, 4000);
    }
  }
);
</script>
