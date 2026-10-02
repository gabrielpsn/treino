import { describe, it, expect } from 'vitest';
import {
  getSafeExercise,
  generateWorkoutSplit,
  conflictsWithRestrictions,
  matchesEquipment,
  isExerciseSafe,
  filterSafeExercises
} from '../../src/engine/generators/workoutGenerator.js';
import { EXERCISE_CATALOG } from '../../src/engine/knowledge/exercises.js';

const baseProfile = {
  userName: 'Teste',
  goal: 'hypertrophy',
  gender: 'male',
  ageYears: 30,
  weightKg: 80,
  heightCm: 180,
  daysPerWeek: 4,
  experienceLevel: 'intermediate',
  equipment: 'gym',
  restrictions: []
};

describe('integridade do catálogo', () => {
  it('tem ids únicos', () => {
    const ids = EXERCISE_CATALOG.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todo exercício declara jointStress como array', () => {
    for (const ex of EXERCISE_CATALOG) {
      expect(Array.isArray(ex.jointStress)).toBe(true);
    }
  });

  it('todo exercício declara equipamento válido', () => {
    const valid = new Set(['gym', 'home', 'gym_or_home']);
    for (const ex of EXERCISE_CATALOG) {
      expect(valid.has(ex.equipment)).toBe(true);
    }
  });
});

describe('matchesEquipment', () => {
  it('bloqueia máquina de academia quando o usuário treina em casa', () => {
    const gymOnly = EXERCISE_CATALOG.find(e => e.equipment === 'gym');
    expect(matchesEquipment(gymOnly, 'home')).toBe(false);
  });

  it('libera equipamento de casa ou compartilhado em qualquer ambiente', () => {
    const homeOk = EXERCISE_CATALOG.filter(e => e.equipment !== 'gym');
    for (const ex of homeOk) {
      expect(matchesEquipment(ex, 'home')).toBe(true);
      expect(matchesEquipment(ex, 'gym')).toBe(true);
    }
  });
});

describe('conflictsWithRestrictions', () => {
  it('detecta conflito com articulação lesionada', () => {
    const kneeExercise = EXERCISE_CATALOG.find(e => e.jointStress.includes('joelho'));
    expect(kneeExercise).toBeDefined();
    expect(conflictsWithRestrictions(kneeExercise, ['joelho'])).toBe(true);
  });

  it('não acusa conflito com restrição diferente', () => {
    const kneeExercise = EXERCISE_CATALOG.find(e => e.jointStress.includes('joelho'));
    expect(conflictsWithRestrictions(kneeExercise, ['ombro'])).toBe(false);
  });

  it('sem restrições, nada conflita', () => {
    for (const ex of EXERCISE_CATALOG) {
      expect(conflictsWithRestrictions(ex, [])).toBe(false);
    }
  });
});

describe('filterSafeExercises', () => {
  it('nunca devolve exercício que conflita com a restrição', () => {
    const safe = filterSafeExercises(EXERCISE_CATALOG, { restrictions: ['joelho'], equipment: 'gym' });
    expect(safe.length).toBeGreaterThan(0);
    for (const ex of safe) {
      expect(ex.jointStress).not.toContain('joelho');
    }
  });

  it('nunca devolve equipamento indisponível em casa', () => {
    const safe = filterSafeExercises(EXERCISE_CATALOG, { restrictions: [], equipment: 'home' });
    for (const ex of safe) {
      expect(ex.equipment).not.toBe('gym');
    }
  });
});

describe('getSafeExercise', () => {
  it('respeita o padrão quando existe match exato', () => {
    const ex = getSafeExercise('quadriceps', 'squat', [], 'gym', []);
    expect(ex.muscle).toBe('quadriceps');
    expect(ex.pattern).toBe('squat');
  });

  it('respeita o equipamento "home"', () => {
    const ex = getSafeExercise('quadriceps', 'squat', [], 'home', []);
    expect(ex.equipment).not.toBe('gym');
  });

  it('pula exercício que conflita com a restrição', () => {
    const allKnee = EXERCISE_CATALOG
      .filter(e => e.muscle === 'quadriceps' && e.jointStress.includes('joelho'))
      .map(e => e.id);

    const ex = getSafeExercise('quadriceps', null, ['joelho'], 'gym', allKnee);
    if (ex) {
      expect(ex.jointStress).not.toContain('joelho');
    }
  });

  it('prefere um equipamento compatível a um incompatível quando a restrição é o gargalo', () => {
    // Com o joelho bloqueado, o fallback não pode devolver equipamento de academia para quem treina em casa.
    const excluded = EXERCISE_CATALOG
      .filter(e => e.jointStress.includes('joelho'))
      .map(e => e.id);

    const ex = getSafeExercise('quadriceps', null, ['joelho'], 'home', excluded);
    if (ex) expect(ex.equipment).not.toBe('gym');
  });

  it('retorna null em vez de inventar exercício inseguro', () => {
    const blocked = EXERCISE_CATALOG
      .filter(e => e.muscle === 'cardio' && e.jointStress.length > 0)
      .map(e => e.id);

    // Bloqueia todos os cardio com restrição de joelho e exige que o fallback não invente um inseguro
    const ex = getSafeExercise('cardio', null, ['joelho'], 'gym', blocked);
    expect(ex === null || !ex.jointStress.includes('joelho')).toBe(true);
  });

  it('não devolve exercício já excluído', () => {
    const first = getSafeExercise('peito', null, [], 'gym', []);
    const second = getSafeExercise('peito', null, [], 'gym', [first.id]);
    expect(second.id).not.toBe(first.id);
  });
});

