<template>
  <div
    id="widget-live-tonnage"
    class="p-4 rounded-2xl bg-[#ECEEFE] border border-[#DCE2FE] text-[#1E293B] shadow-xs space-y-2.5 transition-all"
  >
    <div class="flex items-center justify-between gap-2 flex-wrap">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-[#007BFF] animate-pulse"></span>
        <span class="text-xs font-black uppercase tracking-wider text-[#007BFF]">
          Impacto Mecânico do Treino
        </span>
      </div>

      <div class="flex items-center gap-2 text-xs">
        <span v-if="prsCount > 0" id="badge-session-prs" class="px-2 py-0.5 rounded-full bg-[#FBBF04] text-[#1E293B] font-black text-[10px] shadow-xs flex items-center gap-1">
          <span>🔥</span> {{ prsCount }} {{ prsCount === 1 ? 'Novo PR' : 'Novos PRs' }}
        </span>
        <span class="text-[11px] font-bold text-[#64748B]">
          {{ doneSets }} de {{ totalSets }} séries concluídas
        </span>
      </div>
    </div>

    <!-- Indicador de Tonelagem -->
    <div class="flex items-baseline justify-between gap-3 flex-wrap pt-0.5">
      <div>
        <p class="text-2xl sm:text-3xl font-black text-[#1E293B] tracking-tight">
          {{ tonnageKg.toLocaleString('pt-BR') }} <span class="text-sm font-extrabold text-[#64748B]">kg</span>
        </p>
        <p id="text-real-world-equivalence" class="text-xs text-[#007BFF] font-semibold mt-0.5 flex items-center gap-1">
          <span>⚡</span> {{ realWorldEquivalence }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <div class="px-3 py-1.5 rounded-xl bg-white border border-[#DCE2FE] text-center shadow-xs">
          <span class="block text-[9px] font-bold uppercase text-[#64748B]">XP Estimado</span>
          <span class="text-sm font-black text-[#FBBF04]">+{{ earnedXp }} XP</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  tonnageKg: {
    type: Number,
    default: 0
  },
  doneSets: {
    type: Number,
    default: 0
  },
  totalSets: {
    type: Number,
    default: 0
  },
  prsCount: {
    type: Number,
    default: 0
  },
  earnedXp: {
    type: Number,
    default: 0
  },
  realWorldEquivalence: {
    type: String,
    default: 'Aguardando primeira série'
  }
});
</script>
