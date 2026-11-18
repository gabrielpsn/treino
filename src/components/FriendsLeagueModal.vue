<template>
  <BaseModal
    :is-open="isOpen"
    modal-id="modal-friends-league"
    title="Liga com Amigos"
    subtitle="Ranking real da semana, por código de convite"
    icon="🏆"
    @close="emit('close')"
  >
    <OnlineAccountGate v-if="isOpen" ref="gate" reason="As ligas reais precisam do servidor para juntar a pontuação de todos." @account-changed="onAccount">
      <template #default="{ account }">
        <p v-if="message" id="friends-league-status" role="status" class="text-xs font-bold rounded-xl p-2.5" :class="isError ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'">{{ message }}</p>

        <label class="block text-xs font-bold text-[#64748B]">
          Seu apelido nas ligas
          <input id="input-league-nickname" v-model.trim="nickname" maxlength="24" class="mt-1 w-full rounded-xl border-2 border-[#CBD5E1] px-3 py-2 text-sm" />
        </label>

        <div v-if="!selected" class="space-y-3">
          <ul id="friends-league-list" class="space-y-1.5">
            <li v-if="leagues.length === 0" class="text-xs text-[#64748B] text-center py-2">Você ainda não está em nenhuma liga.</li>
            <li v-for="l in leagues" :key="l.id">
              <button type="button" :id="`btn-open-league-${l.id}`" class="tap-btn w-full flex items-center justify-between rounded-xl border border-[#E2E8F0] px-3 py-2.5 text-left hover:bg-[#F8FAFC]" @click="openLeague(account, l)">
                <span class="text-sm font-black">{{ l.name }}</span>
                <span class="text-[11px] text-[#64748B]">{{ l.members }} atletas →</span>
              </button>
            </li>
          </ul>
          <form class="flex gap-2" @submit.prevent="handleCreate(account)">
            <input id="input-new-league-name" v-model.trim="newName" maxlength="40" placeholder="Nome da nova liga" class="flex-1 rounded-xl border-2 border-[#CBD5E1] px-3 py-2 text-sm" />
            <button id="btn-create-league" type="submit" :disabled="busy" class="tap-btn px-4 rounded-xl bg-[#0066FF] text-white text-sm font-black">Criar</button>
          </form>
          <form class="flex gap-2" @submit.prevent="handleJoin(account)">
            <input id="input-join-league-code" v-model.trim="joinCode" maxlength="16" placeholder="Código de convite" class="flex-1 rounded-xl border-2 border-[#CBD5E1] px-3 py-2 text-sm uppercase" />
            <button id="btn-join-league" type="submit" :disabled="busy || !joinCode" class="tap-btn px-4 rounded-xl border border-[#0066FF] text-[#0066FF] text-sm font-black">Entrar</button>
          </form>
        </div>

        <div v-else class="space-y-3">
          <button type="button" id="btn-league-back" class="tap-btn text-xs font-bold text-[#0066FF]" @click="selected = null">← Minhas ligas</button>
          <div class="flex items-center justify-between">
            <h4 class="text-base font-black">{{ selected.name }}</h4>
            <button type="button" id="btn-share-league-code" class="tap-btn text-xs font-black px-3 py-1.5 rounded-lg bg-[#F1F5F9]" @click="shareCode">Convite: {{ selected.inviteCode }}</button>
          </div>
          <p class="text-[11px] text-[#64748B]">Semana {{ weekKey }} · sua pontuação desta semana: <strong>{{ myScore }} pts</strong> (+10 por série, +50 por recorde, +20 por dia treinado)</p>
          <ol id="friends-league-ranking" class="space-y-1.5">
            <li v-for="row in selected.ranking" :key="row.position" class="flex items-center justify-between rounded-xl border px-3 py-2 text-sm" :class="row.isMe ? 'border-[#0066FF] bg-[#0066FF]/10' : 'border-[#E2E8F0]'">
              <span class="font-black">{{ row.position }}º {{ row.nickname }} <span v-if="row.isMe" class="text-[10px] text-[#0066FF]">(você)</span></span>
              <span class="font-black">{{ row.score }} pts</span>
            </li>
          </ol>
          <button type="button" id="btn-leave-league" class="tap-btn text-xs font-bold text-rose-600 underline" @click="handleLeave(account)">
            {{ selected.isOwner ? 'Encerrar esta liga' : 'Sair desta liga' }}
          </button>
        </div>
      </template>
    </OnlineAccountGate>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue';
