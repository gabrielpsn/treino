import { describe, it, expect } from 'vitest';
import {
  parseWeight,
  parseReps,
  setVolume,
  sessionVolume,
  sessionSetStats,
  sessionDurationMinutes,
  buildProgression,
  buildExerciseProgression,
  loadChangePercent,
  formatVolume,
  formatDuration,
  formatDayKey,
  summarizeByWeek
} from '../../src/engine/history.js';

describe('parseWeight', () => {
  it('aceita número', () => {
    expect(parseWeight(80)).toBe(80);
  });

  it('aceita string numérica', () => {
    expect(parseWeight('80')).toBe(80);
  });

  it('aceita vírgula decimal', () => {
    expect(parseWeight('82,5')).toBe(82.5);
  });

  it('aceita espaços ao redor', () => {
    expect(parseWeight(' 80 ')).toBe(80);
  });

  it('devolve null para string vazia', () => {
    expect(parseWeight('')).toBeNull();
    expect(parseWeight('   ')).toBeNull();
  });

  it('devolve null para texto não numérico', () => {
    expect(parseWeight('abc')).toBeNull();
    expect(parseWeight('80kg')).toBeNull();
  });

  it('devolve null para null/undefined/NaN', () => {
    expect(parseWeight(null)).toBeNull();
    expect(parseWeight(undefined)).toBeNull();
    expect(parseWeight(NaN)).toBeNull();
  });

  it('aceita zero, que é um valor válido de carga', () => {
    expect(parseWeight(0)).toBe(0);
    expect(parseWeight('0')).toBe(0);
  });
});

describe('parseReps', () => {
  it('aceita número e string', () => {
    expect(parseReps(12)).toBe(12);
    expect(parseReps('12')).toBe(12);
  });

  it('trunca fração, porque reps são inteiras', () => {
    expect(parseReps('12.9')).toBe(12);
  });

  it('devolve null para vazio ou inválido', () => {
    expect(parseReps('')).toBeNull();
    expect(parseReps('x')).toBeNull();
    expect(parseReps(null)).toBeNull();
  });
});

describe('setVolume', () => {
  it('multiplica carga por reps', () => {
    expect(setVolume({ weight: '80', reps: '10' })).toBe(800);
  });

  it('aceita campos em string', () => {
    expect(setVolume({ weight: '82,5', reps: '8' })).toBe(660);
  });

  it('devolve 0 quando falta carga ou reps, nunca NaN', () => {
    expect(setVolume({ weight: '80', reps: '' })).toBe(0);
    expect(setVolume({ weight: '', reps: '10' })).toBe(0);
    expect(setVolume({})).toBe(0);
    expect(setVolume(null)).toBe(0);
  });

  it('devolve 0 para carga ou reps zero/negativos', () => {
    expect(setVolume({ weight: '0', reps: '10' })).toBe(0);
    expect(setVolume({ weight: '80', reps: '0' })).toBe(0);
  });
});

describe('sessionVolume', () => {
  it('soma apenas séries concluídas', () => {
    const sets = [
      { weight: '80', reps: '10', isDone: true },
      { weight: '100', reps: '5', isDone: false },
      { weight: '60', reps: '10', isDone: true }
    ];
    expect(sessionVolume(sets)).toBe(1400);
  });

  it('devolve 0 para sessão vazia', () => {
    expect(sessionVolume([])).toBe(0);
    expect(sessionVolume()).toBe(0);
  });
});

describe('sessionSetStats', () => {
  it('conta séries totais, concluídas, com volume e exercícios únicos', () => {
    const sets = [
      { exerciseId: 'supino', weight: '80', reps: '10', isDone: true },
      { exerciseId: 'supino', weight: '80', reps: '10', isDone: true },
      { exerciseId: 'triceps', weight: '30', reps: '12', isDone: true },
      { exerciseId: 'corrida', weight: '', reps: '30', isDone: false }
    ];

    const stats = sessionSetStats(sets);
    expect(stats.totalSets).toBe(4);
    expect(stats.doneSets).toBe(3);
    expect(stats.volumeSets).toBe(3);
    expect(stats.uniqueExercises).toBe(2);
    expect(stats.volume).toBe(80 * 10 * 2 + 30 * 12);
  });

  it('não conta exercício sem id para uniques', () => {
    const stats = sessionSetStats([{ weight: '10', reps: '10', isDone: true }]);
    expect(stats.uniqueExercises).toBe(0);
  });
});

