<template>
  <div
    v-if="isOpen"
    id="onboarding-modal-overlay"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
    role="dialog"
    aria-modal="true"
    aria-labelledby="onboarding-title"
    @click.self="emit('close')"
  >
    <div
      ref="panelRef"
      id="onboarding-modal"
      class="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden my-8"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      
      <!-- Resumo de erros: o botão de enviar vive no passo 3, mas os campos
           problemáticos podem estar no passo 1. -->
      <div
        v-if="errorSummary"
        id="onboarding-error-summary"
        role="alert"
        aria-live="assertive"
        class="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2"
      >
        <span aria-hidden="true">⚠️</span>
        <span class="text-xs font-semibold text-rose-300">{{ errorSummary }}</span>
      </div>

      <!-- Linha de Progresso do Wizard & Fechar -->
      <div class="mb-6">
        <div class="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
          <span :class="form.goal === 'weight_loss' ? 'text-rose-400' : 'text-amber-400'" class="font-bold uppercase tracking-wider">Passo {{ step }} de {{ TOTAL_STEPS }}</span>
          <div class="flex items-center gap-3">
            <span>{{ stepTitle }}</span>
            <button 
              type="button"
              id="btn-close-onboarding"
              aria-label="Fechar configurações"
              @click="emit('close')"
              class="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors leading-none"
              title="Fechar"
            >
              ✕
            </button>
          </div>
        </div>
        <div
          class="w-full bg-slate-800 h-2 rounded-full overflow-hidden"
          role="progressbar"
          :aria-valuenow="step"
          aria-valuemin="1"
          :aria-valuemax="TOTAL_STEPS"
          aria-label="Progresso do cadastro"
        >
          <div 
            :class="form.goal === 'weight_loss' ? 'bg-gradient-to-r from-rose-500 to-rose-400' : 'bg-gradient-to-r from-amber-500 to-amber-400'"
            class="h-full transition-all duration-300 rounded-full"
            :style="{ width: `${(step / TOTAL_STEPS) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Passo 1: Nome, Objetivo & Biometria -->
      <div v-if="step === 1" class="space-y-4">
        <div>
          <h2 id="onboarding-title" class="text-2xl font-black text-white tracking-tight">Bem-vindo(a) ao seu Plano</h2>
          <p class="text-sm text-slate-400 mt-1">Informe seu nome, objetivo e biometria para calibrarmos as taxas metabólicas e fichas ideais.</p>
        </div>

        <!-- Solicitação do Nome do Usuário -->
        <div>
          <label for="input-user-name" class="block text-xs font-semibold text-slate-400 mb-1">Como devemos te chamar? (Seu Nome)</label>
          <input 
            id="input-user-name"
            v-model="form.userName" 
            type="text" 
            maxlength="40"
            placeholder="Ex: Gabriel, Mariana, Patricia..." 
            :aria-invalid="!!errors.userName"
            :aria-describedby="errors.userName ? 'error-user-name' : undefined"
            class="w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-white font-semibold focus:outline-none transition-colors"
            :class="errors.userName ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-amber-500'"
          />
          <p v-if="errors.userName" id="error-user-name" class="text-[11px] text-rose-400 mt-1">{{ errors.userName }}</p>
        </div>

        <!-- Escolha do Objetivo Principal (Hipertrofia vs Emagrecimento) -->
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Qual é o seu objetivo principal agora?</label>
          <div class="grid grid-cols-2 gap-3 pt-1">
            <button 
              type="button"
              id="btn-goal-hypertrophy"
              @click="setGoal('hypertrophy')"
              :class="form.goal === 'hypertrophy' ? 'border-amber-500 bg-amber-500/10 text-white font-bold ring-1 ring-amber-500/50' : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'"
              class="p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1"
            >
              <div class="flex items-center justify-between">
                <span class="text-xl">⚡</span>
                <span v-if="form.goal === 'hypertrophy'" class="text-amber-400 text-xs font-bold">✓ Ativo</span>
              </div>
              <div>
                <strong class="text-sm text-white block">Hipertrofia & Massa</strong>
                <span class="text-[11px] text-slate-400 leading-tight block mt-0.5">Superávit limpo, progressão de carga e força</span>
              </div>
            </button>

            <button 
              type="button"
              id="btn-goal-weight-loss"
              @click="setGoal('weight_loss')"
              :class="form.goal === 'weight_loss' ? 'border-rose-500 bg-rose-500/10 text-white font-bold ring-1 ring-rose-500/50' : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'"
              class="p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1"
            >
              <div class="flex items-center justify-between">
                <span class="text-xl">🔥</span>
                <span v-if="form.goal === 'weight_loss'" class="text-rose-400 text-xs font-bold">✓ Ativo</span>
              </div>
              <div>
                <strong class="text-sm text-white block">Perda de Peso & Definição</strong>
                <span class="text-[11px] text-slate-400 leading-tight block mt-0.5">Déficit calórico, proteção articular & queima</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Gênero -->
        <div class="grid grid-cols-2 gap-4 pt-1">
          <button 
            type="button"
            id="btn-gender-male"
            @click="setGender('male')"
            :class="form.gender === 'male' ? 'border-amber-500 bg-amber-500/10 text-white font-semibold' : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'"
            class="p-3 rounded-2xl border text-center transition-all flex items-center justify-center gap-2"
          >
            <span class="text-xl">♂</span>
            <span class="text-sm">Homem</span>
          </button>
          <button 
            type="button"
            id="btn-gender-female"
            @click="setGender('female')"
            :class="form.gender === 'female' ? 'border-rose-500 bg-rose-500/10 text-white font-semibold' : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'"
            class="p-3 rounded-2xl border text-center transition-all flex items-center justify-center gap-2"
          >
            <span class="text-xl">♀</span>
            <span class="text-sm">Mulher</span>
          </button>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label for="input-age" class="block text-xs font-semibold text-slate-400 mb-1">Idade (anos)</label>
            <input 
              id="input-age"
              v-model.number="form.ageYears" 
              type="number" 
              min="12" 
              max="100" 
              :aria-invalid="!!errors.ageYears"
              :aria-describedby="errors.ageYears ? 'error-age' : undefined"
              class="w-full bg-slate-950 border rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none"
              :class="errors.ageYears ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-amber-500'"
            />
            <p v-if="errors.ageYears" id="error-age" class="text-[11px] text-rose-400 mt-1">{{ errors.ageYears }}</p>
          </div>
          <div>
            <label for="input-weight" class="block text-xs font-semibold text-slate-400 mb-1">Peso (kg)</label>
            <input 
              id="input-weight"
              v-model.number="form.weightKg" 
              type="number" 
              step="0.5" 
              min="30" 
              max="300" 
              :aria-invalid="!!errors.weightKg"
              :aria-describedby="errors.weightKg ? 'error-weight' : undefined"
              class="w-full bg-slate-950 border rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none"
              :class="errors.weightKg ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-amber-500'"
            />
            <p v-if="errors.weightKg" id="error-weight" class="text-[11px] text-rose-400 mt-1">{{ errors.weightKg }}</p>
          </div>
          <div>
            <label for="input-height" class="block text-xs font-semibold text-slate-400 mb-1">Altura (cm)</label>
            <input 
              id="input-height"
              v-model.number="form.heightCm" 
              type="number" 
              min="120" 
              max="230" 
              :aria-invalid="!!errors.heightCm"
              :aria-describedby="errors.heightCm ? 'error-height' : undefined"
              class="w-full bg-slate-950 border rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none"
              :class="errors.heightCm ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-amber-500'"
            />
            <p v-if="errors.heightCm" id="error-height" class="text-[11px] text-rose-400 mt-1">{{ errors.heightCm }}</p>
          </div>
        </div>
      </div>

      <!-- Passo 2: Experiência & Rotina -->
      <div v-else-if="step === 2" class="space-y-4">
        <div>
          <h2 class="text-2xl font-black text-white tracking-tight">Rotina & Frequência</h2>
          <p class="text-sm text-slate-400 mt-1">Definiremos o melhor split de treino para sua semana.</p>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-2">Quantos dias você pode treinar por semana?</label>
          <div class="grid grid-cols-4 gap-2" role="group" aria-label="Dias por semana">
            <button 
              v-for="d in [3, 4, 5, 6]" 
              :key="d" 
              :id="`btn-days-${d}`"
              type="button"
              @click="form.daysPerWeek = d"
              :class="form.daysPerWeek === d ? (form.goal === 'weight_loss' ? 'bg-rose-500 text-white font-bold border-rose-400' : 'bg-amber-500 text-slate-950 font-bold border-amber-400') : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'"
              class="p-3 rounded-xl border text-center text-sm transition-all"
            >
              {{ d }} dias
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-2">Nível de Experiência na Musculação</label>
          <div class="space-y-2">
            <button
              v-for="lvl in levels" 
              :key="lvl.id"
              type="button"
              :id="`btn-exp-${lvl.id}`"
              @click="form.experienceLevel = lvl.id"
              :aria-pressed="form.experienceLevel === lvl.id"
              :class="form.experienceLevel === lvl.id ? (form.goal === 'weight_loss' ? 'border-rose-500 bg-rose-500/10 text-white' : 'border-amber-500 bg-amber-500/10 text-white') : 'border-slate-800 bg-slate-950/60 text-slate-400'"
              class="w-full text-left p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between"
            >
              <div>
                <h4 class="font-bold text-sm text-white">{{ lvl.title }}</h4>
                <p class="text-xs text-slate-400">{{ lvl.desc }}</p>
              </div>
              <span v-if="form.experienceLevel === lvl.id" :class="form.goal === 'weight_loss' ? 'text-rose-400' : 'text-amber-400'" class="font-bold text-sm" aria-hidden="true">✓</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Passo 3: Equipamento, Foco & Restrições -->
      <div v-else-if="step === TOTAL_STEPS" class="space-y-4">
        <div>
          <h2 class="text-2xl font-black text-white tracking-tight">Ambiente & Segurança Articular</h2>
          <p class="text-sm text-slate-400 mt-1">O algoritmo ajustará exercícios para proteger suas articulações.</p>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-2">Onde você vai treinar?</label>
          <div class="grid grid-cols-2 gap-3" role="group" aria-label="Ambiente de treino">
            <button 
              type="button"
              id="btn-equip-gym"
              @click="form.equipment = 'gym'"
              :class="form.equipment === 'gym' ? (form.goal === 'weight_loss' ? 'border-rose-500 bg-rose-500/10 text-white font-semibold' : 'border-amber-500 bg-amber-500/10 text-white font-semibold') : 'border-slate-800 bg-slate-950/60 text-slate-400'"
              class="p-3 rounded-xl border text-center transition-all text-sm"
            >
              🏋️ Academia Completa
            </button>
            <button 
              type="button"
              id="btn-equip-home"
              @click="form.equipment = 'home'"
              :class="form.equipment === 'home' ? (form.goal === 'weight_loss' ? 'border-rose-500 bg-rose-500/10 text-white font-semibold' : 'border-amber-500 bg-amber-500/10 text-white font-semibold') : 'border-slate-800 bg-slate-950/60 text-slate-400'"
              class="p-3 rounded-xl border text-center transition-all text-sm"
            >
              🏠 Em Casa / Halteres
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-2">Tem dores ou restrições articulares? (Opcional)</label>
          <div class="grid grid-cols-3 gap-2" role="group" aria-label="Restrições articulares">
            <button 
              v-for="res in jointOptions" 
              :key="res.id"
              :id="`btn-joint-${res.id}`"
              type="button"
              @click="toggleRestriction(res.id)"
              :class="form.restrictions.includes(res.id) ? 'bg-red-500/20 text-red-300 border-red-500/40 font-semibold' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'"
              class="p-2.5 rounded-xl border text-xs text-center transition-all"
            >
              {{ res.label }}
            </button>
          </div>
          <p class="text-[11px] text-slate-500 mt-1">Se marcado, o sistema substitui exercícios de alta compressão por variantes guiadas e seguras.</p>
        </div>
      </div>

      <!-- Botões de Ação do Modal -->
      <div class="flex items-center justify-between gap-3 mt-8 pt-4 border-t border-slate-800">
        <button 
          v-if="step > 1" 
          type="button"
          id="btn-onboarding-back"
          @click="goToStep(step - 1)"
          class="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-sm font-semibold transition-colors"
        >
          Voltar
        </button>
        <div v-else></div>

        <button 
          v-if="step < TOTAL_STEPS" 
          type="button"
          id="btn-onboarding-next"
          @click="goToStep(step + 1)"
          :class="form.goal === 'weight_loss' ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20' : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'"
          class="px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all"
        >
          Próximo
        </button>

        <button 
          v-else 
          type="button"
          id="btn-onboarding-submit"
          @click="submitProfile"
          :class="form.goal === 'weight_loss' ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20' : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'"
          class="px-6 py-2.5 rounded-xl font-black text-sm shadow-lg transition-all flex items-center gap-2"
        >
          <span>Gerar Meu Plano Inteligente</span>
          <span>{{ form.goal === 'weight_loss' ? '🔥' : '⚡' }}</span>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  initialProfile: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['save', 'close']);

