<template>
  <BaseModal
    :is-open="isOpen"
    modal-id="modal-trainer"
    title="Modo Personal Trainer"
    subtitle="Acompanhe alunos ou receba fichas do seu personal"
    icon="🧑‍🏫"
    wide
    :tabs="TABS"
    v-model:active-tab="tab"
    @close="emit('close')"
  >
    <OnlineAccountGate v-if="isOpen" reason="O modo personal conecta aluno e professor pelo servidor." @account-changed="onAccount">
      <template #default="{ account }">
        <p v-if="message" id="trainer-status" role="status" class="text-xs font-bold rounded-xl p-2.5" :class="isError ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'">{{ message }}</p>

        <!-- ALUNO -->
        <section v-if="tab === 'student'" class="space-y-3">
          <div v-if="inbox.length" id="trainer-inbox" class="space-y-2">
            <h4 class="text-sm font-black">📥 Fichas recebidas</h4>
            <div v-for="plan in inbox" :key="plan.id" class="rounded-2xl border border-[#0066FF]/40 bg-blue-50/50 p-3 space-y-2">
              <p class="text-xs font-bold">De: {{ plan.className }} · {{ new Date(plan.createdAt).toLocaleDateString('pt-BR') }}</p>
              <p v-if="plan.note" class="text-xs italic text-[#475569]">“{{ plan.note }}”</p>
              <ul class="text-[11px] text-[#475569] list-disc pl-4">
                <li v-for="split in plan.workoutSplits" :key="split.id">{{ split.title }}: {{ (split.exercises || []).map(e => e.name).join(', ') }}</li>
              </ul>
              <div class="flex gap-2">
                <button type="button" :id="`btn-accept-plan-${plan.id}`" class="tap-btn flex-1 py-2 rounded-xl bg-[#0066FF] text-white text-xs font-black" @click="respond(account, plan, true)">Usar esta ficha</button>
                <button type="button" :id="`btn-decline-plan-${plan.id}`" class="tap-btn px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-bold" @click="respond(account, plan, false)">Recusar</button>
              </div>
            </div>
          </div>

          <ul id="trainer-memberships" class="space-y-1.5">
            <li v-for="m in memberships" :key="m.id" class="flex items-center justify-between rounded-xl border border-[#E2E8F0] px-3 py-2 text-xs">
              <span><strong>{{ m.name }}</strong> · como {{ m.displayName }}<br /><span class="text-[#64748B]">Resumo enviado: {{ m.summaryUpdatedAt ? new Date(m.summaryUpdatedAt).toLocaleString('pt-BR') : 'ainda não' }}</span></span>
              <button type="button" :id="`btn-leave-class-${m.id}`" class="tap-btn text-rose-600 font-bold" @click="leave(account, m)">Sair</button>
            </li>
          </ul>

          <form class="grid grid-cols-1 sm:grid-cols-3 gap-2" @submit.prevent="join(account)">
            <input id="input-class-code" v-model.trim="classCode" placeholder="Código do personal" class="rounded-xl border-2 border-[#CBD5E1] px-3 py-2 text-sm uppercase" />
            <input id="input-student-name" v-model.trim="displayName" maxlength="40" placeholder="Seu nome para o personal" class="rounded-xl border-2 border-[#CBD5E1] px-3 py-2 text-sm" />
            <button id="btn-join-class" type="submit" :disabled="busy || !classCode" class="tap-btn rounded-xl bg-[#0066FF] text-white text-sm font-black py-2">Entrar na turma</button>
          </form>
          <p class="text-[11px] text-[#64748B] leading-relaxed">
            Ao entrar, seu personal passa a ver um <strong>resumo</strong>: objetivo, dias de treino, restrições, volume e frequência das últimas semanas,
            recordes e tendência de peso. Fotos e o histórico completo não são compartilhados. Você pode sair a qualquer momento.
          </p>
          <button v-if="memberships.length" id="btn-share-summary" type="button" :disabled="busy" class="tap-btn w-full py-2 rounded-xl border border-[#0066FF] text-[#0066FF] text-xs font-black" @click="shareSummary(account)">
            Atualizar meu resumo agora
          </button>
        </section>

        <!-- PERSONAL -->
        <section v-else class="space-y-3">
          <form class="flex gap-2" @submit.prevent="createClass(account)">
            <input id="input-new-class" v-model.trim="newClassName" maxlength="40" placeholder="Nome da turma (ex.: Alunos manhã)" class="flex-1 rounded-xl border-2 border-[#CBD5E1] px-3 py-2 text-sm" />
            <button id="btn-create-class" type="submit" :disabled="busy" class="tap-btn px-4 rounded-xl bg-[#0066FF] text-white text-sm font-black">Criar</button>
          </form>

          <div v-for="cls in classes" :key="cls.id" class="rounded-2xl border border-[#E2E8F0] p-3 space-y-2">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-black">{{ cls.name }}</h4>
              <span class="text-[11px] font-black px-2 py-1 rounded-lg bg-[#F1F5F9]" :id="`class-code-${cls.id}`">Código: {{ cls.inviteCode }}</span>
            </div>
            <p v-if="cls.students.length === 0" class="text-xs text-[#64748B]">Nenhum aluno ainda. Passe o código acima para o aluno digitar no app dele.</p>
            <button
              v-for="st in cls.students"
              :key="st.id"
              type="button"
              :id="`btn-student-${st.id}`"
              class="tap-btn w-full flex items-center justify-between rounded-xl border border-[#E2E8F0] px-3 py-2 text-left text-xs hover:bg-[#F8FAFC]"
              @click="openStudent(account, cls, st)"
            >
              <span class="font-bold">{{ st.displayName }}</span>
              <span class="text-[#64748B]">{{ st.lastPlanStatus ? `ficha: ${STATUS_LABEL[st.lastPlanStatus]}` : 'sem ficha enviada' }} →</span>
            </button>
          </div>

          <div v-if="student" id="trainer-student-detail" class="rounded-2xl border-2 border-[#0066FF]/40 p-3 space-y-2">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-black">{{ student.displayName }}</h4>
              <button type="button" class="tap-btn text-xs font-bold text-[#0066FF]" @click="student = null">Fechar</button>
            </div>
            <template v-if="student.summary">
              <dl class="grid grid-cols-2 gap-2 text-xs">
                <div v-for="item in summaryItems" :key="item.label" class="rounded-lg bg-[#F8FAFC] p-2">
                  <dt class="text-[10px] font-bold uppercase text-[#64748B]">{{ item.label }}</dt>
                  <dd class="font-black">{{ item.value }}</dd>
                </div>
              </dl>
              <p class="text-[10px] text-[#64748B]">Atualizado em {{ new Date(student.summaryUpdatedAt).toLocaleString('pt-BR') }}</p>
            </template>
            <p v-else class="text-xs text-[#64748B]">O aluno ainda não enviou o resumo.</p>

            <textarea id="input-plan-note" v-model="planNote" maxlength="500" rows="2" placeholder="Recado para o aluno (opcional)" class="w-full rounded-xl border-2 border-[#CBD5E1] px-3 py-2 text-xs"></textarea>
            <button id="btn-send-plan" type="button" :disabled="busy || !myWorkoutSplits.length" class="tap-btn w-full py-2.5 rounded-xl bg-[#0066FF] text-white text-xs font-black disabled:opacity-50" @click="sendPlan(account)">
              Enviar minha ficha atual ({{ myWorkoutSplits.length }} treinos) para o aluno
            </button>
            <p class="text-[10px] text-[#64748B]">Monte a ficha no seu próprio app (editor de fichas) e envie. O aluno decide se aceita; exercícios que conflitem com as restrições dele são removidos no aparelho dele.</p>
          </div>
        </section>
      </template>
    </OnlineAccountGate>
  </BaseModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import BaseModal from './BaseModal.vue';
