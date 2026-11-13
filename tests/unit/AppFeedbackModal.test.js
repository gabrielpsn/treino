import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AppFeedbackModal from '../../src/components/AppFeedbackModal.vue';

describe('AppFeedbackModal', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('não renderiza quando isOpen é false', () => {
    const wrapper = mount(AppFeedbackModal, {
      props: {
        isOpen: false,
        userName: 'Gabriel'
      }
    });

    expect(wrapper.find('#app-feedback-modal').exists()).toBe(false);
  });

  it('renderiza os controles de avaliação, 5 estrelas e categorias', () => {
    const wrapper = mount(AppFeedbackModal, {
      props: {
        isOpen: true,
        userName: 'Gabriel'
      }
    });

    expect(wrapper.find('#app-feedback-modal').exists()).toBe(true);
    expect(wrapper.find('#btn-star-1').exists()).toBe(true);
    expect(wrapper.find('#btn-star-5').exists()).toBe(true);
    expect(wrapper.find('#btn-submit-feedback').exists()).toBe(true);
    expect(wrapper.find('#btn-send-whatsapp').exists()).toBe(true);
  });

  it('permite selecionar estrelas e tags rápidas', async () => {
    const wrapper = mount(AppFeedbackModal, {
      props: {
        isOpen: true,
        userName: 'Gabriel'
      }
    });

    // Clica na 4ª estrela
    const star4 = wrapper.find('#btn-star-4');
    expect(star4.exists()).toBe(true);
    await star4.trigger('click');
    expect(wrapper.find('#star-rating-label').text()).toContain('Muito bom');

    // Clica em uma tag rápida
    const tagBtn = wrapper.find('#btn-tag-0');
    expect(tagBtn.exists()).toBe(true);
    await tagBtn.trigger('click');
    expect(tagBtn.classes()).toContain('bg-[#0066FF]');
  });

  it('emite close ao clicar no botão fechar', async () => {
    const wrapper = mount(AppFeedbackModal, {
      props: {
        isOpen: true,
        userName: 'Gabriel'
      }
    });

    await wrapper.find('#btn-close-feedback-modal').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