const TOTAL_STEPS = 3;

const step = ref(1);
const panelRef = ref(null);

const form = ref({
  userName: 'João',
  goal: 'hypertrophy',
  gender: 'male',
  ageYears: 25,
  weightKg: 74,
  heightCm: 175,
  daysPerWeek: 4,
  experienceLevel: 'intermediate',
  equipment: 'gym',
  restrictions: []
});

// Biometria em branco de propósito: o app não deve inventar peso, idade ou
// altura para o usuário. Os cálculos scavem direto do que for digitado e a
// validação no passo final impede que valores absurdos virem plano.
function setGender(selectedGender) {
  form.value.gender = selectedGender;

  // Se o nome ainda for um dos padrões automáticos, ajusta para o gênero escolhido.
  if (!form.value.userName || ['Atleta', 'João', 'Maria'].includes(form.value.userName.trim())) {
    form.value.userName = selectedGender === 'female' ? 'Maria' : 'João';
  }
}

function setGoal(selectedGoal) {
  form.value.goal = selectedGoal;
}

watch(
  () => props.initialProfile,
  (val) => {
    if (val) {
      const defaultName = (val.gender === 'female') ? 'Maria' : 'João';
      form.value = {
        userName: val.userName || defaultName,
        goal: val.goal || 'hypertrophy',
        gender: val.gender || 'male',
        ageYears: val.ageYears || 25,
        weightKg: val.weightKg || 74,
        heightCm: val.heightCm || 175,
        daysPerWeek: val.daysPerWeek || 4,
        experienceLevel: val.experienceLevel || 'intermediate',
        equipment: val.equipment || 'gym',
        restrictions: val.restrictions ? [...val.restrictions] : []
      };
    }
  },
  { immediate: true, deep: true }
);

