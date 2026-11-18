/**
 * Programa guiado de 4 semanas para quem está começando na musculação.
 *
 * A ficha continua a mesma; o que muda semana a semana é a INTENSIDADE:
 * poucas séries e muitas repetições sobrando no começo (aprender o movimento),
 * chegando a 3 séries com 2 repetições sobrando no fim. Nada de falha.
 * Funções puras: o estado (data de início) vem de fora.
 */

export const PROGRAM_WEEKS = [
  {
    week: 1,
    title: 'Aprender os movimentos',
    sets: 2,
    reps: '12-15',
    rir: 4,
    goal: 'Use um peso leve e foque na técnica. Termine cada série sentindo que faria mais 4 repetições.',
    lesson: {
      title: 'Por que começar leve?',
      text: 'Músculos se adaptam rápido, mas tendões e articulações demoram mais. Uma semana leve ensina o movimento ao seu corpo e evita dor e lesão. Não se preocupe com o peso agora.'
    },
    tips: [
      'Assista ao vídeo ("Como fazer") antes de cada exercício novo.',
      'Faça 1 série de aquecimento bem leve no primeiro exercício.',
      'Dor articular aguda não é normal: pare e troque o exercício.'
    ]
  },
  {
    week: 2,
    title: 'Ganhar confiança',
    sets: 3,
    reps: '12',
    rir: 3,
    goal: 'Mais uma série por exercício. Mantenha o peso da semana passada ou suba um pouco se ficou fácil.',
    lesson: {
      title: 'Anote seus pesos',
      text: 'Registrar peso e repetições é o que permite evoluir: o app compara com o último treino e sugere quando subir. Anote mesmo os pesos pequenos.'
    },
    tips: [
      'Respeite o descanso: toque em "Descanso" para iniciar o cronômetro.',
      'Controle a descida do peso (2 a 3 segundos).',
      'Durma bem e coma proteína em todas as refeições.'
    ]
  },
  {
    week: 3,
    title: 'Primeira progressão',
    sets: 3,
    reps: '10-12',
    rir: 2,
    goal: 'Hora de subir o peso: se fez 12 repetições com folga, aumente um pouco na próxima série.',
    lesson: {
      title: 'Sobrecarga progressiva',
      text: 'O músculo cresce quando recebe um desafio um pouco maior que o anterior. Subir de 2 em 2 kg (ou 1 kg em halteres) já é progresso. Siga a "Sugestão" que aparece no exercício.'
    },
    tips: [
      'Suba o peso só se a técnica continuar boa.',
      'Pare com 2 repetições sobrando, não vá até a falha.',
      'Beba água ao longo do treino.'
    ]
  },
  {
    week: 4,
    title: 'Consolidar e reavaliar',
    sets: 3,
    reps: '8-10',
    rir: 2,
    goal: 'Pesos um pouco maiores e menos repetições. No fim da semana, veja sua evolução e escolha o próximo passo.',
    lesson: {
      title: 'O que vem depois',
      text: 'Depois de 4 semanas você já domina os movimentos. A partir daqui, a ficha normal do app com sobrecarga progressiva é o caminho. Registre seu peso corporal para acompanhar o resultado.'
    },
    tips: [
      'Compare seus pesos com os da semana 1 no Histórico.',
      'Registre peso e medidas em "Evolução Corporal".',
      'Comemore: 4 semanas seguidas é o que separa quem desiste de quem evolui.'
    ]
  }
];

export const PROGRAM_DAYS = PROGRAM_WEEKS.length * 7;
const DAY_MS = 86_400_000;

function dayNumber(dateKey) {
  return Math.round(Date.parse(`${dateKey}T12:00:00Z`) / DAY_MS);
}

