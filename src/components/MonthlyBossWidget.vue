<template>
  <div
    id="widget-monthly-boss"
    class="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white border border-indigo-900/50 shadow-md space-y-4 relative overflow-hidden"
  >
    <!-- Brilho de Fundo Decorativo -->
    <div class="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-rose-500/10 blur-3xl pointer-events-none"></div>

    <!-- Cabeçalho do Boss -->
    <div class="flex items-center justify-between gap-3 relative z-10 flex-wrap">
      <div class="flex items-center gap-3">
        <div class="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-3xl shadow-xs animate-pulse flex-shrink-0">
          {{ bossStatus.boss.icon }}
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
              Chefe do Mês • {{ bossStatus.monthKey }}
            </span>
            <span v-if="bossStatus.isDefeated" class="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              🏆 Derrotado!
            </span>
          </div>
          <h4 class="text-base sm:text-lg font-black text-white mt-0.5">
            {{ bossStatus.boss.name }}
          </h4>
          <p class="text-xs text-slate-300">{{ bossStatus.boss.title }}</p>
        </div>
      </div>

      <!-- Dias Restantes -->
      <div class="text-right flex-shrink-0">
        <span class="block text-[10px] font-bold uppercase text-slate-400">Tempo Restante</span>
        <span class="text-sm font-black text-amber-400">⏳ {{ bossStatus.daysRemaining }} dias</span>
      </div>
    </div>

    <!-- Barra de Vida do Boss (HP / Tonelagem) -->
    <div class="space-y-1.5 relative z-10">
      <div class="flex items-center justify-between text-xs font-bold">
        <span class="text-slate-300">
          {{ bossStatus.isDefeated ? 'HP Esgotado' : `HP: ${bossStatus.currentHp.toLocaleString('pt-BR')} kg restantes` }}
        </span>
        <span :class="bossStatus.isDefeated ? 'text-emerald-400' : 'text-rose-400'">
          {{ bossStatus.damagePercent }}% de Dano Causado
        </span>
      </div>

      <div class="w-full bg-slate-950/60 h-3.5 rounded-full overflow-hidden border border-slate-700/60 p-0.5">
        <div
          class="h-full rounded-full transition-all duration-700 shadow-sm"
          :class="bossStatus.isDefeated
            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
            : 'bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600'"
          :style="{ width: `${bossStatus.damagePercent}%` }"
        ></div>
      </div>

      <div class="flex items-center justify-between text-[10px] text-slate-400">
        <span>Dano causado: {{ bossStatus.totalDamageKg.toLocaleString('pt-BR') }} kg</span>
        <span>Meta: {{ bossStatus.maxHp.toLocaleString('pt-BR') }} kg</span>
      </div>
    </div>

    <!-- Rodapé: Recompensa / Reivindicação -->
    <div class="pt-1 flex items-center justify-between gap-3 relative z-10 flex-wrap">
      <p class="text-[11px] text-slate-300 leading-tight">
        <template v-if="bossStatus.isDefeated">
          🎉 Você destruiu o Colosso de aço deste mês com o poder da sobrecarga progressiva!
        </template>
        <template v-else>
          ⚡ Faltam <strong>{{ bossStatus.neededKgPerDay.toLocaleString('pt-BR') }} kg/dia</strong> para derrotar o chefe antes do fim do mês.
        </template>
      </p>

      <div v-if="bossStatus.isDefeated" class="flex-shrink-0">
        <button
          v-if="!isClaimed"
          type="button"
          id="btn-claim-boss-reward"
          @click="emit('claim-reward', { monthKey: bossStatus.monthKey, rewardCoins: bossStatus.boss.rewardCoins, rewardXp: bossStatus.boss.rewardXp })"
          class="tap-btn px-4 py-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5"
        >
          <span>🏆</span>
          <span>Resgatar (+{{ bossStatus.boss.rewardCoins }} 🪙 & +{{ bossStatus.boss.rewardXp }} XP)</span>
        </button>

        <span
          v-else
          class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black"
        >
          <span>✓</span>
          <span>Recompensa Resgatada</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { calculateMonthlyBossStatus } from '../engine/gamification.js';

const props = defineProps({
  monthlyTonnageKg: {
    type: Number,
    default: 0
  },
  claimedMonths: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['claim-reward']);

const bossStatus = computed(() => {
  return calculateMonthlyBossStatus({
    monthlyTonnageKg: props.monthlyTonnageKg,
    date: new Date()
  });
});

const isClaimed = computed(() => {
  return props.claimedMonths.includes(bossStatus.value.monthKey);
});
</script>
