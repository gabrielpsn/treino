<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop com Blur -->
    <div
      id="skill-tree-backdrop"
      class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      @click="emit('close')"
      aria-hidden="true"
    ></div>

    <!-- Modal Card -->
    <div
      id="modal-rpg-skill-tree"
      role="dialog"
      aria-modal="true"
      aria-labelledby="skill-tree-title"
      class="relative w-full max-w-2xl bg-white border border-[#E2E8F0] rounded-3xl p-5 sm:p-7 shadow-2xl z-10 text-[#0F172A] space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Topo: Ícone, Título e Arquétipo -->
      <div class="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-[#0066FF]/10 border border-[#0066FF]/30 flex items-center justify-center text-2xl shadow-xs">
            ⚔️
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 id="skill-tree-title" class="text-lg sm:text-xl font-black text-[#0F172A] tracking-tight uppercase">
                Árvore de Habilidades (RPG Fit)
              </h3>
            </div>
            <p class="text-xs text-[#64748B]">
              Seu avatar evolui conforme o volume mecânico levantado em cada grupo muscular.
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-close-skill-tree"
          @click="emit('close')"
          aria-label="Fechar Árvore de Habilidades"
          class="tap-btn p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-colors"
        >
          ✕
        </button>
      </div>

      <!-- Banner do Arquétipo Dominante -->
      <div class="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#0066FF]/10 via-[#F59E0B]/10 to-[#10B981]/10 border border-[#E2E8F0] flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <span class="text-2xl">{{ dominantArchetype.icon }}</span>
          <div>
            <span class="block text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Arquétipo de Combate</span>
            <h4 class="text-sm font-black text-[#0F172A]">{{ dominantArchetype.title }}</h4>
          </div>
        </div>
        <span class="text-[11px] font-black px-2.5 py-1 rounded-full bg-white border border-[#E2E8F0] text-[#0066FF] shadow-xs">
          Nível Médio: {{ averageLevel }}
        </span>
      </div>

      <!-- Grade dos 4 Ramos RPG -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div
          v-for="branch in computedBranches"
          :key="branch.id"
          :id="`branch-card-${branch.id}`"
          class="p-4 rounded-2xl border transition-all space-y-2.5 shadow-xs"
          :class="branch.cardClasses"
        >
          <!-- Cabeçalho do Ramo -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-2xl">{{ branch.icon }}</span>
              <div>
                <h5 class="text-xs font-black uppercase text-[#0F172A]">{{ branch.name }}</h5>
                <span class="text-[10px] text-[#64748B] block leading-tight">{{ branch.subtitle }}</span>
              </div>
            </div>
            <span
              class="text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs"
              :class="branch.badgeClasses"
            >
              Nv. {{ branch.levelData.level }}
            </span>
          </div>

          <!-- Barra de XP do Ramo -->
          <div class="space-y-1">
            <div class="flex items-center justify-between text-[10px] font-bold text-[#64748B]">
              <span>Progresso</span>
              <span>{{ branch.levelData.progressPercent }}%</span>
            </div>
            <div class="w-full bg-[#F1F5F9] h-2.5 rounded-full overflow-hidden border border-[#E2E8F0]">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="branch.barClasses"
                :style="{ width: `${branch.levelData.progressPercent}%` }"
              ></div>
            </div>
            <div class="flex items-center justify-between text-[9px] text-[#64748B]">
              <span>{{ branch.levelData.currentLevelXp }} / {{ branch.levelData.costForNextLevel }} XP</span>
              <span class="font-bold text-[#0F172A]">Total: {{ branch.levelData.totalXp }} XP</span>
            </div>
          </div>

          <!-- Tags dos Músculos que alimentam o Ramo -->
          <div class="pt-1 flex items-center gap-1.5 flex-wrap">
            <span
              v-for="m in branch.muscles"
              :key="m"
              class="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-[#64748B]"
            >
              {{ m }}
            </span>
          </div>
        </div>
      </div>

      <!-- Rodapé com Botão Fechar -->
      <div class="pt-2">
        <button
          type="button"
          id="btn-confirm-skill-tree"
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
import { RPG_BRANCHES, calculateBranchLevel } from '../engine/gamification.js';

const props = defineProps({
  isOpen: Boolean,
  rpgBranches: {
    type: Object,
    default: () => ({ push: 0, pull: 0, legs: 0, core: 0 })
  }
});

const emit = defineEmits(['close']);

const computedBranches = computed(() => {
  return Object.values(RPG_BRANCHES).map((branch) => {
    const xp = props.rpgBranches?.[branch.id] || 0;
    const levelData = calculateBranchLevel(xp);

    let cardClasses = 'bg-white border-[#E2E8F0] hover:border-[#0066FF]/30';
    let badgeClasses = 'bg-[#0066FF] text-white';
    let barClasses = 'bg-[#0066FF]';

    if (branch.id === 'pull') {
      badgeClasses = 'bg-purple-600 text-white';
      barClasses = 'bg-purple-600';
    } else if (branch.id === 'legs') {
      badgeClasses = 'bg-[#F59E0B] text-[#0F172A]';
      barClasses = 'bg-[#F59E0B]';
    } else if (branch.id === 'core') {
      badgeClasses = 'bg-emerald-600 text-white';
      barClasses = 'bg-emerald-600';
    }

    return {
      ...branch,
      levelData,
      cardClasses,
      badgeClasses,
      barClasses
    };
  });
});

const averageLevel = computed(() => {
  const levels = computedBranches.value.map(b => b.levelData.level);
  const avg = levels.reduce((a, b) => a + b, 0) / levels.length;
  return Math.round(avg * 10) / 10;
});

const dominantArchetype = computed(() => {
  const b = computedBranches.value;
  let top = b[0];
  for (const item of b) {
    if (item.levelData.totalXp > top.levelData.totalXp) {
      top = item;
    }
  }

  if (top.levelData.totalXp === 0) {
    return { title: 'Recruta Polivalente', icon: '🌱' };
  }
  if (top.id === 'push') {
    return { title: 'Especialista em Empurrar (Push Master)', icon: '🛡️' };
  }
  if (top.id === 'pull') {
    return { title: 'Mestre da Dorsal (Pull Predator)', icon: '🦅' };
  }
  if (top.id === 'legs') {
    return { title: 'Colosso do Leg Day (Titan Stance)', icon: '⚡' };
  }
  return { title: 'Fortaleza Blindada (Core Sentinel)', icon: '🧱' };
});
</script>
