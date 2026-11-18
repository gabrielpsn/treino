import { describe, it, expect } from 'vitest';
import { programStatus, normalizeProgramState, weekPrescription, programReview, PROGRAM_WEEKS } from '../../src/engine/beginnerProgram.js';

const s = (dayKey, sets = [{ isDone: true, exerciseId: 'supino', weight: '20' }]) => ({ dayKey, startedAt: `${dayKey}T10:00:00`, sets });

describe('programStatus', () => {
  it('sem início: not_started; dispensado: dismissed', () => {
    expect(programStatus({}, [], { today: '2026-03-01' }).phase).toBe('not_started');
    expect(programStatus({ dismissed: true }, [], { today: '2026-03-01' }).phase).toBe('dismissed');
  });

  it('calcula a semana atual e conta dias distintos treinados por semana', () => {
    const st = { startedOn: '2026-03-02' };
    const sessions = [s('2026-03-02'), s('2026-03-02'), s('2026-03-04'), s('2026-03-06'), s('2026-03-10'), s('2026-02-20')];
    const r = programStatus(st, sessions, { daysPerWeek: 3, today: '2026-03-11' });
    expect(r.phase).toBe('active');
    expect(r.currentWeek).toBe(2);
    expect(r.weeks[0]).toMatchObject({ done: 3, status: 'done' });
    expect(r.weeks[1]).toMatchObject({ done: 1, status: 'current' });
    expect(r.weeks[2].status).toBe('future');
    expect(r.totalDone).toBe(4);
    expect(r.totalTarget).toBe(12);
  });

  it('semana passada incompleta fica parcial; após 28 dias pede reavaliação', () => {
    const st = { startedOn: '2026-03-02' };
    expect(programStatus(st, [s('2026-03-03')], { daysPerWeek: 3, today: '2026-03-12' }).weeks[0].status).toBe('partial');
    const end = programStatus(st, [], { daysPerWeek: 3, today: '2026-03-30' });
    expect(end.phase).toBe('review');
    expect(end.currentWeek).toBe(4);
  });

  it('concluído e estado inválido saneado', () => {
    expect(programStatus({ startedOn: '2026-03-02', completedOn: '2026-03-30' }, [], { today: '2026-04-02' }).phase).toBe('completed');
    expect(normalizeProgramState({ startedOn: 'ontem', dismissed: 'sim' })).toEqual({ startedOn: null, completedOn: null, dismissed: false });
  });
});

describe('prescrição e reavaliação', () => {
  it('texto da semana', () => {
    expect(weekPrescription(PROGRAM_WEEKS[0])).toBe('Semana 1: 2 séries de 12-15, parando com 4 repetições sobrando');
    expect(PROGRAM_WEEKS.map(w => w.rir)).toEqual([4, 3, 2, 2]);
  });

  it('mostra quanto o peso subiu por exercício dentro do programa', () => {
    const sessions = [
      s('2026-03-02', [{ isDone: true, exerciseId: 'supino', weight: '20' }, { isDone: true, exerciseId: 'remada', weight: '30' }]),
      s('2026-03-25', [{ isDone: true, exerciseId: 'supino', weight: '27,5' }, { isDone: true, exerciseId: 'remada', weight: '30' }]),
      s('2026-05-01', [{ isDone: true, exerciseId: 'supino', weight: '60' }])
    ];
    const r = programReview({ startedOn: '2026-03-02' }, sessions, { exerciseName: id => id.toUpperCase() });
    expect(r.workouts).toBe(2);
    expect(r.improvements).toEqual([{ exerciseId: 'supino', name: 'SUPINO', first: 20, last: 27.5, gainKg: 7.5 }]);
  });
});
