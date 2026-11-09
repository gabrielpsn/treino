<template>
  <div
    v-if="isOpen"
    id="backup-import-overlay"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
    role="dialog"
    aria-modal="true"
    aria-labelledby="backup-import-title"
    @click.self="emit('close')"
  >
    <div
      id="backup-import-modal"
      class="relative w-full max-w-lg bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-2xl my-8 text-[#0F172A]"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 id="backup-import-title" class="text-xl font-black text-[#0F172A]">Restaurar backup</h2>
          <p class="text-xs text-[#64748B] mt-1">{{ fileName }}</p>
        </div>
        <button
          type="button"
          id="btn-close-backup-import"
          class="text-[#64748B] hover:text-[#0F172A] text-2xl leading-none p-1 transition-colors"
          aria-label="Fechar restauração de backup"
          @click="emit('close')"
        >
          ×
        </button>
      </div>

      <p class="text-sm text-[#64748B] mb-4">
        Confira o conteúdo antes de restaurar. A restauração
        <strong class="text-rose-600 font-bold">substitui</strong> todos os dados atuais
        deste aparelho.
      </p>

      <dl class="grid grid-cols-2 gap-2 text-sm mb-5">
        <div
          v-for="row in rows"
          :key="row.label"
          class="flex items-baseline justify-between gap-3 px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"
        >
          <dt class="text-xs text-[#64748B]">{{ row.label }}</dt>
          <dd :id="`backup-stat-${row.id}`" class="font-bold text-[#0F172A] tabular-nums">{{ row.value }}</dd>
        </div>
      </dl>

      <div
        v-if="warnings.length > 0"
        id="backup-import-warnings"
        role="status"
        class="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200"
      >
        <p class="text-xs font-bold text-amber-800 mb-1">O que será ajustado ao restaurar:</p>
        <ul class="text-xs text-amber-700 space-y-1 list-disc list-inside font-medium">
          <li v-for="warning in warnings" :key="warning">{{ warning }}</li>
        </ul>
      </div>

      <div class="flex gap-3 justify-end">
        <button
          type="button"
          id="btn-cancel-backup-import"
          class="px-4 py-2 rounded-xl text-sm font-bold text-[#0F172A] border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] transition-colors"
          @click="emit('close')"
        >
          Cancelar
        </button>
        <button
          type="button"
          id="btn-confirm-backup-import"
          class="px-4 py-2 rounded-xl text-sm font-bold bg-[#F59E0B] text-[#0F172A] hover:bg-[#D97706] shadow-sm transition-colors"
          @click="emit('confirm')"
        >
          Substituir dados
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  fileName: { type: String, default: '' },
  // Backup já normalizado por parseBackupText(): o modal não revalida nada,
  // ele só mostra o que o usuário vai perder antes de confirmar.
  backup: { type: Object, default: null },
  warnings: { type: Array, default: () => [] }
});

const emit = defineEmits(['close', 'confirm']);

const rows = computed(() => {
  const summary = props.backup?.summary;
  if (!summary) return [];

  return [
    { id: 'user', label: 'Perfil', value: summary.userName || 'sem nome' },
    {
      id: 'date',
      label: 'Exportado em',
      value: summary.exportedAt ? formatDate(summary.exportedAt) : 'data desconhecida'
    },
    { id: 'splits', label: 'Fichas', value: summary.splits },
    { id: 'exercises', label: 'Exercícios na ficha', value: summary.exercises },
    { id: 'custom', label: 'Exercícios próprios', value: summary.customExercises },
    { id: 'sessions', label: 'Treinos registrados', value: summary.sessions },
    { id: 'sets', label: 'Séries registradas', value: summary.sets }
  ];
});

function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'data inválida';
  return date.toLocaleDateString('pt-BR');
}
</script>
