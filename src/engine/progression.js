const KG_PRECISION = 0.5;

function roundToHalfKg(value) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value / KG_PRECISION) * KG_PRECISION;
}

export function estimate1RM(weightKg, reps) {
  const w = Number(weightKg);
  const rCount = Number(reps);
  if (!Number.isFinite(w) || w <= 0) return 0;
  if (!Number.isFinite(rCount) || rCount < 1) return 0;
  const r = Math.floor(rCount);
  if (r < 1) return 0;
  const est = w * (1 + r / 30);
  return Math.round(est * 10) / 10;
}

function extractPerformedSets(sessions = []) {
  const sets = [];

  for (const session of sessions) {
    if (!session || typeof session !== 'object') continue;
    const list = Array.isArray(session.sets) ? session.sets : [];
    for (const s of list) {
      if (!s || typeof s !== 'object') continue;
      const weight = Number(s.weightKg ?? s.weight ?? 0);
      const reps = Number(s.reps ?? 0);
      const done = s.isDone !== false;
      if (done && Number.isFinite(weight) && weight > 0 && Number.isFinite(reps) && reps > 0) {
        sets.push({
          exerciseId: s.exerciseId ?? session.exerciseId ?? null,
          weightKg: weight,
          reps: Math.floor(reps),
          volume: weight * Math.floor(reps),
          estimated1RM: estimate1RM(weight, reps),
          date: session.date ?? session.createdAt ?? null
        });
      }
    }
  }
  return sets;
}

export function calculatePersonalRecords(sessions = []) {
  const performed = extractPerformedSets(sessions);
  const byExercise = new Map();

  for (const set of performed) {
    if (!set.exerciseId) continue;
    const current = byExercise.get(set.exerciseId) ?? {
      exerciseId: set.exerciseId,
      maxWeightKg: 0,
      maxReps: 0,
      maxVolumeKg: 0,
      bestEstimated1RM: 0,
      bestSet: null
    };

    if (set.weightKg > current.maxWeightKg + 1e-9) {
      current.maxWeightKg = set.weightKg;
    }
    if (set.reps > current.maxReps) {
      current.maxReps = set.reps;
    }
    if (set.volume > current.maxVolumeKg + 1e-9) {
      current.maxVolumeKg = set.volume;
    }
    if (set.estimated1RM > current.bestEstimated1RM + 1e-9) {
      current.bestEstimated1RM = set.estimated1RM;
    }

    const scoreNew = set.estimated1RM * 1000 + set.volume;
    const best = current.bestSet;
    const scoreBest = best ? best.estimated1RM * 1000 + best.volume : -1;
    if (!best || scoreNew > scoreBest + 1e-9) {
      current.bestSet = {
        weightKg: set.weightKg,
        reps: set.reps,
        volume: set.volume,
        estimated1RM: set.estimated1RM,
        date: set.date
      };
    }

    byExercise.set(set.exerciseId, current);
  }

  for (const pr of byExercise.values()) {
    pr.maxWeightKg = Math.round(pr.maxWeightKg * 10) / 10;
    pr.maxVolumeKg = Math.round(pr.maxVolumeKg * 10) / 10;
    pr.bestEstimated1RM = Math.round(pr.bestEstimated1RM * 10) / 10;
    if (pr.bestSet) {
      pr.bestSet.weightKg = Math.round(pr.bestSet.weightKg * 10) / 10;
      pr.bestSet.volume = Math.round(pr.bestSet.volume * 10) / 10;
      pr.bestSet.estimated1RM = Math.round(pr.bestSet.estimated1RM * 10) / 10;
    }
  }

  return byExercise;
}

function suggestedWeightDelta(exercise) {
  if (!exercise || typeof exercise !== 'object') return 0.5;
  const pattern = String(exercise.pattern ?? '').toLowerCase();
  const equipment = String(exercise.equipment ?? '').toLowerCase();
  const muscle = String(exercise.muscle ?? '').toLowerCase();

  if (pattern === 'push_horizontal' || pattern === 'push_vertical' || pattern === 'pull_vertical' || pattern === 'pull_horizontal' || pattern === 'hinge' || pattern === 'squat') {
    return 1.0;
  }

  if (muscle === 'bíceps' || muscle === 'tríceps' || muscle === 'panturrilha' || muscle === 'antebraço' || pattern === 'isolation') {
    return 0.5;
  }

  return 0.5;
}

