import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { TreinoDatabase } from '../../src/db/index.js';
import { openSession, recordSet, closeSession } from '../../src/db/sessions.js';
import { saveCustomExercise } from '../../src/db/customExercises.js';
import {
  BACKUP_KIND,
  BACKUP_VERSION,
  PROFILE_ID,
  PLAN_ID,
  buildBackup,
  backupFileName,
  summarizeBackup,
  parseBackupText,
  restoreBackup,
  hasBackupData
} from '../../src/db/backup.js';
import { EXERCISE_CATALOG } from '../../src/engine/knowledge/exercises.js';

let created = [];
let original;
let dbCounter = 0;

function freshDatabase() {
  const database = new TreinoDatabase(`TreinoBackupTestDB-${++dbCounter}`);
  created.push(database);
  return database;
}

beforeEach(() => {
  original = globalThis.indexedDB;
  globalThis.indexedDB = new IDBFactory();
});

afterEach(async () => {
  for (const database of created) {
    try { database.close(); } catch { /* já fechada */ }
  }
  created = [];
  globalThis.indexedDB = original;
});

const profile = {
  userName: 'Ana',
  goal: 'hypertrophy',
  gender: 'female',
  ageYears: 30,
  weightKg: 68,
  heightCm: 168,
  daysPerWeek: 4,
  experienceLevel: 'intermediate',
  equipment: 'gym',
  restrictions: []
};

function chestExercise(id = 'supino_reto_halteres') {
  return EXERCISE_CATALOG.find(ex => ex.id === id);
}

async function seed(database, overrides = {}) {
  await database.user_profile.put({ id: PROFILE_ID, ...profile, ...overrides.profile });
  await database.active_plan.put({
    id: PLAN_ID,
    generatedAt: '2026-03-01T10:00:00.000Z',
    dietPlan: { kcal: 2200 },
    workoutSplits: [
      {
        id: 'treino-a',
        title: 'Treino A',
        exercises: [chestExercise(), { ...chestExercise('crucifixo_halteres') }]
      }
    ]
  });

  await saveCustomExercise({
    name: 'Supino na Arquinha',
    muscle: 'peito',
    pattern: 'push_horizontal',
    equipment: 'gym_or_home',
    jointStress: [],
    defaultSeries: '4x 8',
    rest: '75s',
    tips: 'Travessa na porta.'
  }, { database });

  await database.workout_logs.put({
    id: 'supino_reto_halteres',
    exerciseId: 'supino_reto_halteres',
    workoutId: 'treino-a',
    weight: 60,
    reps: '8',
    isDone: true,
    updatedAt: '2026-03-02T10:00:00.000Z'
  });

  await database.weekly_checks.put({
    id: 'week:2026-W09:seg',
    weekKey: '2026-W09',
    dayId: 'seg'
  });

  const now = new Date(2026, 2, 3, 18, 0, 0);
  const session = await openSession('treino-a', { database, now });
  await recordSet(
    { splitId: 'treino-a', exerciseId: 'supino_reto_halteres', weight: 62.5, reps: '8', isDone: true },
    { database, now }
  );
  await closeSession(session.id, { database, now: new Date(2026, 2, 3, 19, 0, 0) });

  return { sessionId: session.id, now };
}

describe('buildBackup', () => {
  it('inclui tudo que o usuário criou, inclusive exercícios próprios', async () => {
    const database = freshDatabase();
    await seed(database);

    const backup = await buildBackup({
      database,
      // Data em UTC: `toISOString` converte para UTC e o fuso da máquina não
      // pode decidir o resultado da asserção.
      now: new Date(Date.UTC(2026, 2, 10, 12, 0, 0))
    });

    expect(backup.kind).toBe(BACKUP_KIND);
    expect(backup.version).toBe(BACKUP_VERSION);
    expect(backup.exportedAt).toBe('2026-03-10T12:00:00.000Z');
    expect(backup.userProfile.userName).toBe('Ana');
    expect(backup.activePlan.workoutSplits).toHaveLength(1);
    expect(backup.customExercises).toHaveLength(1);
    expect(backup.customExercises[0].name).toBe('Supino na Arquinha');
    expect(backup.workoutLogs).toHaveLength(1);
    expect(backup.weeklyChecks).toHaveLength(1);
    expect(backup.sessions).toHaveLength(1);
  });

  it('embute as séries dentro da sessão correspondente', async () => {
    const database = freshDatabase();
    const { sessionId } = await seed(database);

    const backup = await buildBackup({ database });

    expect(backup.sessions[0].id).toBe(sessionId);
    expect(backup.sessions[0].sets).toHaveLength(1);
    expect(backup.sessions[0].sets[0]).toMatchObject({
      sessionId,
      exerciseId: 'supino_reto_halteres',
      weight: 62.5,
      isDone: true
    });
  });

  it('exporta um app sem histórico sem quebrar', async () => {
    const database = freshDatabase();
    const backup = await buildBackup({ database });

    expect(backup.userProfile).toBeNull();
    expect(backup.activePlan).toBeNull();
    expect(backup.sessions).toEqual([]);
    expect(hasBackupData(backup)).toBe(false);
  });

  it('o nome do arquivo usa a data da exportação', () => {
    expect(backupFileName(new Date(2026, 2, 10))).toBe('treino-backup-2026-03-10.json');
  });
});

