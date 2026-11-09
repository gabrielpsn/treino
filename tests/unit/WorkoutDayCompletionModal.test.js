import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import WorkoutDayCompletionModal from '../../src/components/WorkoutDayCompletionModal.vue';

describe('WorkoutDayCompletionModal', () => {
  const allDays = [
    { id: 'seg', label: 'Segunda', shortLabel: 'Seg' },
    { id: 'ter', label: 'Terça', shortLabel: 'Ter' },
    { id: 'qua', label: 'Quarta', shortLabel: 'Qua' },
    { id: 'qui', label: 'Quinta', shortLabel: 'Qui' },
    { id: 'sex', label: 'Sexta', shortLabel: 'Sex' },
    { id: 'sab', label: 'Sábado', shortLabel: 'Sáb' },
    { id: 'dom', label: 'Domingo', shortLabel: 'Dom' }
  ];

  it('não renderiza quando isOpen é false', () => {
    const wrapper = mount(WorkoutDayCompletionModal, {
      props: { isOpen: false, suggestedDayId: 'seg' }
    });
    expect(wrapper.find('#workout-day-completion-modal').exists()).toBe(false);
  });

  it('renderiza quando isOpen é true com o dia sugerido e recompensa de XP', () => {
    const wrapper = mount(WorkoutDayCompletionModal, {
      props: {
        isOpen: true,
        suggestedDayId: 'seg',
        allDays,
        splitTitle: 'Treino A (Peito & Tríceps)',
        xpReward: 50
      }
    });

    expect(wrapper.find('#workout-day-completion-modal').exists()).toBe(true);
    expect(wrapper.text()).toContain('Concluir Dia no Quadro');
    expect(wrapper.text()).toContain('Treino A (Peito & Tríceps)');
    expect(wrapper.text()).toContain('+50 XP');
    expect(wrapper.find('#btn-confirm-day-completion').text()).toContain('Marcar Segunda (+50 XP)');
  });

  it('permite alternar o dia da semana a ser marcado', async () => {
    const wrapper = mount(WorkoutDayCompletionModal, {
      props: {
        isOpen: true,
        suggestedDayId: 'seg',
        allDays,
        splitTitle: 'Treino B',
        xpReward: 50
      }
    });

    await wrapper.find('#btn-select-day-ter').trigger('click');
    expect(wrapper.find('#btn-confirm-day-completion').text()).toContain('Marcar Terça (+50 XP)');
  });

  it('emite confirm com dados completos da data ao clicar em confirmar', async () => {
    const wrapper = mount(WorkoutDayCompletionModal, {
      props: {
        isOpen: true,
        suggestedDayId: 'qua',
        allDays,
        splitTitle: 'Treino C',
        xpReward: 50
      }
    });

    await wrapper.find('#btn-confirm-day-completion').trigger('click');
    const emitted = wrapper.emitted('confirm');
    expect(emitted).toHaveLength(1);
    expect(emitted[0][0].dayId).toBe('qua');
    expect(emitted[0][0].dayLabel).toBe('Quarta');
    expect(emitted[0][0].completedDate).toBeDefined();
    expect(emitted[0][0].completedAt).toBeDefined();
  });

  it('emite skip ao clicar no botão de pular ou fechar', async () => {
    const wrapper = mount(WorkoutDayCompletionModal, {
      props: { isOpen: true, suggestedDayId: 'seg' }
    });

    await wrapper.find('#btn-skip-day-completion').trigger('click');
    expect(wrapper.emitted('skip')).toHaveLength(1);

    await wrapper.find('#btn-close-day-completion').trigger('click');
    expect(wrapper.emitted('skip')).toHaveLength(2);
  });
});