import OnlineAccountGate from './OnlineAccountGate.vue';
import {
  createTrainerClass, getStudent, getTrainerInbox, joinTrainerClass, leaveTrainerClass,
  listMyTrainerMemberships, listTrainerClasses, loadCloudAccount, respondToTrainerPlan,
  sendPlanToStudent, uploadStudentSummary
} from '../services/cloud.js';

const props = defineProps({
  isOpen: Boolean,
  studentSummary: { type: Object, default: null },
  myWorkoutSplits: { type: Array, default: () => [] },
  defaultName: { type: String, default: '' }
});
const emit = defineEmits(['close', 'accept-plan']);

const TABS = [
  { id: 'student', label: '🙋 Tenho personal' },
  { id: 'trainer', label: '🧑‍🏫 Sou personal' }
];
const STATUS_LABEL = { pending: 'aguardando', accepted: 'aceita', declined: 'recusada' };
const GOAL_LABEL = { hypertrophy: 'Hipertrofia', weight_loss: 'Emagrecimento', strength: 'Força', recomposition: 'Recomposição', maintenance: 'Manutenção' };

const tab = ref('student');
const busy = ref(false);
const message = ref('');
const isError = ref(false);
const inbox = ref([]);
const memberships = ref([]);
const classes = ref([]);
const student = ref(null);
const classCode = ref('');
const displayName = ref('');
const newClassName = ref('');
const planNote = ref('');
const studentRef = ref(null);

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
  const [mine, box, own] = await Promise.all([
    listMyTrainerMemberships(account),
    getTrainerInbox(account),
    listTrainerClasses(account)
  ]);
  memberships.value = mine.classes;
  inbox.value = box.plans;
  classes.value = own.classes;
  if (memberships.value.length && props.studentSummary) {
    await uploadStudentSummary(account, props.studentSummary).catch(() => {});
  }
}

