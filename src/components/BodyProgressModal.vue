<template>
  <BaseModal
    :is-open="isOpen"
    modal-id="modal-body-progress"
    title="Evolução Corporal"
    subtitle="Peso, medidas, fotos e ajuste automático da dieta"
    icon="📏"
    wide
    :tabs="TABS"
    v-model:active-tab="tab"
    @close="emit('close')"
  >
    <p v-if="error" id="body-progress-error" role="alert" class="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{{ error }}</p>

    <!-- Peso & medidas -->
    <section v-if="tab === 'weight'" class="space-y-4">
      <form id="form-body-entry" class="grid grid-cols-2 sm:grid-cols-4 gap-2" @submit.prevent="handleSaveEntry">
        <label class="col-span-2 sm:col-span-1 text-[11px] font-bold text-[#64748B]">
          Data
          <input id="input-body-date" v-model="form.date" type="date" :max="today" required class="mt-1 w-full rounded-xl border-2 border-[#CBD5E1] px-2 py-2 text-sm text-[#0F172A]" />
        </label>
        <label class="col-span-2 sm:col-span-1 text-[11px] font-bold text-[#64748B]">
          Peso (kg)
          <input id="input-body-weight" v-model="form.weightKg" type="number" step="0.1" min="25" max="350" inputmode="decimal" class="mt-1 w-full rounded-xl border-2 border-[#CBD5E1] px-2 py-2 text-sm text-[#0F172A]" />
        </label>
        <label v-for="field in MEASUREMENT_FIELDS" :key="field.id" class="text-[11px] font-bold text-[#64748B]">
          {{ field.label }} ({{ field.unit }})
          <input :id="`input-body-${field.id}`" v-model="form[field.id]" type="number" step="0.1" :min="field.min" :max="field.max" inputmode="decimal" class="mt-1 w-full rounded-xl border-2 border-[#CBD5E1] px-2 py-2 text-sm text-[#0F172A]" />
        </label>
        <button id="btn-save-body-entry" type="submit" class="tap-btn col-span-2 sm:col-span-4 py-2.5 rounded-xl bg-[#0066FF] text-white text-sm font-black">
          Salvar medição
        </button>
      </form>

      <div v-if="series.length >= 2" class="rounded-2xl border border-[#E2E8F0] p-3">
        <div class="flex items-center justify-between text-xs font-bold mb-1">
          <span>Peso (média de 7 dias)</span>
          <span v-if="trend" id="body-trend" :class="trend.weeklyKg <= 0 ? 'text-emerald-600' : 'text-[#0066FF]'">
            {{ trend.weeklyKg > 0 ? '+' : '' }}{{ trend.weeklyKg.toLocaleString('pt-BR') }} kg/semana
          </span>
        </div>
        <svg id="body-weight-chart" viewBox="0 0 300 120" class="w-full h-32" role="img" :aria-label="`Gráfico de peso de ${chart.min} a ${chart.max} kg`">
          <polyline :points="chart.points.map(p => `${p.x},${p.y}`).join(' ')" fill="none" stroke="#0066FF" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
          <circle v-for="p in chart.points" :key="p.date" :cx="p.x" :cy="p.y" r="3" fill="#0066FF" />
          <text x="4" y="12" font-size="9" fill="#64748B" font-weight="700">{{ chart.max }} kg</text>
          <text x="4" y="116" font-size="9" fill="#64748B" font-weight="700">{{ chart.min }} kg</text>
        </svg>
      </div>

      <div v-if="Object.keys(changes).length" id="body-changes" class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div v-for="(c, key) in changes" :key="key" class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-2">
          <span class="block text-[10px] font-bold uppercase text-[#64748B]">{{ fieldLabel(key) }}</span>
          <span class="text-sm font-black">{{ c.to }}</span>
          <span class="text-[11px] font-bold ml-1" :class="c.delta < 0 ? 'text-emerald-600' : c.delta > 0 ? 'text-[#0066FF]' : 'text-[#64748B]'">
            ({{ c.delta > 0 ? '+' : '' }}{{ c.delta }})
          </span>
        </div>
      </div>

      <ul id="body-entry-list" class="space-y-1.5">
        <li v-if="entries.length === 0" class="text-xs text-[#64748B] text-center py-3">Nenhuma medição ainda. Pese-se de manhã, em jejum, para comparar sempre do mesmo jeito.</li>
        <li v-for="entry in [...entries].reverse()" :key="entry.id" class="flex items-center justify-between gap-2 rounded-xl border border-[#E2E8F0] px-3 py-2 text-xs">
          <span class="font-bold">{{ formatDate(entry.date) }}</span>
          <span class="flex-1 text-[#475569] truncate">{{ describeEntry(entry) }}</span>
          <button type="button" :id="`btn-delete-body-${entry.id}`" class="tap-btn text-rose-600 font-bold px-2" :aria-label="`Excluir medição de ${formatDate(entry.date)}`" @click="handleDeleteEntry(entry.id)">✕</button>
        </li>
      </ul>
    </section>

    <!-- Ajuste de dieta -->
    <section v-else-if="tab === 'diet'" class="space-y-3">
      <div id="diet-adjustment" class="rounded-2xl border p-4 space-y-2" :class="adjustmentClass">
        <p class="text-sm font-black">{{ adjustmentTitle }}</p>
        <p class="text-xs leading-relaxed">{{ adjustment.message }}</p>
        <p class="text-[11px] text-[#64748B]">
          Meta atual: <strong>{{ adjustment.currentTargetCalories }} kcal</strong>.
          Faixa ideal para o objetivo: {{ adjustment.range.min }}% a {{ adjustment.range.max }}% do peso por semana.
        </p>
        <button
          v-if="adjustment.deltaKcal !== 0"
          id="btn-apply-diet-adjustment"
          type="button"
          class="tap-btn w-full py-2.5 rounded-xl bg-[#0066FF] text-white text-sm font-black"
          @click="handleApplyAdjustment"
        >
          Aplicar: {{ adjustment.newTargetCalories }} kcal/dia
        </button>
      </div>
      <p class="text-[11px] text-[#64748B] leading-relaxed">
        O ajuste olha a tendência das últimas 4 semanas, não uma pesagem isolada, e muda no máximo 150 kcal por vez.
        Ao aplicar, proteína e gordura ficam iguais e o carboidrato absorve a diferença. Não substitui acompanhamento de nutricionista.
      </p>
    </section>

    <!-- Fotos -->
    <section v-else class="space-y-3">
      <p class="text-[11px] text-[#64748B]">🔒 As fotos ficam só neste aparelho: não vão para o backup em arquivo nem para a nuvem.</p>
      <div class="flex gap-2">
        <select id="select-photo-pose" v-model="photoPose" class="rounded-xl border-2 border-[#CBD5E1] px-2 py-2 text-sm">
          <option value="frente">Frente</option>
          <option value="lado">Lado</option>
          <option value="costas">Costas</option>
        </select>
        <label class="tap-btn flex-1 text-center py-2.5 rounded-xl bg-[#0066FF] text-white text-sm font-black cursor-pointer">
          📷 Adicionar foto
          <input id="input-progress-photo" type="file" accept="image/*" capture="environment" class="sr-only" @change="handlePhotoSelected" />
        </label>
      </div>

      <div v-if="photos.length >= 2" id="photo-compare" class="grid grid-cols-2 gap-2">
        <figure v-for="side in ['before', 'after']" :key="side" class="space-y-1">
          <select :id="`select-compare-${side}`" v-model="compare[side]" class="w-full rounded-lg border border-[#CBD5E1] px-2 py-1 text-xs">
            <option v-for="p in photos" :key="p.id" :value="p.id">{{ formatDate(p.date) }} · {{ p.pose }}</option>
          </select>
          <img v-if="photoUrl(compare[side])" :src="photoUrl(compare[side])" :alt="side === 'before' ? 'Foto antes' : 'Foto depois'" class="w-full aspect-[3/4] object-cover rounded-xl border border-[#E2E8F0]" />
          <figcaption class="text-[10px] font-bold text-center text-[#64748B]">{{ side === 'before' ? 'Antes' : 'Depois' }}</figcaption>
        </figure>
      </div>

      <div id="photo-grid" class="grid grid-cols-3 gap-2">
        <p v-if="photos.length === 0" class="col-span-3 text-xs text-[#64748B] text-center py-3">Tire fotos com a mesma luz e posição a cada 2–4 semanas.</p>
        <div v-for="p in photos" :key="p.id" class="relative">
          <img :src="photoUrl(p.id)" :alt="`Foto de ${formatDate(p.date)}`" class="w-full aspect-[3/4] object-cover rounded-xl border border-[#E2E8F0]" />
          <span class="absolute bottom-1 left-1 text-[9px] font-bold bg-white/90 rounded px-1">{{ formatDate(p.date) }}</span>
          <button type="button" :id="`btn-delete-photo-${p.id}`" class="tap-btn absolute top-1 right-1 w-7 h-7 rounded-full bg-white/90 text-rose-600 font-black" aria-label="Excluir foto" @click="handleDeletePhoto(p.id)">✕</button>
        </div>
      </div>
    </section>
  </BaseModal>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, toRaw, watch } from 'vue';
