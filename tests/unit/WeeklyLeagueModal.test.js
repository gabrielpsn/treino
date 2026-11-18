import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import WeeklyLeagueModal from '../../src/components/WeeklyLeagueModal.vue';

describe('WeeklyLeagueModal', () => {
  it('renderiza a divisão e os competidores da liga', async () => {
    const wrapper = mount(WeeklyLeagueModal, {
      props: {
        isOpen: true,
        userScore: 420,
        currentTier: 'silver',
        userName: 'Gabriel Pro'
      }
    });

    expect(wrapper.find('#modal-weekly-league').exists()).toBe(true);
    expect(wrapper.text()).toContain('Liga Prata');
    expect(wrapper.text()).toContain('Gabriel Pro');
    expect(wrapper.text()).toContain('420 pts');
    // Rivais são virtuais e a tela precisa dizer isso: 9 bots, o usuário não.
    expect(wrapper.text()).toContain('rivais virtuais');
    expect(wrapper.findAll('#modal-weekly-league [id^="league-row-"]').filter(r => r.text().includes('Rival virtual'))).toHaveLength(9);
    expect(wrapper.find('#league-user-row').text()).not.toContain('Rival virtual');

    await wrapper.find('#btn-close-league').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
