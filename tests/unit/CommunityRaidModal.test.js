import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CommunityRaidModal from '../../src/components/CommunityRaidModal.vue';

describe('CommunityRaidModal', () => {
  it('renderiza o monumento, progresso e marcos da raid', async () => {
    const wrapper = mount(CommunityRaidModal, {
      props: {
        isOpen: true,
        userMonthlyTonnageKg: 30000,
        claimedMilestones: [25]
      }
    });

    expect(wrapper.find('#modal-community-raid').exists()).toBe(true);
    expect(wrapper.text()).toContain('Raid Comunitária Mensal');
    expect(wrapper.text()).toContain('30.000 kg levantados');

    // Botão de fechar emite close
    await wrapper.find('#btn-close-raid').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
