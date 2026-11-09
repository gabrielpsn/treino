<template>
  <div
    v-if="isOpen"
    id="create-split-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="create-split-title"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
  >
    <div
      class="bg-white border border-[#E2E8F0] w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl relative my-8 text-[#0F172A]"
    >
      <!-- Cabeçalho -->
      <div class="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4">
        <div class="flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center text-lg font-bold">
            📋
          </div>
          <div>
            <h3 id="create-split-title" class="text-base sm:text-lg font-black text-[#0F172A]">
              {{ editingSplit ? 'Editar Ficha de Treino' : 'Criar Nova Ficha de Treino' }}
            </h3>
            <p class="text-xs text-[#64748B]">
              Personalize sua rotina, músculos-alvo e cores da sessão.
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-close-create-split"
          aria-label="Fechar modal de criação de ficha"
          @click="$emit('close')"
          class="tap-btn text-[#64748B] hover:text-[#0F172A] p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors"
        >
          ✕
        </button>
      </div>

      <!-- Formulário de Criação -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Título da Ficha -->
        <div>
          <label for="input-split-title" class="block text-xs font-bold text-[#0F172A] mb-1">
            Nome da Ficha <span class="text-[#F59E0B]">*</span>
          </label>
          <input
            id="input-split-title"
            v-model="form.title"
            type="text"
            required
            maxlength="60"
            placeholder="Ex: Treino E (Braços & Abdômen)"
            class="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/20 rounded-xl px-3.5 py-2.5 text-[#0F172A] font-bold text-sm placeholder:text-[#94A3B8] transition-all"
          />
          <p v-if="titleError" id="error-split-title" class="text-xs font-bold text-rose-500 mt-1">
            {{ titleError }}
          </p>
        </div>

        <!-- Subtítulo / Foco -->
        <div>
          <label for="input-split-subtitle" class="block text-xs font-bold text-[#0F172A] mb-1">
            Foco / Descrição dos Músculos
          </label>
          <input
            id="input-split-subtitle"
            v-model="form.subtitle"
            type="text"
            maxlength="120"
            placeholder="Ex: Bíceps no banco inclinado, tríceps testa e prancha"
            class="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/20 rounded-xl px-3.5 py-2.5 text-[#0F172A] font-semibold text-sm placeholder:text-[#94A3B8] transition-all"
          />
        </div>

        <!-- Cor de Destaque -->
        <div>
          <label class="block text-xs font-bold text-[#0F172A] mb-1.5">
            Cor Temática da Ficha
          </label>
          <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <button
              v-for="(theme, key) in COLOR_THEMES"
              :key="key"
              type="button"
              :id="`btn-color-${key}`"
              @click="form.color = key"
              class="tap-btn p-2 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1"
              :class="form.color === key
                ? 'border-[#0066FF] bg-blue-50/50 ring-2 ring-[#0066FF]/20 shadow-sm'
                : 'border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#CBD5E1]'"
            >
              <span class="w-4 h-4 rounded-full" :class="theme.dot"></span>
              <span class="text-[10px] font-bold" :class="form.color === key ? 'text-[#0066FF]' : 'text-[#64748B]'">{{ theme.label }}</span>
            </button>
          </div>
        </div>

        <!-- Seção de Exercícios Iniciais (Opcional) -->
        <div v-if="!editingSplit" class="space-y-2 pt-1 border-t border-[#E2E8F0]">
          <div class="flex items-center justify-between">
            <label class="block text-xs font-bold text-[#0F172A]">
              Exercícios Iniciais (Opcional)
            </label>
            <span class="text-[11px] text-[#0066FF] font-semibold">
              {{ selectedExercises.length }} selecionado(s)
            </span>
          </div>
          <p class="text-xs text-[#64748B]">
            Você pode selecionar exercícios agora ou adicionar depois na ficha.
          </p>

          <!-- Filtro de Busca de Exercício -->
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar exercício pelo nome..."
            class="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#0066FF] focus:bg-white rounded-xl px-3 py-1.5 text-xs text-[#0F172A] placeholder:text-[#94A3B8]"
          />

          <!-- Lista Rápida Selecionável -->
          <div class="max-h-36 overflow-y-auto space-y-1 pr-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2">
            <div
              v-for="ex in filteredExercises"
              :key="ex.id"
              @click="toggleExercise(ex)"
              class="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs border"
              :class="isExerciseSelected(ex.id)
                ? 'bg-blue-50 border-[#0066FF]/40 text-[#0066FF] font-bold'
                : 'border-transparent text-[#64748B] hover:bg-[#F1F5F9]'"
            >
              <div class="flex items-center gap-2 truncate">
                <span>{{ isExerciseSelected(ex.id) ? '☑' : '☐' }}</span>
                <span class="truncate">{{ ex.name }}</span>
              </div>
              <span class="text-[10px] text-[#94A3B8] uppercase tracking-wider flex-shrink-0">
                {{ ex.muscle }}
              </span>
            </div>
            <p v-if="filteredExercises.length === 0" class="text-xs text-[#94A3B8] p-2 text-center">
              Nenhum exercício encontrado.
            </p>
          </div>
        </div>

        <!-- Ações do Rodapé -->
        <div class="flex items-center gap-3 pt-3 border-t border-[#E2E8F0]">
          <button
            type="button"
            id="btn-cancel-create-split"
            @click="$emit('close')"
            class="tap-btn flex-1 min-h-11 px-4 rounded-xl border border-[#CBD5E1] bg-white text-[#0F172A] text-xs font-bold hover:bg-[#F8FAFC] transition-colors"
          >
            Cancelar
          </button>

          <button
            type="submit"
            id="btn-confirm-create-split"
            class="tap-btn flex-1 min-h-11 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
            :class="isWeightLoss
              ? 'bg-rose-500 text-white hover:bg-rose-600 border border-rose-500'
              : 'bg-[#F59E0B] text-[#0F172A] hover:bg-[#D97706] border border-[#F59E0B]'"
          >
            <span>✓ {{ editingSplit ? 'Salvar Alterações' : 'Criar Ficha' }}</span>
          </button>
        </div>
      </form>
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
  existingSplits: {
    type: Array,
    default: () => []
  },
  catalog: {
    type: Array,
    default: () => []
  },
  editingSplit: {
    type: Object,
    default: null
  },
  isWeightLoss: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'create', 'update']);