function sessionDayKey(session) {
  if (session?.dayKey) return session.dayKey;
  const t = Date.parse(session?.startedAt || '');
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Normaliza o estado salvo (localStorage / backup). */
export function normalizeProgramState(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  const isDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
  return {
    startedOn: isDate(s.startedOn) ? s.startedOn : null,
    completedOn: isDate(s.completedOn) ? s.completedOn : null,
    dismissed: s.dismissed === true
  };
}

/**
 * Situação do programa em uma data: semana atual, treinos feitos por semana
 * (dias distintos com série concluída) e se chegou a hora da reavaliação.
 */
export function programStatus(state, sessions = [], { daysPerWeek = 3, today }) {
  const st = normalizeProgramState(state);
  const target = Math.min(Math.max(Number(daysPerWeek) || 3, 2), 6);
  if (!st.startedOn) return { phase: st.dismissed ? 'dismissed' : 'not_started', target };
  if (st.completedOn) return { phase: 'completed', target, completedOn: st.completedOn };

  const start = dayNumber(st.startedOn);
  const elapsed = dayNumber(today) - start;
  const currentWeek = Math.min(PROGRAM_WEEKS.length, Math.max(1, Math.floor(elapsed / 7) + 1));

  const daysByWeek = PROGRAM_WEEKS.map(() => new Set());
  for (const s of sessions) {
    if (!(s?.sets || []).some(set => set?.isDone)) continue;
    const key = sessionDayKey(s);
    if (!key) continue;
    const offset = dayNumber(key) - start;
    if (offset < 0 || offset >= PROGRAM_DAYS) continue;
    daysByWeek[Math.floor(offset / 7)].add(key);
  }

  const weeks = PROGRAM_WEEKS.map((w, i) => {
    const done = daysByWeek[i].size;
    let status = 'future';
    if (w.week < currentWeek) status = done >= target ? 'done' : 'partial';
    else if (w.week === currentWeek) status = done >= target ? 'done' : 'current';
    return { ...w, done, target, status };
  });

  const totalDone = weeks.reduce((sum, w) => sum + w.done, 0);
  return {
    phase: elapsed >= PROGRAM_DAYS ? 'review' : 'active',
    target,
    currentWeek,
    current: weeks[currentWeek - 1],
    weeks,
    totalDone,
    totalTarget: target * PROGRAM_WEEKS.length,
    daysLeftInWeek: 7 - (elapsed % 7),
    startedOn: st.startedOn
  };
}

/** Texto da prescrição da semana para o card do exercício. */
export function weekPrescription(weekDef) {
  if (!weekDef) return '';
  return `Semana ${weekDef.week}: ${weekDef.sets} séries de ${weekDef.reps}, parando com ${weekDef.rir} repetições sobrando`;
}

/**
 * Resumo da reavaliação: frequência e quanto o peso usado subiu entre a
 * primeira e a última vez em que cada exercício apareceu no programa.
 */
export function programReview(state, sessions = [], { exerciseName = id => id } = {}) {
  const st = normalizeProgramState(state);
  if (!st.startedOn) return null;
  const start = dayNumber(st.startedOn);
  const inProgram = sessions
    .filter(s => {
      const key = sessionDayKey(s);
      if (!key || !(s.sets || []).some(set => set?.isDone)) return false;
      const offset = dayNumber(key) - start;
      return offset >= 0 && offset < PROGRAM_DAYS;
    })
    .sort((a, b) => String(a.startedAt || '').localeCompare(String(b.startedAt || '')));

  const firstLast = new Map();
  for (const s of inProgram) {
    for (const set of s.sets || []) {
      const w = Number(String(set.weight ?? '').replace(',', '.'));
      if (!set?.isDone || !set.exerciseId || !Number.isFinite(w) || w <= 0) continue;
      const entry = firstLast.get(set.exerciseId) || { first: w, last: w };
      entry.last = w;
      firstLast.set(set.exerciseId, entry);
    }
  }
  const improvements = [...firstLast.entries()]
    .map(([id, { first, last }]) => ({ exerciseId: id, name: exerciseName(id), first, last, gainKg: Math.round((last - first) * 10) / 10 }))
    .filter(x => x.gainKg > 0)
    .sort((a, b) => b.gainKg - a.gainKg);

  const days = new Set(inProgram.map(sessionDayKey));
  return { workouts: days.size, improvements: improvements.slice(0, 5) };
}
