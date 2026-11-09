<template>
  <div
    id="widget-iron-status"
    class="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E2E8F0] text-[#0F172A] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
  >
    <!-- Lado Esquerdo: Patente, Nível e Barra de XP -->
    <div class="flex items-center gap-3 min-w-0 flex-1">
      <!-- Ícone da Patente -->
      <div
        class="w-11 h-11 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-2xl shadow-xs flex-shrink-0"
        :title="`Patente: ${levelData.patent}`"
      >
        <span>{{ levelData.patentIcon }}</span>
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs font-black tracking-tight text-[#0066FF] uppercase">
            {{ levelData.patent }}
          </span>
          <span class="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#F59E0B] text-[#0F172A] shadow-xs">
            Nv. {{ levelData.level }}
          </span>
          <span v-if="equippedTitleName" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-[#0F172A] border border-[#E2E8F0]">
            {{ equippedTitleIcon }} {{ equippedTitleName }}
          </span>
        </div>

        <!-- Barra de Progresso de XP -->
        <div class="mt-1.5 flex items-center gap-2">
          <div class="flex-1 bg-[#F1F5F9] h-2 rounded-full overflow-hidden border border-[#E2E8F0]" role="progressbar" :aria-valuenow="levelData.progressPercent" aria-valuemin="0" aria-valuemax="100">
            <div
              class="h-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] transition-all duration-500 rounded-full"
              :style="{ width: `${levelData.progressPercent}%` }"
            ></div>
          </div>
          <span class="text-[10px] font-bold text-[#64748B] flex-shrink-0">
            {{ levelData.progressPercent }}%
          </span>
        </div>

        <p class="text-[10px] text-[#64748B] mt-0.5">
          {{ levelData.xpIntoCurrentLevel }} / {{ levelData.costForNextLevel }} XP • 
          <span class="font-semibold text-[#0F172A]">Total: {{ levelData.totalXp }} XP</span>
        </p>
      </div>
    </div>

    <!-- Lado Direito: Ofensiva Semanal (Streak), Chama Diária, Escudos, Habilidades e Loja -->
    <div class="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-[#E2E8F0] pt-2 sm:pt-0 sm:pl-3 flex-shrink-0 flex-wrap">
      <!-- Chama de Streak Diário -->
      <div
        id="badge-daily-streak"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-400/30 shadow-xs"
        :title="`Sequência diária: ${dailyStreak} ${dailyStreak === 1 ? 'dia' : 'dias'} consecutivos de treino (${flameInfo.flameLabel})`"
      >
        <span class="text-sm">{{ flameInfo.flameEmoji }}</span>
        <div class="text-left">
          <span class="block text-[9px] font-bold uppercase text-amber-700 leading-none">Streak</span>
          <span class="text-xs font-black text-amber-800 leading-none">{{ dailyStreak }} {{ dailyStreak === 1 ? 'dia' : 'dias' }}</span>
        </div>
      </div>

      <!-- Sequência Semanal -->
      <div
        id="badge-weekly-streak"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs"
        title="Semanas consecutivas cumprindo a meta de treinos"
      >
        <span class="text-sm">📅</span>
        <div class="text-left">
          <span class="block text-[9px] font-bold uppercase text-[#64748B] leading-none">Ofensiva</span>
          <span class="text-xs font-black text-[#0F172A] leading-none">{{ streak }} sem</span>
        </div>
      </div>

      <!-- Escudos de Deload -->
      <div
        id="badge-deload-shields"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs"
        title="Escudos de recuperação para não perder a sequência em semanas de descanso/deload"
      >
        <span class="text-sm">🛡️</span>
        <div class="text-left">
          <span class="block text-[9px] font-bold uppercase text-[#64748B] leading-none">Escudos</span>
          <span class="text-xs font-black text-[#0F172A] leading-none">{{ shields }}/2</span>
        </div>
      </div>

      <!-- Botão Árvore de Habilidades RPG -->
      <button
        type="button"
        id="btn-open-skill-tree"
        @click="emit('open-skill-tree')"
        class="tap-btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-400/30 text-indigo-700 font-bold text-xs shadow-xs transition-all"
        title="Abrir Árvore de Habilidades por Grupo Muscular"
      >
        <span class="text-sm">⚔️</span>
        <span class="text-[11px] font-black">RPG Fit</span>
      </button>

      <!-- Saldo de Moedas / Botão Loja -->
      <button
        type="button"
        id="btn-open-shop"
        @click="emit('open-shop')"
        class="tap-btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/30 text-amber-800 font-bold text-xs shadow-xs transition-all"
        title="Abrir Loja de Cosméticos e Temas"
      >
        <span class="text-sm">🪙</span>
        <span class="text-[11px] font-black">{{ ironCoins }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { calculateLevelFromXp, getFlameInfo } from '../engine/gamification.js';

const props = defineProps({
  totalXp: {
    type: Number,
    default: 0
  },
  streak: {
    type: Number,
    default: 0
  },
  dailyStreak: {
    type: Number,
    default: 0
  },
  shields: {
    type: Number,
    default: 1
  },
  ironCoins: {
    type: Number,
    default: 0
  },
  equippedTitleName: {
    type: String,
    default: ''
  },
  equippedTitleIcon: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['open-skill-tree', 'open-shop']);

const levelData = computed(() => calculateLevelFromXp(props.totalXp));
const flameInfo = computed(() => getFlameInfo(props.dailyStreak));
</script>
