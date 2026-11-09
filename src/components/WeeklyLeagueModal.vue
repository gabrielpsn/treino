<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop com Blur -->
    <div
      id="league-backdrop"
      class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      @click="emit('close')"
      aria-hidden="true"
    ></div>

    <!-- Modal Card -->
    <div
      id="modal-weekly-league"
      role="dialog"
      aria-modal="true"
      aria-labelledby="league-title"
      class="relative w-full max-w-lg bg-white border border-[#E2E8F0] rounded-3xl p-5 sm:p-7 shadow-2xl z-10 text-[#0F172A] space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Topo: Título e Divisão Atual -->
      <div class="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs"
            :style="{ backgroundColor: `${leagueData.tier.color}20`, borderColor: leagueData.tier.color }"
          >
            {{ leagueData.tier.icon }}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 id="league-title" class="text-lg font-black text-[#0F172A] tracking-tight uppercase">
                {{ leagueData.tier.name }}
              </h3>
              <span class="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#0066FF] text-white">
                Sua Divisão
              </span>
            </div>
            <p class="text-xs text-[#64748B]">
              Compita com outros atletas pela zona de promoção semanal.
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-close-league"
          @click="emit('close')"
          aria-label="Fechar Liga"
          class="tap-btn p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-colors"
        >
          ✕
        </button>
      </div>

      <!-- Posição Atual do Atleta -->
      <div
        class="p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xs"
        :class="leagueData.isPromoted ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-[#F8FAFC] border border-[#E2E8F0]'"
      >
        <div class="flex items-center gap-3">
          <span class="text-2xl font-black text-[#0F172A]">#{{ leagueData.userPosition }}</span>
          <div>
            <span class="block text-[10px] font-bold uppercase text-[#64748B]">Sua Colocação</span>
            <h4 class="text-sm font-black text-[#0F172A]">
              {{ leagueData.isPromoted ? 'Zona de Promoção ⬆️' : 'Zona de Manutenção' }}
            </h4>
          </div>
        </div>
        <div class="text-right">
          <span class="text-xs font-black text-[#0066FF]">{{ userScore }} pts</span>
          <span class="block text-[10px] text-[#64748B]">nesta semana</span>
        </div>
      </div>

      <!-- Tabela da Liga (Top 10) -->
      <div class="space-y-2 pt-1">
        <div class="flex items-center justify-between text-[10px] font-bold uppercase text-[#64748B] px-3">
          <span>Atleta</span>
          <span>Pontos Semanal</span>
        </div>

        <div class="space-y-1.5">
          <div
            v-for="(athlete, idx) in leagueData.leaderboard"
            :key="athlete.name"
            :id="athlete.isUser ? 'league-user-row' : `league-row-${idx}`"
            class="p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all"
            :class="athlete.isUser
              ? 'bg-[#0066FF]/10 border-[#0066FF] shadow-xs'
              : athlete.inPromotionZone
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-white border-[#E2E8F0]'"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <span
                class="w-6 text-center font-black text-xs"
                :class="athlete.position === 1 ? 'text-amber-500 font-extrabold' : athlete.position <= 3 ? 'text-emerald-600' : 'text-[#64748B]'"
              >
                {{ athlete.position }}º
              </span>
              <span class="text-lg">{{ athlete.avatar }}</span>
              <div class="min-w-0">
                <span class="text-xs font-black truncate block" :class="athlete.isUser ? 'text-[#0066FF]' : 'text-[#0F172A]'">
                  {{ athlete.name }} {{ athlete.isUser ? '(Você)' : '' }}
                </span>
                <span v-if="athlete.inPromotionZone" class="text-[9px] font-bold text-emerald-600 block leading-none">
                  Promove ao fim da semana
                </span>
              </div>
            </div>

            <span class="text-xs font-black text-[#0F172A] flex-shrink-0">
              {{ athlete.score }} pts
            </span>
          </div>
        </div>
      </div>

      <!-- Explicação das Regras -->
      <p class="text-[11px] text-[#64748B] leading-relaxed pt-1 text-center">
        💡 Ganhe pontos realizando séries válidas (+10), batendo recordes pessoais (+50) e mantendo dias consecutivos de treino (+20). O Top 3 sobe de divisão no domingo!
      </p>

      <!-- Botão Fechar -->
      <div>
        <button
          type="button"
          id="btn-confirm-league"
          @click="emit('close')"
          class="tap-btn w-full py-3 px-4 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-black text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>Fechar & Voltar ao Treino</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { calculateLeagueLeaderboard } from '../engine/gamification.js';

const props = defineProps({
  isOpen: Boolean,
  userScore: {
    type: Number,
    default: 0
  },
  currentTier: {
    type: String,
    default: 'bronze'
  },
  userName: {
    type: String,
    default: 'Você'
  }
});

const emit = defineEmits(['close']);

const leagueData = computed(() => {
  return calculateLeagueLeaderboard({
    userScore: props.userScore,
    currentTier: props.currentTier,
    userName: props.userName
  });
});
</script>
