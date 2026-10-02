import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ExercisePickerModal from '../../src/components/ExercisePickerModal.vue';
import { EXERCISE_CATALOG } from '../../src/engine/knowledge/exercises.js';

const profile = { goal: 'hypertrophy', restrictions: [], equipment: 'gym' };
const chestExercise = EXERCISE_CATALOG.find(e => e.muscle === 'peito' && e.jointStress.length === 0);

function mountPicker(props = {}) {
  return mount(ExercisePickerModal, {
    props: { isOpen: true, currentExercise: chestExercise, profile, ...props }
  });
}

beforeEach(() => vi.clearAllMocks());

describe('ExercisePickerModal — modo adicionar', () => {
  it('muda o título e o texto de contexto', () => {
    const wrapper = mountPicker({ mode: 'add' });
    expect(wrapper.find('#exercise-picker-title').text()).toBe('Adicionar Exercício');
    expect(wrapper.text()).toContain('Peito');
  });

  it('inclui o exercício atual na lista (ele já está na ficha)', () => {
    const swap = mountPicker();
    const add = mountPicker({ mode: 'add' });
    const idsIn = w => w.findAll('[id^="btn-alternative-"]').map(b => b.attributes('id'));
    expect(idsIn(swap)).not.toContain(`btn-alternative-${chestExercise.id}`);
    expect(idsIn(add)).toContain(`btn-alternative-${chestExercise.id}`);
  });

  it('o botão da alternativa diz Adicionar, não Trocar', () => {
    const wrapper = mountPicker({ mode: 'add' });
    const first = wrapper.find('[id^="btn-alternative-"]');
    expect(first.text()).toContain('Adicionar');
  });

  it('emite select ao escolher e fecha', async () => {
    const wrapper = mountPicker({ mode: 'add' });
    const first = wrapper.find('[id^="btn-alternative-"]');
    const id = first.attributes('id').replace('btn-alternative-', '');
    await first.trigger('click');

    expect(wrapper.emitted('select')[0][0].id).toBe(id);
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('respeita restrição articular também no modo adicionar', () => {
    const wrapper = mountPicker({
      mode: 'add',
      profile: { ...profile, restrictions: ['ombro'] }
    });
    for (const btn of wrapper.findAll('[id^="btn-alternative-"]')) {
      const alt = EXERCISE_CATALOG.find(e => e.id === btn.attributes('id').replace('btn-alternative-', ''));
      expect(alt.jointStress).not.toContain('ombro');
    }
  });

  it('pede criação de exercício quando o grupo está sem alternativa', () => {
    // Catálogo reduzido a um único exercício que a restrição bloqueia: assim o
    // estado vazio não depende do tamanho nem do conteúdo do catálogo real.
    const blocked = {
      id: 'custom_supino_aro',
      name: 'Supino no Aro',
      muscle: 'peito',
      pattern: 'push_horizontal',
      equipment: 'gym_or_home',
      jointStress: ['ombro'],
      defaultSeries: '4x 8',
      rest: '75s',
      tips: '',
      isCustom: true
    };

    const wrapper = mountPicker({
      mode: 'add',
      catalog: [blocked],
      currentExercise: blocked,
      profile: { ...profile, restrictions: ['ombro'] }
    });

    expect(wrapper.findAll('[id^="btn-alternative-"]').length).toBe(0);
    expect(wrapper.find('#btn-create-from-picker').exists()).toBe(true);
  });

  it('emite create para abrir o CRUD', async () => {
    const blocked = {
      id: 'custom_supino_aro',
      name: 'Supino no Aro',
      muscle: 'peito',
      pattern: 'push_horizontal',
      equipment: 'gym_or_home',
      jointStress: ['ombro'],
      defaultSeries: '4x 8',
      rest: '75s',
      tips: '',
      isCustom: true
    };
    const wrapper = mountPicker({
      mode: 'add',
      catalog: [blocked],
      currentExercise: blocked,
      profile: { ...profile, restrictions: ['ombro'] }
    });
    await wrapper.find('#btn-create-from-picker').trigger('click');
    expect(wrapper.emitted('create')).toBeTruthy();
  });

  it('marca exercício próprio na lista', () => {
    const custom = {
      id: 'custom_supino',
      name: 'Supino na Arquinha',
      muscle: 'peito',
      pattern: 'push_horizontal',
      equipment: 'gym_or_home',
      jointStress: [],
      defaultSeries: '4x 8',
      rest: '75s',
      tips: 'x',
      isCustom: true
    };
    const wrapper = mountPicker({ mode: 'add', catalog: [custom, ...EXERCISE_CATALOG] });
    const row = wrapper.find('#btn-alternative-custom_supino');
    expect(row.exists()).toBe(true);
    expect(row.text()).toContain('seu exercício');
  });

  it('não renderiza sem exercício de referência', () => {
    const wrapper = mount(ExercisePickerModal, {
      props: { isOpen: true, currentExercise: null, profile, mode: 'add' }
    });
    expect(wrapper.findAll('[id^="btn-alternative-"]').length).toBe(0);
  });
});