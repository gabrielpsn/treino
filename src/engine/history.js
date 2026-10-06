/**
 * Agregações do histórico de treino.
 *
 * Funções puras sobre os dados já lidos do banco: nada aqui consulta IndexedDB
 * nem depende de Vue. O objetivo é que "volume total", "duração" e "progressão
 * de carga" tenham uma definição única, testável e reutilizada tanto pela tela
 * de histórico quanto pela futura lógica de progressão/IA.
 */

export const KG_PER_LB = 0.45359237;

// Aceita número ou texto ("80", "80,5", " 80 "). Campos preenchidos pela ficha
// vêm de <input type="number"> e chegam como string; o export/import de backup
// pode trazer qualquer um dos dois.
export function parseWeight(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const cleaned = value.trim().replace(',', '.');
  if (cleaned === '') return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseReps(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : null;
  if (typeof value !== 'string') return null;
  const cleaned = value.trim();
  if (cleaned === '') return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

// Volume de uma série: carga × reps. Séries aeróbicas ou sem reps não têm
// volume e retornam 0 em vez de NaN.
export function setVolume(set) {
  const weight = parseWeight(set?.weight);
  const reps = parseReps(set?.reps);
  if (weight === null || reps === null || weight <= 0 || reps <= 0) return 0;
  return weight * reps;
}

// Volume total da sessão, contando apenas séries concluídas. Sem esse filtro,
// uma série digitada e abandonada inflaria o número.
export function sessionVolume(sets = []) {
  return sets.reduce((total, set) => (set?.isDone ? total + setVolume(set) : total), 0);
}

export function sessionSetStats(sets = []) {
  const done = sets.filter(set => set?.isDone);
  const withVolume = done.filter(set => setVolume(set) > 0);
  return {
    totalSets: sets.length,
    doneSets: done.length,
    volumeSets: withVolume.length,
    volume: sessionVolume(sets),
    uniqueExercises: new Set(done.map(set => set.exerciseId).filter(Boolean)).size
  };
}

export function sessionDurationMinutes(session, sets = []) {
  const start = Date.parse(session?.startedAt);
  if (!Number.isFinite(start)) return null;

  const end = session?.finishedAt ? Date.parse(session.finishedAt) : latestSetTime(sets);
  if (!Number.isFinite(end) || end <= start) return 0;

  return Math.round((end - start) / 60000);
}

function latestSetTime(sets = []) {
  let latest = NaN;
  for (const set of sets) {
    const time = Date.parse(set?.recordedAt);
    if (Number.isFinite(time) && (!Number.isFinite(latest) || time > latest)) latest = time;
  }
  return latest;
}

/**
 * Progressão de um exercício: uma entrada por sessão, da mais antiga para a
 * mais recente. Sessões sem carga (exercício aeróbico) entram com volume 0 para
 * que a linha do tempo não tenha buracos.
 */
export function buildProgression(sessionsWithSets = []) {
  const ordered = [...sessionsWithSets].sort((a, b) => String(a?.startedAt || '').localeCompare(String(b?.startedAt || '')));

  return ordered.map(session => {
    const stats = sessionSetStats(session.sets || []);
    return {
      sessionId: session.id,
      startedAt: session.startedAt,
      dayKey: session.dayKey,
      volume: stats.volume,
      doneSets: stats.doneSets,
      topWeight: maxWeight(session.sets || [])
    };
  });
}

function maxWeight(sets = []) {
  let max = null;
  for (const set of sets) {
    if (!set?.isDone) continue;
    const weight = parseWeight(set.weight);
    if (weight !== null && weight > 0 && (max === null || weight > max)) max = weight;
  }
  return max;
}

/**
 * Evolução de carga de UM exercício: um ponto por sessão concluída em que ele
 * aparece, da mais antiga para a mais recente. Sessões sem carga registrada
 * (aeróbico) ficam de fora — não têm eixo Y comparável — e sessões em que o
 * exercício não foi marcado como concluído também, senão a linha cairia para
 * zero no dia em que a pessoa pulou o movimento.
 */
export function buildExerciseProgression(sessionsWithSets = [], exerciseId) {
  if (!exerciseId) return [];

  const points = [];
  for (const session of sessionsWithSets || []) {
    const sets = (session?.sets || []).filter(set => set?.exerciseId === exerciseId && set.isDone);
    if (sets.length === 0) continue;

    const topWeight = maxWeight(sets);
    if (topWeight === null) continue;

    points.push({
      sessionId: session.id,
      dayKey: session.dayKey,
      startedAt: session.startedAt,
      topWeight,
      volume: sessionVolume(sets),
      doneSets: sets.length
    });
  }

  return points.sort((a, b) => String(a.startedAt || '').localeCompare(String(b.startedAt || '')));
}

// Variação percentual da carga máxima entre duas sessões. Retorna null quando
// não há base de comparação (primeira execução, ou exercises sem carga).
export function loadChangePercent(previousTopWeight, currentTopWeight) {
  const previous = parseWeight(previousTopWeight);
  const current = parseWeight(currentTopWeight);
  if (previous === null || current === null || previous <= 0 || current <= 0) return null;

  const change = ((current - previous) / previous) * 100;
  // Variação de menos de 0,1% é ruído de arredondamento do input step="0.5".
  return Math.abs(change) < 0.1 ? 0 : change;
}

export function formatVolume(volume) {
  const value = Number(volume) || 0;
  if (value >= 10000) return `${Math.round(value / 1000)}k kg`;
  return `${Math.round(value).toLocaleString('pt-BR')} kg`;
}

export function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) return '—';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${String(rest).padStart(2, '0')}`;
}

const MONTH_LABELS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// "2026-03-14" -> "14 mar 2026". Evita new Date(string) porque o formato ISO
// sem hora é interpretado como UTC e volta um dia em fusos negativos.
export function formatDayKey(dayKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dayKey || ''));
  if (!match) return '—';
  const [, year, month, day] = match;
  return `${Number(day)} ${MONTH_LABELS[Number(month) - 1]} ${year}`;
}

// Consolida semanas (chave YYYY-Www) com contagem, volume e dias distintos.
// Base do card "últimas semanas" e, depois, do gráfico de barras.
export function summarizeByWeek(sessionsWithSets = []) {
  const weeks = new Map();

  for (const session of sessionsWithSets) {
    const stats = sessionSetStats(session.sets || []);
    const key = session.weekKey;
    if (!key) continue;

    const current = weeks.get(key) || { weekKey: key, sessions: 0, volume: 0, doneSets: 0, days: new Set() };
    current.sessions += 1;
    current.volume += stats.volume;
    current.doneSets += stats.doneSets;
    if (session.dayKey) current.days.add(session.dayKey);
    weeks.set(key, current);
  }

  return [...weeks.values()]
    .map(week => ({ ...week, days: week.days.size }))
    .sort((a, b) => a.weekKey.localeCompare(b.weekKey));
}