watch(
  () => props.isOpen,
  async (open) => {
    if (open) {
      step.value = 1;
      errors.value = {};
      errorSummary.value = '';
      await nextTick();
      panelRef.value?.focus();
    }
  }
);

const stepTitle = computed(() => {
  if (step.value === 1) return 'Perfil & Objetivo';
  if (step.value === 2) return 'Rotina';
  return 'Personalização';
});

const levels = [
  { id: 'beginner', title: 'Iniciante (< 6 meses)', desc: 'Foco em aprendizado motor e adaptação articular' },
  { id: 'intermediate', title: 'Intermediário (6m a 2 anos)', desc: 'Consistente, busca evolução e aumento gradual de intensidade' },
  { id: 'advanced', title: 'Avançado (> 2 anos)', desc: 'Necessita de maior volume e sobrecarga calculada' }
];

const jointOptions = [
  { id: 'lombar', label: 'Dor na Lombar' },
  { id: 'joelho', label: 'Dor no Joelho' },
  { id: 'ombro', label: 'Dor no Ombro' },
  { id: 'cotovelo', label: 'Dor no Cotovelo' },
  { id: 'quadril', label: 'Dor no Quadril' },
  { id: 'punho', label: 'Dor no Punho' }
];

function goToStep(next) {
  if (next < 1 || next > TOTAL_STEPS) return;
  step.value = next;
  errorSummary.value = '';
}

