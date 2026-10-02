import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { TreinoDatabase, getDayKey } from '../../src/db/index.js';
import {
  buildSetId,
  findOpenSession,
  openSession,
  recordSet,
  closeSession,
  getSetsForSession,
  listSessions,
  getLastSetForExercise,
  getLastSetsForExercises,
  getOpenSessionIds,
  getExerciseTimeline,
  deleteSession
} from '../../src/db/sessions.js';

let created = [];
let original;
let dbCounter = 0;

function freshDatabase() {
  const db = new TreinoDatabase(`TreinoSessionsTestDB-${++dbCounter}`);
  created.push(db);
  return { db, now: new Date(2026, 2, 14, 10, 0, 0) };
}

beforeEach(() => {
  original = globalThis.indexedDB;
  globalThis.indexedDB = new IDBFactory();
});

afterEach(async () => {
  for (const db of created) {
    try { db.close(); } catch { /* já fechada */ }
  }
  created = [];
  globalThis.indexedDB = original;
});

describe('buildSetId', () => {
  it('combina sessão e exercício em uma chave estável', () => {
    expect(buildSetId(7, 'supino_reto_barra')).toBe('7:supino_reto_barra');
  });

  it('gera chaves diferentes para exercícios diferentes na mesma sessão', () => {
    expect(buildSetId(7, 'supino')).not.toBe(buildSetId(7, 'cruzeiro'));
  });
});

describe('openSession', () => {
  it('cria uma sessão com dayKey, weekKey e startedAt', async () => {
    const { db, now } = freshDatabase();
    const session = await openSession('treino-a', { database: db, now });

    expect(session.id).toBeDefined();
    expect(session.splitId).toBe('treino-a');
    expect(session.dayKey).toBe('2026-03-14');
    expect(session.weekKey).toMatch(/^\d{4}-W\d{2}$/);
    expect(session.finishedAt).toBeNull();
    expect(session.source).toBe('live');
  });

  it('reaproveita a sessão aberta em vez de criar outra', async () => {
    const { db, now } = freshDatabase();
    const first = await openSession('treino-a', { database: db, now });
    const second = await openSession('treino-a', { database: db, now });

    expect(second.id).toBe(first.id);
    expect(await db.workout_sessions.count()).toBe(1);
  });

  it('cria sessões separadas para splits diferentes', async () => {
    const { db, now } = freshDatabase();
    const a = await openSession('treino-a', { database: db, now });
    const b = await openSession('treino-b', { database: db, now });

    expect(a.id).not.toBe(b.id);
    expect(await db.workout_sessions.count()).toBe(2);
  });

  it('cria uma nova sessão no dia seguinte, fechando a anterior', async () => {
    const { db, now } = freshDatabase();
    const yesterday = new Date(2026, 2, 13, 10, 0, 0);
    const today = new Date(2026, 2, 14, 10, 0, 0);

    const first = await openSession('treino-a', { database: db, now: yesterday });
    const second = await openSession('treino-a', { database: db, now: today });

    expect(second.id).not.toBe(first.id);

    const closed = await db.workout_sessions.get(first.id);
    expect(closed.finishedAt).not.toBeNull();
    expect(closed.dayKey).toBe('2026-03-13');
  });

  it('fecha sessões antigas do mesmo dia quando uma nova é aberta', async () => {
    const { db, now } = freshDatabase();
    const first = await openSession('treino-a', { database: db, now });
    await closeSession(first.id, { database: db, now });

    const second = await openSession('treino-a', { database: db, now });

    expect(second.id).not.toBe(first.id);
    expect(await db.workout_sessions.count()).toBe(2);
  });
});

describe('findOpenSession', () => {
  it('devolve null quando não há sessão do split no dia', async () => {
    const { db, now } = freshDatabase();
    expect(await findOpenSession('treino-a', { database: db, now })).toBeNull();
  });

  it('ignora sessão já finalizada', async () => {
    const { db, now } = freshDatabase();
    const session = await openSession('treino-a', { database: db, now });
    await closeSession(session.id, { database: db, now });

    expect(await findOpenSession('treino-a', { database: db, now })).toBeNull();
  });
});

