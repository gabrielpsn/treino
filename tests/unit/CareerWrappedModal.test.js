import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CareerWrappedModal from '../../src/components/CareerWrappedModal.vue';

describe('CareerWrappedModal', () => {
  it('renderiza os dados de retrospectiva acumulada', async () => {
    const historySessions = [
      {
        sets: [
          { exerciseId: 'supino_reto', isDone: true, weight: 100, reps: 10 },
          { exerciseId: 'agachamento', isDone: true, weight: 140, reps: 6 }
        ]
      }
    ];

    const wrapper = mount(CareerWrappedModal, {
      props: {
        isOpen: true,
        historySessions,
        gamificationState: {
          lifetimeTonnageKg: 35000,
          dailyStreak: 12,
          ironCoins: 400
        },
        userProfile: {
          userName: 'Mariana'
        }
      }
    });

    expect(wrapper.find('#modal-career-wrapped').exists()).toBe(true);
    expect(wrapper.text()).toContain('35.000');
    expect(wrapper.text()).toContain('140 kg');
    expect(wrapper.text()).toContain('12 dias');

    await wrapper.find('#btn-close-wrapped').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
