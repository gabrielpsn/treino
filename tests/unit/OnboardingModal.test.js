import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import OnboardingModal from '../../src/components/OnboardingModal.vue';

describe('OnboardingModal — Campos limpos e validação obrigatória', () => {
  it('inicia com campos totalmente limpos/em branco quando não há perfil prévio', () => {
    const wrapper = mount(OnboardingModal, {
      props: {
        isOpen: true,
        initialProfile: null
      }
    });

    const inputName = wrapper.find('#input-user-name');
    const inputAge = wrapper.find('#input-age');
    const inputWeight = wrapper.find('#input-weight');
    const inputHeight = wrapper.find('#input-height');

    expect(inputName.element.value).toBe('');
    expect(inputAge.element.value).toBe('');
    expect(inputWeight.element.value).toBe('');
    expect(inputHeight.element.value).toBe('');

    // Nenhum botão de fechar deve existir no primeiro acesso
    expect(wrapper.find('#btn-close-onboarding').exists()).toBe(false);
  });

  it('não permite fechar o modal no primeiro acesso via ESC ou clique no overlay', async () => {
    const wrapper = mount(OnboardingModal, {
      props: {
        isOpen: true,
        initialProfile: null
      }
    });

    // Simula ESC
    await wrapper.find('#onboarding-modal').trigger('keydown.esc');
    expect(wrapper.emitted('close')).toBeFalsy();

    // Simula clique no backdrop
    await wrapper.find('#onboarding-modal-overlay').trigger('click');
    expect(wrapper.emitted('close')).toBeFalsy();
  });

  it('selecionar gênero não preenche o nome automaticamente com João ou Maria', async () => {
    const wrapper = mount(OnboardingModal, {
      props: {
        isOpen: true,
        initialProfile: null
      }
    });

    const inputName = wrapper.find('#input-user-name');
    expect(inputName.element.value).toBe('');

    await wrapper.find('#btn-gender-male').trigger('click');
    expect(inputName.element.value).toBe('');

    await wrapper.find('#btn-gender-female').trigger('click');
    expect(inputName.element.value).toBe('');
  });

  it('bloqueia o avanço para o Passo 2 se os campos obrigatórios do Passo 1 estiverem vazios', async () => {
    const wrapper = mount(OnboardingModal, {
      props: {
        isOpen: true,
        initialProfile: null
      }
    });

    // Tenta avançar com tudo em branco
    await wrapper.find('#btn-onboarding-next').trigger('click');

    // Permanece no passo 1
    expect(wrapper.text()).toContain('Passo 1 de 3');
    expect(wrapper.find('#onboarding-error-summary').exists()).toBe(true);
    expect(wrapper.find('#error-user-name').text()).toContain('Informe seu nome');
    expect(wrapper.find('#error-goal').text()).toContain('Selecione seu objetivo');
    expect(wrapper.find('#error-gender').text()).toContain('Selecione seu gênero');
    expect(wrapper.find('#error-age').text()).toContain('Informe sua idade');
    expect(wrapper.find('#error-weight').text()).toContain('Informe seu peso');
    expect(wrapper.find('#error-height').text()).toContain('Informe sua altura');
  });

  it('bloqueia o avanço com valores biométricos fora da faixa permitida', async () => {
    const wrapper = mount(OnboardingModal, {
      props: {
        isOpen: true,
        initialProfile: null
      }
    });

    await wrapper.find('#input-user-name').setValue('Teste Validação');
    await wrapper.find('#btn-goal-hypertrophy').trigger('click');
    await wrapper.find('#btn-gender-male').trigger('click');
    await wrapper.find('#input-age').setValue(5); // idade mínima é 12
    await wrapper.find('#input-weight').setValue(10); // peso mínimo é 30
    await wrapper.find('#input-height').setValue(50); // altura mínima é 120

    await wrapper.find('#btn-onboarding-next').trigger('click');

    expect(wrapper.text()).toContain('Passo 1 de 3');
    expect(wrapper.find('#error-age').text()).toContain('entre 12 e 100');
    expect(wrapper.find('#error-weight').text()).toContain('entre 30 e 300');
    expect(wrapper.find('#error-height').text()).toContain('entre 120 e 230');
  });

  it('permite avançar ao Passo 2 e valida Passo 2 e Passo 3 até salvar com sucesso', async () => {
    const wrapper = mount(OnboardingModal, {
      props: {
        isOpen: true,
        initialProfile: null
      }
    });

    // Preenche Passo 1 corretamente
    await wrapper.find('#input-user-name').setValue('Carlos Eduardo');
    await wrapper.find('#btn-goal-hypertrophy').trigger('click');
    await wrapper.find('#btn-gender-male').trigger('click');
    await wrapper.find('#input-age').setValue(28);
    await wrapper.find('#input-weight').setValue(82.5);
    await wrapper.find('#input-height').setValue(180);

    // Avança para o Passo 2
    await wrapper.find('#btn-onboarding-next').trigger('click');
    expect(wrapper.text()).toContain('Passo 2 de 3');

    // Tenta avançar do Passo 2 sem selecionar dias e experiência
    await wrapper.find('#btn-onboarding-next').trigger('click');
    expect(wrapper.text()).toContain('Passo 2 de 3');
    expect(wrapper.find('#error-days').text()).toContain('Selecione de 3 a 6 dias');
    expect(wrapper.find('#error-experience').text()).toContain('Selecione seu nível');

    // Preenche Passo 2
    await wrapper.find('#btn-days-4').trigger('click');
    await wrapper.find('#btn-exp-intermediate').trigger('click');

    // Avança para o Passo 3
    await wrapper.find('#btn-onboarding-next').trigger('click');
    expect(wrapper.text()).toContain('Passo 3 de 3');

    // Tenta submeter sem equipamento ou dieta
    await wrapper.find('#btn-onboarding-submit').trigger('click');
    expect(wrapper.find('#error-equipment').text()).toContain('Selecione o local');
    expect(wrapper.find('#error-dietary').text()).toContain('Selecione sua preferência');

    // Preenche Passo 3
    await wrapper.find('#btn-equip-gym').trigger('click');
    await wrapper.find('#btn-dietary-omnivore').trigger('click');

    // Submete com sucesso
    await wrapper.find('#btn-onboarding-submit').trigger('click');

    expect(wrapper.emitted('save')).toBeTruthy();
    const savedData = wrapper.emitted('save')[0][0];
    expect(savedData.userName).toBe('Carlos Eduardo');
    expect(savedData.goal).toBe('hypertrophy');
    expect(savedData.gender).toBe('male');
    expect(savedData.ageYears).toBe(28);
    expect(savedData.weightKg).toBe(82.5);
    expect(savedData.heightCm).toBe(180);
    expect(savedData.daysPerWeek).toBe(4);
    expect(savedData.experienceLevel).toBe('intermediate');
    expect(savedData.equipment).toBe('gym');
    expect(savedData.dietaryPreference).toBe('omnivore');
    expect(savedData.isConfigured).toBe(true);
  });

  it('preenche campos existentes e permite fechar quando initialProfile é fornecido', async () => {
    const existingProfile = {
      isConfigured: true,
      userName: 'Ana Paula',
      goal: 'weight_loss',
      gender: 'female',
      ageYears: 32,
      weightKg: 65,
      heightCm: 168,
      daysPerWeek: 5,
      experienceLevel: 'advanced',
      equipment: 'gym',
      restrictions: ['joelho'],
      dietaryPreference: 'vegetarian'
    };

    const wrapper = mount(OnboardingModal, {
      props: {
        isOpen: true,
        initialProfile: existingProfile
      }
    });

    expect(wrapper.find('#input-user-name').element.value).toBe('Ana Paula');
    expect(wrapper.find('#input-age').element.value).toBe('32');
    expect(wrapper.find('#input-weight').element.value).toBe('65');
    expect(wrapper.find('#input-height').element.value).toBe('168');

    // O botão de fechar deve existir para perfis já configurados
    const closeBtn = wrapper.find('#btn-close-onboarding');
    expect(closeBtn.exists()).toBe(true);

    await closeBtn.trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });
});
