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
  dietaryPreference: 'omnivore',
  restrictions: [],
  isConfigured: true
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
    rir: '1',
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
    { splitId: 'treino-a', exerciseId: 'supino_reto_halteres', weight: 62.5, reps: '8', rir: '2', isDone: true },
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

describe('parseBackupText — arquivo sem versão', () => {
  it('recusa o formato antigo, que nunca teve kind nem version', () => {
    // O formato antigo (exportado antes do formato versionado) não trazia
    // exercícios próprios e nunca passou por validação. Aceitá-lo despejaria
    // dados não saneados no aparelho.
    const result = parseBackupText(JSON.stringify({
      userProfile: profile,
      activePlan: { id: PLAN_ID, workoutSplits: [] },
      workoutLogs: {},
      sessions: []
    }));

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/não é um backup do TreinoPro/);
  });

  it('recusa kind correto com version faltando', () => {
    const result = parseBackupText(JSON.stringify({
      kind: BACKUP_KIND,
      userProfile: profile
    }));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Versão de backup inválida/);
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

  it('preenche rir vazio em séries de backups antigos, sem inventar valor', () => {
    const result = parseBackupText(JSON.stringify({
      kind: BACKUP_KIND,
      version: 1,
      sessions: [{
        id: 7,
        startedAt: '2026-03-03T18:00:00.000Z',
        sets: [
          { id: 'a', sessionId: 7, exerciseId: 'supino_reto_halteres', weight: 60, reps: '8', isDone: true },
          { id: 'b', sessionId: 7, exerciseId: 'desenvolvimento_dumbbell', weight: 20, reps: '10', rir: '3', isDone: true }
        ]
      }]
    }));

    const sets = result.backup.sessions[0].sets;
    expect(sets.find(s => s.exerciseId === 'supino_reto_halteres').rir).toBe('');
    expect(sets.find(s => s.exerciseId === 'desenvolvimento_dumbbell').rir).toBe('3');
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
function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    get length() { return map.size; },
    key: i => [...map.keys()][i] ?? null,
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: k => { map.delete(k); },
    dump: () => Object.fromEntries(map)
  };
}

describe('backup de gamificação e caminhada (localStorage)', () => {
  const gamification = { totalXp: 4200, ironCoins: 350, equippedTitle: 'heroi_raid', unlockedTitles: ['iniciante_ferro', 'heroi_raid'] };
  const sourceStorage = () => memoryStorage({
    treinopro_gamification_state: JSON.stringify(gamification),
    'treinopro_walking_2026-03-01': JSON.stringify({ steps: 9000, goalSteps: 8000 }),
    'treinopro_walking_2026-03-02': JSON.stringify({ steps: 4000 }),
    treinopro_walking_lixo: '{}',
    outra_chave: 'x'
  });

  it('exporta XP, moedas e dias de caminhada', async () => {
    const backup = await buildBackup({ database: freshDatabase(), storage: sourceStorage() });
    expect(backup.gamification.totalXp).toBe(4200);
    expect(backup.gamification.ironCoins).toBe(350);
    expect(backup.walking.map(d => d.date)).toEqual(['2026-03-01', '2026-03-02']);
    expect(backup.walking[0].steps).toBe(9000);
  });

  it('round-trip restaura gamificação e substitui a caminhada do aparelho', async () => {
    const source = freshDatabase();
    await seed(source);
    const backup = parseBackupText(JSON.stringify(
      await buildBackup({ database: source, storage: sourceStorage() })
    )).backup;

    const targetStorage = memoryStorage({
      treinopro_gamification_state: JSON.stringify({ totalXp: 10 }),
      'treinopro_walking_2025-01-01': JSON.stringify({ steps: 1 })
    });
    const counts = await restoreBackup(backup, { database: freshDatabase(), storage: targetStorage });

    expect(counts.gamification).toBe(true);
    expect(counts.walkingDays).toBe(2);
    expect(counts.localDataError).toBe(false);
    const data = targetStorage.dump();
    expect(JSON.parse(data.treinopro_gamification_state).totalXp).toBe(4200);
    expect(data['treinopro_walking_2025-01-01']).toBeUndefined();
    expect(JSON.parse(data['treinopro_walking_2026-03-02']).steps).toBe(4000);
  });

  it('backup antigo sem gamificação não apaga XP nem caminhada atuais', async () => {
    const source = freshDatabase();
    await seed(source);
    const legacy = await buildBackup({ database: source, storage: null });
    delete legacy.gamification;
    delete legacy.walking;
    const backup = parseBackupText(JSON.stringify(legacy)).backup;
    expect(backup.gamification).toBeNull();
    expect(backup.walking).toBeNull();

    const targetStorage = memoryStorage({
      treinopro_gamification_state: JSON.stringify({ totalXp: 777 }),
      'treinopro_walking_2026-01-01': JSON.stringify({ steps: 5 })
    });
    await restoreBackup(backup, { database: freshDatabase(), storage: targetStorage });
    const data = targetStorage.dump();
    expect(JSON.parse(data.treinopro_gamification_state).totalXp).toBe(777);
    expect(data['treinopro_walking_2026-01-01']).toBeDefined();
  });

  it('saneia valores adulterados no arquivo', async () => {
    const legacy = await buildBackup({ database: freshDatabase(), storage: null });
    legacy.gamification = { totalXp: -50, ironCoins: 'abc', unlockedBadgeIds: 'tudo' };
    legacy.walking = [{ date: '2026-03-01', steps: -10 }, { date: 'nao-e-data', steps: 1 }, null];
    const { backup } = parseBackupText(JSON.stringify(legacy));
    expect(backup.gamification.totalXp).toBe(0);
    expect(backup.gamification.ironCoins).toBe(100);
    expect(backup.gamification.unlockedBadgeIds).toEqual([]);
    expect(backup.walking).toEqual([expect.objectContaining({ date: '2026-03-01', steps: 0 })]);
    expect(summarizeBackup(backup)).toMatchObject({ totalXp: 0, walkingDays: 1 });
  });
});

describe('perfil restaurado continua configurado', () => {
  it('backup antigo sem isConfigured não reabre o onboarding', async () => {
    const legacy = await buildBackup({ database: freshDatabase(), storage: null });
    legacy.userProfile = { id: PROFILE_ID, userName: 'Ana', goal: 'hypertrophy', gender: 'female', ageYears: 30, weightKg: 60, heightCm: 165, dietaryPreference: 'vegan' };
    const { backup } = parseBackupText(JSON.stringify(legacy));
    expect(backup.userProfile.isConfigured).toBe(true);
    expect(backup.userProfile.dietaryPreference).toBe('vegan');
  });

  it('perfil incompleto não é marcado como configurado', async () => {
    const legacy = await buildBackup({ database: freshDatabase(), storage: null });
    legacy.userProfile = { id: PROFILE_ID, userName: 'Ana' };
    const { backup } = parseBackupText(JSON.stringify(legacy));
    expect(backup.userProfile.isConfigured).toBe(false);
  });
});

describe('backup de medições corporais e vídeos', () => {
  it('round-trip leva medições e links de vídeo; arquivo antigo não apaga', async () => {
    const source = freshDatabase();
    await source.body_metrics.put({ id: '2026-03-01', date: '2026-03-01', weightKg: 80, waistCm: 90 });
    const storage = {
      map: new Map([['overload_exercise_videos', JSON.stringify({ supino: 'https://youtu.be/abc', ruim: 'https://site.mal/x' })]]),
      get length() { return this.map.size; },
      key(i) { return [...this.map.keys()][i] ?? null; },
      getItem(k) { return this.map.get(k) ?? null; },
      setItem(k, v) { this.map.set(k, String(v)); },
      removeItem(k) { this.map.delete(k); }
    };
    const exported = await buildBackup({ database: source, storage });
    expect(exported.exerciseVideos).toEqual({ supino: 'https://youtu.be/abc' });
    const { backup } = parseBackupText(JSON.stringify(exported));
    expect(summarizeBackup(backup).bodyMetrics).toBe(1);

    const target = freshDatabase();
    await target.body_metrics.put({ id: '2025-01-01', date: '2025-01-01', weightKg: 70 });
    const targetStorage = { ...storage, map: new Map() };
    Object.setPrototypeOf(targetStorage, Object.getPrototypeOf(storage));
    const counts = await restoreBackup(backup, { database: target, storage: targetStorage });
    expect(counts.bodyMetrics).toBe(1);
    expect((await target.body_metrics.toArray()).map(r => r.id)).toEqual(['2026-03-01']);
    expect(JSON.parse(targetStorage.getItem('overload_exercise_videos'))).toEqual({ supino: 'https://youtu.be/abc' });

    const legacy = { ...exported };
    delete legacy.bodyMetrics;
    const keep = freshDatabase();
    await keep.body_metrics.put({ id: '2025-01-01', date: '2025-01-01', weightKg: 70 });
    await restoreBackup(parseBackupText(JSON.stringify(legacy)).backup, { database: keep, storage: null });
    expect(await keep.body_metrics.count()).toBe(1);
  });
});


describe('backup do programa iniciante', () => {
  it('leva e restaura o estado do programa; arquivo antigo não apaga', async () => {
    const make = (entries = {}) => {
      const map = new Map(Object.entries(entries));
      return {
        get length() { return map.size; }, key: i => [...map.keys()][i] ?? null,
        getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: k => map.delete(k), map
      };
    };
    const source = make({ overload_beginner_program: JSON.stringify({ startedOn: '2026-03-02' }) });
    const exported = await buildBackup({ database: freshDatabase(), storage: source });
    expect(exported.beginnerProgram).toEqual({ startedOn: '2026-03-02', completedOn: null, dismissed: false });

    const target = make();
    await restoreBackup(parseBackupText(JSON.stringify(exported)).backup, { database: freshDatabase(), storage: target });
    expect(JSON.parse(target.map.get('overload_beginner_program')).startedOn).toBe('2026-03-02');

    const legacy = { ...exported };
    delete legacy.beginnerProgram;
    const keep = make({ overload_beginner_program: JSON.stringify({ startedOn: '2026-01-01' }) });
    await restoreBackup(parseBackupText(JSON.stringify(legacy)).backup, { database: freshDatabase(), storage: keep });
    expect(JSON.parse(keep.map.get('overload_beginner_program')).startedOn).toBe('2026-01-01');
  });
});
