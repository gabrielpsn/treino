import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import YearlyHeatmapWidget from '../../src/components/YearlyHeatmapWidget.vue';

describe('YearlyHeatmapWidget', () => {
  it('renderiza o mapa de calor com semanas e métricas', async () => {
    const history = [
      {
        dayKey: '2026-11-09',
        sets: [
          { isDone: true, weight: 100, reps: 10 },
          { isDone: true, weight: 100, reps: 10 }
        ]
      }
    ];

    const wrapper = mount(YearlyHeatmapWidget, {
      props: {
        historySessions: history
      }
    });

    expect(wrapper.find('#widget-yearly-heatmap').exists()).toBe(true);
    expect(wrapper.text()).toContain('Mapa de Calor de Consistência');
    expect(wrapper.text()).toContain('dias ativos');
    expect(wrapper.text()).toContain('séries');
  });
});
