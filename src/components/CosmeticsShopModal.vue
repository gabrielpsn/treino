<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop com Blur -->
    <div
      id="shop-backdrop"
      class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      @click="emit('close')"
      aria-hidden="true"
    ></div>

    <!-- Modal Card -->
    <div
      id="modal-cosmetics-shop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shop-title"
      class="relative w-full max-w-2xl bg-white border border-[#E2E8F0] rounded-3xl p-5 sm:p-7 shadow-2xl z-10 text-[#0F172A] space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Topo: Título, Subtítulo e Saldo de Moedas -->
      <div class="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-2xl shadow-xs">
            🪙
          </div>
          <div>
            <h3 id="shop-title" class="text-lg sm:text-xl font-black text-[#0F172A] tracking-tight uppercase">
              Iron Store • Loja de Cosméticos
            </h3>
            <p class="text-xs text-[#64748B]">
              Personalize a aparência do seu app e exiba títulos de honra no seu perfil.
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-close-shop"
          @click="emit('close')"
          aria-label="Fechar Loja"
          class="tap-btn p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-colors"
        >
          ✕
        </button>
      </div>

      <!-- Saldo de Moedas em Destaque -->
      <div class="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-between gap-3 shadow-xs">
        <div class="flex items-center gap-2.5">
          <span class="text-2xl animate-bounce">🪙</span>
          <div>
            <span class="block text-[10px] font-bold uppercase tracking-wider text-amber-700">Saldo Atual</span>
            <span class="text-lg sm:text-xl font-black text-amber-900">{{ ironCoins }} Moedas de Ferro</span>
          </div>
        </div>
        <span class="text-[11px] text-amber-800 font-medium hidden sm:inline">
          Ganhe mais moedas completando treinos, batendo PRs e mantendo streaks!
        </span>
      </div>

      <!-- Navegação por Abas da Loja (Temas vs Títulos) -->
      <div class="flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
        <button
          type="button"
          id="tab-shop-themes"
          @click="activeTab = 'themes'"
          class="tap-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2"
          :class="activeTab === 'themes' ? 'bg-[#0066FF] text-white shadow-xs' : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]'"
        >
          <span>🎨</span>
          <span>Temas de Interface</span>
        </button>

        <button
          type="button"
          id="tab-shop-titles"
          @click="activeTab = 'titles'"
          class="tap-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2"
          :class="activeTab === 'titles' ? 'bg-[#0066FF] text-white shadow-xs' : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]'"
        >
          <span>🏷️</span>
          <span>Títulos do Perfil</span>
        </button>
      </div>

      <!-- Conteúdo da Aba: Temas de Interface -->
      <div v-if="activeTab === 'themes'" class="space-y-3">
        <div
          v-for="theme in COSMETIC_THEMES"
          :key="theme.id"
          :id="`theme-card-${theme.id}`"
          class="p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
          :class="equippedTheme === theme.id ? 'border-[#0066FF] bg-[#0066FF]/5 ring-2 ring-[#0066FF]/20' : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'"
        >
          <!-- Informações do Tema -->
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="w-12 h-12 rounded-xl border flex items-center justify-center text-xl shadow-xs flex-shrink-0"
              :style="{ backgroundColor: theme.bgColor, borderColor: theme.primaryColor }"
            >
              <span>{{ theme.icon }}</span>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h5 class="text-sm font-black text-[#0F172A]">{{ theme.name }}</h5>
                <span
                  v-if="equippedTheme === theme.id"
                  class="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#0066FF] text-white"
                >
                  ✓ Ativo
                </span>
              </div>
              <p class="text-xs text-[#64748B]">{{ theme.description }}</p>
            </div>
          </div>

          <!-- Botões de Ação do Tema -->
          <div class="flex items-center gap-2 flex-shrink-0 justify-end">
            <!-- Já Equipado -->
            <button
              v-if="equippedTheme === theme.id"
              type="button"
              disabled
              class="px-3.5 py-2 rounded-xl text-xs font-black bg-[#0066FF] text-white cursor-default shadow-xs"
            >
              ✓ Equipado
            </button>

            <!-- Desbloqueado, mas não equipado -->
            <button
              v-else-if="unlockedThemes.includes(theme.id)"
              type="button"
              :id="`btn-equip-theme-${theme.id}`"
              @click="emit('equip-theme', theme.id)"
              class="tap-btn px-3.5 py-2 rounded-xl text-xs font-black bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] border border-[#E2E8F0] transition-all shadow-xs"
            >
              Equipar
            </button>

            <!-- Bloqueado (Comprar) -->
            <button
              v-else
              type="button"
              :id="`btn-buy-theme-${theme.id}`"
              @click="emit('unlock-theme', { themeId: theme.id, price: theme.price })"
              :disabled="ironCoins < theme.price"
              class="tap-btn px-3.5 py-2 rounded-xl text-xs font-black bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 disabled:cursor-not-allowed text-[#0F172A] transition-all flex items-center gap-1.5 shadow-xs"
            >
              <span>🪙</span>
              <span>Desbloquear ({{ theme.price }})</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Conteúdo da Aba: Títulos de Status -->
      <div v-if="activeTab === 'titles'" class="space-y-3">
        <div
          v-for="titleItem in TITLES_CATALOG"
          :key="titleItem.id"
          :id="`title-card-${titleItem.id}`"
          class="p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
          :class="equippedTitle === titleItem.id ? 'border-[#0066FF] bg-[#0066FF]/5 ring-2 ring-[#0066FF]/20' : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'"
        >
          <!-- Informações do Título -->
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-12 h-12 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-2xl shadow-xs flex-shrink-0">
              <span>{{ titleItem.icon }}</span>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h5 class="text-sm font-black text-[#0F172A]">{{ titleItem.title }}</h5>
                <span
                  v-if="equippedTitle === titleItem.id"
                  class="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#0066FF] text-white"
                >
                  ✓ No Perfil
                </span>
              </div>
              <p class="text-xs text-[#64748B]">{{ titleItem.description }}</p>
            </div>
          </div>

          <!-- Botões de Ação do Título -->
          <div class="flex items-center gap-2 flex-shrink-0 justify-end">
            <!-- Já Equipado -->
            <button
              v-if="equippedTitle === titleItem.id"
              type="button"
              disabled
              class="px-3.5 py-2 rounded-xl text-xs font-black bg-[#0066FF] text-white cursor-default shadow-xs"
            >
              ✓ Equipado
            </button>

            <!-- Desbloqueado, mas não equipado -->
            <button
              v-else-if="unlockedTitles.includes(titleItem.id)"
              type="button"
              :id="`btn-equip-title-${titleItem.id}`"
              @click="emit('equip-title', titleItem.id)"
              class="tap-btn px-3.5 py-2 rounded-xl text-xs font-black bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] border border-[#E2E8F0] transition-all shadow-xs"
            >
              Equipar
            </button>

            <!-- Bloqueado (Comprar) -->
            <button
              v-else
              type="button"
              :id="`btn-buy-title-${titleItem.id}`"
              @click="emit('unlock-title', { titleId: titleItem.id, price: titleItem.price })"
              :disabled="ironCoins < titleItem.price"
              class="tap-btn px-3.5 py-2 rounded-xl text-xs font-black bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 disabled:cursor-not-allowed text-[#0F172A] transition-all flex items-center gap-1.5 shadow-xs"
            >
              <span>🪙</span>
              <span>Comprar ({{ titleItem.price }})</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Rodapé com Botão Fechar -->
      <div class="pt-2">
        <button
          type="button"
          id="btn-confirm-shop"
          @click="emit('close')"
          class="tap-btn w-full py-3 px-4 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-black text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>Concluir</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { COSMETIC_THEMES, TITLES_CATALOG } from '../engine/gamification.js';

defineProps({
  isOpen: Boolean,
  ironCoins: {
    type: Number,
    default: 0
  },
  unlockedThemes: {
    type: Array,
    default: () => ['blue', 'orange']
  },
  equippedTheme: {
    type: String,
    default: 'blue'
  },
  unlockedTitles: {
    type: Array,
    default: () => ['iniciante_ferro']
  },
  equippedTitle: {
    type: String,
    default: 'iniciante_ferro'
  }
});

const emit = defineEmits([
  'close',
  'equip-theme',
  'unlock-theme',
  'equip-title',
  'unlock-title'
]);

const activeTab = ref('themes');
</script>
