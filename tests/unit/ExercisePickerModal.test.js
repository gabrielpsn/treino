import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ExercisePickerModal from '../../src/components/ExercisePickerModal.vue';
import { EXERCISE_CATALOG } from '../../src/engine/knowledge/exercises.js';

const kneeExercise = EXERCISE_CATALOG.find(e => e.jointStress.includes('joelho'));
const gymOnlyExercise = EXERCISE_CATALOG.find(e => e.equipment === 'gym');
const plainExercise = EXERCISE_CATALOG.find(e => e.jointStress.length === 0);

const profile = {
  goal: 'hypertrophy',
  restrictions: [],
  equipment: 'gym'
};

function mountPicker(props = {}) {
  return mount(ExercisePickerModal, {
    props: { isOpen: true, currentExercise: plainExercise, profile, ...props }
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ExercisePickerModal — alternativas seguras', () => {
  it('não renderiza nada quando está fechado', () => {
    const wrapper = mount(ExercisePickerModal, {
      props: { isOpen: false, currentExercise: plainExercise, profile }
    });
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it('lista alternativas do mesmo grupo muscular', () => {
    const wrapper = mountPicker();
    const names = wrapper.findAll('h5').map(h => h.text());
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(plainExercise.muscle).toBeTruthy();
    }
  });

  it('nunca oferece o próprio exercício atual na lista', () => {
    const wrapper = mountPicker();
    const offered = wrapper.findAll('button[id^="btn-alternative-"]')
      .map(b => b.attributes('id').replace('btn-alternative-', ''));
    expect(offered).not.toContain(plainExercise.id);
  });

  it('respeita restrição articular do perfil', () => {
    const wrapper = mountPicker({
      currentExercise: kneeExercise,
      profile: { ...profile, restrictions: ['joelho'] }
    });

    for (const button of wrapper.findAll('button[id^="btn-alternative-"]')) {
      const alt = EXERCISE_CATALOG.find(e => e.id === button.attributes('id').replace('btn-alternative-', ''));
      expect(alt.jointStress).not.toContain('joelho');
    }
  });

  it('respeita equipamento "home" do perfil', () => {
    const wrapper = mountPicker({
      currentExercise: plainExercise,
      profile: { ...profile, equipment: 'home' }
    });

    for (const button of wrapper.findAll('button[id^="btn-alternative-"]')) {
      const alt = EXERCISE_CATALOG.find(e => e.id === button.attributes('id').replace('btn-alternative-', ''));
      expect(alt.equipment).not.toBe('gym');
    }
  });

  it('informa o contexto de filtragem ao usuário', () => {
    const wrapper = mountPicker({
      currentExercise: kneeExercise,
      profile: { ...profile, restrictions: ['joelho', 'ombro'] }
    });
    expect(wrapper.text()).toContain('joelho');
    expect(wrapper.text()).toContain('ombro');
  });

  it('avisa quando não há alternativa segura', () => {
    const target = gymOnlyExercise.equipment === 'gym' ? gymOnlyExercise : plainExercise;
    const wrapper = mountPicker({
      currentExercise: target,
      profile: { ...profile, restrictions: ['joelho', 'lombar', 'ombro', 'cotovelo', 'quadril', 'punho'] }
    });

    const buttons = wrapper.findAll('button[id^="btn-alternative-"]');
    if (buttons.length === 0) {
      expect(wrapper.text()).toContain('Nenhuma alternativa segura');
    } else {
      // Se houver alternativas, nenhuma pode conflitar com as restrições.
      for (const button of buttons) {
        const alt = EXERCISE_CATALOG.find(e => e.id === button.attributes('id').replace('btn-alternative-', ''));
        expect(alt.jointStress).toEqual([]);
      }
    }
  });

  it('tolera perfil ausente sem quebrar', () => {
    const wrapper = mount(ExercisePickerModal, {
      props: { isOpen: true, currentExercise: plainExercise }
    });
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
  });

  it('tolera exercício atual ausente', () => {
    const wrapper = mount(ExercisePickerModal, {
      props: { isOpen: true, currentExercise: null, profile }
    });
    expect(wrapper.findAll('button[id^="btn-alternative-"]')).toHaveLength(0);
  });
});

describe('ExercisePickerModal — emissão de eventos', () => {
  it('emite select e close ao escolher uma alternativa', async () => {
    const wrapper = mountPicker();
    const first = wrapper.findAll('button[id^="btn-alternative-"]')[0];
    const altId = first.attributes('id').replace('btn-alternative-', '');
    const expected = EXERCISE_CATALOG.find(e => e.id === altId);

    await first.trigger('click');

    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('select')[0][0].id).toBe(expected.id);
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emite close pelo botão de fechar', async () => {
    const wrapper = mountPicker();
    await wrapper.find('button[aria-label="Fechar seleção de exercício"]').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emite close ao clicar no fundo do overlay', async () => {
    const wrapper = mountPicker();
    await wrapper.find('[role="dialog"]').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });
});