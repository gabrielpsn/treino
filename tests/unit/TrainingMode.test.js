import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import TrainingMode from '../../src/components/TrainingMode.vue';
import { setVoiceCoachEnabled } from '../../src/engine/audioHaptics.js';

describe('TrainingMode Component', () => {
  beforeEach(() => {
    setVoiceCoachEnabled(true);
  });

  const dummySplit = {
    id: 'treino-a',
    title: 'Treino A - Peito e Tríceps',
    exercises: [
      {
        id: 'supino_reto',
        name: 'Supino Reto com Barra',
        muscle: 'peito',
        defaultSeries: '4 séries × 8 a 10 reps',
        defaultReps: 10,
        defaultWeight: 80,
        rest: '90s'
      }
    ]
  };

  it('renderiza o modo treino com o botão de treinador de voz AI', async () => {
    const wrapper = mount(TrainingMode, {
      props: {
        split: dummySplit,
        logs: {},
        lastSets: {},
        startedAt: new Date().toISOString()
      }
    });

    expect(wrapper.find('#training-mode').exists()).toBe(true);
    expect(wrapper.find('#btn-toggle-voice-coach').exists()).toBe(true);
    expect(wrapper.text()).toContain('Voz Ativa');

    // Alterna para mudo
    await wrapper.find('#btn-toggle-voice-coach').trigger('click');
    expect(wrapper.text()).toContain('Mudo');
  });
});
