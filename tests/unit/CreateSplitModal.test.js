import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CreateSplitModal from '../../src/components/CreateSplitModal.vue';

describe('CreateSplitModal', () => {
  it('não renderiza quando isOpen é false', () => {
    const wrapper = mount(CreateSplitModal, {
      props: { isOpen: false }
    });
    expect(wrapper.find('#create-split-modal').exists()).toBe(false);
  });

  it('sugere o próximo título com base nas fichas existentes', () => {
    const wrapper = mount(CreateSplitModal, {
      props: {
        isOpen: true,
        existingSplits: [{ id: 'treino-a' }, { id: 'treino-b' }, { id: 'treino-c' }]
      }
    });
    const titleInput = wrapper.find('#input-split-title');
    expect(titleInput.element.value).toBe('Treino D');
  });

  it('valida título obrigatório', async () => {
    const wrapper = mount(CreateSplitModal, {
      props: { isOpen: true, existingSplits: [] }
    });
    const titleInput = wrapper.find('#input-split-title');
    await titleInput.setValue('');
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.find('#error-split-title').text()).toContain('Informe o nome');
    expect(wrapper.emitted('create')).toBeUndefined();
  });

  it('emite evento create com dados completos e cor selecionada', async () => {
    const wrapper = mount(CreateSplitModal, {
      props: { isOpen: true, existingSplits: [{ id: 'treino-a' }] }
    });

    await wrapper.find('#input-split-title').setValue('Treino Glúteos & Posterior');
    await wrapper.find('#input-split-subtitle').setValue('Foco em cadeia posterior');
    await wrapper.find('#btn-color-purple').trigger('click');
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.emitted('create')).toHaveLength(1);
    const [payload] = wrapper.emitted('create')[0];
    expect(payload.title).toBe('Treino Glúteos & Posterior');
    expect(payload.subtitle).toBe('Foco em cadeia posterior');
    expect(payload.color).toBe('purple');
    expect(payload.accentBg).toContain('purple');
  });

  it('emite update ao editar ficha existente', async () => {
    const wrapper = mount(CreateSplitModal, {
      props: {
        isOpen: true,
        editingSplit: {
          id: 'treino-a',
          title: 'Treino A Antigo',
          subtitle: 'Sub antigo',
          color: 'blue'
        }
      }
    });

    const titleInput = wrapper.find('#input-split-title');
    expect(titleInput.element.value).toBe('Treino A Antigo');
    await titleInput.setValue('Treino A Novo');
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.emitted('update')).toHaveLength(1);
    const [payload] = wrapper.emitted('update')[0];
    expect(payload.splitId).toBe('treino-a');
    expect(payload.title).toBe('Treino A Novo');
  });

  it('emite close ao clicar em cancelar ou fechar', async () => {
    const wrapper = mount(CreateSplitModal, {
      props: { isOpen: true }
    });
    await wrapper.find('#btn-close-create-split').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
