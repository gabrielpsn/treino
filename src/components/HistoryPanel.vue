<template>
  <div class="space-y-6">
    <!-- Resumo geral -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div
        v-for="stat in headlineStats"
        :key="stat.label"
        class="p-4 rounded-2xl bg-slate-900 border border-slate-800"
      >
        <span class="text-[11px] uppercase font-semibold text-slate-500 block">{{ stat.label }}</span>
        <span class="text-xl font-black text-white mt-1 block">{{ stat.value }}</span>
        <span v-if="stat.hint" class="text-[11px] text-slate-500 mt-0.5 block">{{ stat.hint }}</span>
      </div>
    </div>

    <!-- Estado vazio -->
    <div
      v-if="sessions.length === 0"
      id="history-empty-state"
      class="text-center py-14 px-6 border border-dashed border-slate-800 rounded-3xl"
    >
      <p class="text-3xl mb-2" aria-hidden="true">📈</p>
      <h3 class="text-base font-bold text-white">Nenhum treino registrado ainda</h3>
      <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
        Registre a carga e marque um exercício como concluído na aba
        <strong>Fichas de Treino</strong>. A partir daí cada sessão aparece aqui com
        volume, duração e evolução.
      </p>
    </div>

    <template v-else>
      <!-- Volume por semana -->
      <section
        v-if="weeks.length > 0"
        id="history-weekly-chart"
        class="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5"
      >
        <h3 class="text-sm font-bold text-white mb-1">Volume por semana</h3>
        <p class="text-[11px] text-slate-500 mb-4">
          Soma de carga × repetições das séries concluídas.
        </p>

        <ul class="flex items-end gap-2 h-32">
          <li
            v-for="week in weeks"
            :key="week.weekKey"
            class="flex-1 flex flex-col items-center gap-1.5 min-w-0"
          >
            <span class="text-[10px] text-slate-400 font-semibold truncate w-full text-center">
              {{ formatVolume(week.volume) }}
            </span>
            <div
              class="w-full rounded-t-md transition-all"
              :class="isWeightLoss ? 'bg-rose-500/70' : 'bg-amber-500/70'"
              :style="{ height: barHeight(week.volume) }"
              role="img"
              :aria-label="`${week.sessions} ${week.sessions === 1 ? 'treino' : 'treinos'}, ${formatVolume(week.volume)} em ${week.days} ${week.days === 1 ? 'dia' : 'dias'}`"
            ></div>
            <span class="text-[10px] text-slate-500 truncate w-full text-center">
              {{ shortWeekLabel(week.weekKey) }}
            </span>
          </li>
        </ul>
      </section>

      <!-- Lista de sessões -->
      <section class="space-y-3">
        <h3 class="text-sm font-bold text-white">Treinos</h3>

        <article
          v-for="session in sessions"
          :key="session.id"
          :id="`history-session-${session.id}`"
          class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
        >
          <button
            type="button"
            :id="`btn-history-session-${session.id}`"
            class="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-800/40 transition-colors"
            :aria-expanded="isExpanded(session.id) ? 'true' : 'false'"
            :aria-controls="`history-session-body-${session.id}`"
            @click="toggleExpanded(session.id)"
          >
            <div class="min-w-0">
              <p class="text-sm font-bold text-white truncate">
                {{ formatDayKey(session.dayKey) }}
                <span class="text-slate-500 font-medium">· {{ splitTitle(session.splitId) }}</span>
              </p>
              <p class="text-[11px] text-slate-400 mt-0.5">
                {{ statsFor(session).doneSets }} séries · {{ formatVolume(statsFor(session).volume) }} ·
                {{ formatDuration(durationFor(session)) }}
                <span v-if="session.source === 'legacy-workout-logs'" class="text-slate-500">
                  (carga anterior)
                </span>
              </p>
            </div>
            <span class="text-slate-500 text-xs shrink-0" aria-hidden="true">
              {{ isExpanded(session.id) ? '▲' : '▼' }}
            </span>
          </button>

          <div
            v-show="isExpanded(session.id)"
            :id="`history-session-body-${session.id}`"
            class="border-t border-slate-800 px-4 py-3 space-y-2"
          >
            <div
              v-for="set in setsOf(session)"
              :key="set.exerciseId"
              class="flex items-center justify-between gap-3 text-xs"
            >
              <span class="text-slate-300 truncate">{{ exerciseName(set.exerciseId) }}</span>
              <span class="text-slate-400 shrink-0 tabular-nums">
                <template v-if="hasLoad(set)">
                  {{ formatWeight(set.weight) }} kg × {{ set.reps }} reps
                </template>
                <template v-else-if="set.isDone"> concluído </template>
                <template v-else-if="set.weight || set.reps"> registrado </template>
                <template v-else> — </template>
              </span>
            </div>
          </div>
        </article>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import {
  sessionSetStats,
  sessionDurationMinutes,
  summarizeByWeek,
  formatVolume,
  formatDuration,
  formatDayKey,
  parseWeight,
  parseReps
} from '../engine/history';