import BaseModal from './BaseModal.vue';
import {
  MEASUREMENT_FIELDS,
  chartPoints,
  measurementChanges,
  movingAverage,
  rebalanceMacros,
  suggestCalorieAdjustment,
  weightSeries,
  weightTrend
} from '../engine/bodyProgress.js';
import {
  addProgressPhoto,
  deleteBodyEntry,
  deleteProgressPhoto,
  listBodyEntries,
  listProgressPhotos,
  saveBodyEntry
} from '../db/bodyProgress.js';

const props = defineProps({
  isOpen: Boolean,
  goal: { type: String, default: 'hypertrophy' },
  gender: { type: String, default: 'male' },
  bmr: { type: Number, default: 0 },
  targetCalories: { type: Number, default: 0 },
  macros: { type: Object, default: () => ({}) },
  database: { type: Object, default: undefined }
});
const emit = defineEmits(['close', 'apply-calories', 'entries-changed']);

const TABS = [
  { id: 'weight', label: '⚖️ Peso & Medidas' },
  { id: 'diet', label: '🥗 Ajuste da Dieta' },
  { id: 'photos', label: '📷 Fotos' }
];

const tab = ref('weight');
const entries = ref([]);
const photos = ref([]);
const error = ref('');
const photoPose = ref('frente');
const compare = ref({ before: null, after: null });
const urlCache = new Map();

