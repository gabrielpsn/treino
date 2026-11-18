<template>
  <div v-if="!account" class="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-2 text-center">
    <p class="text-sm font-black">Recursos online desativados</p>
    <p class="text-xs text-[#475569]">{{ reason }} Não pedimos e-mail nem senha: o app cria um código secreto anônimo neste aparelho.</p>
    <p v-if="error" class="text-xs font-bold text-rose-600">{{ error }}</p>
    <button id="btn-online-activate" type="button" :disabled="busy" class="tap-btn w-full py-2.5 rounded-xl bg-[#0066FF] text-white text-sm font-black disabled:opacity-50" @click="activate">
      Ativar recursos online
    </button>
  </div>
  <slot v-else :account="account" />
</template>

<script setup>
import { ref } from 'vue';
import { createCloudAccount, loadCloudAccount } from '../services/cloud.js';

defineProps({ reason: { type: String, default: '' } });
const emit = defineEmits(['account-changed']);

const account = ref(loadCloudAccount());
const busy = ref(false);
const error = ref('');

async function activate() {
  busy.value = true;
  error.value = '';
  try {
    account.value = await createCloudAccount();
    emit('account-changed', account.value);
  } catch (err) {
    error.value = err.message;
  } finally {
    busy.value = false;
  }
}

defineExpose({ refresh: () => { account.value = loadCloudAccount(); } });
</script>