describe('sessionDurationMinutes', () => {
  it('calcula a duração entre início e fim', () => {
    const session = {
      startedAt: '2026-03-10T10:00:00.000Z',
      finishedAt: '2026-03-10T10:45:00.000Z'
    };
    expect(sessionDurationMinutes(session)).toBe(45);
  });

  it('usa a última série quando a sessão ainda está aberta', () => {
    const session = { startedAt: '2026-03-10T10:00:00.000Z', finishedAt: null };
    const sets = [{ recordedAt: '2026-03-10T10:30:00.000Z' }];
    expect(sessionDurationMinutes(session, sets)).toBe(30);
  });

  it('ignora séries registradas antes do início da sessão', () => {
    const session = { startedAt: '2026-03-10T10:00:00.000Z', finishedAt: null };
    const sets = [
      { recordedAt: '2026-03-09T09:00:00.000Z' },
      { recordedAt: '2026-03-10T10:20:00.000Z' }
    ];
    expect(sessionDurationMinutes(session, sets)).toBe(20);
  });

  it('devolve null sem startedAt válido', () => {
    expect(sessionDurationMinutes({ startedAt: 'data invalida' })).toBeNull();
    expect(sessionDurationMinutes(null)).toBeNull();
  });

  it('devolve 0 quando fim é anterior ao início', () => {
    const session = { startedAt: '2026-03-10T10:00:00.000Z', finishedAt: '2026-03-10T09:00:00.000Z' };
    expect(sessionDurationMinutes(session)).toBe(0);
  });
});

describe('buildProgression', () => {
  it('ordena da mais antiga para a mais recente', () => {
    const progression = buildProgression([
      { id: 2, startedAt: '2026-03-10T10:00:00.000Z', sets: [{ exerciseId: 'a', weight: '90', reps: '5', isDone: true }] },
      { id: 1, startedAt: '2026-03-03T10:00:00.000Z', sets: [{ exerciseId: 'a', weight: '80', reps: '5', isDone: true }] }
    ]);

    expect(progression.map(p => p.sessionId)).toEqual([1, 2]);
    expect(progression.map(p => p.topWeight)).toEqual([80, 90]);
  });

  it('não altera a array original', () => {
    const input = [
      { id: 2, startedAt: '2026-03-10T10:00:00.000Z', sets: [] },
      { id: 1, startedAt: '2026-03-03T10:00:00.000Z', sets: [] }
    ];
    buildProgression(input);
    expect(input.map(s => s.id)).toEqual([2, 1]);
  });

  it('ignora séries não concluídas ao achar a carga máxima', () => {
    const progression = buildProgression([
      { id: 1, startedAt: '2026-03-03T10:00:00.000Z', sets: [{ weight: '80', reps: '5', isDone: true }, { weight: '200', reps: '5', isDone: false }] }
    ]);
    expect(progression[0].topWeight).toBe(80);
  });

  it('devolve topWeight null em sessão só com aeróbico', () => {
    const progression = buildProgression([
      { id: 1, startedAt: '2026-03-03T10:00:00.000Z', sets: [{ weight: '', reps: '30', isDone: true }] }
    ]);
    expect(progression[0].topWeight).toBeNull();
    expect(progression[0].volume).toBe(0);
  });
});

describe('buildExerciseProgression', () => {
  const SESSIONS = [
    {
      id: 10,
      dayKey: '2026-03-03',
      startedAt: '2026-03-03T10:00:00.000Z',
      sets: [
        { exerciseId: 'supino', weight: '40', reps: '10', isDone: true },
        { exerciseId: 'supino', weight: '36', reps: '8', isDone: true },
        { exerciseId: 'remada', weight: '50', reps: '10', isDone: true }
      ]
    },
    {
      id: 11,
      dayKey: '2026-03-10',
      startedAt: '2026-03-10T10:00:00.000Z',
      sets: [
        { exerciseId: 'supino', weight: '42,5', reps: '10', isDone: true },
        { exerciseId: 'remada', weight: '50', reps: '10', isDone: false }
      ]
    }
  ];

  it('um ponto por sessão com carga do exercício escolhido, em ordem cronológica', () => {
    const points = buildExerciseProgression(SESSIONS, 'supino');
    expect(points.map(p => p.sessionId)).toEqual([10, 11]);
    expect(points.map(p => p.topWeight)).toEqual([40, 42.5]);
    expect(points[0].dayKey).toBe('2026-03-03');
  });

  it('só considera séries concluídas do exercício pedido', () => {
    const points = buildExerciseProgression(SESSIONS, 'remada');
    // A remada da sessão 11 não foi concluída e não pode virar ponto de queda.
    expect(points.map(p => p.sessionId)).toEqual([10]);
    expect(points[0].topWeight).toBe(50);
  });

  it('sessão sem carga (aeróbico) fica de fora do gráfico', () => {
    const points = buildExerciseProgression(
      [{ id: 1, startedAt: '2026-03-03T10:00:00.000Z', sets: [{ exerciseId: 'corrida', weight: '', reps: '20', isDone: true }] }],
      'corrida'
    );
    expect(points).toEqual([]);
  });

  it('exercício sem histórico devolve vazio, e sem exerciseId também', () => {
    expect(buildExerciseProgression(SESSIONS, 'inexistente')).toEqual([]);
    expect(buildExerciseProgression(SESSIONS, null)).toEqual([]);
    expect(buildExerciseProgression([], 'supino')).toEqual([]);
  });
});

