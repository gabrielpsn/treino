<template>
  <section
    v-if="evaluation && (evaluation.recommended || evaluation.inDeload)"
    id="deload-banner"
    class="rounded-2xl border p-4 space-y-2"
    :class="evaluation.inDeload ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'"
  >
    <template v-if="evaluation.inDeload">
      <p class="text-sm font-black text-emerald-900">🧘 Semana de deload ativa</p>
      <p class="text-xs text-emerald-900 leading-relaxed">
        Use cerca de {{ Math.round(evaluation.prescription.loadFactor * 100) }}% da carga de sempre, metade das séries
        e pare com {{ evaluation.prescription.targetRir }} repetições sobrando. A carga sugerida aparece em cada exercício.
      </p>
      <button id="btn-end-deload" type="button" class="tap-btn text-xs font-bold text-emerald-900 underline" @click="emit('end')">Encerrar deload</button>
    </template>
    <template v-else>
      <p class="text-sm font-black text-amber-900">⚠️ Que tal uma semana de deload?</p>
      <ul class="text-xs text-amber-900 list-disc pl-4">
        <li v-for="reason in evaluation.reasons" :key="reason">{{ reason }}</li>
      </ul>
      <p class="text-[11px] text-amber-900">Uma semana mais leve recupera articulações e sistema nervoso, e costuma destravar a progressão.</p>
      <div class="flex gap-2">
        <button id="btn-start-deload" type="button" class="tap-btn flex-1 py-2 rounded-xl bg-amber-500 text-white text-xs font-black" @click="emit('start')">Fazer deload esta semana</button>
        <button id="btn-dismiss-deload" type="button" class="tap-btn px-3 py-2 rounded-xl border border-amber-400 text-xs font-bold text-amber-900" @click="emit('dismiss')">Agora não</button>
      </div>
    </template>
  </section>
</template>

<script setup>
defineProps({ evaluation: { type: Object, default: null } });
const emit = defineEmits(['start', 'dismiss', 'end']);
</script>
