import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MonthlyBossWidget from '../../src/components/MonthlyBossWidget.vue';

describe('MonthlyBossWidget', () => {
  it('renderiza o Boss mensal com HP e dano causado', () => {
    const wrapper = mount(MonthlyBossWidget, {
      props: {
        monthlyTonnageKg: 15000,
        claimedMonths: []
      }
    });

    expect(wrapper.find('#widget-monthly-boss').exists()).toBe(true);
    expect(wrapper.text()).toContain('Chefe do Mês');
    expect(wrapper.text()).toContain('15.000 kg');
    expect(wrapper.text()).toContain('HP:');
  });

  it('exibe botão de resgate quando o Boss é derrotado e emite claim-reward', async () => {
    const wrapper = mount(MonthlyBossWidget, {
      props: {
        monthlyTonnageKg: 50000, // Cobre o HP
        claimedMonths: []
      }
    });

    expect(wrapper.text()).toContain('Derrotado!');
    expect(wrapper.find('#btn-claim-boss-reward').exists()).toBe(true);

    await wrapper.find('#btn-claim-boss-reward').trigger('click');
    expect(wrapper.emitted('claim-reward')).toHaveLength(1);
  });
});