describe('summarizeBackup', () => {
  it('conta o que será restaurado', async () => {
    const database = freshDatabase();
    await seed(database);
    const backup = await buildBackup({ database });

    expect(summarizeBackup(backup)).toMatchObject({
      userName: 'Ana',
      splits: 1,
      exercises: 2,
      customExercises: 1,
      sessions: 1,
      sets: 1
    });
  });
});

describe('parseBackupText — recusa', () => {
  it('recusa texto que não é JSON', () => {
    const result = parseBackupText('isto não é json');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/JSON/);
  });

  it('recusa array e tipos primitivos', () => {
    expect(parseBackupText('[]').ok).toBe(false);
    expect(parseBackupText('"texto"').ok).toBe(false);
    expect(parseBackupText('null').ok).toBe(false);
  });

  it('recusa objeto que não é backup', () => {
    const result = parseBackupText(JSON.stringify({ foo: 'bar' }));
    expect(result.ok).toBe(false);
  });

  it('recusa backup de versão mais nova', () => {
    const result = parseBackupText(JSON.stringify({
      kind: BACKUP_KIND,
      version: BACKUP_VERSION + 1,
      userProfile: profile
    }));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/mais nova/);
  });

  it('recusa versão não numérica', () => {
    expect(parseBackupText(JSON.stringify({ kind: BACKUP_KIND, version: 'um' })).ok).toBe(false);
  });
});

describe('parseBackupText — arquivo antigo', () => {
  it('aceita o formato sem "kind" e avisa o que não vem junto', () => {
    const result = parseBackupText(JSON.stringify({
      userProfile: profile,
      activePlan: { id: PLAN_ID, workoutSplits: [] },
      workoutLogs: {},
      sessions: []
    }));

    expect(result.ok).toBe(true);
    expect(result.backup.userProfile.userName).toBe('Ana');
    expect(result.warnings.join(' ')).toMatch(/antigo/);
  });

  it('aceita workoutLogs no formato de objeto (mapa exerciseId -> log)', () => {
    const result = parseBackupText(JSON.stringify({
      kind: BACKUP_KIND,
      version: 1,
      userProfile: profile,
      workoutLogs: {
        supino_reto_halteres: { exerciseId: 'supino_reto_halteres', weight: 60, reps: '8' }
      }
    }));

    expect(result.ok).toBe(true);
    expect(result.backup.workoutLogs).toHaveLength(1);
    expect(result.backup.workoutLogs[0].weight).toBe(60);
  });
});

