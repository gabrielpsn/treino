import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import {
  TreinoDatabase,
  migrateLegacyWeeklyChecks,
  migrateLegacyLogsToSession,
  getCurrentWeekKey,
  getDayKey,
  buildWeekCheckId,
  LEGACY_SESSION_SOURCE
} from '../../src/db/index.js';

let created = [];
let original;

let dbCounter = 0;

// Cada teste recebe um banco novo: o Dexie reaproveita o handle por nome,
// então reutilizar "TreinoProDB" faria o estado vazar entre casos.
function freshDatabase() {
  const db = new TreinoDatabase(`TreinoProTestDB-${++dbCounter}`);
  created.push(db);
  return { db, migrateLegacyWeeklyChecks, migrateLegacyLogsToSession, getCurrentWeekKey, getDayKey, buildWeekCheckId, LEGACY_SESSION_SOURCE };
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

describe('getCurrentWeekKey', () => {
  it('devolve uma chave no formato YYYY-Www', async () => {
    const { getCurrentWeekKey } = freshDatabase();
    expect(getCurrentWeekKey()).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('devolve a mesma chave dentro da mesma semana ISO', async () => {
    const { getCurrentWeekKey } = freshDatabase();
    // Quarta e quinta-cauda caem na mesma semana ISO.
    const wednesday = new Date(2026, 0, 7);
    const thursday = new Date(2026, 0, 8);
    expect(getCurrentWeekKey(wednesday)).toBe(getCurrentWeekKey(thursday));
  });

  it('muda de chave quando cruza a virada de semana', async () => {
    const { getCurrentWeekKey } = freshDatabase();
    const sunday = new Date(2026, 0, 11);
    const nextMonday = new Date(2026, 0, 12);
    expect(getCurrentWeekKey(sunday)).not.toBe(getCurrentWeekKey(nextMonday));
  });

  it('não é afetada pelo fuso: usa UTC internamente', async () => {
    const { getCurrentWeekKey } = freshDatabase();
    // Duas datas locais muito próximas no mesmo dia podem cair em dias UTC
    // diferentes; a chave deve reflects o dia local informado, não "agora".
    expect(getCurrentWeekKey(new Date(2026, 6, 15))).toMatch(/^2026-W\d{2}$/);
  });
});

describe('buildWeekCheckId', () => {
  it('incorpora a semana e o dia no id', async () => {
    const { buildWeekCheckId } = freshDatabase();
    expect(buildWeekCheckId('seg', '2026-W03')).toBe('week:2026-W03:seg');
  });

  it('gera ids distintos para o mesmo dia em semanas diferentes', async () => {
    const { buildWeekCheckId } = freshDatabase();
    expect(buildWeekCheckId('seg', '2026-W03')).not.toBe(buildWeekCheckId('seg', '2026-W04'));
  });
});

describe('migrateLegacyWeeklyChecks', () => {
  it('reescreve registros antigos sem weekKey para a chave da semana atual', async () => {
    const { db, migrateLegacyWeeklyChecks, getCurrentWeekKey } = freshDatabase();

    await db.weekly_checks.put({ id: 'seg', done: true });
    await db.weekly_checks.put({ id: 'ter', done: false });

    const migrated = await migrateLegacyWeeklyChecks(db);
    expect(migrated).toBe(2);

    const rows = await db.weekly_checks.toArray();
    expect(rows.length).toBe(2);

    const weekKey = getCurrentWeekKey();
    for (const row of rows) {
      expect(row.weekKey).toBe(weekKey);
      expect(row.id).toBe(`week:${weekKey}:${row.dayId}`);
    }

    const oldRows = await db.weekly_checks.toArray();
    expect(oldRows.some(r => r.id === 'seg')).toBe(false);
  });

  it('preserva o valor done durante a migração', async () => {
    const { db, migrateLegacyWeeklyChecks } = freshDatabase();
    await db.weekly_checks.put({ id: 'seg', done: true });
    await db.weekly_checks.put({ id: 'qua', done: false });

    await migrateLegacyWeeklyChecks(db);

    const rows = await db.weekly_checks.toArray();
    const byDay = Object.fromEntries(rows.map(r => [r.dayId, r.done]));
    expect(byDay.seg).toBe(true);
    expect(byDay.wa).toBeUndefined();
    expect(byDay.qua).toBe(false);
  });

  it('é idempotente: rodar duas vezes não duplica nem renomeia', async () => {
    const { db, migrateLegacyWeeklyChecks } = freshDatabase();
    await db.weekly_checks.put({ id: 'seg', done: true });

    expect(await migrateLegacyWeeklyChecks(db)).toBe(1);
    expect(await migrateLegacyWeeklyChecks(db)).toBe(0);

    const rows = await db.weekly_checks.toArray();
    expect(rows.length).toBe(1);
  });

  it('não mexe em registros que já estão no formato novo', async () => {
    const { db, migrateLegacyWeeklyChecks, buildWeekCheckId } = freshDatabase();
    const futureWeek = '2099-W01';
    const id = buildWeekCheckId('seg', futureWeek);
    await db.weekly_checks.put({ id, weekKey: futureWeek, dayId: 'seg', done: true });

    expect(await migrateLegacyWeeklyChecks(db)).toBe(0);

    const rows = await db.weekly_checks.toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(id);
    expect(rows[0].weekKey).toBe(futureWeek);
  });

  it('não colide com registro novo do mesmo dia quando ambos existem', async () => {
    const { db, migrateLegacyWeeklyChecks, getCurrentWeekKey, buildWeekCheckId } = freshDatabase();
    const weekKey = getCurrentWeekKey();

    await db.weekly_checks.put({ id: 'seg', done: false });
    await db.weekly_checks.put({ id: buildWeekCheckId('seg', weekKey), weekKey, dayId: 'seg', done: true });

    await migrateLegacyWeeklyChecks(db);

    const rows = await db.weekly_checks.toArray();
    expect(rows).toHaveLength(1);
    // O registro no formato novo (done: true) deve prevalecer.
    expect(rows[0].done).toBe(true);
  });

  it('funciona com a base vazia', async () => {
    const { db, migrateLegacyWeeklyChecks } = freshDatabase();
    expect(await migrateLegacyWeeklyChecks(db)).toBe(0);
  });
});

describe('consulta por weekKey', () => {
  it('permite ler só os dias da semana corrente', async () => {
    const { db, buildWeekCheckId } = freshDatabase();

    await db.weekly_checks.put({ id: buildWeekCheckId('seg', '2026-W03'), weekKey: '2026-W03', dayId: 'seg', done: true });
    await db.weekly_checks.put({ id: buildWeekCheckId('seg', '2026-W04'), weekKey: '2026-W04', dayId: 'seg', done: false });

    const current = await db.weekly_checks.where('weekKey').equals('2026-W03').toArray();
    expect(current).toHaveLength(1);
    expect(current[0].done).toBe(true);
  });
});

describe('schema v3: sessões de treino', () => {
  it('cria as tabelas de histórico em uma base nova', async () => {
    const { db } = freshDatabase();

    expect(db.tables.map(t => t.name)).toEqual(
      expect.arrayContaining(['workout_sessions', 'session_sets'])
    );
  });

  it('mantém as tabelas do schema anterior', async () => {
    const { db } = freshDatabase();

    expect(db.tables.map(t => t.name)).toEqual(
      expect.arrayContaining(['user_profile', 'active_plan', 'workout_logs', 'weekly_checks', 'custom_exercises'])
    );
  });
});

describe('migrateLegacyLogsToSession', () => {
  async function seedLegacyLogs(db) {
    await db.workout_logs.put({
      id: 'supino',
      exerciseId: 'supino',
      workoutId: 'treino-a',
      weight: '80',
      reps: '10',
      isDone: true,
      updatedAt: '2026-03-01T10:00:00.000Z'
    });
    await db.workout_logs.put({
      id: 'agachamento',
      exerciseId: 'agachamento',
      workoutId: 'treino-b',
      weight: '100',
      reps: '5',
      isDone: false,
      updatedAt: '2026-03-02T10:00:00.000Z'
    });
  }

  it('não faz nada quando não há logs antigos', async () => {
    const { db, migrateLegacyLogsToSession } = freshDatabase();

    expect(await migrateLegacyLogsToSession(db)).toBeNull();
    expect(await db.workout_sessions.count()).toBe(0);
  });

  it('converte os logs em uma sessão com uma série por exercício', async () => {
    const { db, migrateLegacyLogsToSession } = freshDatabase();
    await seedLegacyLogs(db);

    const sessionId = await migrateLegacyLogsToSession(db);
    expect(sessionId).toBeDefined();

    expect(await db.workout_sessions.count()).toBe(1);

    const sets = await db.session_sets.where('sessionId').equals(sessionId).toArray();
    expect(sets).toHaveLength(2);
    expect(sets.map(s => s.exerciseId).sort()).toEqual(['agachamento', 'supino']);
  });

  it('preserva carga, reps, conclusão e timestamp de cada série', async () => {
    const { db, migrateLegacyLogsToSession } = freshDatabase();
    await seedLegacyLogs(db);

    const sessionId = await migrateLegacyLogsToSession(db);
    const sets = await db.session_sets.where('sessionId').equals(sessionId).toArray();
    const supino = sets.find(s => s.exerciseId === 'supino');

    expect(supino.weight).toBe('80');
    expect(supino.reps).toBe('10');
    expect(supino.isDone).toBe(true);
    expect(supino.recordedAt).toBe('2026-03-01T10:00:00.000Z');
  });

  it('não apaga os workout_logs, que continuam sendo o estado atual', async () => {
    const { db, migrateLegacyLogsToSession } = freshDatabase();
    await seedLegacyLogs(db);

    await migrateLegacyLogsToSession(db);

    expect(await db.workout_logs.count()).toBe(2);
    expect(await db.workout_logs.get('supino')).toMatchObject({ weight: '80', isDone: true });
  });

  it('marca a sessão com o source da migração', async () => {
    const { db, migrateLegacyLogsToSession, LEGACY_SESSION_SOURCE } = freshDatabase();
    await seedLegacyLogs(db);

    const sessionId = await migrateLegacyLogsToSession(db);
    const session = await db.workout_sessions.get(sessionId);

    expect(session.source).toBe(LEGACY_SESSION_SOURCE);
    expect(session.finishedAt).not.toBeNull();
  });

  it('é idempotente: rodar duas vezes não duplica as séries', async () => {
    const { db, migrateLegacyLogsToSession } = freshDatabase();
    await seedLegacyLogs(db);

    expect(await migrateLegacyLogsToSession(db)).toBeDefined();
    expect(await migrateLegacyLogsToSession(db)).toBeNull();

    expect(await db.workout_sessions.count()).toBe(1);
    expect(await db.session_sets.count()).toBe(2);
  });

  it('não migra logs quando já existe sessão criada pelo app', async () => {
    const { db, migrateLegacyLogsToSession } = freshDatabase();
    await seedLegacyLogs(db);
    await db.workout_sessions.add({
      dayKey: '2026-03-10',
      weekKey: '2026-W11',
      startedAt: '2026-03-10T10:00:00.000Z',
      finishedAt: null,
      splitId: 'treino-a',
      source: 'live'
    });

    // Com sessão "live" presente, os logs estão sendo mantidos em paralelo e
    // migrá-los criaria um treino duplicado a cada abertura do app.
    expect(await migrateLegacyLogsToSession(db)).toBeNull();
    expect(await db.workout_sessions.count()).toBe(1);
    expect(await db.session_sets.count()).toBe(0);
  });

  it('normaliza isDone ausente para false', async () => {
    const { db, migrateLegacyLogsToSession } = freshDatabase();
    await db.workout_logs.put({ id: 'corrida', exerciseId: 'corrida', workoutId: 'cardio', weight: '', reps: '30' });

    const sessionId = await migrateLegacyLogsToSession(db);
    const sets = await db.session_sets.where('sessionId').equals(sessionId).toArray();

    expect(sets[0].isDone).toBe(false);
  });

  it('funciona com carga e reps ausentes', async () => {
    const { db, migrateLegacyLogsToSession } = freshDatabase();
    await db.workout_logs.put({ id: 'corrida', exerciseId: 'corrida', workoutId: 'cardio' });

    const sessionId = await migrateLegacyLogsToSession(db);
    const sets = await db.session_sets.where('sessionId').equals(sessionId).toArray();

    expect(sets[0].weight).toBe('');
    expect(sets[0].reps).toBe('');
  });
});