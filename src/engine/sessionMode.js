/**
 * Lógica pura do Modo Treino (tela cheia durante a execução da ficha).
 *
 * Nada aqui toca em IndexedDB nem em Vue: a fila de exercícios é derivada da
 * ficha + logs atuais, e o cronômetro é só uma diferença de timestamps. Isso
 * mantém a parte testável (progresso, ordenação, formatação) fora do componente.
 */

// Tempo decorrido em "MM:SS"; acima de uma hora vira "H:MM:SS" para não
// estourar a largura do cronômetro no celular.
export function formatElapsed(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

// Diferença segura entre um ISO string e um instante de referência. Valores
// inválidos (sessão ainda não aberta, relógio corrompido) viram 0 em vez de
// NaN, que travaria o cronômetro em "NaN:NaN".
export function elapsedSince(startedAt, nowMs) {
  const start = Date.parse(startedAt);
  if (!Number.isFinite(start) || !Number.isFinite(nowMs)) return 0;
  return Math.max(0, nowMs - start);
}

/**
 * Fila do modo treino: exercícios da ficha atual com o estado de conclusão
 * tirado dos logs. `focusId` aponta para o primeiro pendente (ou o último
 * exercício, quando tudo está feito) — é o que o modo mostra em destaque.
 */
export function buildTrainingQueue(exercises = [], logs = {}) {
  const items = (exercises || []).map(ex => ({
    exerciseId: ex.id,
    name: ex.name,
    isDone: !!logs[ex.id]?.isDone
  }));

  const doneCount = items.filter(item => item.isDone).length;
  const firstPending = items.find(item => !item.isDone) || null;

  return {
    items,
    totalCount: items.length,
    doneCount,
    remainingCount: items.length - doneCount,
    focusId: firstPending ? firstPending.exerciseId : (items.length > 0 ? items[items.length - 1].exerciseId : null),
    allDone: items.length > 0 && doneCount === items.length
  };
}