describe('parseBackupText — saneamento', () => {
  it('coage o perfil para os tipos que o app usa', () => {
    const result = parseBackupText(JSON.stringify({
      kind: BACKUP_KIND,
      version: 1,
      userProfile: {
        userName: 'Ana',
        ageYears: '30',
        weightKg: '68,5',
        daysPerWeek: 99,
        heightCm: 5000,
        restrictions: 'joelho',
        campoIndesconhecido: 'nada'
      }
    }));

    const restored = result.backup.userProfile;
    expect(restored.ageYears).toBe(30);
    // "68,5" não é número: cai no mínimo em vez de virar NaN no filtro.
    expect(restored.weightKg).toBe(25);
    expect(restored.daysPerWeek).toBe(7);
    expect(restored.heightCm).toBe(230);
    // restrictions como string quebraria `restrictions.includes(...)` em todo o
    // filtro de segurança: precisa virar lista, e lista vazia aqui.
    expect(restored.restrictions).toEqual([]);
    expect(restored.campoIndesconhecido).toBeUndefined();
    expect(restored.id).toBe(PROFILE_ID);
  });

  it('descarta séries cuja sessão não existe no arquivo', () => {
    const result = parseBackupText(JSON.stringify({
      kind: BACKUP_KIND,
      version: 1,
      sessions: [
        {
          id: 1,
          dayKey: '2026-03-03',
          startedAt: '2026-03-03T18:00:00.000Z',
          finishedAt: '2026-03-03T19:00:00.000Z',
          splitId: 'treino-a',
          sets: [{ sessionId: 1, exerciseId: 'supino_reto_halteres', weight: 60, isDone: true }]
        }
      ],
      sessionSets: [{ sessionId: 999, exerciseId: 'supino_reto_halteres', weight: 100 }]
    }));

    expect(result.backup.sessions[0].sets).toHaveLength(1);
    expect(result.warnings.join(' ')).toMatch(/1 séries sem sessão/);
  });

  it('recalcula o id da série a partir de (sessão, exercício)', () => {
    const result = parseBackupText(JSON.stringify({
      kind: BACKUP_KIND,
      version: 1,
      sessions: [{
        id: 7,
        startedAt: '2026-03-03T18:00:00.000Z',
        sets: [
          { id: 'adulterado', sessionId: 7, exerciseId: 'supino_reto_halteres', isDone: true },
          { id: 'outro', sessionId: 7, exerciseId: 'supino_reto_halteres', isDone: false }
        ]
      }]
    }));

    const sets = result.backup.sessions[0].sets;
    expect(sets.every(s => s.id === '7:supino_reto_halteres')).toBe(true);
    // Duas linhas para o mesmo par viram uma: no banco o id é a chave primária,
    // então as duas não poderiam coexistir de qualquer forma.
    expect(sets).toHaveLength(2);
  });

  it('remove do plano os exercícios que conflitam com o perfil do backup', () => {
    const result = parseBackupText(JSON.stringify({
      kind: BACKUP_KIND,
      version: 1,
      userProfile: { ...profile, restrictions: ['ombro'] },
      activePlan: {
        id: PLAN_ID,
        workoutSplits: [{
          id: 'treino-a',
          title: 'Treino A',
          exercises: [
            { ...chestExercise('desenvolvimento_halteres'), jointStress: ['ombro'] },
            { ...chestExercise('supino_reto_halteres'), jointStress: [] }
          ]
        }]
      }
    }));

    expect(result.backup.activePlan.workoutSplits[0].exercises).toHaveLength(1);
    expect(result.warnings.join(' ')).toMatch(/conflitavam com o perfil/);
  });

  it('recusa exercício próprio que burlaria o filtro articular', () => {
    const result = parseBackupText(JSON.stringify({
      kind: BACKUP_KIND,
      version: 1,
      customExercises: [
        {
          id: 'custom_desenrasque',
          name: 'Desenrasque',
          muscle: 'peito',
          pattern: 'push_horizontal',
          equipment: 'gym_or_home',
          // articulação que nem existe: o app não pode aceitar isso, porque o
          // exercício entraria no catálogo sem nenhuma restrição declarada.
          jointStress: ['pescoco'],
          defaultSeries: '4x 8',
          rest: '60s',
          tips: 'x'
        },
        {
          id: 'custom_valido',
          name: 'Supino na Arquinha',
          muscle: 'peito',
          pattern: 'push_horizontal',
          equipment: 'gym_or_home',
          jointStress: ['ombro'],
          defaultSeries: '4x 8',
          rest: '60s',
          tips: 'x'
        }
      ]
    }));

    expect(result.backup.customExercises).toHaveLength(1);
    expect(result.backup.customExercises[0].id).toBe('custom_valido');
    expect(result.warnings.join(' ')).toMatch(/descartados por serem inválidos/);
  });

  it('não aceita id de exercício de fábrica vindo do arquivo', () => {
    const result = parseBackupText(JSON.stringify({
      kind: BACKUP_KIND,
      version: 1,
      customExercises: [{
        id: 'supino_reto_halteres',
        name: 'Supino Quebrado',
        muscle: 'peito',
        pattern: 'push_horizontal',
        equipment: 'gym_or_home',
        jointStress: [],
        defaultSeries: '4x 8',
        rest: '60s',
        tips: 'x'
      }]
    }));

    // O id é recalculado a partir do nome: um arquivo não pode sequestrar um id
    // do catálogo embutido.
    expect(result.backup.customExercises[0].id).toBe('custom_supino_quebrado');
  });

  it('deduplica exercícios próprios repetidos no arquivo', () => {
    const row = {
      id: 'custom_rep',
      name: 'Supino na Arquinha',
      muscle: 'peito',
      pattern: 'push_horizontal',
      equipment: 'gym_or_home',
      jointStress: [],
      defaultSeries: '4x 8',
      rest: '60s',
      tips: 'x'
    };
    const result = parseBackupText(JSON.stringify({
      kind: BACKUP_KIND,
      version: 1,
      customExercises: [row, { ...row }, { ...row, id: 'custom_outro', name: 'Cadeira Sufocante' }]
    }));

    // O id manda: duas linhas com o mesmo id são o mesmo exercício, mesmo com
    // nomes diferentes — o id é o que liga o histórico de cargas.
    expect(result.backup.customExercises).toHaveLength(2);
    expect(result.backup.customExercises.map(ex => ex.id)).toEqual([
      'custom_rep',
      'custom_outro'
    ]);
    expect(result.warnings.join(' ')).toMatch(/repetidos/);
  });
});

