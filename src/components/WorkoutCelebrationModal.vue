<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop com Blur -->
    <div
      id="celebration-backdrop"
      class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      @click="emit('close')"
      aria-hidden="true"
    ></div>

    <!-- Modal Card -->
    <div
      id="modal-workout-celebration"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
      class="relative w-full max-w-lg bg-white border-2 border-[#DCE2FE] rounded-3xl p-5 sm:p-7 shadow-2xl z-10 text-[#1E293B] space-y-5 animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Topo: Ícone e Título -->
      <div class="text-center space-y-1">
        <div class="w-16 h-16 rounded-2xl bg-[#FBBF04]/20 border border-[#FBBF04] mx-auto flex items-center justify-center text-3xl shadow-sm">
          🏆
        </div>
        <h3 id="celebration-title" class="text-2xl font-black text-[#1E293B] tracking-tight">
          Treino Concluído!
        </h3>
        <p class="text-xs text-[#64748B]">
          Excelente execução. Seus ganhos mecânicos e registros foram consolidados.
        </p>
      </div>

      <!-- Card de Tonelagem e Impacto -->
      <div class="p-4 rounded-2xl bg-[#ECEEFE] border border-[#DCE2FE] text-center space-y-1">
        <span class="text-[10px] font-bold uppercase tracking-wider text-[#007BFF]">
          Volume Mecânico Total Levantado
        </span>
        <div class="text-3xl sm:text-4xl font-black text-[#1E293B]">
          {{ tonnageKg.toLocaleString('pt-BR') }} <span class="text-base font-extrabold text-[#64748B]">kg</span>
        </div>
        <p class="text-xs text-[#007BFF] font-bold">
          ⚡ {{ realWorldEquivalence }}
        </p>
      </div>

      <!-- Métricas Rápidas: Séries e XP -->
      <div class="grid grid-cols-2 gap-3 text-center">
        <div class="p-3 rounded-xl bg-white border border-[#DCE2FE] shadow-xs">
          <span class="block text-[10px] font-bold uppercase text-[#64748B]">Séries Válidas</span>
          <span class="text-xl font-black text-[#1E293B]">{{ doneSets }} séries</span>
        </div>
        <div class="p-3 rounded-xl bg-white border border-[#DCE2FE] shadow-xs">
          <span class="block text-[10px] font-bold uppercase text-[#64748B]">Iron XP Ganho</span>
          <span class="text-xl font-black text-[#FBBF04]">+{{ earnedXp }} XP</span>
        </div>
      </div>

      <!-- Conquistas / Badges Desbloqueados -->
      <div v-if="newBadges && newBadges.length > 0" class="p-3.5 rounded-2xl bg-[#FBBF04]/10 border border-[#FBBF04]/40 space-y-2">
        <div class="flex items-center gap-1.5 text-xs font-black text-[#1E293B] uppercase">
          <span>✨</span>
          <span>Nova Conquista Desbloqueada!</span>
        </div>
        <div class="space-y-2">
          <div
            v-for="badge in newBadges"
            :key="badge.id"
            class="flex items-center gap-3 p-2 rounded-xl bg-white border border-[#DCE2FE]"
          >
            <span class="text-2xl">{{ badge.icon }}</span>
            <div class="min-w-0 text-left">
              <h5 class="text-xs font-black text-[#1E293B]">{{ badge.title }}</h5>
              <p class="text-[10px] text-[#64748B] truncate">{{ badge.description }}</p>
            </div>
            <span class="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FBBF04] text-[#1E293B]">
              +{{ badge.xpReward }} XP
            </span>
          </div>
        </div>
      </div>

      <!-- Botão CTA Fechar -->
      <div>
        <button
          type="button"
          id="btn-close-celebration"
          @click="emit('close')"
          class="tap-btn w-full py-3 px-4 rounded-xl bg-[#FBBF04] hover:bg-[#f5a623] text-[#1E293B] font-black text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>Continuar Evoluindo</span>
          <span>→</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isOpen: Boolean,
  tonnageKg: {
    type: Number,
    default: 0
  },
  doneSets: {
    type: Number,
    default: 0
  },
  earnedXp: {
    type: Number,
    default: 0
  },
  realWorldEquivalence: {
    type: String,
    default: ''
  },
  newBadges: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close']);
</script>
