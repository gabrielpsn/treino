import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AiPlanLoadingModal from '../../src/components/AiPlanLoadingModal.vue';

describe('AiPlanLoadingModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('não é renderizado quando isOpen é false', () => {
    const wrapper = mount(AiPlanLoadingModal, {
      props: { isOpen: false }
    });
    expect(wrapper.find('#ai-plan-loading-modal').exists()).toBe(false);
  });

  it('é renderizado quando isOpen é true com título e passos de loading', () => {
    const wrapper = mount(AiPlanLoadingModal, {
      props: { isOpen: true }
    });

    expect(wrapper.find('#ai-plan-loading-modal').exists()).toBe(true);
    expect(wrapper.text()).toContain('Gerando seu Novo Plano');
    expect(wrapper.text()).toContain('Agente Cloudflare Workers AI');
    expect(wrapper.find('#ai-progress-percentage').exists()).toBe(true);
    expect(wrapper.find('#ai-step-0').text()).toContain('1. Analisando perfil biométrico e rotina');
  });

  it('avança as etapas ao longo do tempo', async () => {
    const wrapper = mount(AiPlanLoadingModal, {
      props: { isOpen: true }
    });

    expect(wrapper.find('#ai-step-0').classes()).toContain('text-[#0F172A]');

    // Avança o timer em 1800ms
    vi.advanceTimersByTime(1850);
    await wrapper.vm.$nextTick();

    // Etapa 0 agora concluída (emerald), etapa 1 ativa
    expect(wrapper.find('#ai-step-0').classes()).toContain('text-emerald-800');
    expect(wrapper.find('#ai-step-1').classes()).toContain('text-[#0F172A]');

    // Avança mais 1800ms
    vi.advanceTimersByTime(1850);
    await wrapper.vm.$nextTick();

    expect(wrapper.find('#ai-step-1').classes()).toContain('text-emerald-800');
    expect(wrapper.find('#ai-step-2').classes()).toContain('text-[#0F172A]');
  });
});