describe('loadChangePercent', () => {
  it('calcula o aumento percentual', () => {
    expect(loadChangePercent(80, 88)).toBeCloseTo(10, 5);
  });

  it('calcula a queda percentual', () => {
    expect(loadChangePercent(100, 90)).toBeCloseTo(-10, 5);
  });

  it('trata ruído de arredondamento como 0%', () => {
    expect(loadChangePercent(100.4, 100.5)).toBe(0);
  });

  it('devolve null sem base de comparação', () => {
    expect(loadChangePercent(null, 80)).toBeNull();
    expect(loadChangePercent(80, null)).toBeNull();
    expect(loadChangePercent(0, 80)).toBeNull();
  });
});

describe('formatVolume', () => {
  it('formata com separador pt-BR', () => {
    expect(formatVolume(1234)).toBe('1.234 kg');
  });

  it('abrevia valores grandes', () => {
    expect(formatVolume(25000)).toBe('25k kg');
  });

  it('devolve 0 kg para valor ausente', () => {
    expect(formatVolume(null)).toBe('0 kg');
    expect(formatVolume(undefined)).toBe('0 kg');
  });
});

describe('formatDuration', () => {
  it('formata minutos', () => {
    expect(formatDuration(45)).toBe('45 min');
  });

  it('formata horas exatas', () => {
    expect(formatDuration(120)).toBe('2h');
  });

  it('formata horas com resto', () => {
    expect(formatDuration(135)).toBe('2h 15');
  });

  it('devolve travessão para duração desconhecida', () => {
    expect(formatDuration(null)).toBe('—');
  });
});

describe('formatDayKey', () => {
  it('formata a data em pt-BR', () => {
    expect(formatDayKey('2026-03-14')).toBe('14 mar 2026');
  });

  it('formata janeiro e dezembro', () => {
    expect(formatDayKey('2026-01-05')).toBe('5 jan 2026');
    expect(formatDayKey('2026-12-25')).toBe('25 dez 2026');
  });

  it('não volta um dia por causa de parsing UTC', () => {
    // new Date('2026-03-14') é meia-noite UTC, que é 14/03 21:00 no dia anterior
    // em fusos negativos. A formatação por regex evita esse deslocamento.
    expect(formatDayKey('2026-03-14')).toContain('14');
    expect(formatDayKey('2026-03-14')).not.toContain('13');
  });

  it('devolve travessão para entrada inválida', () => {
    expect(formatDayKey('14/03/2026')).toBe('—');
    expect(formatDayKey('')).toBe('—');
    expect(formatDayKey(null)).toBe('—');
  });
});

describe('summarizeByWeek', () => {
  const sessions = [
    { id: 1, weekKey: '2026-W10', dayKey: '2026-03-09', startedAt: '2026-03-09T10:00:00.000Z', sets: [{ exerciseId: 'a', weight: '80', reps: '10', isDone: true }] },
    { id: 2, weekKey: '2026-W10', dayKey: '2026-03-11', startedAt: '2026-03-11T10:00:00.000Z', sets: [{ exerciseId: 'a', weight: '80', reps: '5', isDone: true }] },
    { id: 3, weekKey: '2026-W11', dayKey: '2026-03-16', startedAt: '2026-03-16T10:00:00.000Z', sets: [{ exerciseId: 'b', weight: '60', reps: '10', isDone: true }] }
  ];

  it('agrupa por semana com sessões, volume e dias distintos', () => {
    const weeks = summarizeByWeek(sessions);

    expect(weeks).toHaveLength(2);
    expect(weeks[0]).toMatchObject({ weekKey: '2026-W10', sessions: 2, volume: 1200, doneSets: 2, days: 2 });
    expect(weeks[1]).toMatchObject({ weekKey: '2026-W11', sessions: 1, volume: 600, days: 1 });
  });

  it('ordena da semana mais antiga para a mais recente', () => {
    expect(summarizeByWeek(sessions).map(w => w.weekKey)).toEqual(['2026-W10', '2026-W11']);
  });

  it('conta o mesmo dia só uma vez em dias distintos', () => {
    const sameDay = [
      { id: 1, weekKey: '2026-W10', dayKey: '2026-03-09', sets: [{ exerciseId: 'a', weight: '80', reps: '10', isDone: true }] },
      { id: 2, weekKey: '2026-W10', dayKey: '2026-03-09', sets: [{ exerciseId: 'b', weight: '80', reps: '10', isDone: true }] }
    ];

    expect(summarizeByWeek(sameDay)[0].days).toBe(1);
    expect(summarizeByWeek(sameDay)[0].sessions).toBe(2);
  });

  it('ignora sessão sem weekKey', () => {
    expect(summarizeByWeek([{ id: 1, dayKey: '2026-03-09', sets: [] }])).toHaveLength(0);
  });
});