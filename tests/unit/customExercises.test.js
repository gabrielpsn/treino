import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { TreinoDatabase } from '../../src/db/index.js';
import {
  CUSTOM_ID_PREFIX,
  MUSCLE_OPTIONS,
  PATTERN_OPTIONS,
  JOINT_OPTIONS,
  EQUIPMENT_OPTIONS,
  buildFullCatalog,
  buildCustomSlug,
  isCustomExercise,
  validateCustomExercise,
  listCustomExercises,
  saveCustomExercise,
  deleteCustomExercise
} from '../../src/db/customExercises.js';
import { EXERCISE_CATALOG } from '../../src/engine/knowledge/exercises.js';
import { getSafeExercise, generateWorkoutSplit } from '../../src/engine/generators/workoutGenerator.js';

let database;

const validInput = {
  name: 'Supino na Arquinha',
  muscle: 'peito',
  pattern: 'push_horizontal',
  equipment: 'gym_or_home',
  jointStress: ['ombro'],
  defaultSeries: '4x 8-10 reps',
  rest: '75s',
  tips: 'Travessa na porta.'
};

beforeEach(() => {
  database = new TreinoDatabase(new IDBFactory().name ? `custom-ex-${Math.random()}` : undefined);
});

afterEach(async () => {
  await database.delete();
});

describe('validateCustomExercise', () => {
  it('aceita um exercício bem formado', () => {
    const result = validateCustomExercise(validInput);
    expect(result.ok).toBe(true);
    expect(result.value.id).toBe(`${CUSTOM_ID_PREFIX}supino_na_arquinha`);
    expect(result.value.isCustom).toBe(true);
    expect(result.value.jointStress).toEqual(['ombro']);
  });

  it('normaliza espaços e preenche dica vazia', () => {
    const result = validateCustomExercise({ ...validInput, name: '  Supino   na  Arquinha ', tips: '' });
    expect(result.value.name).toBe('Supino na Arquinha');
    expect(result.value.tips).toBeTruthy();
  });

  it('rejeita nome curto ou longo demais', () => {
    expect(validateCustomExercise({ ...validInput, name: 'ab' }).errors.name).toBeTruthy();
    expect(validateCustomExercise({ ...validInput, name: 'x'.repeat(61) }).errors.name).toBeTruthy();
  });

  it('rejeita grupo muscular desconhecido', () => {
    expect(validateCustomExercise({ ...validInput, muscle: 'antebraço' }).errors.muscle).toBeTruthy();
  });

  it('rejeita padrão incompatível com o grupo muscular', () => {
    const errors = validateCustomExercise({ ...validInput, muscle: 'peito', pattern: 'squat' }).errors;
    expect(errors.pattern).toBeTruthy();
  });

  it('exige séries e descanso', () => {
    const errors = validateCustomExercise({ ...validInput, defaultSeries: '', rest: '  ' }).errors;
    expect(errors.defaultSeries).toBeTruthy();
    expect(errors.rest).toBeTruthy();
  });

  it('rejeita articulação desconhecida em vez de descartá-la em silêncio', () => {
    // Descartar faria o exercício ser salvo como se não carregasse aquela
    // articulação e passaria pelo filtro de quem tem a lesão.
    const result = validateCustomExercise({ ...validInput, jointStress: ['joelho', 'dedo'] });
    expect(result.ok).toBe(false);
    expect(result.errors.jointStress).toContain('dedo');
  });

  it('rejeita equipamento inválido', () => {
    expect(validateCustomExercise({ ...validInput, equipment: 'barca' }).errors.equipment).toBeTruthy();
  });

  it('mantém o id e createdAt ao editar', () => {
    const first = validateCustomExercise(validInput).value;
    const second = validateCustomExercise(
      { ...validInput, name: 'Supino na Arquinha Ajustado' },
      { existingId: first.id }
    ).value;
    expect(second.id).toBe(first.id);
    expect(second.name).toBe('Supino na Arquinha Ajustado');
  });
});

