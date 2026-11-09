<template>
  <div v-if="isOpen">
    <!-- Backdrop com Blur e fade-in -->
    <div
      id="drawer-backdrop"
      class="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-200"
      @click="emit('close')"
      aria-hidden="true"
    ></div>

    <!-- Menu Lateral (Drawer) Deslizante -->
    <aside
      id="app-side-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Menu principal do aplicativo"
      class="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white border-r border-[#E2E8F0] text-[#0F172A] z-50 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-200"
    >
      <!-- Topo / Conteúdo Superior -->
      <div class="p-4 sm:p-5 space-y-5">
        
        <!-- Cabeçalho do Drawer com Botão Fechar -->
        <div class="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div class="flex items-center gap-2.5">
            <img src="/overload_AI.svg" alt="Overload AI" class="w-8 h-8 rounded-xl object-cover shadow-sm flex-shrink-0" />
            <span class="text-sm font-black text-[#0066FF] tracking-wider uppercase">Overload AI</span>
          </div>

          <button
            type="button"
            id="btn-close-drawer"
            @click="emit('close')"
            aria-label="Fechar menu lateral"
            class="tap-btn p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-colors"
          >
            ✕
          </button>
        </div>

        <!-- Card de Perfil do Atleta -->
        <div
          class="p-4 rounded-2xl relative overflow-hidden shadow-md text-white"
          :class="isWeightLoss
            ? 'bg-gradient-to-br from-rose-600 via-rose-700 to-orange-700'
            : currentTheme === 'orange'
              ? 'bg-gradient-to-br from-orange-600 via-orange-700 to-amber-700'
              : 'bg-gradient-to-br from-[#0066FF] via-[#0055D4] to-[#0044AA]'"
        >
          <!-- Fundo sutil com detalhe estético -->
          <div class="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none"></div>

          <div class="flex items-center gap-3 relative z-10">
            <!-- Avatar com Borda Branca -->
            <div class="w-14 h-14 rounded-full bg-white/20 border-2 border-white flex items-center justify-center font-black text-xl text-white shadow-md flex-shrink-0">
              {{ (userProfile?.userName || 'A').charAt(0).toUpperCase() }}
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded bg-black/25 text-white/90 border border-white/20">
                  Atleta Pro
                </span>
                <span v-if="dailyStreak > 0" class="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400/30 text-amber-200 border border-amber-300/40">
                  {{ flameEmoji }} {{ dailyStreak }}d
                </span>
              </div>
              <h4 id="drawer-user-name" class="text-base font-black truncate text-white mt-0.5">
                {{ userProfile?.userName || 'Atleta' }}
              </h4>
              <p class="text-xs text-white/80 font-medium">
                {{ userProfile?.weightKg ? `${userProfile.weightKg} kg` : 'Perfil Ativo' }} • 
                <span class="capitalize">{{ userProfile?.experienceLevel === 'beginner' ? 'Iniciante' : userProfile?.experienceLevel === 'advanced' ? 'Avançado' : 'Intermediário' }}</span>
              </p>
            </div>
          </div>

          <!-- Botão para Ajustar Perfil -->
          <div class="mt-3 pt-2.5 border-t border-white/20">
            <button
              type="button"
              id="btn-adjust-profile"
              @click="handleProfileClick"
              class="tap-btn w-full py-2 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 backdrop-blur-sm"
              title="Ajustar Perfil & Biometria"
            >
              <span>⚙️</span>
              <span>Ajustar Perfil & Biometria</span>
            </button>
          </div>
        </div>

        <!-- Seções Principais do App -->
        <div class="space-y-1">
          <p class="text-[10px] font-black uppercase tracking-widest text-[#64748B] px-2">
            Navegação Principal
          </p>

          <button
            type="button"
            id="btn-drawer-nav-workout"
            @click="handleNavigate('workout')"
            class="tap-btn w-full p-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition-colors text-left"
            :class="activeTab === 'workout'
              ? 'bg-[#F59E0B] text-[#0F172A] shadow-xs font-black'
              : 'text-[#0F172A] hover:bg-[#F1F5F9]'"
          >
            <span class="text-base">🏋️</span>
            <span>Treinos & Fichas</span>
          </button>

          <button
            type="button"
            id="btn-drawer-nav-nutrition"
            @click="handleNavigate('nutrition')"
            class="tap-btn w-full p-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition-colors text-left"
            :class="activeTab === 'nutrition'
              ? 'bg-[#F59E0B] text-[#0F172A] shadow-xs font-black'
              : 'text-[#0F172A] hover:bg-[#F1F5F9]'"
          >
            <span class="text-base">🥗</span>
            <span>Dieta & Nutrição</span>
          </button>

          <button
            type="button"
            id="btn-drawer-nav-frequency"
            @click="handleNavigate('frequency')"
            class="tap-btn w-full p-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition-colors text-left"
            :class="activeTab === 'frequency'
              ? 'bg-[#F59E0B] text-[#0F172A] shadow-xs font-black'
              : 'text-[#0F172A] hover:bg-[#F1F5F9]'"
          >
            <span class="text-base">📅</span>
            <span>Calendário & Frequência</span>
          </button>

          <button
            type="button"
            id="btn-drawer-nav-history"
            @click="handleNavigate('history')"
            class="tap-btn w-full p-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition-colors text-left"
            :class="activeTab === 'history'
              ? 'bg-[#F59E0B] text-[#0F172A] shadow-xs font-black'
              : 'text-[#0F172A] hover:bg-[#F1F5F9]'"
          >
            <span class="text-base">📊</span>
            <span>Histórico & Métricas</span>
          </button>
        </div>

        <!-- Gestão de Fichas e Treino -->
        <div class="space-y-1">
          <p class="text-[10px] font-black uppercase tracking-widest text-[#64748B] px-2">
            Gestão do Treino
          </p>

          <button
            type="button"
            id="btn-drawer-create-split"
            @click="handleAction('open-create-split')"
            class="tap-btn w-full p-2.5 rounded-xl font-bold text-xs flex items-center gap-3 text-[#0F172A] bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors text-left border border-[#E2E8F0]"
          >
            <span class="text-base">📋</span>
            <span>Criar Nova Ficha</span>
          </button>

          <button
            type="button"
            id="btn-drawer-custom-exercises"
            @click="handleAction('open-custom-exercises')"
            class="tap-btn w-full p-2.5 rounded-xl font-bold text-xs flex items-center gap-3 text-[#0F172A] bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors text-left border border-[#E2E8F0]"
          >
            <span class="text-base">⚡</span>
            <span>Meus Exercícios Personalizados</span>
          </button>

          <button
            type="button"
            id="btn-drawer-ai-plan"
            @click="handleAction('generate-ai-plan')"
            class="tap-btn w-full p-2.5 rounded-xl font-bold text-xs flex items-center gap-3 text-[#0066FF] bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors text-left border border-[#E2E8F0]"
          >
            <span class="text-base">🤖</span>
            <span>Gerar Ficha com IA (Gemini)</span>
          </button>
        </div>

        <!-- Dados & Segurança (Backup / Importação) -->
        <div class="space-y-1">
          <p class="text-[10px] font-black uppercase tracking-widest text-[#64748B] px-2">
            Dados & Dispositivo
          </p>

          <button
            type="button"
            id="btn-export-backup"
            @click="handleAction('export-backup')"
            class="tap-btn w-full p-2.5 rounded-xl font-bold text-xs flex items-center gap-3 text-[#0F172A] hover:bg-[#F1F5F9] transition-colors text-left border border-[#E2E8F0] bg-white"
            title="Exportar Dados (Backup)"
          >
            <span class="text-base">💾</span>
            <span>Exportar Dados (Backup)</span>
          </button>

          <button
            type="button"
            id="btn-import-backup"
            @click="handleAction('import-backup')"
            class="tap-btn w-full p-2.5 rounded-xl font-bold text-xs flex items-center gap-3 text-[#0F172A] hover:bg-[#F1F5F9] transition-colors text-left border border-[#E2E8F0] bg-white"
            title="Restaurar backup"
          >
            <span class="text-base">📂</span>
            <span>Restaurar Backup</span>
          </button>

          <button
            type="button"
            id="btn-install-app"
            @click="handleAction('install-app')"
            class="tap-btn w-full p-2.5 rounded-xl font-bold text-xs flex items-center gap-3 text-[#0F172A] hover:bg-[#F1F5F9] transition-colors text-left border border-[#E2E8F0] bg-white"
            title="Instalar App ou Criar Atalho"
          >
            <span class="text-base">📲</span>
            <span>{{ isAppInstalled ? 'App Já Instalado' : 'Instalar no Celular' }}</span>
          </button>
        </div>

        <!-- Seletor de Tema Visual -->
        <div class="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
          <p class="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">
            Tema Visual do App
          </p>
          <div class="grid grid-cols-2 gap-1.5 text-xs">
            <button
              type="button"
              id="btn-theme-blue"
              @click="emit('set-theme', 'blue')"
              class="tap-btn p-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all"
              :class="currentTheme === 'blue'
                ? 'border-[#0066FF] bg-[#0066FF] text-white shadow-xs'
                : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#0066FF]'"
            >
              <span class="w-2.5 h-2.5 rounded-full bg-[#0066FF]"></span>
              <span>Azul Cobalto</span>
            </button>

            <button
              type="button"
              id="btn-theme-orange"
              @click="emit('set-theme', 'orange')"
              class="tap-btn p-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all"
              :class="currentTheme === 'orange'
                ? 'border-orange-500 bg-orange-500 text-white shadow-xs'
                : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-orange-500'"
            >
              <span class="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span>Laranja Força</span>
            </button>
          </div>
        </div>

      </div>

      <!-- Rodapé do Drawer -->
      <div class="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] text-center">
        <p class="text-[11px] font-bold text-[#0F172A]">Overload AI • Versão 2.2</p>
        <p class="text-[10px] text-[#64748B]">Sobrecarga Progressiva, Hipertrofia & Nutrição com IA</p>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  userProfile: {
    type: Object,
    default: null
  },
  isWeightLoss: Boolean,
  activeTab: {
    type: String,
    default: 'workout'
  },
  currentTheme: {
    type: String,
    default: 'blue'
  },
  dailyStreak: {
    type: Number,
    default: 0
  },
  isAppInstalled: Boolean
});

const flameEmoji = computed(() => {
  if (props.dailyStreak >= 8) return '💎🔥';
  if (props.dailyStreak >= 4) return '⚡🔥';
  return '🔥';
});

const emit = defineEmits([
  'close',
  'navigate',
  'open-profile',
  'open-create-split',
  'open-custom-exercises',
  'generate-ai-plan',
  'export-backup',
  'import-backup',
  'install-app',
  'set-theme'
]);

function handleNavigate(tab) {
  emit('navigate', tab);
  emit('close');
}

function handleProfileClick() {
  emit('open-profile');
  emit('close');
}

function handleAction(action) {
  emit(action);
  emit('close');
}
</script>
