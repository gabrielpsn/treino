import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ExerciseDetailsModal from '../../src/components/ExerciseDetailsModal.vue';

describe('ExerciseDetailsModal', () => {
  const dummyExercise = {
    id: 'supino-reto',
    name: 'Supino Reto com Barra',
    muscle: 'peito',
    pattern: 'push_horizontal',
    defaultSeries: '4 séries',
    rest: '90s',
    tips: 'Manter escápulas aduzidas e pés firmes no chão.'
  };

  it('não renderiza quando isOpen é false', () => {
    const wrapper = mount(ExerciseDetailsModal, {
      props: {
        isOpen: false,
        exercise: dummyExercise
      }
    });

    expect(wrapper.find('#exercise-details-modal').exists()).toBe(false);
  });

  it('renderiza título, músculo alvo e padrão de movimento', () => {
    const wrapper = mount(ExerciseDetailsModal, {
      props: {
        isOpen: true,
        exercise: dummyExercise
      }
    });

    expect(wrapper.find('#detail-exercise-name').text()).toBe('Supino Reto com Barra');
    expect(wrapper.find('#detail-exercise-muscle-badge').text()).toContain('Peito');
    expect(wrapper.text()).toContain('Empurrar horizontal');
  });

  it('permite alternar entre as 3 abas: Imagem, Músculo e Descrição', async () => {
    const wrapper = mount(ExerciseDetailsModal, {
      props: {
        isOpen: true,
        exercise: dummyExercise
      }
    });

    // Padrão inicia na aba "image"
    expect(wrapper.find('#detail-panel-image').exists()).toBe(true);

    // Clica na aba Músculo
    await wrapper.find('#tab-btn-detail-muscle').trigger('click');
    expect(wrapper.find('#detail-panel-muscle').exists()).toBe(true);
    expect(wrapper.find('#detail-body-front').exists()).toBe(true);

    // Clica na aba Descrição
    await wrapper.find('#tab-btn-detail-description').trigger('click');
    expect(wrapper.find('#detail-panel-description').exists()).toBe(true);
    expect(wrapper.find('#detail-exercise-tips').text()).toContain('Manter escápulas aduzidas');
  });

  it('emite evento close ao clicar em Voltar ou no X', async () => {
    const wrapper = mount(ExerciseDetailsModal, {
      props: {
        isOpen: true,
        exercise: dummyExercise
      }
    });

    await wrapper.find('#btn-close-exercise-details').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);

    await wrapper.find('#btn-close-exercise-details-x').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(2);
  });
});
