<template>
  <div
    v-if="isOpen"
    id="custom-exercises-overlay"
    class="fixed inset-0 z-50 flex justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
    role="dialog"
    aria-modal="true"
    aria-labelledby="custom-exercises-title"
    @click.self="emit('close')"
  >
    <div
      id="custom-exercises-modal"
      class="relative w-full max-w-2xl bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-2xl my-auto text-[#0F172A]"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 id="custom-exercises-title" class="text-xl font-black text-[#0F172A]">Meus exercícios</h2>
          <p class="text-xs text-[#64748B] mt-1">
            Exercícios criados por você entram no plano e na troca de exercícios.
            Marque as articulações sobrecarregadas para respeitar suas restrições.
          </p>
        </div>
        <button
          type="button"
          id="btn-close-custom-exercises"
          class="text-[#64748B] hover:text-[#0F172A] text-2xl leading-none p-1 transition-colors"
          aria-label="Fechar meus exercícios"
          @click="emit('close')"
        >
          ×
        </button>
      </div>

      <div
        v-if="errorSummary"
        id="custom-exercises-error-summary"
        role="alert"
        aria-live="assertive"
        class="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2"
      >
        <span aria-hidden="true">⚠️</span>
        <span class="text-xs font-semibold text-rose-700">{{ errorSummary }}</span>
      </div>

      <!-- Lista dos exercícios do usuário -->
      <div class="space-y-2 mb-6">
        <p v-if="exercises.length === 0" id="custom-exercises-empty" class="text-sm text-[#94A3B8] text-center py-8">
          Você ainda não criou nenhum exercício.
        </p>

        <div
          v-for="ex in exercises"
          :key="ex.id"
          :id="`custom-exercise-${ex.id}`"
          class="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start justify-between gap-3"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-bold text-[#0F172A] truncate">{{ ex.name }}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-[#0066FF] border border-blue-200 font-semibold">
                {{ muscleLabels[ex.muscle] || ex.muscle }}
              </span>
              <span
                v-if="ex.jointStress.length"
                class="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium"
              >
                sobrecarrega {{ ex.jointStress.map(j => jointLabels[j] || j).join(', ') }}
              </span>
            </div>
            <p class="text-[11px] text-[#64748B] mt-0.5">{{ ex.defaultSeries }} • {{ ex.rest }}</p>
          </div>
          <div class="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              :id="`btn-edit-custom-${ex.id}`"
              class="text-[11px] text-[#64748B] hover:text-[#0066FF] font-semibold px-2 py-1 transition-colors"
              :aria-label="`Editar ${ex.name}`"
              @click="startEdit(ex)"
            >
              Editar
            </button>
            <button
              type="button"
              :id="`btn-delete-custom-${ex.id}`"
              class="text-[11px] text-[#64748B] hover:text-rose-600 font-semibold px-2 py-1 transition-colors"
              :aria-label="`Excluir ${ex.name}`"
              @click="confirmDelete(ex)"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>

      <!-- Confirmação de exclusão -->
      <div
        v-if="pendingDelete"
        id="custom-exercise-delete-confirm"
        class="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200"
      >
        <p class="text-xs text-rose-800 mb-3">
          Excluir <strong>{{ pendingDelete.name }}</strong>? Ele também sai do plano atual
          quando o plano for regerado.
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            id="btn-confirm-delete-custom"
            class="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
            @click="doDelete"
          >
            Excluir
          </button>
          <button
            type="button"
            id="btn-cancel-delete-custom"
            class="px-3 py-1.5 rounded-lg bg-white border border-[#CBD5E1] text-[#0F172A] text-xs font-bold hover:bg-[#F8FAFC] transition-colors"
            @click="pendingDelete = null"
          >
            Cancelar
          </button>
        </div>
      </div>

      <!-- Formulário -->
      <form id="custom-exercise-form" class="space-y-4" @submit.prevent="submit">
        <h3 class="text-sm font-bold text-[#0F172A]">
          {{ editingId ? 'Editar exercício' : 'Novo exercício' }}
        </h3>

        <div>
          <label for="input-custom-name" class="block text-xs font-bold text-[#0F172A] mb-1">Nome</label>
          <input
            id="input-custom-name"
            v-model="form.name"
            type="text"
            :aria-invalid="!!errors.name"
            :aria-describedby="errors.name ? 'error-custom-name' : undefined"
            placeholder="Ex.: Supino na Arquinha"
            class="w-full bg-[#F8FAFC] border-2 rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] font-bold placeholder:text-[#94A3B8] focus:outline-none transition-colors"
            :class="errors.name ? 'border-rose-500 bg-rose-50/20 focus:border-rose-500' : 'border-[#CBD5E1] focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/20'"
          />
          <p v-if="errors.name" id="error-custom-name" class="text-[11px] font-bold text-rose-600 mt-1">{{ errors.name }}</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="select-custom-muscle" class="block text-xs font-bold text-[#0F172A] mb-1">Grupo muscular</label>
            <select
              id="select-custom-muscle"
              v-model="form.muscle"
              class="w-full bg-[#F8FAFC] border-2 rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] font-bold focus:outline-none transition-colors"
              :class="errors.muscle ? 'border-rose-500 bg-rose-50/20' : 'border-[#CBD5E1] focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/20'"
            >
              <option value="" disabled>Selecione</option>
              <option v-for="m in muscleOptions" :key="m" :value="m">{{ muscleLabels[m] }}</option>
            </select>
            <p v-if="errors.muscle" class="text-[11px] font-bold text-rose-600 mt-1">{{ errors.muscle }}</p>
          </div>

          <div>
            <label for="select-custom-pattern" class="block text-xs font-bold text-[#0F172A] mb-1">Padrão de movimento</label>
            <select
              id="select-custom-pattern"
              v-model="form.pattern"
              class="w-full bg-[#F8FAFC] border-2 rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] font-bold focus:outline-none transition-colors"
              :class="errors.pattern ? 'border-rose-500 bg-rose-50/20' : 'border-[#CBD5E1] focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/20'"
            >
              <option value="" disabled>Selecione</option>
              <option v-for="p in availablePatterns" :key="p" :value="p">{{ patternLabels[p] || p }}</option>
            </select>
            <p v-if="errors.pattern" class="text-[11px] font-bold text-rose-600 mt-1">{{ errors.pattern }}</p>
          </div>
        </div>

        <div>
          <span class="block text-xs font-semibold text-[#64748B] mb-1">Equipamento necessário</span>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="eq in equipmentOptions"
              :key="eq"
              type="button"
              :id="`btn-custom-equipment-${eq}`"
              :aria-pressed="form.equipment === eq"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
              :class="form.equipment === eq
                ? 'bg-[#0066FF] border-[#0066FF] text-white shadow-sm'
                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1]'"
              @click="form.equipment = eq"
            >
              {{ equipmentLabels[eq] }}
            </button>
          </div>
        </div>

        <div>
          <span class="block text-xs font-semibold text-[#64748B] mb-1">Articulações sobrecarregadas</span>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="j in jointOptions"
              :key="j"
              type="button"
              :id="`btn-custom-joint-${j}`"
              :aria-pressed="form.jointStress.includes(j)"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
              :class="form.jointStress.includes(j)
                ? 'bg-rose-100 border-rose-300 text-rose-800 font-bold'
                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1]'"
              @click="toggleJoint(j)"
            >
              {{ jointLabels[j] }}
            </button>
          </div>
          <p class="text-[11px] text-[#64748B] mt-1.5">
            Só marque as que o exercício realmente sobrecarrega. Marcar uma a mais
            apenas esconde o exercício para quem tem essa dor.
          </p>
          <p v-if="errors.jointStress" class="text-[11px] text-rose-600 mt-1">{{ errors.jointStress }}</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="input-custom-series" class="block text-xs font-bold text-[#0F172A] mb-1">Séries</label>
            <input
              id="input-custom-series"
              v-model="form.defaultSeries"
              type="text"
              :aria-invalid="!!errors.defaultSeries"
              placeholder="3x 10-12 reps"
              class="w-full bg-[#F8FAFC] border-2 rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] font-bold placeholder:text-[#94A3B8] focus:outline-none transition-colors"
              :class="errors.defaultSeries ? 'border-rose-500 bg-rose-50/20' : 'border-[#CBD5E1] focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/20'"
            />
            <p v-if="errors.defaultSeries" class="text-[11px] font-bold text-rose-600 mt-1">{{ errors.defaultSeries }}</p>
          </div>

          <div>
            <label for="input-custom-rest" class="block text-xs font-bold text-[#0F172A] mb-1">Descanso</label>
            <input
              id="input-custom-rest"
              v-model="form.rest"
              type="text"
              :aria-invalid="!!errors.rest"
              placeholder="60s"
              class="w-full bg-[#F8FAFC] border-2 rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] font-bold placeholder:text-[#94A3B8] focus:outline-none transition-colors"
              :class="errors.rest ? 'border-rose-500 bg-rose-50/20' : 'border-[#CBD5E1] focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/20'"
            />
            <p v-if="errors.rest" class="text-[11px] font-bold text-rose-600 mt-1">{{ errors.rest }}</p>
          </div>
        </div>

        <div>
          <label for="input-custom-tips" class="block text-xs font-bold text-[#0F172A] mb-1">Dica de execução</label>
          <textarea
            id="input-custom-tips"
            v-model="form.tips"
            rows="2"
            maxlength="240"
            placeholder="Apoio, amplitude, erro comum..."
            class="w-full bg-[#F8FAFC] border-2 border-[#CBD5E1] focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/20 rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] font-semibold placeholder:text-[#94A3B8] focus:outline-none resize-y transition-colors"
          ></textarea>
          <p v-if="errors.tips" class="text-[11px] font-bold text-rose-600 mt-1">{{ errors.tips }}</p>
        </div>

        <div class="flex items-center gap-2 pt-2">
          <button
            type="submit"
            id="btn-save-custom-exercise"
            class="px-4 py-2 rounded-xl bg-[#F59E0B] text-[#0F172A] text-sm font-bold hover:bg-[#D97706] shadow-sm transition-colors"
          >
            {{ editingId ? 'Salvar alterações' : 'Criar exercício' }}
          </button>
          <button
            v-if="editingId"
            type="button"
            id="btn-cancel-edit-custom"
            class="px-4 py-2 rounded-xl bg-white border border-[#CBD5E1] text-[#0F172A] text-sm font-bold hover:bg-[#F8FAFC] transition-colors"
            @click="resetForm"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import {
  MUSCLE_OPTIONS,
  PATTERN_OPTIONS,
  EQUIPMENT_OPTIONS,
  JOINT_OPTIONS,
  MUSCLE_LABELS,
  PATTERN_LABELS,
  EQUIPMENT_LABELS,
  JOINT_LABELS,
  validateCustomExercise
} from '../db/customExercises';

