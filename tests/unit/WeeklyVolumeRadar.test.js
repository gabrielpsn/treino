import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import WeeklyVolumeRadar from '../../src/components/WeeklyVolumeRadar.vue';

describe('WeeklyVolumeRadar', () => {
  it('renderiza os grupos musculares e calcula os grupos em déficit', () => {
    const weeklySessions = [
      {
        sets: [
          { exerciseId: 'supino_reto', isDone: true, weight: 80, reps: 10 },
          { exerciseId: 'supino_reto', isDone: true, weight: 80, reps: 10 },
          { exerciseId: 'supino_reto', isDone: true, weight: 80, reps: 10 }
        ]
      }
    ];

    const muscleMap = {
      supino_reto: 'peito'
    };

    const wrapper = mount(WeeklyVolumeRadar, {
      props: {
        weeklySessions,
        liveWorkoutLogs: {},
        exerciseMuscleMap: muscleMap
      }
    });

    expect(wrapper.find('#widget-weekly-volume-radar').exists()).toBe(true);
    expect(wrapper.text()).toContain('Peitoral');
    expect(wrapper.text()).toContain('Costas / Dorsal');
    expect(wrapper.find('#alert-lagging-muscles').exists()).toBe(true);
  });
});
