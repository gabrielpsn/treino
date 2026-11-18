<template>
  <BaseModal
    :is-open="isOpen"
    modal-id="modal-program"
    title="Primeiros 30 dias"
    subtitle="Programa guiado para iniciantes"
    icon="🎓"
    @close="emit('close')"
  >
    <!-- Ainda não começou (aberto pelo menu) -->
    <template v-if="info.phase === 'not_started' || info.phase === 'dismissed'">
      <p class="text-xs text-[#475569] leading-relaxed">
        4 semanas usando a sua ficha atual, mudando só a intensidade: começa com 2 séries leves para aprender os movimentos
        e termina com 3 séries mais pesadas. Sempre parando antes da falha.
      </p>
      <ol class="space-y-1.5">
        <li v-for="w in PROGRAM_WEEKS" :key="w.week" class="rounded-xl border border-[#E2E8F0] p-2.5 text-xs">
          <strong>Semana {{ w.week }} · {{ w.title }}</strong>
          <span class="block text-[#64748B]">{{ w.sets }} séries de {{ w.reps }}, {{ w.rir }} repetições sobrando</span>
        </li>
      </ol>
      <button type="button" id="btn-program-start-modal" class="tap-btn w-full py-3 rounded-xl bg-[#0066FF] text-white text-sm font-black" @click="emit('start')">Começar hoje</button>
    </template>

    <!-- Em andamento -->
    <template v-else-if="info.phase === 'active'">
      <ol id="program-weeks" class="grid grid-cols-4 gap-1.5">
        <li
          v-for="w in info.weeks"
          :key="w.week"
          class="rounded-xl border p-2 text-center"
          :class="w.week === info.currentWeek ? 'border-[#0066FF] bg-blue-50' : 'border-[#E2E8F0]'"
        >
          <span class="block text-lg" aria-hidden="true">{{ STATUS_ICON[w.status] }}</span>
          <span class="block text-[10px] font-black">Semana {{ w.week }}</span>
          <span class="block text-[10px] text-[#64748B]">{{ w.done }}/{{ w.target }}</span>
        </li>
      </ol>

      <section id="program-current-week" class="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 space-y-2">
        <p class="text-sm font-black">Semana {{ info.currentWeek }}: {{ info.current.title }}</p>
        <p class="text-xs text-[#334155]">{{ info.current.goal }}</p>
        <p class="text-xs font-bold text-[#0066FF]">
          {{ info.current.sets }} séries de {{ info.current.reps }} repetições, parando com {{ info.current.rir }} sobrando
        </p>
        <p class="text-[11px] text-[#64748B]">Faltam {{ info.daysLeftInWeek }} dia(s) nesta semana · meta: {{ info.target }} treinos</p>
      </section>

      <section class="rounded-2xl border border-amber-200 bg-amber-50 p-3 space-y-1">
        <p class="text-xs font-black text-amber-900">📘 {{ info.current.lesson.title }}</p>
        <p class="text-xs text-amber-900 leading-relaxed">{{ info.current.lesson.text }}</p>
      </section>

      <ul class="space-y-1 text-xs text-[#334155]">
        <li v-for="tip in info.current.tips" :key="tip">✔️ {{ tip }}</li>
      </ul>

      <button type="button" id="btn-program-go-train" class="tap-btn w-full py-3 rounded-xl bg-[#F59E0B] text-[#0F172A] text-sm font-black" @click="emit('train')">▶ Treinar agora</button>
      <button type="button" id="btn-program-abandon" class="tap-btn w-full text-[11px] font-bold text-[#64748B] underline" @click="confirmAbandon">Sair do programa</button>
    </template>

    <!-- Reavaliação -->
    <template v-else-if="info.phase === 'review'">
      <section id="program-review" class="space-y-3">
        <p class="text-base font-black">🏁 Parabéns, você completou o programa!</p>
        <p class="text-xs text-[#334155]">
          Você treinou em <strong>{{ review?.workouts ?? 0 }} dias</strong> nestas 4 semanas
          (meta: {{ info.totalTarget }}).
        </p>
        <div v-if="review?.improvements?.length" class="space-y-1">
          <p class="text-xs font-black">Seus pesos subiram:</p>
          <ul class="space-y-1">
            <li v-for="item in review.improvements" :key="item.exerciseId" class="flex justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 text-xs">
              <span>{{ item.name }}</span>
              <strong class="text-emerald-700">{{ item.first }} → {{ item.last }} kg (+{{ item.gainKg }})</strong>
            </li>
          </ul>
        </div>
        <p v-else class="text-xs text-[#64748B]">Registre os pesos nos próximos treinos para ver sua evolução no Histórico.</p>
        <button type="button" id="btn-program-complete" class="tap-btn w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-black" @click="emit('complete')">
          Concluir e ganhar {{ reward.xp }} XP + {{ reward.coins }} moedas
        </button>
      </section>
    </template>

    <!-- Concluído -->
    <template v-else-if="info.phase === 'completed'">
      <section id="program-completed" class="space-y-3 text-center">
        <p class="text-3xl" aria-hidden="true">🏆</p>
        <p class="text-base font-black">Programa concluído!</p>
        <p class="text-xs text-[#475569]">Agora você pode seguir a ficha normal, com sobrecarga progressiva. Se já se sente confortável, atualize seu nível para Intermediário.</p>
        <button type="button" id="btn-program-update-level" class="tap-btn w-full py-3 rounded-xl bg-[#0066FF] text-white text-sm font-black" @click="emit('open-profile')">Atualizar meu nível</button>
        <button type="button" class="tap-btn w-full py-2 text-xs font-bold text-[#64748B]" @click="emit('close')">Continuar como está</button>
      </section>
    </template>
  </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue';
import { PROGRAM_WEEKS } from '../engine/beginnerProgram.js';

defineProps({
  isOpen: Boolean,
  info: { type: Object, required: true },
  review: { type: Object, default: null },
  reward: { type: Object, default: () => ({ xp: 0, coins: 0 }) }
});
const emit = defineEmits(['close', 'start', 'train', 'abandon', 'complete', 'open-profile']);

const STATUS_ICON = { done: '✅', partial: '🟡', current: '🔵', future: '⚪' };

function confirmAbandon() {
  if (window.confirm('Sair do programa? Sua ficha continua a mesma; você pode recomeçar pelo menu quando quiser.')) emit('abandon');
}
</script>
