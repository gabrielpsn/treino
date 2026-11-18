/**
 * Peso corporal, medidas e ajuste automático da dieta.
 *
 * Funções puras: recebem as medições já lidas do banco. O ajuste de calorias
 * olha a TENDÊNCIA de peso (regressão linear das últimas semanas), não a
 * diferença entre duas pesagens — o peso diário oscila 1–2 kg com água e sal,
 * e reagir a isso faria a meta pular toda semana.
 */

export const MEASUREMENT_FIELDS = [
  { id: 'waistCm', label: 'Cintura', unit: 'cm', min: 40, max: 200 },
  { id: 'hipCm', label: 'Quadril', unit: 'cm', min: 50, max: 220 },
  { id: 'chestCm', label: 'Peito', unit: 'cm', min: 50, max: 200 },
  { id: 'armCm', label: 'Braço', unit: 'cm', min: 15, max: 70 },
  { id: 'thighCm', label: 'Coxa', unit: 'cm', min: 25, max: 110 },
  { id: 'bodyFatPct', label: '% Gordura', unit: '%', min: 3, max: 70 }
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

// Faixa saudável de variação semanal, em % do peso corporal por semana.
// Fora dela, a dieta é ajustada; dentro, fica como está.
export const GOAL_WEEKLY_RATE_PCT = {
  weight_loss: { min: -1.0, max: -0.4 },
  hypertrophy: { min: 0.1, max: 0.5 },
  strength: { min: 0.0, max: 0.5 },
  recomposition: { min: -0.4, max: 0.1 },
  maintenance: { min: -0.2, max: 0.2 }
};

export const CALORIE_STEP_KCAL = 150;
export const MIN_DAYS_FOR_ADJUSTMENT = 14;
export const MIN_ENTRIES_FOR_ADJUSTMENT = 4;
const TREND_WINDOW_DAYS = 28;

function toNumberInRange(value, min, max) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return Math.round(n * 10) / 10;
}

/**
 * Saneia uma medição. Devolve `null` quando não há data válida ou nenhum
 * valor aproveitável — uma linha vazia não deve virar ponto no gráfico.
 */
export function normalizeBodyEntry(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const date = typeof raw.date === 'string' ? raw.date.slice(0, 10) : '';
  if (!DATE_RE.test(date)) return null;

  const entry = { id: date, date, weightKg: toNumberInRange(raw.weightKg, 25, 350) };
  for (const field of MEASUREMENT_FIELDS) {
    entry[field.id] = toNumberInRange(raw[field.id], field.min, field.max);
  }
  const hasValue = entry.weightKg !== null || MEASUREMENT_FIELDS.some(f => entry[f.id] !== null);
  if (!hasValue) return null;

  if (typeof raw.note === 'string' && raw.note.trim()) entry.note = raw.note.trim().slice(0, 200);
  entry.updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString();
  return entry;
}

function dayIndex(date) {
  return Math.round(Date.parse(`${date}T12:00:00Z`) / DAY_MS);
}

export function sortEntries(entries = []) {
  return [...entries].filter(Boolean).sort((a, b) => a.date.localeCompare(b.date));
}

/** Pontos de peso (data, kg) em ordem cronológica. */
export function weightSeries(entries = []) {
  return sortEntries(entries)
    .filter(e => Number.isFinite(e.weightKg))
    .map(e => ({ date: e.date, weightKg: e.weightKg }));
}

/**
 * Média móvel de 7 dias por ponto: suaviza a oscilação diária para o gráfico.
 */
export function movingAverage(series = [], windowDays = 7) {
  return series.map(point => {
    const end = dayIndex(point.date);
    const inWindow = series.filter(p => {
      const d = dayIndex(p.date);
      return d <= end && d > end - windowDays;
    });
    const avg = inWindow.reduce((sum, p) => sum + p.weightKg, 0) / inWindow.length;
    return { date: point.date, weightKg: Math.round(avg * 10) / 10 };
  });
}

/**
 * Tendência de peso por regressão linear na janela recente.
 * Devolve kg/semana e % do peso/semana, ou null sem dados suficientes.
 */
export function weightTrend(entries = [], { today = null, windowDays = TREND_WINDOW_DAYS } = {}) {
  const series = weightSeries(entries);
  if (series.length < 2) return null;

  const lastDay = today ? dayIndex(today) : dayIndex(series[series.length - 1].date);
  const recent = series.filter(p => dayIndex(p.date) > lastDay - windowDays && dayIndex(p.date) <= lastDay);
  if (recent.length < 2) return null;

  const xs = recent.map(p => dayIndex(p.date));
  const ys = recent.map(p => p.weightKg);
  const spanDays = xs[xs.length - 1] - xs[0];
  if (spanDays <= 0) return null;

  const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
  const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slopePerDay = den === 0 ? 0 : num / den;
  const weeklyKg = slopePerDay * 7;
  const weeklyPct = meanY > 0 ? (weeklyKg / meanY) * 100 : 0;

  return {
    weeklyKg: Math.round(weeklyKg * 100) / 100,
    weeklyPct: Math.round(weeklyPct * 100) / 100,
    spanDays,
    points: recent.length,
    averageKg: Math.round(meanY * 10) / 10
  };
}