const props = defineProps({
  isOpen: Boolean,
  exercises: { type: Array, default: () => [] },
  // Grupo muscular pré-escolhado, usado quando o modal é aberto a partir do
  // seletor de adição de exercício. Evita o usuário escolher de novo o mesmo
  // grupo muscular que ele acabou de ver.
  initialMuscle: { type: String, default: null }
});

const emit = defineEmits(['close', 'save', 'delete']);

const muscleOptions = MUSCLE_OPTIONS;
const equipmentOptions = EQUIPMENT_OPTIONS;
const jointOptions = JOINT_OPTIONS;
const muscleLabels = MUSCLE_LABELS;
const patternLabels = PATTERN_LABELS;
const equipmentLabels = EQUIPMENT_LABELS;
const jointLabels = JOINT_LABELS;

// O primeiro padrão do grupo já vem preenchido: o formulário não deve nascer
// com um campo obrigatório em branco que o usuário nunca escolheu.
function blankForm(muscle = 'peito') {
  const group = PATTERN_OPTIONS[muscle] ? muscle : 'peito';
  return {
    name: '',
    muscle: group,
    pattern: PATTERN_OPTIONS[group][0],
    equipment: 'gym_or_home',
    jointStress: [],
    defaultSeries: '3x 10-12 reps',
    rest: '60s',
    tips: ''
  };
}

