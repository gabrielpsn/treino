<template>
  <div
    v-if="isOpen"
    id="workout-day-completion-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="day-completion-title"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
  >
    <div
      class="bg-white border border-[#E2E8F0] w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl relative my-8 text-[#0F172A] animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Ícone e Cabeçalho -->
      <div class="flex items-start justify-between gap-4 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center text-2xl shadow-xs flex-shrink-0">
            🗓️
          </div>
          <div>
            <h3 id="day-completion-title" class="text-lg font-black text-[#0F172A] leading-tight">
              Concluir Dia no Quadro
            </h3>
            <p class="text-xs text-[#64748B] mt-0.5">
              Registre a data no calendário semanal e ganhe XP.
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-close-day-completion"
          aria-label="Fechar confirmação de dia"
          @click="$emit('skip')"
          class="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded-xl hover:bg-[#F1F5F9] transition-colors leading-none"
        >
          ✕
        </button>
      </div>

      <!-- Resumo da Conclusão -->
      <div class="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 space-y-3 mb-5">
        <!-- Seletor do Dia da Semana -->
        <div>
          <label class="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
            Dia da Semana
          </label>
          <div class="grid grid-cols-4 sm:grid-cols-7 gap-1.5" role="radiogroup" aria-label="Escolha o dia da semana para marcar">
            <button
              v-for="day in availableDays"
              :key="day.id"
              type="button"
              :id="`btn-select-day-${day.id}`"
              role="radio"
              :aria-checked="selectedDayId === day.id"
              @click="selectedDayId = day.id"
              class="py-2 px-1 rounded-xl text-center text-xs font-bold transition-all border"
              :class="selectedDayId === day.id
                ? 'bg-[#0066FF] border-[#0066FF] text-white shadow-xs'
                : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1] hover:text-[#0F172A]'"
            >
              <span class="block text-[11px] leading-tight">{{ day.shortLabel || day.label.slice(0, 3) }}</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 pt-1 border-t border-[#E2E8F0] text-xs">
          <!-- Treino Executado -->
          <div>
            <span class="text-[#64748B] block text-[10px] uppercase font-bold tracking-wider">Treino</span>
            <strong class="text-[#0066FF] font-bold block truncate mt-0.5">
              {{ splitTitle || 'Treino do Dia' }}
            </strong>
          </div>

          <!-- Data / Hora Concluída -->
          <div>
            <span class="text-[#64748B] block text-[10px] uppercase font-bold tracking-wider">Concluído em</span>
            <strong class="text-[#0F172A] font-bold block mt-0.5 tabular-nums">
              {{ formattedDate }}
            </strong>
          </div>
        </div>

        <!-- Recompensa de XP -->
        <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-base" aria-hidden="true">⚡</span>
            <div>
              <p class="text-xs font-bold text-[#0F172A]">Consistência Semanal</p>
              <p class="text-[10px] text-[#64748B]">Bônus por manter sua rotina em dia</p>
            </div>
          </div>
          <span class="text-xs font-black text-amber-700 bg-amber-100/70 border border-amber-300 px-2.5 py-1 rounded-lg tabular-nums">
            +{{ xpReward }} XP
          </span>
        </div>
      </div>

      <!-- Ações -->
      <div class="space-y-2">
        <button
          type="button"
          id="btn-confirm-day-completion"
          @click="confirmSelection"
          class="tap-btn w-full py-3.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 bg-[#F59E0B] text-[#0F172A] hover:bg-[#D97706] border border-[#F59E0B]"
        >
          <span>✓ Marcar {{ selectedDayLabel }} (+{{ xpReward }} XP)</span>
        </button>

        <button
          type="button"
          id="btn-skip-day-completion"
          @click="$emit('skip')"
          class="tap-btn w-full py-2.5 px-4 text-xs font-bold text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          Concluir treino sem marcar dia
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
  suggestedDayId: {
    type: String,
    default: 'seg'
  },
  allDays: {
    type: Array,
    default: () => [
      { id: 'seg', label: 'Segunda', shortLabel: 'Seg' },
      { id: 'ter', label: 'Terça', shortLabel: 'Ter' },
      { id: 'qua', label: 'Quarta', shortLabel: 'Qua' },
      { id: 'qui', label: 'Quinta', shortLabel: 'Qui' },
      { id: 'sex', label: 'Sexta', shortLabel: 'Sex' },
      { id: 'sab', label: 'Sábado', shortLabel: 'Sáb' },
      { id: 'dom', label: 'Domingo', shortLabel: 'Dom' }
    ]
  },
  splitTitle: {
    type: String,
    default: ''
  },
  xpReward: {
    type: Number,
    default: 50
  }
});

const emit = defineEmits(['confirm', 'skip']);

const selectedDayId = ref(props.suggestedDayId);

watch(
  () => props.suggestedDayId,
  (newId) => {
    if (newId) selectedDayId.value = newId;
  },
  { immediate: true }
);

watch(
  () => props.isOpen,
  (open) => {
    if (open && props.suggestedDayId) {
      selectedDayId.value = props.suggestedDayId;
    }
  }
);

const availableDays = computed(() => {
  if (props.allDays && props.allDays.length > 0) return props.allDays;
  return [
    { id: 'seg', label: 'Segunda', shortLabel: 'Seg' },
    { id: 'ter', label: 'Terça', shortLabel: 'Ter' },
    { id: 'qua', label: 'Quarta', shortLabel: 'Qua' },
    { id: 'qui', label: 'Quinta', shortLabel: 'Qui' },
    { id: 'sex', label: 'Sexta', shortLabel: 'Sex' },
    { id: 'sab', label: 'Sábado', shortLabel: 'Sáb' },
    { id: 'dom', label: 'Domingo', shortLabel: 'Dom' }
  ];
});

const selectedDay = computed(() => {
  return availableDays.value.find(d => d.id === selectedDayId.value) || availableDays.value[0];
});

const selectedDayLabel = computed(() => selectedDay.value?.label || 'Dia');

const formattedDate = computed(() => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  return `${day}/${month} às ${hours}:${mins}`;
});

function confirmSelection() {
  const now = new Date();
  const completedDate = now.toLocaleDateString('pt-BR');
  const completedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const completedAt = now.toISOString();

  emit('confirm', {
    dayId: selectedDayId.value,
    dayLabel: selectedDayLabel.value,
    completedAt,
    completedDate,
    completedTime
  });
}
</script>
