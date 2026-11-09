import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CosmeticsShopModal from '../../src/components/CosmeticsShopModal.vue';

describe('CosmeticsShopModal', () => {
  it('renderiza o saldo de moedas e catálogo de temas e títulos', async () => {
    const wrapper = mount(CosmeticsShopModal, {
      props: {
        isOpen: true,
        ironCoins: 450,
        unlockedThemes: ['blue', 'orange'],
        equippedTheme: 'blue',
        unlockedTitles: ['iniciante_ferro'],
        equippedTitle: 'iniciante_ferro'
      }
    });

    expect(wrapper.find('#modal-cosmetics-shop').exists()).toBe(true);
    expect(wrapper.text()).toContain('450 Moedas de Ferro');
    expect(wrapper.text()).toContain('Azul Cobalto Pro');
    expect(wrapper.text()).toContain('Cyberpunk Neon');

    // Botão de equipar tema laranja
    await wrapper.find('#btn-equip-theme-orange').trigger('click');
    expect(wrapper.emitted('equip-theme')).toHaveLength(1);
    expect(wrapper.emitted('equip-theme')[0]).toEqual(['orange']);

    // Alterna para aba de títulos
    await wrapper.find('#tab-shop-titles').trigger('click');
    expect(wrapper.text()).toContain('Titã do Supino');
    expect(wrapper.text()).toContain('Comprar (300)');

    // Clica para comprar título
    await wrapper.find('#btn-buy-title-tita_supino').trigger('click');
    expect(wrapper.emitted('unlock-title')).toHaveLength(1);
    expect(wrapper.emitted('unlock-title')[0]).toEqual([{ titleId: 'tita_supino', price: 300 }]);
  });

  it('emite close ao clicar no botão fechar', async () => {
    const wrapper = mount(CosmeticsShopModal, {
      props: {
        isOpen: true
      }
    });

    await wrapper.find('#btn-close-shop').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