describe('persistência de custom_exercises', () => {
  it('salva e lista', async () => {
    await saveCustomExercise(validInput, { database });
    const rows = await listCustomExercises({ database });
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Supino na Arquinha');
  });

  it('atualiza sem duplicar na edição', async () => {
    const saved = await saveCustomExercise(validInput, { database });
    await saveCustomExercise({ ...validInput, rest: '90s' }, { database, existingId: saved.id });
    const rows = await listCustomExercises({ database });
    expect(rows).toHaveLength(1);
    expect(rows[0].rest).toBe('90s');
  });

  it('bloqueia nome duplicado', async () => {
    await saveCustomExercise(validInput, { database });
    await expect(saveCustomExercise(validInput, { database })).rejects.toThrow();
  });

  it('não pode sobrescrever exercício de fábrica mesmo com nome igual', async () => {
    // O prefixo 'custom:' no id é o que garante isso: mesmo que o slug do nome
    // colida com um id de fábrica, os dois coexistem no catálogo.
    const saved = await saveCustomExercise({ ...validInput, name: 'Flexao Solo' }, { database });
    expect(saved.id).toBe(`${CUSTOM_ID_PREFIX}flexao_solo`);
    expect(EXERCISE_CATALOG.some(e => e.id === saved.id)).toBe(false);

    const full = buildFullCatalog([saved]);
    expect(full).toHaveLength(EXERCISE_CATALOG.length + 1);
    const factory = full.find(e => e.id === 'flexao_solo');
    expect(factory.isCustom).toBeUndefined();
    expect(full.filter(e => e.id === 'flexao_solo')).toHaveLength(1);
  });

  it('remove', async () => {
    const saved = await saveCustomExercise(validInput, { database });
    await deleteCustomExercise(saved.id, { database });
    expect(await listCustomExercises({ database })).toHaveLength(0);
  });

  it('propaga erros de validação no erro lançado', async () => {
    await saveCustomExercise({ ...validInput, name: '' }, { database }).then(
      () => { throw new Error('deveria ter rejeitado'); },
      err => { expect(err.errors.name).toBeTruthy(); }
    );
  });
});

describe('buildFullCatalog', () => {
  it('sem customizados devolve o catálogo embutido intacto', () => {
    expect(buildFullCatalog([])).toEqual(EXERCISE_CATALOG);
  });

  it('coloca os customizados antes do catálogo de fábrica', () => {
    // O usuário criou o exercício para usar; ele precisa ganhar o slot.
    const custom = validateCustomExercise(validInput).value;
    const full = buildFullCatalog([custom]);
    expect(full).toHaveLength(EXERCISE_CATALOG.length + 1);
    expect(full[0].id).toBe(custom.id);
  });

  it('ignora customizado malformado e entrada nula', () => {
    const full = buildFullCatalog([{ id: 'custom:x' }, null, { name: 'sem id' }, undefined]);
    expect(full).toHaveLength(EXERCISE_CATALOG.length);
  });

  it('customizado nunca duplica id do catálogo', () => {
    const first = EXERCISE_CATALOG[0].id;
    const full = buildFullCatalog([{ ...EXERCISE_CATALOG[0], isCustom: true }]);
    expect(full.filter(e => e.id === first)).toHaveLength(1);
  });
});

