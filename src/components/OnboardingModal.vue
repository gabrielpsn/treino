<template>
  <div v-if="isOpen" id="onboarding-modal-overlay" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
    <div id="onboarding-modal" class="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden my-8">
      
      <!-- Linha de Progresso do Wizard & Fechar -->
      <div class="mb-6">
        <div class="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
          <span :class="form.goal === 'weight_loss' ? 'text-rose-400' : 'text-amber-400'" class="font-bold uppercase tracking-wider">Passo {{ step }} de 3</span>
          <div class="flex items-center gap-3">
            <span>{{ stepTitle }}</span>
            <button 
              type="button"
              id="btn-close-onboarding"
              @click="emit('close')"
              class="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors leading-none"
              title="Fechar"
            >
              ✕
            </button>
          </div>
        </div>
        <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div 
            :class="form.goal === 'weight_loss' ? 'bg-gradient-to-r from-rose-500 to-rose-400' : 'bg-gradient-to-r from-amber-500 to-amber-400'"
            class="h-full transition-all duration-300 rounded-full"
            :style="{ width: `${(step / 3) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Passo 1: Nome, Objetivo & Biometria -->
      <div v-if="step === 1" class="space-y-4">
        <div>
          <h2 class="text-2xl font-black text-white tracking-tight">Bem-vindo(a) ao seu Plano</h2>
          <p class="text-sm text-slate-400 mt-1">Informe seu nome, objetivo e biometria para calibrarmos as taxas metabólicas e fichas ideais.</p>
        </div>

        <!-- Solicitação do Nome do Usuário -->
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Como devemos te chamar? (Seu Nome)</label>
          <input 
            id="input-user-name"
            v-model="form.userName" 
            type="text" 
            placeholder="Ex: Gabriel, Mariana, Patricia..." 
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-semibold focus:border-amber-500 focus:outline-none transition-colors"
          />
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
            <label class="block text-xs font-semibold text-slate-400 mb-1">Idade (anos)</label>
            <input 
              id="input-age"
              v-model.number="form.ageYears" 
              type="number" 
              min="14" 
              max="99" 
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-semibold focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Peso (kg)</label>
            <input 
              id="input-weight"
              v-model.number="form.weightKg" 
              type="number" 
              step="0.5" 
              min="35" 
              max="200" 
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-semibold focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Altura (cm)</label>
            <input 
              id="input-height"
              v-model.number="form.heightCm" 
              type="number" 
              min="120" 
              max="230" 
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-semibold focus:border-amber-500 focus:outline-none"
            />
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
          <div class="grid grid-cols-4 gap-2">
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
            <div 
              v-for="lvl in levels" 
              :key="lvl.id"
              :id="`btn-exp-${lvl.id}`"
              @click="form.experienceLevel = lvl.id"
              :class="form.experienceLevel === lvl.id ? (form.goal === 'weight_loss' ? 'border-rose-500 bg-rose-500/10 text-white' : 'border-amber-500 bg-amber-500/10 text-white') : 'border-slate-800 bg-slate-950/60 text-slate-400'"
              class="p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between"
            >
              <div>
                <h4 class="font-bold text-sm text-white">{{ lvl.title }}</h4>
                <p class="text-xs text-slate-400">{{ lvl.desc }}</p>
              </div>
              <span v-if="form.experienceLevel === lvl.id" :class="form.goal === 'weight_loss' ? 'text-rose-400' : 'text-amber-400'" class="font-bold text-sm">✓</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Passo 3: Equipamento, Foco & Restrições -->
      <div v-else-if="step === 3" class="space-y-4">
        <div>
          <h2 class="text-2xl font-black text-white tracking-tight">Ambiente & Segurança Articular</h2>
          <p class="text-sm text-slate-400 mt-1">O algoritmo ajustará exercícios para proteger suas articulações.</p>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-2">Onde você vai treinar?</label>
          <div class="grid grid-cols-2 gap-3">
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
          <div class="grid grid-cols-3 gap-2">
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
          @click="step--"
          class="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-sm font-semibold transition-colors"
        >
          Voltar
        </button>
        <div v-else></div>

        <button 
          v-if="step < 3" 
          type="button"
          id="btn-onboarding-next"
          @click="step++"
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
import { ref, computed, watch } from 'vue';

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

const step = ref(1);

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

function setGender(selectedGender) {
  const previousGender = form.value.gender;
  form.value.gender = selectedGender;
  
  // Se o nome atual for o padrão antigo (ou vazio/Atleta), altera automaticamente para João ou Maria
  if (!form.value.userName || form.value.userName === 'Atleta' || form.value.userName === 'João' || form.value.userName === 'Maria' || form.value.userName === 'Mariana') {
    form.value.userName = selectedGender === 'female' ? 'Maria' : 'João';
  }

  // Calibra biometria padrão de referência se for emagrecimento
  if (form.value.goal === 'weight_loss' && (!props.initialProfile || !props.initialProfile.goal)) {
    if (selectedGender === 'female') {
      form.value.ageYears = 39;
      form.value.weightKg = 86;
      form.value.heightCm = 156;
    } else {
      form.value.ageYears = 30;
      form.value.weightKg = 92;
      form.value.heightCm = 178;
    }
  }
}

function setGoal(selectedGoal) {
  form.value.goal = selectedGoal;
  // Se mudar para emagrecimento e for o primeiro preenchimento, sugere padrões de referência do protótipo
  if (selectedGoal === 'weight_loss' && (!props.initialProfile || !props.initialProfile.goal)) {
    if (form.value.gender === 'female') {
      form.value.ageYears = 39;
      form.value.weightKg = 86;
      form.value.heightCm = 156;
    }
  }
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
  (open) => {
    if (open) {
      step.value = 1;
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
  { id: 'ombro', label: 'Dor no Ombro' }
];

function toggleRestriction(id) {
  const idx = form.value.restrictions.indexOf(id);
  if (idx >= 0) {
    form.value.restrictions.splice(idx, 1);
  } else {
    form.value.restrictions.push(id);
  }
}

function submitProfile() {
  emit('save', { ...form.value });
}
</script>