const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
const emptyForm = () => ({ date: today, weightKg: '', ...Object.fromEntries(MEASUREMENT_FIELDS.map(f => [f.id, ''])) });
const form = ref(emptyForm());
const dbOpts = computed(() => (props.database ? { database: toRaw(props.database) } : {}));

async function reload() {
  try {
    entries.value = await listBodyEntries(dbOpts.value);
    photos.value = await listProgressPhotos(dbOpts.value);
    if (photos.value.length >= 2) {
      compare.value = { before: photos.value[0].id, after: photos.value[photos.value.length - 1].id };
    }
  } catch (err) {
    error.value = 'Não foi possível ler suas medições.';
    console.error(err);
  }
}

watch(() => props.isOpen, open => { if (open) { error.value = ''; reload(); } }, { immediate: true });

const series = computed(() => movingAverage(weightSeries(entries.value)));
const chart = computed(() => chartPoints(series.value));
const trend = computed(() => weightTrend(entries.value));
const changes = computed(() => measurementChanges(entries.value));
const adjustment = computed(() => suggestCalorieAdjustment({
  entries: entries.value,
  goal: props.goal,
  targetCalories: props.targetCalories,
  gender: props.gender,
  bmr: props.bmr,
  today
}));

const adjustmentTitle = computed(() => ({
  increase: '⬆️ Hora de comer um pouco mais',
  decrease: '⬇️ Hora de reduzir um pouco',
  on_track: '✅ Dieta no ponto',
  at_floor: '⚠️ Meta no mínimo seguro',
  insufficient_data: '📊 Ainda coletando dados',
  no_target: 'Sem meta calórica'
}[adjustment.value.status]));

const adjustmentClass = computed(() => ({
  increase: 'border-blue-200 bg-blue-50',
  decrease: 'border-amber-200 bg-amber-50',
  on_track: 'border-emerald-200 bg-emerald-50',
  at_floor: 'border-rose-200 bg-rose-50'
}[adjustment.value.status] ?? 'border-[#E2E8F0] bg-[#F8FAFC]'));

function fieldLabel(key) {
  if (key === 'weightKg') return 'Peso (kg)';
  const f = MEASUREMENT_FIELDS.find(x => x.id === key);
  return f ? `${f.label} (${f.unit})` : key;
}

function describeEntry(entry) {
  const parts = [];
  if (entry.weightKg !== null) parts.push(`${entry.weightKg} kg`);
  for (const f of MEASUREMENT_FIELDS) if (entry[f.id] !== null) parts.push(`${f.label} ${entry[f.id]}${f.unit}`);
  return parts.join(' · ');
}

function formatDate(date) {
  const [y, m, d] = String(date).split('-');
  return `${d}/${m}/${y.slice(2)}`;
}

async function handleSaveEntry() {
  error.value = '';
  try {
    await saveBodyEntry(form.value, dbOpts.value);
    form.value = emptyForm();
    await reload();
    emit('entries-changed', entries.value);
  } catch (err) {
    error.value = err.message || 'Não foi possível salvar.';
  }
}

async function handleDeleteEntry(id) {
  await deleteBodyEntry(id, dbOpts.value);
  await reload();
  emit('entries-changed', entries.value);
}

function handleApplyAdjustment() {
  emit('apply-calories', rebalanceMacros(props.macros, adjustment.value.newTargetCalories));
}

async function compressImage(file, maxSide = 1080) {
  if (typeof createImageBitmap !== 'function') return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise(resolve => canvas.toBlob(blob => resolve(blob || file), 'image/jpeg', 0.82));
}

async function handlePhotoSelected(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  error.value = '';
  try {
    const blob = await compressImage(file);
    await addProgressPhoto({ date: today, blob, pose: photoPose.value }, dbOpts.value);
    await reload();
  } catch (err) {
    error.value = 'Não foi possível salvar a foto.';
    console.error(err);
  }
}

async function handleDeletePhoto(id) {
  await deleteProgressPhoto(id, dbOpts.value);
  const url = urlCache.get(id);
  if (url) URL.revokeObjectURL(url);
  urlCache.delete(id);
  await reload();
}

function photoUrl(id) {
  if (id === null || id === undefined) return '';
  if (urlCache.has(id)) return urlCache.get(id);
  const photo = photos.value.find(p => p.id === id);
  if (!photo?.blob || typeof URL.createObjectURL !== 'function') return '';
  const url = URL.createObjectURL(photo.blob);
  urlCache.set(id, url);
  return url;
}

onBeforeUnmount(() => {
  for (const url of urlCache.values()) URL.revokeObjectURL(url);
});
</script>