import BaseModal from './BaseModal.vue';
import OnlineAccountGate from './OnlineAccountGate.vue';
import { createLeague, getLeague, joinLeague, leaveLeague, listLeagues, loadCloudAccount, postLeagueScore } from '../services/cloud.js';

const props = defineProps({
  isOpen: Boolean,
  weekKey: { type: String, required: true },
  myScore: { type: Number, default: 0 },
  defaultNickname: { type: String, default: 'Atleta' }
});
const emit = defineEmits(['close']);

const NICK_KEY = 'overload_league_nickname';
const leagues = ref([]);
const selected = ref(null);
const busy = ref(false);
const message = ref('');
const isError = ref(false);
const newName = ref('');
const joinCode = ref('');
const nickname = ref(readNick());
const gate = ref(null);

function readNick() {
  try { return localStorage.getItem(NICK_KEY) || ''; } catch { return ''; }
}
watch(nickname, v => { try { localStorage.setItem(NICK_KEY, v); } catch { /* ignora */ } });

async function run(fn, success = '') {
  busy.value = true;
  message.value = '';
  try {
    await fn();
    isError.value = false;
    message.value = success;
  } catch (err) {
    isError.value = true;
    message.value = err.message;
  } finally {
    busy.value = false;
  }
}

async function refresh(account) {
  const data = await listLeagues(account);
  leagues.value = data.leagues;
  // Publica a pontuação da semana em todas as ligas ao abrir.
  await Promise.all(data.leagues.map(l => postLeagueScore(account, l.id, props.weekKey, props.myScore).catch(() => {})));
}

watch(() => props.isOpen, open => {
  selected.value = null;
  if (!nickname.value) nickname.value = props.defaultNickname;
  const account = loadCloudAccount();
  if (open && account) run(() => refresh(account));
});

function onAccount(account) {
  if (account) run(() => refresh(account));
}

function openLeague(account, league) {
  return run(async () => {
    await postLeagueScore(account, league.id, props.weekKey, props.myScore);
    selected.value = await getLeague(account, league.id, props.weekKey);
  });
}

function handleCreate(account) {
  return run(async () => {
    const created = await createLeague(account, { name: newName.value || 'Liga dos Amigos', nickname: nickname.value || props.defaultNickname });
    newName.value = '';
    await refresh(account);
    await openLeague(account, { id: created.id });
  }, 'Liga criada! Envie o código de convite para seus amigos.');
}

function handleJoin(account) {
  return run(async () => {
    const joined = await joinLeague(account, { inviteCode: joinCode.value, nickname: nickname.value || props.defaultNickname });
    joinCode.value = '';
    await refresh(account);
    await openLeague(account, { id: joined.id });
  }, 'Você entrou na liga!');
}

function handleLeave(account) {
  const msg = selected.value.isOwner ? 'Encerrar a liga para todos os participantes?' : 'Sair desta liga?';
  if (!window.confirm(msg)) return;
  return run(async () => {
    await leaveLeague(account, selected.value.id);
    selected.value = null;
    await refresh(account);
  });
}

async function shareCode() {
  const text = `Entra na minha liga "${selected.value.name}" no Overload AI! Código: ${selected.value.inviteCode}`;
  try {
    if (navigator.share) await navigator.share({ text });
    else {
      await navigator.clipboard.writeText(text);
      isError.value = false;
      message.value = 'Convite copiado.';
    }
  } catch {
    // Compartilhamento cancelado.
  }
}

defineExpose({ gate });
</script>
