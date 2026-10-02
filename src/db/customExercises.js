import { db } from './index.js';
import { EXERCISE_CATALOG } from '../engine/knowledge/exercises.js';

// Exercícios criados pelo usuário. Precisam obedecer exatamente o mesmo
// formato do catálogo embutido porque são injetados no mesmo gerador e passam
// pelo mesmo filtro de segurança — um exercício próprio não pode ser um atalho
// para contornar uma restrição articular.

// Prefixo sem ':' de propósito. O id do exercício entra em seletores CSS
// (`#btn-edit-custom-<id>`) e em aria-label; um ':' faria o seletor ser
// inválido e o botão de editar/excluir ficaria inalcançável por
// querySelector e por leitor de tela.
export const CUSTOM_ID_PREFIX = 'custom_';

export const MUSCLE_OPTIONS = [
  'peito',
  'ombro',
  'costas',
  'trapezio',
  'biceps',
  'triceps',
  'quadriceps',
  'posterior',
  'gluteos',
  'panturrilha',
  'core',
  'cardio'
];

// Padrões por músculo: um exercício de quadríceps com padrão de costas faria o
// gerador tratá-lo como slot de costas e a ficha ficaria incoerente.
export const PATTERN_OPTIONS = {
  peito: ['push_horizontal', 'push_incline', 'fly'],
  ombro: ['push_vertical', 'lateral_raise', 'rear_delt'],
  costas: ['pull_vertical', 'pull_horizontal', 'lat_isolation'],
  trapezio: ['shrug'],
  biceps: ['biceps_curl'],
  triceps: ['triceps_extension', 'triceps_overhead'],
  quadriceps: ['squat', 'leg_press', 'leg_extension'],
  posterior: ['hinge', 'leg_curl'],
  gluteos: ['hip_thrust', 'abduction'],
  panturrilha: ['calf_raise'],
  core: ['crunch', 'plank'],
  cardio: ['cardio_bike', 'cardio_incline', 'cardio_eliptico', 'steps']
};

export const EQUIPMENT_OPTIONS = ['gym', 'home', 'gym_or_home'];
export const JOINT_OPTIONS = ['lombar', 'joelho', 'ombro', 'cotovelo', 'quadril', 'punho'];

// Mesmos valores que o catálogo embutido usa, para a UI não depender de magic
// strings espalhados por três arquivos.
export const PATTERN_LABELS = {
  push_horizontal: 'Empurrar horizontal',
  push_incline: 'Empurrar inclinado',
  fly: 'Crucifixo / Peck-deck',
  push_vertical: 'Empurrar vertical',
  lateral_raise: 'Elevação lateral',
  rear_delt: 'Elevação posterior',
  pull_vertical: 'Puxar vertical',
  pull_horizontal: 'Puxar horizontal',
  lat_isolation: 'Isolamento de dorsal',
  shrug: 'Elevação de trapézio',
  biceps_curl: 'Rosca bíceps',
  triceps_extension: 'Tríceps na extensão',
  triceps_overhead: 'Tríceps acima da cabeça',
  squat: 'Agachamento',
  leg_press: 'Leg press',
  leg_extension: 'Extensão de perna',
  hinge: 'Levantamento de quadril',
  leg_curl: 'Flexão de perna',
  hip_thrust: 'Elevação pélvica',
  abduction: 'Abdução',
  calf_raise: 'Elevação de panturrilha',
  crunch: 'Abdominal crunch',
  plank: 'Prancha',
  cardio_bike: 'Bicicleta',
  cardio_incline: 'Caminhada/cardio inclinado',
  cardio_eliptico: 'Elíptico/transport',
  steps: 'Passos no celular'
};

export const MUSCLE_LABELS = {
  peito: 'Peito',
  ombro: 'Ombro',
  costas: 'Costas',
  trapezio: 'Trapézio',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  quadriceps: 'Quadríceps',
  posterior: 'Posterior de coxa',
  gluteos: 'Glúteos',
  panturrilha: 'Panturrilha',
  core: 'Core',
  cardio: 'Cardio'
};

export const EQUIPMENT_LABELS = {
  gym: 'Academia',
  home: 'Casa',
  gym_or_home: 'Casa ou academia'
};

export const JOINT_LABELS = {
  lombar: 'Lombar',
  joelho: 'Joelho',
  ombro: 'Ombro',
  cotovelo: 'Cotovelo',
  quadril: 'Quadril',
  punho: 'Punho'
};

export function isCustomExercise(exercise) {
  return typeof exercise?.id === 'string' && exercise.id.startsWith(CUSTOM_ID_PREFIX);
}

/**
 * Junta catálogo embutido + exercícios do usuário numa lista só, na mesma ordem
 * em que o gerador espera: o que já vem pronto tem prioridade.
 *
 * Exercícios próprios entram no catálogo para poderem ser escolhidos no lugar de
 * um slot, mas nunca são devolvidos para um `muscle/pattern` que o catálogo já
 * cobre — isso mantém os planos de fábrica estáveis e faz o exercício do usuário
 * aparecer apenas como alternativa dentro do mesmo grupo.
 */