/** Diferença entre a primeira e a última medição de cada campo. */
export function measurementChanges(entries = []) {
  const sorted = sortEntries(entries);
  const out = {};
  for (const field of [{ id: 'weightKg' }, ...MEASUREMENT_FIELDS]) {
    const withValue = sorted.filter(e => Number.isFinite(e[field.id]));
    if (withValue.length < 2) continue;
    const first = withValue[0];
    const last = withValue[withValue.length - 1];
    out[field.id] = {
      from: first[field.id],
      to: last[field.id],
      delta: Math.round((last[field.id] - first[field.id]) * 10) / 10,
      fromDate: first.date,
      toDate: last.date
    };
  }
  return out;
}

function calorieFloor(gender, bmr) {
  const base = gender === 'female' ? 1200 : 1500;
  return Math.max(base, Math.round(Number(bmr) || 0));
}

/**
 * Sugere ajuste da meta calórica a partir da tendência de peso.
 *
 * Passos pequenos (150 kcal) e só com pelo menos 2 semanas e 4 pesagens: o
 * objetivo é corrigir a rota com calma, não perseguir a balança.
 */
export function suggestCalorieAdjustment({
  entries = [],
  goal = 'hypertrophy',
  targetCalories,
  gender = 'male',
  bmr = 0,
  today = null
} = {}) {
  const target = Math.round(Number(targetCalories) || 0);
  const range = GOAL_WEEKLY_RATE_PCT[goal] ?? GOAL_WEEKLY_RATE_PCT.maintenance;
  const trend = weightTrend(entries, { today });

  const base = { range, trend, currentTargetCalories: target, deltaKcal: 0, newTargetCalories: target };

  if (!target) {
    return { ...base, status: 'no_target', message: 'Gere um plano para ter uma meta calórica.' };
  }
  if (!trend || trend.spanDays < MIN_DAYS_FOR_ADJUSTMENT || trend.points < MIN_ENTRIES_FOR_ADJUSTMENT) {
    return {
      ...base,
      status: 'insufficient_data',
      message: `Registre o peso pelo menos ${MIN_ENTRIES_FOR_ADJUSTMENT} vezes ao longo de ${MIN_DAYS_FOR_ADJUSTMENT} dias para o ajuste automático.`
    };
  }

  let delta = 0;
  if (trend.weeklyPct < range.min) delta = CALORIE_STEP_KCAL;
  else if (trend.weeklyPct > range.max) delta = -CALORIE_STEP_KCAL;

  const floor = calorieFloor(gender, bmr);
  let next = target + delta;
  // Só limita reduções: o piso nunca vira motivo para subir uma meta que o
  // usuário (ou o profissional) definiu abaixo dele.
  if (delta < 0 && next < floor) next = Math.min(target, Math.max(floor, next));
  delta = next - target;

  const rate = `${trend.weeklyKg > 0 ? '+' : ''}${trend.weeklyKg.toLocaleString('pt-BR')} kg/semana`;
  if (delta === 0 && (trend.weeklyPct < range.min || trend.weeklyPct > range.max)) {
    return {
      ...base,
      status: 'at_floor',
      message: `Seu peso está variando ${rate}, mas a meta já está no mínimo seguro. Fale com um nutricionista antes de reduzir mais.`
    };
  }
  if (delta === 0) {
    return { ...base, status: 'on_track', message: `No ritmo certo: ${rate}. Mantenha a meta atual.` };
  }

  return {
    ...base,
    status: delta > 0 ? 'increase' : 'decrease',
    deltaKcal: delta,
    newTargetCalories: next,
    message: delta > 0
      ? `Seu peso está variando ${rate}, abaixo do ideal para o objetivo. Sugestão: +${delta} kcal/dia.`
      : `Seu peso está variando ${rate}, acima do ideal para o objetivo. Sugestão: ${delta} kcal/dia.`
  };
}

/**
 * Reparte a nova meta calórica mantendo proteína e gordura: o carboidrato
 * absorve a diferença (4 kcal/g), com piso de 50 g.
 */
export function rebalanceMacros(macros = {}, newCalories) {
  const protein = Math.max(0, Math.round(Number(macros.proteinGrams) || 0));
  const fat = Math.max(0, Math.round(Number(macros.fatGrams) || 0));
  const kcal = Math.round(Number(newCalories) || 0);
  const carbs = Math.max(50, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { targetCalories: kcal, proteinGrams: protein, carbsGrams: carbs, fatGrams: fat };
}

/** Pontos (x, y) de um gráfico de linha simples em SVG. */
export function chartPoints(series = [], { width = 300, height = 120, pad = 12 } = {}) {
  if (series.length === 0) return { points: [], min: 0, max: 0 };
  const values = series.map(p => p.weightKg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const first = dayIndex(series[0].date);
  const last = dayIndex(series[series.length - 1].date);
  const daySpan = last - first || 1;
  const points = series.map(p => ({
    date: p.date,
    weightKg: p.weightKg,
    x: Math.round((pad + ((dayIndex(p.date) - first) / daySpan) * (width - pad * 2)) * 10) / 10,
    y: Math.round((height - pad - ((p.weightKg - min) / span) * (height - pad * 2)) * 10) / 10
  }));
  return { points, min, max };
}
