<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop com Blur -->
    <div
      id="raid-backdrop"
      class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      @click="emit('close')"
      aria-hidden="true"
    ></div>

    <!-- Modal Card -->
    <div
      id="modal-community-raid"
      role="dialog"
      aria-modal="true"
      aria-labelledby="raid-title"
      class="relative w-full max-w-lg bg-white border border-[#E2E8F0] rounded-3xl p-5 sm:p-7 shadow-2xl z-10 text-[#0F172A] space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Topo: Título da Raid e Monumento -->
      <div class="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
        <div class="flex items-center gap-3">
          <div class="w-13 h-13 rounded-2xl bg-[#0066FF]/10 border border-[#0066FF]/30 flex items-center justify-center text-3xl shadow-xs flex-shrink-0">
            {{ raidStatus.raid.icon }}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#0066FF] text-white">
                Raid Comunitária Mensal
              </span>
              <span v-if="raidStatus.isCompleted" class="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                🏆 Concluída!
              </span>
            </div>
            <h3 id="raid-title" class="text-base sm:text-lg font-black text-[#0F172A] tracking-tight mt-0.5">
              {{ raidStatus.raid.name }}
            </h3>
            <p class="text-xs text-[#64748B]">
              {{ raidStatus.raid.description }}
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-close-raid"
          @click="emit('close')"
          aria-label="Fechar Raid"
          class="tap-btn p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-colors"
        >
          ✕
        </button>
      </div>

      <!-- Barra de Progresso Coletivo Global -->
      <div class="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-indigo-900/50 shadow-md space-y-3 relative overflow-hidden">
        <div class="flex items-center justify-between text-xs font-bold">
          <div>
            <span class="text-[10px] uppercase text-indigo-300 block">Progresso Global</span>
            <span class="text-base font-black text-white">
              {{ (raidStatus.totalRaidKg / 1000).toLocaleString('pt-BR') }} <span class="text-xs text-indigo-200">/ {{ (raidStatus.totalGoalKg / 1000).toLocaleString('pt-BR') }} toneladas</span>
            </span>
          </div>
          <div class="text-right">
            <span class="text-sm font-black text-amber-400">{{ raidStatus.progressPercent }}%</span>
            <span class="block text-[10px] text-slate-300">⏳ {{ raidStatus.daysRemaining }} dias restantes</span>
          </div>
        </div>

        <!-- Barra com marcadores -->
        <div class="relative w-full bg-slate-800/80 h-3 rounded-full overflow-hidden border border-slate-700">
          <div
            class="h-full bg-gradient-to-r from-[#0066FF] via-indigo-500 to-[#F59E0B] transition-all duration-700 ease-out"
            :style="{ width: `${raidStatus.progressPercent}%` }"
          ></div>
        </div>
      </div>

      <!-- Contribuição Pessoal do Atleta -->
      <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-between gap-3 shadow-xs">
        <div class="flex items-center gap-2.5">
          <span class="text-2xl">💪</span>
          <div>
            <span class="block text-[10px] font-bold uppercase text-amber-900">Sua Força Mecânica Aplicada</span>
            <h4 class="text-sm font-black text-[#0F172A]">
              {{ raidStatus.userMonthlyTonnageKg.toLocaleString('pt-BR') }} kg levantados
            </h4>
          </div>
        </div>
        <div class="text-right">
          <span class="text-xs font-black text-amber-700">{{ raidStatus.userPercent }}%</span>
          <span class="block text-[9px] text-[#64748B]">do monumento</span>
        </div>
      </div>

      <!-- Marcos da Raid & Recompensas -->
      <div class="space-y-2 pt-1">
        <h4 class="text-xs font-black uppercase text-[#64748B] tracking-wider px-1">
          Marcos de Engenharia & Recompensas
        </h4>

        <div class="space-y-2">
          <div
            v-for="milestone in raidStatus.milestones"
            :key="milestone.percent"
            class="p-3 rounded-xl border flex items-center justify-between gap-3 transition-all"
            :class="milestone.isReached
              ? milestone.isClaimed
                ? 'bg-slate-50 border-slate-200 opacity-80'
                : 'bg-emerald-500/10 border-emerald-500/40 shadow-xs'
              : 'bg-white border-[#E2E8F0]'"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <span
                class="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                :class="milestone.isReached ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-[#64748B]'"
              >
                {{ milestone.percent }}%
              </span>
              <div class="min-w-0">
                <span class="text-xs font-black text-[#0F172A] block truncate">
                  {{ milestone.label }}
                </span>
                <span class="text-[10px] text-[#64748B] block">
                  +{{ milestone.coins }} 🪙 • +{{ milestone.xp }} XP {{ milestone.unlockTitleId ? '• 👑 Título' : '' }}
                </span>
              </div>
            </div>

            <!-- Botão de Ação do Marco -->
            <button
              v-if="milestone.canClaim"
              type="button"
              :id="`btn-claim-raid-${milestone.percent}`"
              @click="handleClaim(milestone)"
              class="tap-btn px-3 py-1.5 rounded-lg bg-[#F59E0B] hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xs transition-transform flex items-center gap-1 flex-shrink-0"
            >
              <span>Resgatar</span>
            </button>
            <span
              v-else-if="milestone.isClaimed"
              class="text-[10px] font-black text-emerald-600 flex items-center gap-0.5 flex-shrink-0"
            >
              <span>✓ Resgatado</span>
            </span>
            <span
              v-else
              class="text-[10px] font-bold text-[#94A3B8] flex-shrink-0"
            >
              🔒 Bloqueado
            </span>
          </div>
        </div>
      </div>

      <!-- Botões de Ação do Rodapé -->
      <div class="pt-2 flex items-center gap-2">
        <button
          type="button"
          id="btn-confirm-raid"
          @click="emit('close')"
          class="tap-btn w-full py-3 px-4 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-black text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>Continuar Levantando Ferro</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { calculateActiveRaidStatus } from '../engine/gamification.js';

const props = defineProps({
  isOpen: Boolean,
  userMonthlyTonnageKg: {
    type: Number,
    default: 0
  },
  claimedMilestones: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'claim-milestone']);

const raidStatus = computed(() => {
  return calculateActiveRaidStatus({
    userMonthlyTonnageKg: props.userMonthlyTonnageKg,
    claimedMilestones: props.claimedMilestones,
    date: new Date()
  });
});

function handleClaim(milestone) {
  emit('claim-milestone', {
    milestonePercent: milestone.percent,
    rewardCoins: milestone.coins,
    rewardXp: milestone.xp,
    unlockTitleId: milestone.unlockTitleId || null
  });
}
</script>