describe('recordSet', () => {
  it('abre a sessão e grava a série na primeira chamada', async () => {
    const { db, now } = freshDatabase();
    const sessionId = await recordSet(
      { splitId: 'treino-a', exerciseId: 'supino', weight: '80', reps: '10', isDone: true },
      { database: db, now }
    );

    expect(sessionId).toBeDefined();
    const sets = await getSetsForSession(sessionId, { database: db });
    expect(sets).toHaveLength(1);
    expect(sets[0]).toMatchObject({ exerciseId: 'supino', weight: '80', reps: '10', isDone: true });
  });

  it('sobrescreve em vez de duplicar quando o mesmo exercício é editado de novo', async () => {
    const { db, now } = freshDatabase();
    await recordSet({ splitId: 'treino-a', exerciseId: 'supino', weight: '80', reps: '10', isDone: true }, { database: db, now });
    await recordSet({ splitId: 'treino-a', exerciseId: 'supino', weight: '85', reps: '8', isDone: true }, { database: db, now });

    const sets = await db.session_sets.toArray();
    expect(sets).toHaveLength(1);
    expect(sets[0].weight).toBe('85');
  });

  it('aceita reescrever um campo preservando os outros', async () => {
    const { db, now } = freshDatabase();
    const sessionId = await recordSet(
      { splitId: 'treino-a', exerciseId: 'supino', weight: '80', reps: '10', isDone: true },
      { database: db, now }
    );
    await recordSet({ splitId: 'treino-a', exerciseId: 'supino', weight: '', reps: '12', isDone: true }, { database: db, now });

    const sets = await getSetsForSession(sessionId, { database: db });
    expect(sets[0].reps).toBe('12');
    expect(sets[0].weight).toBe('');
  });

  it('aceita um sessionId explícito sem reabrir sessão', async () => {
    const { db, now } = freshDatabase();
    const session = await openSession('treino-a', { database: db, now });
    await closeSession(session.id, { database: db, now });

    const used = await recordSet(
      { splitId: 'treino-b', exerciseId: 'agachamento', sessionId: session.id },
      { database: db, now }
    );

    expect(used).toBe(session.id);
    expect(await db.workout_sessions.count()).toBe(1);
  });

  it('ignora chamadas sem splitId ou exerciseId', async () => {
    const { db, now } = freshDatabase();
    expect(await recordSet({ splitId: null, exerciseId: 'supino' }, { database: db, now })).toBeNull();
    expect(await recordSet({ splitId: 'treino-a', exerciseId: null }, { database: db, now })).toBeNull();
    expect(await db.session_sets.count()).toBe(0);
  });
});

