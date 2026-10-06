import { describe, it, expect } from 'vitest';
import { formatElapsed, elapsedSince, buildTrainingQueue } from '../../src/engine/sessionMode.js';

describe('formatElapsed', () => {
  it('formata minutos e segundos com dois dígitos', () => {
    expect(formatElapsed(0)).toBe('00:00');
    expect(formatElapsed(1000)).toBe('00:01');
    expect(formatElapsed(61_000)).toBe('01:01');
    expect(formatElapsed(59 * 60_000 + 59_000)).toBe('59:59');
  });

  it('passa de H:MM:SS depois de uma hora', () => {
    expect(formatElapsed(3_600_000)).toBe('1:00:00');
    expect(formatElapsed(3_661_000)).toBe('1:01:01');
  });

  it('valores inválidos viram 00:00 em vez de NaN', () => {
    expect(formatElapsed(NaN)).toBe('00:00');
    expect(formatElapsed(-5000)).toBe('00:00');
    expect(formatElapsed(Infinity)).toBe('00:00');
  });
});

describe('elapsedSince', () => {
  it('calcula a diferença entre o início da sessão e agora', () => {
    const start = '2026-10-06T10:00:00.000Z';
    const now = Date.parse(start) + 90_000;
    expect(elapsedSince(start, now)).toBe(90_000);
  });

  it('nunca fica negativo nem NaN', () => {
    const start = '2026-10-06T10:00:00.000Z';
    expect(elapsedSince(start, Date.parse(start) - 10_000)).toBe(0);
    expect(elapsedSince(null, Date.now())).toBe(0);
    expect(elapsedSince('não é data', Date.now())).toBe(0);
    expect(elapsedSince(start, NaN)).toBe(0);
  });
});

describe('buildTrainingQueue', () => {
  const EXERCISES = [
    { id: 'supino', name: 'Supino Reto' },
    { id: 'remada', name: 'Remada Curvada' },
    { id: 'desenvolvimento', name: 'Desenvolvimento' }
  ];

  it('marca o primeiro pendente como foco quando nada foi feito', () => {
    const queue = buildTrainingQueue(EXERCISES, {});
    expect(queue.totalCount).toBe(3);
    expect(queue.doneCount).toBe(0);
    expect(queue.remainingCount).toBe(3);
    expect(queue.focusId).toBe('supino');
    expect(queue.allDone).toBe(false);
  });

  it('avança o foco conforme os exercícios são concluídos', () => {
    const queue = buildTrainingQueue(EXERCISES, {
      supino: { isDone: true },
      remada: { isDone: true }
    });
    expect(queue.doneCount).toBe(2);
    expect(queue.focusId).toBe('desenvolvimento');
  });

  it('todos concluídos: allDone true e foco no último exercício', () => {
    const queue = buildTrainingQueue(EXERCISES, {
      supino: { isDone: true },
      remada: { isDone: true },
      desenvolvimento: { isDone: true }
    });
    expect(queue.allDone).toBe(true);
    expect(queue.remainingCount).toBe(0);
    expect(queue.focusId).toBe('desenvolvimento');
  });

  it('log com isDone falsy não conta como concluído', () => {
    const queue = buildTrainingQueue(EXERCISES, {
      supino: { isDone: false },
      remada: { weight: '40', isDone: undefined }
    });
    expect(queue.doneCount).toBe(0);
    expect(queue.focusId).toBe('supino');
  });

  it('ficha vazia não quebra', () => {
    const queue = buildTrainingQueue([], {});
    expect(queue.totalCount).toBe(0);
    expect(queue.focusId).toBeNull();
    expect(queue.allDone).toBe(false);
  });
});