describe('generateWorkoutSplit', () => {
  it('gera splits sem duplicar exercício dentro da mesma ficha', () => {
    const { splits } = generateWorkoutSplit(baseProfile);
    for (const split of splits) {
      const ids = split.exercises.map(e => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('respeita as restrições articulares em todos os splits', () => {
    const { splits } = generateWorkoutSplit({ ...baseProfile, restrictions: ['joelho', 'lombar'] });
    for (const split of splits) {
      for (const ex of split.exercises) {
        expect(ex.jointStress.some(j => ['joelho', 'lombar'].includes(j))).toBe(false);
      }
    }
  });

  it('respeita equipamento "home" em todos os splits', () => {
    const { splits } = generateWorkoutSplit({ ...baseProfile, equipment: 'home' });
    for (const split of splits) {
      for (const ex of split.exercises) {
        expect(ex.equipment).not.toBe('gym');
      }
    }
  });

  it('permite repetir exercício entre splits (exigência da periodização)', () => {
    // Upper1 e Upper2 compartilham movimentos de empurrar por desenho: são
    // sessões diferentes do mesmo padrão, não duplicação indevida. O que não
    // pode acontecer é o MESMO exercício aparecer duas vezes na mesma ficha.
    const { splits } = generateWorkoutSplit(baseProfile);
    const upperSplits = splits.filter(s => /Upper/i.test(s.title));
    if (upperSplits.length < 2) return;

    const a = upperSplits[0].exercises.map(e => e.id);
    const b = upperSplits[1].exercises.map(e => e.id);
    const overlap = a.filter(id => b.includes(id));
    expect(overlap.length).toBeGreaterThan(0);
  });

  it('monta 3 splits no emagrecimento independentemente da frequência', () => {
    for (const days of [3, 4, 5, 6]) {
      const { splits, weekDays } = generateWorkoutSplit({ ...baseProfile, goal: 'weight_loss', daysPerWeek: days });
      expect(splits.length).toBe(3);
      expect(weekDays.length).toBe(7);
    }
  });

  it('preenche todos os 7 dias da semana no emagrecimento', () => {
    for (const days of [3, 4, 5, 6]) {
      const { weekDays } = generateWorkoutSplit({ ...baseProfile, goal: 'weight_loss', daysPerWeek: days });
      expect(weekDays.filter(d => d.workout !== 'Descanso').length).toBeGreaterThanOrEqual(days);
    }
  });

  it('monta a divisão correta por frequência na hipertrofia', () => {
    expect(generateWorkoutSplit({ ...baseProfile, daysPerWeek: 3 }).splits.length).toBe(3); // ABC
    expect(generateWorkoutSplit({ ...baseProfile, daysPerWeek: 4 }).splits.length).toBe(4); // Upper/Lower
    expect(generateWorkoutSplit({ ...baseProfile, daysPerWeek: 5 }).splits.length).toBe(3); // PPL
    expect(generateWorkoutSplit({ ...baseProfile, daysPerWeek: 6 }).splits.length).toBe(3); // PPL
  });

  it('gera splits não vazios com restrição máxima', () => {
    const allJoints = ['lombar', 'joelho', 'ombro', 'cotovelo', 'quadril', 'punho'];
    const { splits } = generateWorkoutSplit({ ...baseProfile, restrictions: allJoints });
    expect(splits.length).toBeGreaterThan(0);
    const total = splits.reduce((sum, s) => sum + s.exercises.length, 0);
    expect(total).toBeGreaterThan(0);
    for (const split of splits) {
      for (const ex of split.exercises) {
        expect(ex.jointStress.some(j => allJoints.includes(j))).toBe(false);
      }
    }
  });

  it('todo exercício gerado tem os campos que a UI usa', () => {
    const { splits } = generateWorkoutSplit(baseProfile);
    for (const split of splits) {
      for (const ex of split.exercises) {
        expect(ex.name).toBeTruthy();
        expect(ex.muscle).toBeTruthy();
        expect(ex.defaultSeries).toBeTruthy();
        expect(ex.rest).toBeTruthy();
      }
    }
  });
});

describe('isExerciseSafe', () => {
  it('combina equipamento e restrição', () => {
    const gymKnee = EXERCISE_CATALOG.find(e => e.equipment === 'gym' && e.jointStress.includes('joelho'));
    if (gymKnee) {
      expect(isExerciseSafe(gymKnee, { restrictions: ['joelho'], equipment: 'gym' })).toBe(false);
    }
  });
});

// Slots (muscle/pattern) que os splits pedem ao catálogo. Mantido explícito de
// propósito: se alguém adicionar um padrão novo ao gerador sem exercício
// correspondente, o catálogo perde cobertura e este teste quebra.
const REQUESTED_SLOTS = [
  ['biceps', 'biceps_curl'],
  ['cardio', 'cardio_bike'],
  ['cardio', 'cardio_eliptico'],
  ['cardio', 'cardio_incline'],
  ['cardio', 'steps'],
  ['core', 'crunch'],
  ['core', 'plank'],
  ['costas', 'lat_isolation'],
  ['costas', 'pull_horizontal'],
  ['costas', 'pull_vertical'],
  ['gluteos', 'abduction'],
  ['gluteos', 'hip_thrust'],
  ['ombro', 'lateral_raise'],
  ['ombro', 'push_vertical'],
  ['ombro', 'rear_delt'],
  ['panturrilha', 'calf_raise'],
  ['peito', 'fly'],
  ['peito', 'push_horizontal'],
  ['peito', 'push_incline'],
  ['posterior', 'hinge'],
  ['posterior', 'leg_curl'],
  ['quadriceps', 'leg_extension'],
  ['quadriceps', 'leg_press'],
  ['quadriceps', 'squat'],
  ['triceps', 'triceps_extension'],
  ['triceps', 'triceps_overhead']
];

const ALL_RESTRICTIONS = ['lombar', 'joelho', 'ombro', 'cotovelo', 'quadril', 'punho'];
const EQUIPMENTS = ['gym', 'home'];

describe('cobertura do catálogo', () => {
  it('getSafeExercise devolve alternativa para todo slot em qualquer combinação', () => {
    const omitted = [];
    for (const equipment of EQUIPMENTS) {
      const profiles = [[], ...ALL_RESTRICTIONS.map(r => [r]), ALL_RESTRICTIONS];
      for (const restrictions of profiles) {
        for (const [muscle, pattern] of REQUESTED_SLOTS) {
          if (!getSafeExercise(muscle, pattern, restrictions, equipment, [])) {
            omitted.push(`${muscle}/${pattern} [${equipment}] restrições=[${restrictions.join(',')}]`);
          }
        }
      }
    }
    expect(omitted).toEqual([]);
  });

  it('todo exercício gerado é seguro para o perfil', () => {
    const violations = [];
    for (const equipment of EQUIPMENTS) {
      for (const restrictions of [[], ALL_RESTRICTIONS]) {
        const { splits } = generateWorkoutSplit({ ...baseProfile, equipment, restrictions });
        for (const split of splits) {
          for (const ex of split.exercises) {
            if (!isExerciseSafe(ex, { restrictions, equipment })) {
              violations.push(`${ex.id} [${equipment}] restrições=[${restrictions.join(',')}]`);
            }
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('não repete exercício dentro do mesmo split', () => {
    for (const equipment of EQUIPMENTS) {
      const { splits } = generateWorkoutSplit({ ...baseProfile, equipment });
      for (const split of splits) {
        const ids = split.exercises.map(e => e.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });

  it('cada split mantém o tamanho planejado em casa', () => {
    const { splits } = generateWorkoutSplit({ ...baseProfile, equipment: 'home' });
    for (const split of splits) {
      expect(split.exercises.length).toBeGreaterThanOrEqual(6);
    }
  });

  it('dor no joelho ainda oferece quadríceps em casa', () => {
    const found = getSafeExercise('quadriceps', 'leg_extension', ['joelho'], 'home', []);
    expect(found).not.toBeNull();
    expect(found.jointStress).not.toContain('joelho');
  });

  it('dor na lombar ainda oferece posterior em casa', () => {
    for (const pattern of ['hinge', 'leg_curl']) {
      const found = getSafeExercise('posterior', pattern, ['lombar'], 'home', []);
      expect(found, `posterior/${pattern} sem opção para lombar em casa`).not.toBeNull();
      expect(found.jointStress).not.toContain('lombar');
    }
  });

  it('catálogo mantém ids únicos e metadados válidos', () => {
    const valid = new Set(['gym', 'home', 'gym_or_home']);
    const ids = new Set();
    for (const ex of EXERCISE_CATALOG) {
      expect(valid.has(ex.equipment)).toBe(true);
      expect(ids.has(ex.id)).toBe(false);
      ids.add(ex.id);
      expect(ex.name).toBeTruthy();
      expect(ex.tips).toBeTruthy();
      expect(ex.defaultSeries).toBeTruthy();
    }
  });
});