export function suggestNextLoad({
  exerciseId,
  exercise,
  lastSets = [],
  targetRepsRange = null,
  defaultWeightKg = 0,
  defaultReps = 10
} = {}) {
  const sets = (lastSets || []).filter(s => s && (s.isDone !== false) && Number(s.weightKg) > 0 && Number(s.reps) > 0);

  let currentWeight = 0;
  let avgReps = 0;
  let completed = sets.length;
  let totalVolume = 0;

  if (sets.length > 0) {
    const sumW = sets.reduce((acc, s) => acc + Number(s.weightKg), 0);
    const sumR = sets.reduce((acc, s) => acc + Number(s.reps), 0);
    totalVolume = sets.reduce((acc, s) => acc + Number(s.weightKg) * Number(s.reps), 0);
    currentWeight = roundToHalfKg(sumW / sets.length);
    avgReps = Math.round(sumR / sets.length);
  } else if (Number(defaultWeightKg) > 0) {
    currentWeight = roundToHalfKg(Number(defaultWeightKg));
  }

  if (avgReps < 1 && Number(defaultReps) > 0) {
    avgReps = Math.floor(Number(defaultReps));
  }

  let rMin = 8;
  let rMax = 12;
  if (Array.isArray(targetRepsRange) && targetRepsRange.length === 2) {
    rMin = Math.max(1, Math.floor(targetRepsRange[0]));
    rMax = Math.max(rMin, Math.floor(targetRepsRange[1]));
  } else if (exercise?.referenceRepsRange) {
    const [minr, maxr] = exercise.referenceRepsRange;
    if (minr) rMin = Math.max(1, Math.floor(minr));
    if (maxr) rMax = Math.max(rMin, Math.floor(maxr));
  }

  const baseReps = Math.max(rMin, Math.min(rMax, avgReps || rMin));
  const weightDelta = suggestedWeightDelta(exercise);

  if (sets.length === 0) {
    const w = currentWeight > 0 ? currentWeight : roundToHalfKg(Number(defaultWeightKg) || 0);
    const r = baseReps || Math.floor(Number(defaultReps) || rMin);
    return {
      exerciseId: exerciseId ?? exercise?.id ?? null,
      suggestedWeightKg: w > 0 ? w : 0,
      suggestedReps: Math.max(rMin, Math.min(rMax, r)),
      rationale: 'Sem histórico suficiente — mantenha peso/reps para estabelecer base.',
      confidence: 'low',
      deltaKg: 0,
      basedOn: { completedSets: 0, avgWeightKg: w, avgReps: r, totalVolumeKg: 0 }
    };
  }

  let nextWeight = currentWeight;
  let nextReps = baseReps;
  let deltaKg = 0;
  let rationale = 'Mantenha carga e repetições (dentro da faixa alvo).';

  if (avgReps >= rMax) {
    nextWeight = roundToHalfKg(currentWeight + weightDelta);
    nextReps = rMin;
    deltaKg = nextWeight - currentWeight;
    rationale = `Alcançou ${avgReps} reps (topo ${rMax}) → suba peso para ${nextWeight} kg e volte para ${nextReps} reps.`;
  } else if (avgReps >= rMin + 1) {
    nextReps = Math.min(rMax, baseReps + 1);
    nextWeight = currentWeight;
    deltaKg = 0;
    rationale = `Dentro da faixa (${rMin}–${rMax}): aumente reps para ${nextReps} (mantendo ${nextWeight} kg).`;
  } else if (avgReps < rMin) {
    nextReps = Math.max(rMin, baseReps + 1);
    nextWeight = currentWeight;
    deltaKg = 0;
    rationale = `Ficou abaixo da faixa (${avgReps} < ${rMin}) — mantenha ${nextWeight} kg e busque ${nextReps} reps com boa execução.`;
  }

  if (nextWeight < 0.5 && currentWeight >= 0.5) {
    nextWeight = currentWeight;
  }

  return {
    exerciseId: exerciseId ?? exercise?.id ?? null,
    suggestedWeightKg: roundToHalfKg(nextWeight),
    suggestedReps: Math.max(rMin, Math.min(rMax, nextReps)),
    rationale,
    confidence: sets.length >= 2 ? 'medium' : 'low',
    deltaKg: Math.round(deltaKg * 10) / 10,
    basedOn: {
      completedSets: completed,
      avgWeightKg: currentWeight,
      avgReps,
      totalVolumeKg: Math.round(totalVolume * 10) / 10,
      targetRange: [rMin, rMax]
    }
  };
}

export function getLastSetsForExercise(sessions = [], exerciseId) {
  if (!exerciseId) return [];

  const recent = [...sessions]
    .filter(s => s && s.date)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 4);

  const out = [];
  for (const session of recent) {
    const sets = Array.isArray(session.sets) ? session.sets : [];
    for (const s of sets) {
      if (s?.exerciseId === exerciseId && s.isDone !== false && Number(s.weightKg) > 0 && Number(s.reps) > 0) {
        out.push({
          weightKg: Number(s.weightKg),
          reps: Math.floor(Number(s.reps)),
          isDone: true
        });
      }
    }
    if (out.length >= 6) break;
  }
  return out;
}