export function buildFullCatalog(customExercises = []) {
  const usable = customExercises.filter(ex => ex && ex.id && ex.name && ex.muscle && ex.pattern);
  const customIds = new Set(usable.map(ex => ex.id));
  return [
    // Exercícios do usuário vêm PRIMEIRO de propósito. Ele criou aquele
    // exercício para usar, e o slot que ele informa é exatamente onde ele quer
    // que apareça — se ficasse no fim só entraria como último recurso, ou seja
    // nunca, porque o catálogo de fábrica já cobre todos os slots.
    // Colocado na frente, ele ganha o slot; se estiver bloqueado por restrição
    // ou equipamento, o filtro de segurança o descarta e a fábrica assume.
    ...usable.filter(ex => !EXERCISE_CATALOG.some(base => base.id === ex.id)),
    ...EXERCISE_CATALOG
  ];
}

/**
 * Valida e normaliza o formulário de criação/edição.
 * Devolve `{ ok: true, value }` ou `{ ok: false, errors }` com chaves por campo,
 * no mesmo formato que o OnboardingModal já usa — a UI de erro fica idêntica.
 */
export function validateCustomExercise(input = {}, { existingId = null } = {}) {
  const errors = {};

  const name = String(input.name ?? '').trim().replace(/\s+/g, ' ');
  if (name.length < 3) errors.name = 'Informe um nome com pelo menos 3 letras.';
  if (name.length > 60) errors.name = 'Use no máximo 60 caracteres.';

  const muscle = String(input.muscle ?? '');
  if (!MUSCLE_OPTIONS.includes(muscle)) errors.muscle = 'Escolha um grupo muscular.';

  const validPatterns = PATTERN_OPTIONS[muscle] ?? [];
  const pattern = String(input.pattern ?? '');
  if (!validPatterns.includes(pattern)) {
    errors.pattern = 'Escolha um padrão compatível com o grupo muscular.';
  }

  const equipment = String(input.equipment ?? 'gym_or_home');
  if (!EQUIPMENT_OPTIONS.includes(equipment)) errors.equipment = 'Escolha um tipo de equipamento.';

  // Articulação desconhecida é ERRO, nunca descartada em silêncio: se o
  // usuário digitar "joelho" com acento ou erro de grafia e a entrada sumisse,
  // o exercício seria salvo como seguro e passaria pelo filtro de restrição de
  // quem exatamente não pode fazer esse movimento.
  const jointStress = Array.isArray(input.jointStress) ? [...new Set(input.jointStress)] : [];
  const unknown = jointStress.filter(j => !JOINT_OPTIONS.includes(j));
  if (unknown.length > 0) {
    errors.jointStress = `Articulação inválida: ${unknown.join(', ')}.`;
  }

  const defaultSeries = String(input.defaultSeries ?? '').trim();
  if (!defaultSeries) errors.defaultSeries = 'Informe as séries, ex.: 3x 10-12 reps.';
  if (defaultSeries.length > 30) errors.defaultSeries = 'Use no máximo 30 caracteres.';

  const rest = String(input.rest ?? '').trim();
  if (!rest) errors.rest = 'Informe o descanso, ex.: 60s.';
  if (rest.length > 30) errors.rest = 'Use no máximo 30 caracteres.';

  const tips = String(input.tips ?? '').trim();
  if (tips.length > 240) errors.tips = 'Use no máximo 240 caracteres.';

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const value = {
    name,
    muscle,
    pattern,
    equipment,
    jointStress,
    defaultSeries,
    rest,
    tips: tips || 'Exercício criado por você.',
    // O catálogo embutido é a fonte da verdade; o id do usuário não pode
    // colidir com um id de fábrica.
    id: existingId ?? `${CUSTOM_ID_PREFIX}${buildCustomSlug(name)}`,
    isCustom: true,
    createdAt: input.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return { ok: true, value };
}

// NFD separa o acento da letra base; a faixa \u0300-\u036f são os combining marks
// que sobra e precisam sair. Escrito como escape e não como caractere literal
// porque o caractere é invisível no editor e fácil de corromper.
function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

// Id derivado do nome, e não aleatório: precisa ser o mesmo entre reloads para
// que o exercício não duplique a cada visita.
export function buildCustomSlug(name) {
  return slugify(name) || 'exercicio';
}

export async function listCustomExercises({ database = db } = {}) {
  const rows = await database.custom_exercises.toArray();
  return rows.sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
}

export async function saveCustomExercise(input, { database = db, existingId = null } = {}) {
  // Ao editar, o id precisa continuar o mesmo mesmo que o usuário mude o nome.
  // O id é a chave usada por workout_logs e session_sets: recalculá-lo a partir
  // do nome criaria um exercício novo e deixaria todo o histórico do exercício
  // antigo órfão. Por isso o `existingId` explícito tem precedência, mas na
  // ausência dele o próprio id recebido já existente é respeitado.
  const targetId = existingId ?? (isCustomExercise(input) ? input.id : null);

  const result = validateCustomExercise(input, { existingId: targetId });
  if (!result.ok) {
    const error = new Error('Exercício inválido');
    error.errors = result.errors;
    throw error;
  }

  const { value } = result;

  const clash = await database.custom_exercises.get(value.id);
  if (clash && clash.id !== targetId) {
    const error = new Error('Já existe um exercício com este nome');
    error.errors = { name: 'Já existe um exercício com este nome.' };
    throw error;
  }

  await database.custom_exercises.put(value);
  return value;
}

export async function deleteCustomExercise(id, { database = db } = {}) {
  await database.custom_exercises.delete(id);
}