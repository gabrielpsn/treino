<template>
  <section id="today-workout-card" class="rounded-3xl bg-gradient-to-br from-[#0066FF] to-[#004ACC] text-white p-5 shadow-lg space-y-4">
    <div>
      <p class="text-xs font-bold text-blue-100">{{ greeting }}, {{ firstName }} 👋</p>
      <template v-if="split">
        <h2 id="today-workout-title" class="text-xl font-black leading-tight mt-1">
          {{ doneToday ? 'Treino de hoje concluído! 🎉' : `Hoje é dia de: ${split.title}` }}
        </h2>
        <p class="text-xs text-blue-100 mt-1">
          <template v-if="doneToday">Descanse e se alimente bem. Amanhã a próxima ficha aparece aqui.</template>
          <template v-else>
            {{ split.exercises?.length || 0 }} exercícios · cerca de {{ minutes }} min
            <span v-if="muscles"> · {{ muscles }}</span>
          </template>
        </p>
      </template>
      <h2 v-else class="text-xl font-black mt-1">Seu plano está sendo preparado…</h2>
    </div>

    <div v-if="split" class="flex flex-col sm:flex-row gap-2">
      <button
        v-if="!doneToday"
        type="button"
        id="btn-start-today"
        class="tap-btn flex-1 min-h-[52px] rounded-2xl bg-[#F59E0B] hover:bg-[#D97706] text-[#0F172A] text-base font-black shadow-md"
        @click="emit('start')"
      >▶ Começar treino de hoje</button>
      <button
        type="button"
        id="btn-view-today"
        class="tap-btn flex-1 min-h-[48px] rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-sm font-bold"
        @click="emit('view')"
      >{{ doneToday ? 'Ver a ficha' : 'Ver exercícios antes' }}</button>
    </div>

    <p v-if="weekPlanned" class="text-[11px] text-blue-100">
      Esta semana: <strong class="text-white">{{ weekDone }} de {{ weekPlanned }}</strong> treinos
    </p>

    <!-- Primeiros passos: só para quem acabou de chegar -->
    <div v-if="showFirstSteps" id="first-steps" class="rounded-2xl bg-white text-[#0F172A] p-4 space-y-2">
      <div class="flex items-center justify-between">
        <p class="text-sm font-black">🧭 Primeiros passos</p>
        <button type="button" id="btn-dismiss-first-steps" class="tap-btn text-[11px] font-bold text-[#64748B] underline" @click="emit('dismiss-steps')">Ocultar</button>
      </div>
      <ol class="space-y-1.5">
        <li v-for="(item, i) in steps" :key="item.id">
          <button
            type="button"
            :id="`first-step-${item.id}`"
            class="tap-btn w-full flex items-center justify-start gap-3 rounded-xl border px-3 py-2 text-left text-xs"
            :class="item.done ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-[#E2E8F0] hover:bg-[#F8FAFC]'"
            @click="emit(item.action)"
          >
            <span class="w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center text-[11px] font-black" :class="item.done ? 'bg-emerald-500 text-white' : 'bg-[#F1F5F9] text-[#0F172A]'">{{ item.done ? '✓' : i + 1 }}</span>
            <span>
              <strong class="block">{{ item.title }}</strong>
              <span class="text-[#64748B]">{{ item.hint }}</span>
            </span>
          </button>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  userName: { type: String, default: '' },
  split: { type: Object, default: null },
  doneToday: Boolean,
  minutes: { type: Number, default: 0 },
  muscles: { type: String, default: '' },
  weekDone: { type: Number, default: 0 },
  weekPlanned: { type: Number, default: 0 },
  showFirstSteps: Boolean,
  stepsDone: { type: Object, default: () => ({}) }
});
const emit = defineEmits(['start', 'view', 'dismiss-steps', 'open-glossary', 'open-body-progress']);

const firstName = computed(() => (props.userName || 'atleta').trim().split(/\s+/)[0]);
const greeting = computed(() => {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
});

const steps = computed(() => [
  { id: 'glossary', action: 'open-glossary', title: 'Entenda os termos', hint: 'Série, repetição, carga… em 1 minuto.', done: !!props.stepsDone.glossary },
  { id: 'workout', action: 'start', title: 'Faça seu primeiro treino', hint: 'O modo treino guia exercício por exercício.', done: !!props.stepsDone.workout },
  { id: 'weight', action: 'open-body-progress', title: 'Registre seu peso', hint: 'Para acompanhar sua evolução.', done: !!props.stepsDone.weight }
]);
</script>