const props = defineProps({
  sessions: { type: Array, required: true },   // já vem com `sets` preenchidos
  splitTitles: { type: Object, default: () => ({}) }, // splitId -> título
  exerciseNames: { type: Object, default: () => ({}) }, // exerciseId -> nome
  isWeightLoss: { type: Boolean, default: false }
});

const expanded = ref([]);

function isExpanded(sessionId) {
  return expanded.value.includes(sessionId);
}

function toggleExpanded(sessionId) {
  expanded.value = isExpanded(sessionId)
    ? expanded.value.filter(id => id !== sessionId)
    : [...expanded.value, sessionId];
}

function statsFor(session) {
  return sessionSetStats(session.sets || []);
}

function durationFor(session) {
  return sessionDurationMinutes(session, session.sets || []);
}

function setsOf(session) {
  return [...(session.sets || [])].sort((a, b) => String(a.exerciseId).localeCompare(String(b.exerciseId)));
}

function hasLoad(set) {
  return parseWeight(set?.weight) !== null && parseReps(set?.reps) !== null;
}

function formatWeight(value) {
  const weight = parseWeight(value);
  return weight === null ? '—' : String(weight).replace('.', ',');
}

function splitTitle(splitId) {
  if (!splitId) return 'Treino';
  return props.splitTitles[splitId] || splitId;
}

function exerciseName(exerciseId) {
  return props.exerciseNames[exerciseId] || exerciseId;
}

// "2026-W07" -> "S07". A semana já aparece com o dia na lista de treinos, então
// a barra só precisa do número curto para não repetir o mesmo dado.
function shortWeekLabel(weekKey) {
  const match = /-W(\d+)$/.exec(String(weekKey || ''));
  return match ? `S${match[1]}` : weekKey;
}

const weeks = computed(() => summarizeByWeek(props.sessions));

const headlineStats = computed(() => {
  const sessions = props.sessions;
  const totals = sessions.reduce(
    (acc, session) => {
      const stats = statsFor(session);
      acc.volume += stats.volume;
      acc.doneSets += stats.doneSets;
      return acc;
    },
    { volume: 0, doneSets: 0 }
  );

  const days = new Set(sessions.map(s => s.dayKey).filter(Boolean));
  const durations = sessions.map(durationFor).filter(d => d !== null && d > 0);

  return [
    { label: 'Treinos', value: String(sessions.length), hint: `${days.size} ${days.size === 1 ? 'dia' : 'dias'}` },
    { label: 'Volume total', value: formatVolume(totals.volume), hint: 'carga × reps' },
    { label: 'Séries concluídas', value: String(totals.doneSets) },
    { label: 'Tempo médio', value: durations.length ? formatDuration(Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)) : '—' }
  ];
});

function barHeight(volume) {
  const max = Math.max(...weeks.value.map(w => w.volume), 1);
  // Piso de 6% para que uma semana de volume baixo continue visível como barra.
  return `${Math.max(6, Math.round((volume / max) * 100))}%`;
}
</script>