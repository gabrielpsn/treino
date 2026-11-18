<template>
  <BaseModal
    :is-open="isOpen"
    modal-id="modal-cloud-sync"
    title="Backup na Nuvem"
    subtitle="Sem e-mail nem senha: um código secreto liga seus aparelhos"
    icon="☁️"
    @close="emit('close')"
  >
    <p v-if="message" id="cloud-status" role="status" class="text-xs font-bold rounded-xl p-2.5" :class="isError ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'">{{ message }}</p>

    <template v-if="!account">
      <p class="text-xs text-[#475569] leading-relaxed">
        Ative para guardar uma cópia dos seus treinos, plano, medidas e conquistas no servidor e recuperar em outro celular.
        As fotos de progresso nunca saem do aparelho.
      </p>
      <button id="btn-cloud-activate" type="button" :disabled="busy" class="tap-btn w-full py-3 rounded-xl bg-[#0066FF] text-white text-sm font-black disabled:opacity-50" @click="handleActivate">
        Ativar backup na nuvem
      </button>
      <form class="space-y-2 border-t border-[#E2E8F0] pt-3" @submit.prevent="handleLink">
        <label class="block text-xs font-bold text-[#64748B]">
          Já tenho um código (de outro aparelho)
          <input id="input-cloud-code" v-model.trim="codeInput" type="text" autocomplete="off" spellcheck="false" class="mt-1 w-full rounded-xl border-2 border-[#CBD5E1] px-3 py-2 text-sm font-mono" />
        </label>
        <button id="btn-cloud-link" type="submit" :disabled="busy || !codeInput" class="tap-btn w-full py-2.5 rounded-xl border border-[#0066FF] text-[#0066FF] text-sm font-black disabled:opacity-50">
          Conectar e restaurar
        </button>
      </form>
    </template>

    <template v-else>
      <div class="rounded-2xl border border-amber-300 bg-amber-50 p-3 space-y-2">
        <p class="text-xs font-black text-amber-900">🔑 Seu código secreto</p>
        <p class="text-[11px] text-amber-900">Guarde em lugar seguro. Quem tiver este código acessa seus dados; sem ele, não há como recuperar.</p>
        <div class="flex gap-2">
          <code id="cloud-access-code" class="flex-1 text-[11px] bg-white rounded-lg border border-amber-200 px-2 py-2 break-all">{{ showCode ? account.accessCode : '••••••••••••••••' }}</code>
          <button id="btn-cloud-toggle-code" type="button" class="tap-btn px-3 rounded-lg bg-white border border-amber-300 text-xs font-bold" @click="showCode = !showCode">{{ showCode ? 'Ocultar' : 'Mostrar' }}</button>
          <button id="btn-cloud-copy-code" type="button" class="tap-btn px-3 rounded-lg bg-white border border-amber-300 text-xs font-bold" @click="copyCode">Copiar</button>
        </div>
      </div>

      <p class="text-xs text-[#475569]">Último envio: <strong id="cloud-last-sync">{{ account.lastSyncAt ? new Date(account.lastSyncAt).toLocaleString('pt-BR') : 'nunca' }}</strong></p>

      <div class="grid grid-cols-2 gap-2">
        <button id="btn-cloud-push" type="button" :disabled="busy" class="tap-btn py-2.5 rounded-xl bg-[#0066FF] text-white text-sm font-black disabled:opacity-50" @click="handlePush(false)">⬆️ Enviar agora</button>
        <button id="btn-cloud-pull" type="button" :disabled="busy" class="tap-btn py-2.5 rounded-xl border border-[#0066FF] text-[#0066FF] text-sm font-black disabled:opacity-50" @click="handlePull">⬇️ Baixar da nuvem</button>
      </div>
      <button v-if="conflict" id="btn-cloud-force-push" type="button" class="tap-btn w-full py-2 rounded-xl bg-amber-500 text-white text-xs font-black" @click="handlePush(true)">
        Substituir a nuvem pelos dados deste aparelho
      </button>
      <p class="text-[11px] text-[#64748B]">O app também envia sozinho depois de cada treino concluído.</p>

      <div class="border-t border-[#E2E8F0] pt-3 flex flex-col gap-2">
        <button id="btn-cloud-forget" type="button" class="tap-btn text-xs font-bold text-[#475569] underline" @click="handleForget">Desconectar este aparelho (os dados na nuvem continuam)</button>
        <button id="btn-cloud-delete" type="button" class="tap-btn text-xs font-bold text-rose-600 underline" @click="handleDelete">Excluir meus dados da nuvem</button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue';
import BaseModal from './BaseModal.vue';
import { buildBackup } from '../db/backup.js';
import {
  createCloudAccount,
  deleteCloudAccount,
  linkWithAccessCode,
  loadCloudAccount,
  pullSnapshot,
  pushSnapshot,
  saveCloudAccount
} from '../services/cloud.js';

const props = defineProps({ isOpen: Boolean });
const emit = defineEmits(['close', 'restore-backup', 'account-changed']);

const account = ref(loadCloudAccount());
const busy = ref(false);
const message = ref('');
const isError = ref(false);
const conflict = ref(false);
const codeInput = ref('');
const showCode = ref(false);

watch(() => props.isOpen, open => {
  if (open) {
    account.value = loadCloudAccount();
    message.value = '';
    conflict.value = false;
    showCode.value = false;
  }
});

async function run(action, success) {
  busy.value = true;
  message.value = '';
  try {
    await action();
    isError.value = false;
    if (success) message.value = success;
  } catch (err) {
    isError.value = true;
    message.value = err.message;
    if (err.code === 'conflict') conflict.value = true;
  } finally {
    busy.value = false;
  }
}

function handleActivate() {
  return run(async () => {
    account.value = await createCloudAccount();
    account.value = await pushSnapshot(account.value, await buildBackup());
    showCode.value = true;
    emit('account-changed', account.value);
  }, 'Backup na nuvem ativado. Anote o código abaixo!');
}

function handleLink() {
  return run(async () => {
    const { account: linked, snapshot } = await linkWithAccessCode(codeInput.value);
    account.value = linked;
    codeInput.value = '';
    emit('account-changed', linked);
    if (snapshot.backup) emit('restore-backup', snapshot.backup);
    else throw new Error('Código conectado, mas ainda não há backup na nuvem.');
  }, 'Aparelho conectado. Confira os dados antes de restaurar.');
}

function handlePush(force) {
  return run(async () => {
    account.value = await pushSnapshot(account.value, await buildBackup(), { force });
    conflict.value = false;
  }, 'Dados enviados para a nuvem.');
}

function handlePull() {
  return run(async () => {
    const snapshot = await pullSnapshot(account.value);
    if (!snapshot.backup) throw new Error('Ainda não há backup na nuvem.');
    account.value = { ...account.value, lastSyncAt: snapshot.updatedAt };
    saveCloudAccount(account.value);
    emit('restore-backup', snapshot.backup);
  });
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(account.value.accessCode);
    isError.value = false;
    message.value = 'Código copiado.';
  } catch {
    showCode.value = true;
  }
}

function handleForget() {
  if (!window.confirm('Desconectar este aparelho? Você vai precisar do código para conectar de novo.')) return;
  saveCloudAccount(null);
  account.value = null;
  emit('account-changed', null);
}

function handleDelete() {
  if (!window.confirm('Excluir permanentemente seus dados da nuvem, ligas e turmas? Isso não pode ser desfeito. Os dados deste aparelho continuam.')) return;
  return run(async () => {
    await deleteCloudAccount(account.value);
    account.value = null;
    emit('account-changed', null);
  }, 'Dados da nuvem excluídos.');
}
</script>
