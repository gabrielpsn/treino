import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PrCelebrationToast from '../../src/components/PrCelebrationToast.vue';

describe('PrCelebrationToast', () => {
  it('renderiza os detalhes do PR batido', async () => {
    const wrapper = mount(PrCelebrationToast, {
      props: {
        isOpen: true,
        exerciseName: 'Supino Reto com Barra',
        weightKg: 90,
        reps: 8,
        diffKg: 5
      }
    });

    expect(wrapper.find('#toast-pr-celebration').exists()).toBe(true);
    expect(wrapper.text()).toContain('Supino Reto com Barra');
    expect(wrapper.text()).toContain('90 kg');
    expect(wrapper.text()).toContain('+5 kg');

    await wrapper.find('#toast-pr-celebration').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