watch(() => props.isOpen, open => {
  student.value = null;
  if (!displayName.value) displayName.value = props.defaultName;
  const account = loadCloudAccount();
  if (open && account) run(() => refresh(account));
});

function onAccount(account) {
  if (account) run(() => refresh(account));
}

function join(account) {
  return run(async () => {
    await joinTrainerClass(account, { inviteCode: classCode.value, displayName: displayName.value || props.defaultName });
    classCode.value = '';
    await refresh(account);
  }, 'Você entrou na turma. Seu resumo foi enviado ao personal.');
}

function leave(account, m) {
  if (!window.confirm(`Sair da turma "${m.name}"? O personal deixa de ver seu resumo.`)) return;
  return run(async () => {
    await leaveTrainerClass(account, m.id);
    await refresh(account);
  });
}

function shareSummary(account) {
  return run(() => uploadStudentSummary(account, props.studentSummary), 'Resumo atualizado.');
}

function respond(account, plan, accepted) {
  return run(async () => {
    await respondToTrainerPlan(account, plan.id, accepted);
    if (accepted) emit('accept-plan', { workoutSplits: plan.workoutSplits, className: plan.className });
    await refresh(account);
  }, accepted ? 'Ficha do personal aplicada!' : 'Ficha recusada.');
}

function createClass(account) {
  return run(async () => {
    await createTrainerClass(account, newClassName.value || 'Minha turma');
    newClassName.value = '';
    await refresh(account);
  }, 'Turma criada. Passe o código para seus alunos.');
}

function openStudent(account, cls, st) {
  return run(async () => {
    studentRef.value = { classId: cls.id, studentId: st.id };
    student.value = await getStudent(account, cls.id, st.id);
  });
}

function sendPlan(account) {
  return run(async () => {
    await sendPlanToStudent(account, studentRef.value.classId, studentRef.value.studentId, {
      workoutSplits: props.myWorkoutSplits,
      note: planNote.value
    });
    planNote.value = '';
    await refresh(account);
    student.value = await getStudent(account, studentRef.value.classId, studentRef.value.studentId);
  }, 'Ficha enviada! O aluno verá na próxima vez que abrir o modo personal.');
}

const summaryItems = computed(() => {
  const s = student.value?.summary;
  if (!s) return [];
  const items = [
    { label: 'Objetivo', value: GOAL_LABEL[s.goal] ?? s.goal ?? '—' },
    { label: 'Dias/semana', value: s.daysPerWeek ?? '—' },
    { label: 'Equipamento', value: s.equipment === 'home' ? 'Casa' : 'Academia' },
    { label: 'Restrições', value: s.restrictions?.length ? s.restrictions.join(', ') : 'nenhuma' },
    { label: 'Treinos na semana', value: `${s.weekly?.sessions ?? 0} de ${s.weekly?.plannedSessions ?? '?'}` },
    { label: 'Séries na semana', value: s.weekly?.doneSets ?? 0 },
    { label: 'Volume na semana', value: `${(s.weekly?.volumeKg ?? 0).toLocaleString('pt-BR')} kg` },
    { label: 'RIR médio', value: s.weekly?.averageRir ?? '—' },
    { label: 'Peso atual', value: s.latestWeightKg ? `${s.latestWeightKg} kg` : '—' },
    { label: 'Tendência de peso', value: s.weightTrendKgPerWeek !== null && s.weightTrendKgPerWeek !== undefined ? `${s.weightTrendKgPerWeek} kg/sem` : '—' }
  ];
  if (s.weekly?.prs?.length) items.push({ label: 'Recordes', value: s.weekly.prs.join(', ') });
  if (s.weekly?.stalled?.length) items.push({ label: 'Estagnados', value: s.weekly.stalled.join(', ') });
  if (s.recentWeeks?.length) items.push({ label: 'Treinos/semana (últ. 4)', value: s.recentWeeks.map(w => w.sessions).join(' · ') });
  return items;
});
</script>