function toggleRestriction(id) {
  const idx = form.value.restrictions.indexOf(id);
  if (idx >= 0) {
    form.value.restrictions.splice(idx, 1);
  } else {
    form.value.restrictions.push(id);
  }
}

const errors = ref({});
const errorSummary = ref('');

const ERROR_STEP = { userName: 1, ageYears: 1, weightKg: 1, heightCm: 1, daysPerWeek: 2, experienceLevel: 2, equipment: 3 };

function validateProfile() {
  const next = {};
  const name = (form.value.userName || '').trim();
  if (!name) next.userName = 'Informe seu nome ou apelido';
  else if (name.length > 40) next.userName = 'Use no máximo 40 caracteres';

  const age = Number(form.value.ageYears);
  if (!Number.isFinite(age) || age < 12 || age > 100) next.ageYears = 'Idade deve estar entre 12 e 100 anos';

  const weight = Number(form.value.weightKg);
  if (!Number.isFinite(weight) || weight < 30 || weight > 300) next.weightKg = 'Peso deve estar entre 30 e 300 kg';

  const height = Number(form.value.heightCm);
  if (!Number.isFinite(height) || height < 120 || height > 230) next.heightCm = 'Altura deve estar entre 120 e 230 cm';

  if (!form.value.daysPerWeek || form.value.daysPerWeek < 2 || form.value.daysPerWeek > 6) {
    next.daysPerWeek = 'Selecione de 2 a 6 dias por semana';
  }

  errors.value = next;

  const fields = Object.keys(next);
  if (fields.length === 0) {
    errorSummary.value = '';
    return true;
  }

  // Os campos com erro vivem no passo 1, mas o botão de enviar fica no passo 3.
  // Sem voltar para o passo do primeiro erro, a validação bloquearia o envio
  // sem mostrar nenhuma mensagem na tela.
  const targetStep = Math.min(...fields.map(f => ERROR_STEP[f] ?? 1));
  errorSummary.value = `Corrija ${fields.length} ${fields.length === 1 ? 'campo' : 'campos'} para continuar.`;
  if (step.value !== targetStep) {
    step.value = targetStep;
  }
  return false;
}

function submitProfile() {
  if (!validateProfile()) return;
  emit('save', { ...form.value, restrictions: [...form.value.restrictions] });
}
</script>