const COLOR_THEMES = {
  amber: { label: 'Âmbar', dot: 'bg-amber-500', accentBg: 'bg-amber-50 border-amber-200 text-amber-800' },
  blue: { label: 'Azul', dot: 'bg-blue-500', accentBg: 'bg-blue-50 border-blue-200 text-blue-800' },
  emerald: { label: 'Verde', dot: 'bg-emerald-500', accentBg: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  purple: { label: 'Roxo', dot: 'bg-purple-500', accentBg: 'bg-purple-50 border-purple-200 text-purple-800' },
  rose: { label: 'Rosa', dot: 'bg-rose-500', accentBg: 'bg-rose-50 border-rose-200 text-rose-800' },
  cyan: { label: 'Ciano', dot: 'bg-cyan-500', accentBg: 'bg-cyan-50 border-cyan-200 text-cyan-800' }
};

const form = ref({
  title: '',
  subtitle: '',
  color: 'amber'
});

const titleError = ref('');
const searchQuery = ref('');
const selectedExercises = ref([]);

function suggestNextTitle() {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const count = props.existingSplits.length;
  const nextLetter = letters[count] || String(count + 1);
  return `Treino ${nextLetter}`;
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      titleError.value = '';
      searchQuery.value = '';
      selectedExercises.value = [];

      if (props.editingSplit) {
        form.value = {
          title: props.editingSplit.title || '',
          subtitle: props.editingSplit.subtitle || '',
          color: props.editingSplit.color || 'amber'
        };
      } else {
        form.value = {
          title: suggestNextTitle(),
          subtitle: '',
          color: props.isWeightLoss ? 'rose' : 'amber'
        };
      }
    }
  },
  { immediate: true }
);

const filteredExercises = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return props.catalog.slice(0, 15);
  return props.catalog
    .filter(e => e.name.toLowerCase().includes(query) || (e.muscle && e.muscle.toLowerCase().includes(query)))
    .slice(0, 20);
});

function isExerciseSelected(id) {
  return selectedExercises.value.some(e => e.id === id);
}

function toggleExercise(exercise) {
  const idx = selectedExercises.value.findIndex(e => e.id === exercise.id);
  if (idx >= 0) {
    selectedExercises.value.splice(idx, 1);
  } else {
    selectedExercises.value.push(exercise);
  }
}

function handleSubmit() {
  const title = form.value.title.trim();
  if (!title) {
    titleError.value = 'Informe o nome da ficha de treino.';
    return;
  }

  const theme = COLOR_THEMES[form.value.color] || COLOR_THEMES.amber;

  if (props.editingSplit) {
    emit('update', {
      splitId: props.editingSplit.id,
      title,
      subtitle: form.value.subtitle.trim(),
      color: form.value.color,
      accentBg: theme.accentBg
    });
  } else {
    emit('create', {
      title,
      subtitle: form.value.subtitle.trim() || 'Ficha personalizada pelo atleta',
      color: form.value.color,
      accentBg: theme.accentBg,
      exercises: selectedExercises.value
    });
  }
}
</script>