describe('restoreBackup', () => {
  it('substitui todos os dados do aparelho pelos do backup', async () => {
    const source = freshDatabase();
    await seed(source);
    const backup = await buildBackup({ database: source });

    const target = freshDatabase();
    await seed(target, { profile: { userName: 'Dados Antigos' } });

    await restoreBackup(backup, { database: target });

    const profileRow = await target.user_profile.get(PROFILE_ID);
    expect(profileRow.userName).toBe('Ana');

    const planRow = await target.active_plan.get(PLAN_ID);
    expect(planRow.workoutSplits[0].exercises).toHaveLength(2);

    expect(await target.custom_exercises.count()).toBe(1);
    expect(await target.workout_sessions.count()).toBe(1);
    expect(await target.session_sets.count()).toBe(1);
    expect(await target.weekly_checks.count()).toBe(1);
  });

  it('apaga o que estava no aparelho antes, em vez de misturar', async () => {
    const target = freshDatabase();
    await seed(target);
    await target.workout_sessions.add({ dayKey: '2026-01-01', startedAt: 'x', splitId: 'treino-z' });

    const backup = await buildBackup({ database: freshDatabase() });
    await restoreBackup(backup, { database: target });

    expect(await target.user_profile.count()).toBe(0);
    expect(await target.workout_sessions.count()).toBe(0);
    expect(await target.session_sets.count()).toBe(0);
    expect(await target.custom_exercises.count()).toBe(0);
  });

  it('round-trip: exportar e restaurar devolve o mesmo estado', async () => {
    const source = freshDatabase();
    await seed(source);
    const backup = await buildBackup({ database: source });

    const target = freshDatabase();
    await restoreBackup(parseBackupText(JSON.stringify(backup)).backup, { database: target });
    const reExport = await buildBackup({ database: target });

    expect(reExport.userProfile).toEqual(backup.userProfile);
    expect(reExport.customExercises).toEqual(backup.customExercises);
    expect(reExport.workoutLogs).toEqual(backup.workoutLogs);
    expect(reExport.weeklyChecks).toEqual(backup.weeklyChecks);
    expect(reExport.sessions).toEqual(backup.sessions);
    expect(reExport.activePlan).toEqual(backup.activePlan);
  });

  it('restaurar duas vezes é idempotente', async () => {
    const source = freshDatabase();
    await seed(source);
    const backup = parseBackupText(JSON.stringify(await buildBackup({ database: source }))).backup;

    const target = freshDatabase();
    await restoreBackup(backup, { database: target });
    await restoreBackup(backup, { database: target });

    expect(await target.workout_sessions.count()).toBe(1);
    expect(await target.session_sets.count()).toBe(1);
    expect(await target.custom_exercises.count()).toBe(1);
  });

  it('não deixa o banco pela metade quando a escrita falha', async () => {
    const source = freshDatabase();
    await seed(source);
    const backup = parseBackupText(JSON.stringify(await buildBackup({ database: source }))).backup;

    const target = freshDatabase();
    await seed(target, { profile: { userName: 'Intacto' } });

    // Falha no meio das escritas: `workout_sessions` tem id autoincrementado,
    // então uma linha sem id seria aceita silenciosamente pelo Dexie. Quebrar a
    // escrita de séries é o caminho real de falha (cota estourada, IndexedDB
    // bloqueado) e o que precisa ser provado é o rollback.
    vi.spyOn(target.session_sets, 'bulkPut').mockRejectedValue(new Error('storage cheio'));

    await expect(restoreBackup(backup, { database: target })).rejects.toThrow('storage cheio');

    const profileRow = await target.user_profile.get(PROFILE_ID);
    expect(profileRow.userName).toBe('Intacto');
    expect(await target.custom_exercises.count()).toBe(1);
    expect(await target.workout_sessions.count()).toBe(1);
  });
});