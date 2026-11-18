<template>
  <!-- Oferta para iniciantes -->
  <section v-if="offer" id="program-offer" class="rounded-2xl border-2 border-dashed border-[#0066FF]/40 bg-blue-50/60 p-4 space-y-2">
    <p class="text-sm font-black text-[#0F172A]">🎓 Novo na academia? Faça o programa "Primeiros 30 dias"</p>
    <p class="text-xs text-[#475569] leading-relaxed">
      4 semanas guiadas: começa leve para aprender os movimentos e, aos poucos, você sobe os pesos com segurança.
      Uma dica nova por semana.
    </p>
    <div class="flex gap-2">
      <button type="button" id="btn-start-program" class="tap-btn flex-1 py-2.5 rounded-xl bg-[#0066FF] text-white text-sm font-black" @click="emit('start')">Começar programa</button>
      <button type="button" id="btn-dismiss-program" class="tap-btn px-3 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#475569]" @click="emit('dismiss')">Agora não</button>
    </div>
  </section>

  <!-- Programa em andamento -->
  <button
    v-else-if="info.phase === 'active'"
    type="button"
    id="program-progress-card"
    class="tap-btn w-full text-left rounded-2xl border border-[#E2E8F0] bg-white p-4 space-y-2 shadow-xs hover:border-[#0066FF]/40"
    @click="emit('open')"
  >
    <div class="flex items-center justify-between gap-2">
      <span class="text-sm font-black text-[#0F172A]">🎓 Semana {{ info.currentWeek }} de 4 · {{ info.current.title }}</span>
      <span class="text-[11px] font-bold text-[#0066FF]">Ver semana →</span>
    </div>
    <div class="grid grid-cols-4 gap-1" aria-hidden="true">
      <span
        v-for="w in info.weeks"
        :key="w.week"
        class="h-2 rounded-full"
        :class="w.status === 'done' ? 'bg-emerald-500' : w.status === 'partial' ? 'bg-amber-400' : w.status === 'current' ? 'bg-[#0066FF]' : 'bg-[#E2E8F0]'"
      ></span>
    </div>
    <p class="text-[11px] text-[#475569]">
      Esta semana: <strong>{{ info.current.done }} de {{ info.target }}</strong> treinos ·
      {{ info.current.sets }} séries de {{ info.current.reps }}, parando com {{ info.current.rir }} sobrando
    </p>
  </button>

  <!-- Hora da reavaliação -->
  <button
    v-else-if="info.phase === 'review'"
    type="button"
    id="program-review-card"
    class="tap-btn w-full text-left rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 shadow-md"
    @click="emit('open')"
  >
    <p class="text-sm font-black">🏁 Você completou as 4 semanas!</p>
    <p class="text-xs text-emerald-50">Veja sua evolução e escolha o próximo passo.</p>
  </button>
</template>

<script setup>
defineProps({
  info: { type: Object, required: true },
  offer: Boolean
});
const emit = defineEmits(['start', 'dismiss', 'open']);
</script>
