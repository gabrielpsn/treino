import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DailyActivityRings from '../../src/components/DailyActivityRings.vue';

describe('DailyActivityRings', () => {
  it('renderiza o widget com anéis e percentuais corretos', () => {
    const wrapper = mount(DailyActivityRings, {
      props: {
        workoutPercent: 75,
        workoutStatusText: '8 séries feitas',
        waterPercent: 60,
        waterText: '1500 / 2500 ml',
        creatineTaken: false
      }
    });

    expect(wrapper.find('#widget-daily-activity-rings').exists()).toBe(true);
    expect(wrapper.text()).toContain('75%');
    expect(wrapper.text()).toContain('8 séries feitas');
    expect(wrapper.text()).toContain('60%');
    expect(wrapper.text()).toContain('1500 / 2500 ml');
    expect(wrapper.text()).toContain('Marcar');
  });

  it('emite toggleCreatine ao clicar no card de creatina', async () => {
    const wrapper = mount(DailyActivityRings, {
      props: {
        workoutPercent: 100,
        workoutStatusText: 'Concluído',
        waterPercent: 100,
        waterText: '2500 / 2500 ml',
        creatineTaken: true
      }
    });

    expect(wrapper.text()).toContain('100% Concluído');
    expect(wrapper.text()).toContain('Tomada');

    await wrapper.find('[role="button"]').trigger('click');
    expect(wrapper.emitted('toggleCreatine')).toHaveLength(1);
  });
});
