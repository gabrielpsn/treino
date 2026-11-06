import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MuscleBodyMap from '../../src/components/MuscleBodyMap.vue';

describe('MuscleBodyMap', () => {
  it('renderiza visão frontal e traseira por padrão (both)', () => {
    const wrapper = mount(MuscleBodyMap, {
      props: {
        highlightedMuscles: ['peito', 'biceps']
      }
    });

    expect(wrapper.find('#body-front').exists()).toBe(true);
    expect(wrapper.find('#body-back').exists()).toBe(true);
  });

  it('alterna visualização para apenas frente e apenas costas', async () => {
    const wrapper = mount(MuscleBodyMap, {
      props: {
        highlightedMuscles: ['peito'],
        showControls: true
      }
    });

    // Clica em "Frente"
    await wrapper.find('#btn-view-front').trigger('click');
    expect(wrapper.find('#body-front').exists()).toBe(true);
    expect(wrapper.find('#body-back').exists()).toBe(false);

    // Clica em "Costas"
    await wrapper.find('#btn-view-back').trigger('click');
    expect(wrapper.find('#body-front').exists()).toBe(false);
    expect(wrapper.find('#body-back').exists()).toBe(true);

    // Clica em "Frente & Costas"
    await wrapper.find('#btn-view-both').trigger('click');
    expect(wrapper.find('#body-front').exists()).toBe(true);
    expect(wrapper.find('#body-back').exists()).toBe(true);
  });

  it('destaca músculos primários e secundários com as classes corretas', () => {
    const wrapper = mount(MuscleBodyMap, {
      props: {
        highlightedMuscles: ['peito'],
        secondaryMuscles: ['triceps']
      }
    });

    // Peitoral esquerdo deve ter classe primária (fill-orange-500)
    const peitoPath = wrapper.find('#muscle-front-peito-left');
    expect(peitoPath.exists()).toBe(true);
    expect(peitoPath.classes()).toContain('fill-orange-500');

    // Tríceps deve ter classe secundária (fill-amber-400/80)
    const tricepsPath = wrapper.find('#muscle-back-triceps-left');
    expect(tricepsPath.exists()).toBe(true);
    expect(tricepsPath.classes()).toContain('fill-amber-400/80');
  });

  it('emite evento select-muscle ao clicar em um grupo muscular interativo', async () => {
    const wrapper = mount(MuscleBodyMap, {
      props: {
        interactive: true
      }
    });

    const ombroPath = wrapper.find('#muscle-front-ombro-left');
    await ombroPath.trigger('click');

    expect(wrapper.emitted('select-muscle')).toHaveLength(1);
    expect(wrapper.emitted('select-muscle')[0]).toEqual(['ombro']);
  });

  it('aplica idPrefix corretamente quando fornecido', () => {
    const wrapper = mount(MuscleBodyMap, {
      props: {
        idPrefix: 'modal-',
        showControls: true
      }
    });

    expect(wrapper.find('#modal-body-front').exists()).toBe(true);
    expect(wrapper.find('#modal-btn-view-front').exists()).toBe(true);
  });
});
