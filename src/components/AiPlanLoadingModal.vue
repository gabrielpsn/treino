<template>
  <div
    v-if="isOpen"
    id="ai-plan-loading-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="ai-loading-title"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto"
  >
    <div
      class="bg-white border border-[#E2E8F0] w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl relative my-8 text-[#0F172A] animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Cabeçalho com Ícone Animado -->
      <div class="flex flex-col items-center text-center mb-6">
        <div class="relative flex items-center justify-center w-20 h-20 mb-4">
          <!-- Anel de rotação sutil -->
          <div class="absolute inset-0 rounded-3xl border-2 border-dashed border-[#0066FF]/40 animate-spin" style="animation-duration: 8s;"></div>
          <!-- Anel pulsante -->
          <div class="absolute inset-1 rounded-2xl bg-[#0066FF]/10 animate-ping opacity-30" style="animation-duration: 2.5s;"></div>
          <!-- Caixa central do ícone -->
          <div class="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0052cc] to-[#0066FF] text-white flex items-center justify-center text-3xl shadow-lg shadow-[#0066FF]/30">
            🤖
          </div>
        </div>

        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#0066FF] text-[10px] font-bold uppercase tracking-wider mb-2">
          <span class="w-2 h-2 rounded-full bg-[#0066FF] animate-pulse"></span>
          Agente Cloudflare Workers AI
        </div>

        <h3 id="ai-loading-title" class="text-xl font-black text-[#0F172A] leading-tight">
          Gerando seu Novo Plano
        </h3>
        <p class="text-xs text-[#64748B] mt-1 max-w-xs leading-relaxed">
          Nossa inteligência artificial está estruturando sua divisão de treinos e dieta sob medida.
        </p>
      </div>

      <!-- Barra de Progresso Suave -->
      <div class="mb-5 space-y-1.5">
        <div class="flex justify-between items-center text-[11px] font-bold">
          <span class="text-[#64748B]">Progresso do Agente</span>
          <span id="ai-progress-percentage" class="text-[#0066FF] font-black">{{ progressPercentage }}%</span>
        </div>
        <div class="w-full bg-[#F1F5F9] h-2.5 rounded-full overflow-hidden border border-[#E2E8F0]">
          <div
            id="ai-progress-bar"
            class="h-full bg-gradient-to-r from-[#0066FF] via-[#0052cc] to-[#F59E0B] transition-all duration-500 rounded-full"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
      </div>

      <!-- Linha do Tempo de Etapas da IA -->
      <div class="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 space-y-3 mb-5">
        <div
          v-for="(step, idx) in steps"
          :key="step.id"
          :id="`ai-step-${idx}`"
          class="flex items-center gap-3 text-xs transition-all duration-300"
          :class="getStepTextClass(idx)"
        >
          <!-- Ícone do status da etapa -->
          <div
            class="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300"
            :class="getStepBadgeClass(idx)"
          >
            <template v-if="idx < currentStepIndex">
              ✓
            </template>
            <template v-else-if="idx === currentStepIndex">
              <span class="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full"></span>
            </template>
            <template v-else>
              {{ idx + 1 }}
            </template>
          </div>

          <!-- Rótulo da etapa -->
          <div class="flex-1 min-w-0">
            <p class="font-bold truncate" :class="idx === currentStepIndex ? 'text-[#0F172A]' : ''">
              {{ step.label }}
            </p>
            <p v-if="idx === currentStepIndex" class="text-[10px] text-[#64748B] mt-0.5 animate-pulse">
              {{ step.detail }}
            </p>
          </div>
        </div>
      </div>

      <!-- Dica Informativa -->
      <div class="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
        <span class="text-base flex-shrink-0">💡</span>
        <div>
          <strong class="font-bold">Treino e Dieta Integrados:</strong>
          <span class="text-[11px] block mt-0.5 text-amber-800">
            Assim que a IA finalizar, a tela e o banco de dados local serão atualizados instantaneamente com as novas fichas e macros.
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const steps = [
  {
    id: 'profile',
    label: '1. Analisando perfil biométrico e rotina',
    detail: 'Verificando restrições articulares, frequência e meta calórica...'
  },
  {
    id: 'catalog',
    label: '2. Consultando biomecânica no catálogo',
    detail: 'Filtrando exercícios seguros e compatíveis com seu equipamento...'
  },
  {
    id: 'splits',
    label: '3. Estruturando divisão muscular e séries',
    detail: 'Otimizando ordem dos compostos, faixas de reps e descanso...'
  },
  {
    id: 'nutrition',
    label: '4. Calculando cardápio e macronutrientes',
    detail: 'Dimensionando calorias, proteínas, carboidratos e gorduras...'
  },
  {
    id: 'finalize',
    label: '5. Sincronizando protocolo com o aplicativo',
    detail: 'Persistindo dados no armazenamento local de alta velocidade...'
  }
];

const currentStepIndex = ref(0);
let stepTimer = null;

const progressPercentage = computed(() => {
  const count = steps.length;
  const pct = Math.round(((currentStepIndex.value + 0.6) / count) * 100);
  return Math.min(95, Math.max(15, pct));
});

function getStepBadgeClass(idx) {
  if (idx < currentStepIndex.value) {
    return 'bg-emerald-100 text-emerald-700 border border-emerald-300';
  }
  if (idx === currentStepIndex.value) {
    return 'bg-[#0066FF] text-white shadow-xs';
  }
  return 'bg-white border border-[#CBD5E1] text-[#94A3B8]';
}

function getStepTextClass(idx) {
  if (idx < currentStepIndex.value) {
    return 'text-emerald-800';
  }
  if (idx === currentStepIndex.value) {
    return 'text-[#0F172A] font-bold';
  }
  return 'text-[#94A3B8] opacity-75';
}

function startStepCycle() {
  stopStepCycle();
  currentStepIndex.value = 0;
  stepTimer = setInterval(() => {
    if (currentStepIndex.value < steps.length - 1) {
      currentStepIndex.value += 1;
    }
  }, 1800);
}

function stopStepCycle() {
  if (stepTimer) {
    clearInterval(stepTimer);
    stepTimer = null;
  }
}

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      startStepCycle();
    } else {
      stopStepCycle();
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  stopStepCycle();
});
</script>
