import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AppSideDrawer from '../../src/components/AppSideDrawer.vue';

describe('AppSideDrawer', () => {
  const dummyProfile = {
    userName: 'Paulo Costa',
    weightKg: 82,
    experienceLevel: 'intermediate'
  };

  it('não renderiza quando isOpen é false', () => {
    const wrapper = mount(AppSideDrawer, {
      props: {
        isOpen: false,
        userProfile: dummyProfile
      }
    });

    expect(wrapper.find('#app-side-drawer').exists()).toBe(false);
  });

  it('renderiza perfil do atleta e biometria', () => {
    const wrapper = mount(AppSideDrawer, {
      props: {
        isOpen: true,
        userProfile: dummyProfile
      }
    });

    expect(wrapper.find('#drawer-user-name').text()).toBe('Paulo Costa');
    expect(wrapper.text()).toContain('82 kg');
    expect(wrapper.text()).toContain('Intermediário');
  });

  it('emite navigate e close ao clicar em item de navegação', async () => {
    const wrapper = mount(AppSideDrawer, {
      props: {
        isOpen: true,
        userProfile: dummyProfile,
        activeTab: 'workout'
      }
    });

    await wrapper.find('#btn-drawer-nav-nutrition').trigger('click');
    expect(wrapper.emitted('navigate')).toHaveLength(1);
    expect(wrapper.emitted('navigate')[0]).toEqual(['nutrition']);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('emite close ao clicar no backdrop ou botão de fechar', async () => {
    const wrapper = mount(AppSideDrawer, {
      props: {
        isOpen: true,
        userProfile: dummyProfile
      }
    });

    await wrapper.find('#btn-close-drawer').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);

    await wrapper.find('#drawer-backdrop').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(2);
  });

  it('emite ações de treino (criar ficha, exercícios personalizados, gerar IA)', async () => {
    const wrapper = mount(AppSideDrawer, {
      props: {
        isOpen: true,
        userProfile: dummyProfile
      }
    });

    await wrapper.find('#btn-drawer-create-split').trigger('click');
    expect(wrapper.emitted('open-create-split')).toHaveLength(1);

    await wrapper.find('#btn-drawer-custom-exercises').trigger('click');
    expect(wrapper.emitted('open-custom-exercises')).toHaveLength(1);

    await wrapper.find('#btn-drawer-ai-plan').trigger('click');
    expect(wrapper.emitted('generate-ai-plan')).toHaveLength(1);

    await wrapper.find('#btn-drawer-walking').trigger('click');
    expect(wrapper.emitted('open-walking')).toHaveLength(1);
  });

  it('emite export-backup e import-backup', async () => {
    const wrapper = mount(AppSideDrawer, {
      props: {
        isOpen: true,
        userProfile: dummyProfile
      }
    });

    await wrapper.find('#btn-export-backup').trigger('click');
    expect(wrapper.emitted('export-backup')).toHaveLength(1);

    await wrapper.find('#btn-import-backup').trigger('click');
    expect(wrapper.emitted('import-backup')).toHaveLength(1);
  });
});
