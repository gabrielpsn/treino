<template>
  <section id="weekly-coach-card" class="rounded-2xl border border-[#E2E8F0] bg-white p-4 space-y-2 shadow-xs">
    <div class="flex items-center justify-between gap-2">
      <h3 class="text-sm font-black">🧠 Coach da Semana</h3>
      <span class="text-[10px] font-bold text-[#64748B]">{{ summary?.weekKey }}</span>
    </div>
    <p id="weekly-coach-text" class="text-xs leading-relaxed text-[#334155] whitespace-pre-line">{{ aiText || localText }}</p>
    <p v-if="aiText" class="text-[10px] text-[#64748B]">Análise gerada por IA a partir dos seus números. Não substitui um profissional.</p>
    <p v-if="error" class="text-[11px] font-bold text-rose-600">{{ error }}</p>
    <button
      v-if="!aiText"
      id="btn-weekly-coach-ai"
      type="button"
      :disabled="loading || !summary"
      class="tap-btn w-full py-2 rounded-xl border border-[#0066FF] text-[#0066FF] text-xs font-black disabled:opacity-50"
      @click="askAi"
    >{{ loading ? 'Analisando...' : 'Pedir análise da IA' }}</button>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { localCoachText } from '../engine/weeklySummary.js';
import { requestWeeklyCoach } from '../services/cloud.js';

const props = defineProps({ summary: { type: Object, default: null } });

const CACHE_KEY = 'overload_weekly_coach';
const aiText = ref('');
const loading = ref(false);
const error = ref('');
const localText = computed(() => localCoachText(props.summary));

function readCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    return cached?.weekKey === props.summary?.weekKey ? cached.text : '';
  } catch {
    return '';
  }
}

watch(() => props.summary?.weekKey, () => { aiText.value = readCache(); error.value = ''; }, { immediate: true });

async function askAi() {
  loading.value = true;
  error.value = '';
  try {
    aiText.value = await requestWeeklyCoach(props.summary);
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ weekKey: props.summary.weekKey, text: aiText.value })); } catch { /* ignora */ }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>
