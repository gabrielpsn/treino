/**
 * Qual ficha fazer hoje: a seguinte à última treinada, em rodízio (A → B → C → A).
 * Se já houve treino concluído hoje, aponta a ficha feita hoje e marca como feita.
 */
function sessionDay(session) {
  if (session?.dayKey) return session.dayKey;
  const t = Date.parse(session?.startedAt || '');
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function pickTodaySplit(splits = [], sessions = [], todayKey) {
  if (!splits.length) return { split: null, doneToday: false };
  const done = sessions
    .filter(s => s?.splitId && (s.sets || []).some(set => set?.isDone))
    .sort((a, b) => String(b.startedAt || '').localeCompare(String(a.startedAt || '')));

  const today = done.find(s => sessionDay(s) === todayKey);
  if (today) {
    const split = splits.find(s => s.id === today.splitId);
    if (split) return { split, doneToday: true };
  }

  const last = done.find(s => splits.some(sp => sp.id === s.splitId));
  if (!last) return { split: splits[0], doneToday: false };
  const index = splits.findIndex(s => s.id === last.splitId);
  return { split: splits[(index + 1) % splits.length], doneToday: false };
}

/** Duração aproximada: ~2,5 min por série (execução + descanso) + 5 de aquecimento. */
export function estimateMinutes(split) {
  const sets = (split?.exercises || []).reduce((total, ex) => {
    const match = String(ex.defaultSeries || '').match(/(\d+)\s*x/i);
    return total + (match ? Number(match[1]) : 3);
  }, 0);
  return Math.round(sets * 2.5 + 5);
}
