<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
    <div class="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden my-8">
      
      <!-- Linha de Progresso do Wizard & Fechar -->
      <div class="mb-6">
        <div class="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
          <span class="text-amber-400 font-bold uppercase tracking-wider">Passo {{ step }} de 3</span>
          <div class="flex items-center gap-3">
            <span>{{ stepTitle }}</span>
            <button 
              v-if="initialProfile" 
              type="button"
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
            class="bg-gradient-to-r from-amber-500 to-amber-400 h-full transition-all duration-300 rounded-full"
            :style="{ width: `${(step / 3) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Passo 1: Biometria -->
      <div v-if="step === 1" class="space-y-4">
        <div>
          <h2 class="text-2xl font-black text-white tracking-tight">Seus Dados Biométricos</h2>
          <p class="text-sm text-slate-400 mt-1">Usamos essas métricas para calcular suas taxas metabólicas, superávit calórico e hidratação.</p>
        </div>

        <div class="grid grid-cols-2 gap-4 pt-2">
          <button 
            type="button"
            @click="form.gender = 'male'"
            :class="form.gender === 'male' ? 'border-amber-500 bg-amber-500/10 text-white font-semibold' : 'border-slate-800 bg-slate-950/60 text-slate-400'"
            class="p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 hover:border-slate-700"
          >
            <span class="text-2xl">♂</span>
            <span>Homem</span>
          </button>
          <button 
            type="button"
            @click="form.gender = 'female'"
            :class="form.gender === 'female' ? 'border-amber-500 bg-amber-500/10 text-white font-semibold' : 'border-slate-800 bg-slate-950/60 text-slate-400'"
            class="p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 hover:border-slate-700"
          >
            <span class="text-2xl">♀</span>
            <span>Mulher</span>
          </button>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Idade (anos)</label>
            <input 
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
          <h2 class="text-2xl font-black text-white tracking-tight">Rotina & Disponibilidade</h2>
          <p class="text-sm text-slate-400 mt-1">Definiremos o melhor split de treino para sua semana.</p>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-2">Quantos dias você pode treinar por semana?</label>
          <div class="grid grid-cols-4 gap-2">
            <button 
              v-for="d in [3, 4, 5, 6]" 
              :key="d" 
              type="button"
              @click="form.daysPerWeek = d"
              :class="form.daysPerWeek === d ? 'bg-amber-500 text-slate-950 font-bold border-amber-400' : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'"
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
              @click="form.experienceLevel = lvl.id"
              :class="form.experienceLevel === lvl.id ? 'border-amber-500 bg-amber-500/10 text-white' : 'border-slate-800 bg-slate-950/60 text-slate-400'"
              class="p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between"
            >
              <div>
                <h4 class="font-bold text-sm text-white">{{ lvl.title }}</h4>
                <p class="text-xs text-slate-400">{{ lvl.desc }}</p>
              </div>
              <span v-if="form.experienceLevel === lvl.id" class="text-amber-400 font-bold text-sm">✓</span>
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
              @click="form.equipment = 'gym'"
              :class="form.equipment === 'gym' ? 'border-amber-500 bg-amber-500/10 text-white font-semibold' : 'border-slate-800 bg-slate-950/60 text-slate-400'"
              class="p-3 rounded-xl border text-center transition-all text-sm"
            >
              🏋️ Academia Completa
            </button>
            <button 
              type="button"
              @click="form.equipment = 'home'"
              :class="form.equipment === 'home' ? 'border-amber-500 bg-amber-500/10 text-white font-semibold' : 'border-slate-800 bg-slate-950/60 text-slate-400'"
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
              type="button"
              @click="toggleRestriction(res.id)"
              :class="form.restrictions.includes(res.id) ? 'bg-red-500/20 text-red-300 border-red-500/40 font-semibold' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'"
              class="p-2.5 rounded-xl border text-xs text-center transition-all"
            >
              {{ res.label }}
            </button>
          </div>
          <p class="text-[11px] text-slate-500 mt-1">Se marcado, o sistema substitui exercícios de alta compressão por variantes seguras.</p>
        </div>
      </div>

      <!-- Botões de Ação do Modal -->
      <div class="flex items-center justify-between gap-3 mt-8 pt-4 border-t border-slate-800">
        <button 
          v-if="step > 1" 
          type="button"
          @click="step--"
          class="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-sm font-semibold transition-colors"
        >
          Voltar
        </button>
        <div v-else></div>

        <button 
          v-if="step < 3" 
          type="button"
          @click="step++"
          class="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all"
        >
          Próximo
        </button>

        <button 
          v-else 
          type="button"
          @click="submitProfile"
          class="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
        >
          <span>Gerar Meu Plano Inteligente</span>
          <span>⚡</span>
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
  gender: 'male',
  ageYears: 25,
  weightKg: 74,
  heightCm: 175,
  daysPerWeek: 4,
  experienceLevel: 'intermediate',
  equipment: 'gym',
  restrictions: []
});

watch(
  () => props.initialProfile,
  (val) => {
    if (val) {
      form.value = {
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
  if (step.value === 1) return 'Biometria';
  if (step.value === 2) return 'Rotina';
  return 'Personalização';
});

const levels = [
  { id: 'beginner', title: 'Iniciante (< 6 meses)', desc: 'Foco em aprendizado motor e adaptação neural' },
  { id: 'intermediate', title: 'Intermediário (6m a 2 anos)', desc: 'Consistente, busca hipertrofia e aumento de cargas' },
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
