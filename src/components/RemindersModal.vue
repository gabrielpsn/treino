<template>
  <BaseModal
    :is-open="isOpen"
    modal-id="modal-reminders"
    title="Lembretes de Treino"
    subtitle="Notificação no celular nos dias e horário que você escolher"
    icon="⏰"
    @close="emit('close')"
  >
    <fieldset class="space-y-2">
      <legend class="text-xs font-bold text-[#64748B] mb-1">Dias da semana</legend>
      <div class="grid grid-cols-7 gap-1">
        <button
          v-for="day in DAYS"
          :key="day.id"
          type="button"
          :id="`btn-reminder-day-${day.id}`"
          :aria-pressed="settings.days.includes(day.id)"
          class="tap-btn py-2 rounded-lg text-xs font-black border"
          :class="settings.days.includes(day.id) ? 'bg-[#0066FF] text-white border-[#0066FF]' : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'"
          @click="toggleDay(day.id)"
        >{{ day.label }}</button>
      </div>
    </fieldset>

    <label class="block text-xs font-bold text-[#64748B]">
      Horário
      <input id="input-reminder-time" v-model="settings.time" type="time" class="mt-1 w-full rounded-xl border-2 border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A]" />
    </label>

    <p v-if="message" id="reminder-status" role="status" class="text-xs font-bold rounded-xl p-2.5" :class="isError ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'">{{ message }}</p>
    <p v-if="!supported" class="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
      Este navegador não suporta notificações. No iPhone, adicione o app à tela inicial (Compartilhar → Adicionar à Tela de Início) e abra por lá.
    </p>

    <div class="flex gap-2">
      <button id="btn-enable-reminders" type="button" :disabled="busy || settings.days.length === 0" class="tap-btn flex-1 py-2.5 rounded-xl bg-[#0066FF] text-white text-sm font-black disabled:opacity-50" @click="handleEnable">
        {{ settings.enabled ? 'Atualizar lembretes' : 'Ativar lembretes' }}
      </button>
      <button v-if="settings.enabled" id="btn-disable-reminders" type="button" :disabled="busy" class="tap-btn px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm font-bold" @click="handleDisable">
        Desativar
      </button>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref } from 'vue';
import BaseModal from './BaseModal.vue';
import { disableReminders, enableReminders, loadReminderSettings, pushSupported } from '../services/cloud.js';

defineProps({ isOpen: Boolean });
const emit = defineEmits(['close']);

const DAYS = [
  { id: 0, label: 'D' }, { id: 1, label: 'S' }, { id: 2, label: 'T' }, { id: 3, label: 'Q' },
  { id: 4, label: 'Q' }, { id: 5, label: 'S' }, { id: 6, label: 'S' }
];

const settings = ref(loadReminderSettings());
const supported = pushSupported();
const busy = ref(false);
const message = ref('');
const isError = ref(false);


function toggleDay(id) {
  const days = settings.value.days;
  settings.value.days = days.includes(id) ? days.filter(d => d !== id) : [...days, id].sort();
}

async function handleEnable() {
  busy.value = true;
  message.value = '';
  try {
    settings.value = await enableReminders({ days: settings.value.days, time: settings.value.time });
    isError.value = false;
    message.value = `Pronto! Você vai receber o lembrete às ${settings.value.time}.`;
  } catch (err) {
    isError.value = true;
    message.value = err.message;
  } finally {
    busy.value = false;
  }
}

async function handleDisable() {
  busy.value = true;
  try {
    settings.value = await disableReminders();
    isError.value = false;
    message.value = 'Lembretes desativados.';
  } finally {
    busy.value = false;
  }
}
</script>