const form = ref(blankForm());
const errors = ref({});
const errorSummary = ref('');
const editingId = ref(null);
const pendingDelete = ref(null);

// Só oferece padrões do grupo escolhido: mandar "agachamento" como exercício de
// costas geraria uma ficha incoerente.
const availablePatterns = computed(() => PATTERN_OPTIONS[form.value.muscle] ?? []);

// Padrão derivado quando o grupo muda. O valor inicial já vem correto em
// blankForm(), então aqui só importa a troca de grupo em tempo de uso.
function normalizePattern() {
  const valid = availablePatterns.value;
  if (!valid.includes(form.value.pattern)) {
    form.value.pattern = valid[0] ?? '';
  }
}

watch(
  () => form.value.muscle,
  () => {
    normalizePattern();
    errors.value.pattern = '';
  }
);

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      resetForm(props.initialMuscle);
      pendingDelete.value = null;
    }
  }
);

// O preset chega no mesmo tick em que o modal abre (o pai ajusta a prop no
// mesmo handler do clique). `immediate` cobre o primeiro preenchimento.
watch(
  () => props.initialMuscle,
  (muscle) => {
    if (muscle && !editingId.value && PATTERN_OPTIONS[muscle]) {
      form.value.muscle = muscle;
      normalizePattern();
    }
  },
  { immediate: true }
);

function resetForm(muscle = props.initialMuscle) {
  form.value = blankForm(muscle);
  errors.value = {};
  errorSummary.value = '';
  editingId.value = null;
}

function startEdit(ex) {
  form.value = {
    name: ex.name,
    muscle: ex.muscle,
    pattern: ex.pattern,
    equipment: ex.equipment,
    jointStress: [...(ex.jointStress ?? [])],
    defaultSeries: ex.defaultSeries,
    rest: ex.rest,
    tips: ex.tips ?? ''
  };
  errors.value = {};
  errorSummary.value = '';
  editingId.value = ex.id;
}

function confirmDelete(ex) {
  pendingDelete.value = ex;
}

function doDelete() {
  emit('delete', pendingDelete.value.id);
  pendingDelete.value = null;
  resetForm();
}

function toggleJoint(joint) {
  const list = form.value.jointStress;
  form.value.jointStress = list.includes(joint)
    ? list.filter(j => j !== joint)
    : [...list, joint];
}

function submit() {
  errors.value = {};
  errorSummary.value = '';

  const result = validateCustomExercise(form.value, { existingId: editingId.value });
  if (!result.ok) {
    errors.value = result.errors;
    errorSummary.value = `Corrija ${Object.keys(result.errors).length} ${
      Object.keys(result.errors).length === 1 ? 'campo' : 'campos'
    } para salvar o exercício.`;
    return;
  }

  emit('save', result.value);
  resetForm();
}
</script>
