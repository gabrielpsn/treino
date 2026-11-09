import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import HistoryPanel from '../../src/components/HistoryPanel.vue';

describe('HistoryPanel', () => {
  it('renderiza o painel com alternador de métrica de força', async () => {
    const sessions = [
      {
        id: 's1',
        dayKey: '2026-11-01',
        startedAt: '2026-11-01T10:00:00Z',
        sets: [
          { exerciseId: 'supino_reto', isDone: true, weight: 80, reps: 10 }
        ]
      },
      {
        id: 's2',
        dayKey: '2026-11-08',
        startedAt: '2026-11-08T10:00:00Z',
        sets: [
          { exerciseId: 'supino_reto', isDone: true, weight: 85, reps: 10 }
        ]
      }
    ];

    const wrapper = mount(HistoryPanel, {
      props: {
        sessions,
        splitTitles: { 'treino-a': 'Treino A' },
        exerciseNames: { supino_reto: 'Supino Reto' }
      }
    });

    expect(wrapper.find('#btn-metric-top-weight').exists()).toBe(true);
    expect(wrapper.find('#btn-metric-1rm').exists()).toBe(true);

    // Alterna para 1RM
    await wrapper.find('#btn-metric-1rm').trigger('click');
    expect(wrapper.text()).toContain('1RM');
  });
});