describe('consultas de histórico', () => {
  it('listSessions ordena da mais recente para a mais antiga', async () => {
    const { db } = freshDatabase();
    const old = new Date(2026, 1, 10, 9, 0, 0);
    const recent = new Date(2026, 2, 12, 9, 0, 0);

    await recordSet({ splitId: 'treino-a', exerciseId: 'a' }, { database: db, now: old });
    await recordSet({ splitId: 'treino-a', exerciseId: 'b' }, { database: db, now: recent });

    const sessions = await listSessions({ database: db });
    expect(sessions.map(s => s.dayKey)).toEqual(['2026-03-12', '2026-02-10']);
  });

  it('listSessions com includeSets anexa as séries', async () => {
    const { db, now } = freshDatabase();
    await recordSet({ splitId: 'treino-a', exerciseId: 'supino', weight: '80', reps: '10' }, { database: db, now });

    const withSets = await listSessions({ includeSets: true, database: db });
    expect(withSets[0].sets).toHaveLength(1);
    expect(withSets[0].sets[0].exerciseId).toBe('supino');
  });

  it('listSessions sem includeSets não consulta as séries', async () => {
    const { db, now } = freshDatabase();
    await recordSet({ splitId: 'treino-a', exerciseId: 'supino' }, { database: db, now });

    const sessions = await listSessions({ database: db });
    expect(sessions[0].sets).toBeUndefined();
  });

  it('respeita o limite de sessões', async () => {
    const { db } = freshDatabase();
    for (let day = 1; day <= 5; day++) {
      await recordSet(
        { splitId: 'treino-a', exerciseId: `ex${day}` },
        { database: db, now: new Date(2026, 2, day, 10, 0, 0) }
      );
    }

    expect(await listSessions({ database: db })).toHaveLength(5);
    expect(await listSessions({ limit: 2, database: db })).toHaveLength(2);
  });

  it('getLastSetForExercise devolve a série mais recente', async () => {
    const { db } = freshDatabase();
    await recordSet(
      { splitId: 'treino-a', exerciseId: 'supino', weight: '60' },
      { database: db, now: new Date(2026, 1, 10, 9, 0, 0) }
    );
    await recordSet(
      { splitId: 'treino-a', exerciseId: 'supino', weight: '70' },
      { database: db, now: new Date(2026, 2, 10, 9, 0, 0) }
    );

    const last = await getLastSetForExercise('supino', { database: db });
    expect(last.weight).toBe('70');
  });

  it('getLastSetForExercise devolve null para exercício nunca registrado', async () => {
    const { db } = freshDatabase();
    expect(await getLastSetForExercise('inexistente', { database: db })).toBeNull();
  });

  it('getLastSetsForExercises devolve a projeção mais recente por exercício', async () => {
    const { db } = freshDatabase();
    await recordSet(
      { splitId: 'treino-a', exerciseId: 'supino', weight: '60' },
      { database: db, now: new Date(2026, 1, 10, 9, 0, 0) }
    );
    await recordSet(
      { splitId: 'treino-a', exerciseId: 'supino', weight: '75' },
      { database: db, now: new Date(2026, 2, 10, 9, 0, 0) }
    );
    await recordSet(
      { splitId: 'treino-b', exerciseId: 'agachamento', weight: '100' },
      { database: db, now: new Date(2026, 2, 11, 9, 0, 0) }
    );

    const map = await getLastSetsForExercises(['supino', 'agachamento'], { database: db });
    expect(map.supino.weight).toBe('75');
    expect(map.agachamento.weight).toBe('100');
  });

  it('getLastSetsForExercises aceita lista vazia', async () => {
    const { db } = freshDatabase();
    expect(await getLastSetsForExercises([], { database: db })).toEqual({});
    expect(await getLastSetsForExercises(null, { database: db })).toEqual({});
  });

  it('getLastSetsForExercises ignora as séries da sessão excluída', async () => {
    const { db } = freshDatabase();
    const antiga = await recordSet(
      { splitId: 'treino-a', exerciseId: 'supino', weight: '70' },
      { database: db, now: new Date(2026, 1, 10, 9, 0, 0) }
    );
    const atual = await recordSet(
      { splitId: 'treino-a', exerciseId: 'supino', weight: '85' },
      { database: db, now: new Date(2026, 2, 10, 9, 0, 0) }
    );

    const map = await getLastSetsForExercises(['supino'], { excludeSessionIds: [atual], database: db });
    expect(map.supino.weight).toBe('70');
  });

  it('getLastSetsForExercises devolve vazio se tudo está na sessão excluída', async () => {
    const { db, now } = freshDatabase();
    const atual = await recordSet(
      { splitId: 'treino-a', exerciseId: 'supino', weight: '85' },
      { database: db, now }
    );

    expect(await getLastSetsForExercises(['supino'], { excludeSessionIds: [atual], database: db })).toEqual({});
  });

  it('getLastSetsForExercises ignora null e undefined na lista de exclusão', async () => {
    const { db, now } = freshDatabase();
    await recordSet({ splitId: 'treino-a', exerciseId: 'supino', weight: '85' }, { database: db, now });

    const map = await getLastSetsForExercises(['supino'], { excludeSessionIds: [null, undefined], database: db });
    expect(map.supino.weight).toBe('85');
  });

  it('getOpenSessionIds devolve só as sessões abertas de hoje', async () => {
    const { db } = freshDatabase();
    const hoje = new Date(2026, 2, 14, 10, 0, 0);

    const aberta = await recordSet({ splitId: 'treino-a', exerciseId: 'a' }, { database: db, now: hoje });
    const encerrada = await recordSet(
      { splitId: 'treino-b', exerciseId: 'b' },
      { database: db, now: hoje }
    );
    await closeSession(encerrada, { database: db, now: hoje });

    const ontem = await recordSet(
      { splitId: 'treino-a', exerciseId: 'antigo' },
      { database: db, now: new Date(2026, 2, 13, 10, 0, 0) }
    );
    expect(ontem).not.toBe(aberta);

    expect(await getOpenSessionIds({ database: db, now: hoje })).toEqual([aberta]);
  });

  it('getExerciseTimeline devolve as séries em ordem cronológica', async () => {
    const { db } = freshDatabase();
    await recordSet(
      { splitId: 'treino-a', exerciseId: 'supino', weight: '90' },
      { database: db, now: new Date(2026, 2, 10, 9, 0, 0) }
    );
    await recordSet(
      { splitId: 'treino-a', exerciseId: 'supino', weight: '80' },
      { database: db, now: new Date(2026, 1, 10, 9, 0, 0) }
    );

    const timeline = await getExerciseTimeline('supino', { database: db });
    expect(timeline.map(s => s.weight)).toEqual(['80', '90']);
  });
});

describe('deleteSession', () => {
  it('remove a sessão e as séries dela', async () => {
    const { db, now } = freshDatabase();
    const sessionId = await recordSet(
      { splitId: 'treino-a', exerciseId: 'supino', weight: '80' },
      { database: db, now }
    );

    await deleteSession(sessionId, { database: db });

    expect(await db.workout_sessions.count()).toBe(0);
    expect(await db.session_sets.count()).toBe(0);
  });

  it('não apaga séries de outras sessões', async () => {
    const { db } = freshDatabase();
    await recordSet(
      { splitId: 'treino-a', exerciseId: 'a' },
      { database: db, now: new Date(2026, 1, 10, 9, 0, 0) }
    );
    const target = await recordSet(
      { splitId: 'treino-b', exerciseId: 'b' },
      { database: db, now: new Date(2026, 2, 10, 9, 0, 0) }
    );

    await deleteSession(target, { database: db });

    expect(await db.session_sets.count()).toBe(1);
    expect((await db.session_sets.toArray())[0].exerciseId).toBe('a');
  });
});

describe('getDayKey', () => {
  it('usa a data local, não a UTC', () => {
    // 23h30 no Brasil é 02h30 do dia seguinte em UTC. new Date().toISOString()
    // cortaria o dia; o dayKey local preserva a intenção.
    const lateNight = new Date(2026, 2, 14, 23, 30, 0);
    expect(getDayKey(lateNight)).toBe('2026-03-14');
  });

  it('formata meses e dias com dois dígitos', () => {
    expect(getDayKey(new Date(2026, 0, 5, 12, 0, 0))).toBe('2026-01-05');
  });
});