import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VersionUpdatePrompt from '../../src/components/VersionUpdatePrompt.vue';

describe('VersionUpdatePrompt', () => {
  it('não renderiza o card quando visible é false', () => {
    const wrapper = mount(VersionUpdatePrompt, {
      props: { visible: false }
    });
    expect(wrapper.find('#pwa-update-prompt').exists()).toBe(false);
  });

  it('renderiza o card de nova versão com atributos de acessibilidade quando visible é true', () => {
    const wrapper = mount(VersionUpdatePrompt, {
      props: { visible: true, isWeightLoss: false }
    });
    const prompt = wrapper.find('#pwa-update-prompt');
    expect(prompt.exists()).toBe(true);
    expect(prompt.attributes('role')).toBe('alert');
    expect(prompt.attributes('aria-live')).toBe('polite');
    expect(wrapper.text()).toContain('Atualização Pronta!');
    expect(wrapper.text()).toContain('Atualizar agora');
  });

  it('emite evento update ao clicar em Atualizar agora', async () => {
    const wrapper = mount(VersionUpdatePrompt, {
      props: { visible: true }
    });
    const btn = wrapper.find('#btn-pwa-update-now');
    expect(btn.exists()).toBe(true);
    await btn.trigger('click');
    expect(wrapper.emitted('update')).toHaveLength(1);
  });

  it('emite evento dismiss ao clicar em Depois ou no botão fechar', async () => {
    const wrapper = mount(VersionUpdatePrompt, {
      props: { visible: true }
    });
    const btnDismiss = wrapper.find('#btn-pwa-dismiss');
    expect(btnDismiss.exists()).toBe(true);
    await btnDismiss.trigger('click');
    expect(wrapper.emitted('dismiss')).toHaveLength(1);
  });

  it('aplica estilo de emagrecimento (rose) quando isWeightLoss é true', () => {
    const wrapper = mount(VersionUpdatePrompt, {
      props: { visible: true, isWeightLoss: true }
    });
    const updateBtn = wrapper.find('#btn-pwa-update-now');
    expect(updateBtn.classes()).toContain('bg-rose-500');
  });
});