describe('integração com o gerador', () => {
  it('o gerador aceita exercício próprio no lugar do slot', () => {
    const custom = validateCustomExercise(validInput).value;
    const found = getSafeExercise('peito', 'push_horizontal', [], 'home', [], buildFullCatalog([custom]));
    expect(found.id).toBe(custom.id);
  });

  it('sem o customizado o slot volta ao exercício de fábrica', () => {
    const found = getSafeExercise('peito', 'push_horizontal', [], 'home', []);
    expect(found.id).not.toMatch(new RegExp(CUSTOM_ID_PREFIX));
  });

  it('exercício próprio respeita restrição articular', () => {
    const custom = validateCustomExercise(validInput).value;
    const found = getSafeExercise('peito', 'push_horizontal', ['ombro'], 'home', [], buildFullCatalog([custom]));
    expect(found.id).not.toBe(custom.id);
  });

  it('exercício próprio em casa não vaza equipamento de academia', () => {
    const custom = validateCustomExercise({ ...validInput, equipment: 'gym' }).value;
    const found = getSafeExercise('peito', 'push_horizontal', [], 'home', [], buildFullCatalog([custom]));
    expect(found.equipment).not.toBe('gym');
  });

  it('gerar split com catálogo customizado usa o exercício próprio', () => {
    const custom = validateCustomExercise(validInput).value;
    const { splits } = generateWorkoutSplit({
      goal: 'hypertrophy', daysPerWeek: 4, equipment: 'home', restrictions: [],
      catalog: buildFullCatalog([custom])
    });
    const ids = splits.flatMap(s => s.exercises.map(e => e.id));
    expect(ids).toContain(custom.id);
  });

  it('não repete exercício próprio entre slots', () => {
    const custom = validateCustomExercise(validInput).value;
    const { splits } = generateWorkoutSplit({
      goal: 'hypertrophy', daysPerWeek: 4, equipment: 'home', restrictions: [],
      catalog: buildFullCatalog([custom])
    });
    for (const split of splits) {
      const ids = split.exercises.map(e => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('isCustomExercise identifica pelo prefixo', () => {
    expect(isCustomExercise({ id: `${CUSTOM_ID_PREFIX}a` })).toBe(true);
    expect(isCustomExercise({ id: 'flexao_solo' })).toBe(false);
    expect(isCustomExercise(null)).toBe(false);
  });
});

describe('coerência das opções oferecidas na UI', () => {
  it('todo grupo tem ao menos um padrão', () => {
    for (const muscle of MUSCLE_OPTIONS) {
      expect(PATTERN_OPTIONS[muscle]?.length).toBeGreaterThan(0);
    }
  });

  it('todo padrão offered pertence a algum grupo conhecido', () => {
    const known = new Set(Object.values(PATTERN_OPTIONS).flat());
    for (const muscle of MUSCLE_OPTIONS) {
      for (const pattern of PATTERN_OPTIONS[muscle]) {
        expect(known.has(pattern)).toBe(true);
      }
    }
  });

  it('restrições da UI são as mesmas do motor', () => {
    // Uma articulação oferecida na UI que o motor não conhece faria o exercício
    // passar pelo filtro mesmo para quem tem a lesão.
    const known = new Set(JOINT_OPTIONS);
    for (const ex of EXERCISE_CATALOG) {
      for (const joint of ex.jointStress) {
        expect(known.has(joint)).toBe(true);
      }
    }
  });

  it('equipamentos da UI cobrem todo o catálogo', () => {
    const known = new Set(EQUIPMENT_OPTIONS);
    for (const ex of EXERCISE_CATALOG) {
      expect(known.has(ex.equipment)).toBe(true);
    }
  });
});

describe('buildCustomSlug', () => {
  it('remove acentos e normaliza', () => {
    expect(buildCustomSlug('Agachamento Isométrico')).toBe('agachamento_isometrico');
    expect(buildCustomSlug('Puxada  na  Barra')).toBe('puxada_na_barra');
  });

  it('nunca fica vazio', () => {
    expect(buildCustomSlug('!!!')).toBe('exercicio');
  });
});
describe('edição preserva o id', () => {
  it('mantém o id quando o nome muda', async () => {
    // O id é a chave de workout_logs e session_sets. Se mudasse junto com o
    // nome, todo o histórico de cargas do exercício ficaria órfão e o exercício
    // "renomeado" apareceria como um treino totalmente novo.
    const saved = await saveCustomExercise(validInput, { database });
    const renamed = { ...saved, name: 'Supino na Arquinha Inclinado' };
    const updated = await saveCustomExercise(renamed, { database });

    expect(updated.id).toBe(saved.id);
    const rows = await listCustomExercises({ database });
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Supino na Arquinha Inclinado');
  });

  it('preserva createdAt na edição para não reordenar a lista', async () => {
    const saved = await saveCustomExercise(validInput, { database });
    const updated = await saveCustomExercise({ ...saved, name: 'Renomeado' }, { database });
    expect(updated.createdAt).toBe(saved.createdAt);
  });

  it('saveCustomExercise aceita o id sem existingId explícito', async () => {
    const saved = await saveCustomExercise(validInput, { database });
    const updated = await saveCustomExercise({ ...saved, rest: '120s' }, { database });
    expect(updated.id).toBe(saved.id);
    expect((await listCustomExercises({ database }))[0].rest).toBe('120s');
  });
});
