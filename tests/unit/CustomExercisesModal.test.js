import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CustomExercisesModal from '../../src/components/CustomExercisesModal.vue';
import { validateCustomExercise, MUSCLE_LABELS, PATTERN_OPTIONS } from '../../src/db/customExercises.js';

const existing = validateCustomExercise({
  name: 'Supino na Arquinha',
  muscle: 'peito',
  pattern: 'push_horizontal',
  equipment: 'gym_or_home',
  jointStress: ['ombro'],
  defaultSeries: '4x 8-10 reps',
  rest: '75s',
  tips: 'Travessa na porta.'
}).value;

function mountModal(props = {}) {
  return mount(CustomExercisesModal, {
    props: { isOpen: true, exercises: [], ...props }
  });
}

describe('CustomExercisesModal — lista', () => {
  it('não renderiza quando está fechado', () => {
    const wrapper = mount(CustomExercisesModal, { props: { isOpen: false } });
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it('mostra estado vazio quando não há exercícios', () => {
    expect(mountModal().find('#custom-exercises-empty').exists()).toBe(true);
  });

  it('lista os exercícios do usuário com grupo e séries', () => {
    const wrapper = mountModal({ exercises: [existing] });
    const text = wrapper.text();
    expect(text).toContain('Supino na Arquinha');
    expect(text).toContain(MUSCLE_LABELS[existing.muscle]);
    expect(text).toContain(existing.defaultSeries);
  });

  it('avisa as articulações carregadas', () => {
    expect(mountModal({ exercises: [existing] }).text()).toContain('Ombro');
  });

  it('não exibe aviso de articulação quando o exercício não tem nenhuma', () => {
    const plain = { ...existing, jointStress: [] };
    const wrapper = mountModal({ exercises: [plain] });
    // O aviso é o único lugar onde a palavra aparece, então se ela sumiu o
    // badge de articulação também sumiu.
    expect(wrapper.text()).not.toContain('sobrecarrega ');
  });
});

describe('CustomExercisesModal — padrões por grupo', () => {
  it('oferece só os padrões do grupo escolhido', () => {
    const wrapper = mountModal();
    const select = wrapper.find('#select-custom-pattern');
    const options = select.findAll('option')
      .map(o => o.attributes('value'))
      .filter(Boolean);

    const muscle = wrapper.find('#select-custom-muscle').element.value;
    expect(options.sort()).toEqual([...PATTERN_OPTIONS[muscle]].sort());
  });

  it('trocar o grupo troca o padrão incompatível', async () => {
    const wrapper = mountModal();
    const select = wrapper.find('#select-custom-muscle');
    await select.setValue('costas');
    expect(PATTERN_OPTIONS.costas).toContain(wrapper.find('#select-custom-pattern').element.value);
  });
});

describe('CustomExercisesModal — seleção de equipamento e articulações', () => {
  it('marca equipamento por clique', async () => {
    const wrapper = mountModal();
    await wrapper.find('#btn-custom-equipment-home').trigger('click');
    expect(wrapper.find('#btn-custom-equipment-home').attributes('aria-pressed')).toBe('true');
    expect(wrapper.find('#btn-custom-equipment-gym_or_home').attributes('aria-pressed')).toBe('false');
  });

  it('liga e desliga articulação', async () => {
    const wrapper = mountModal();
    const btn = () => wrapper.find('#btn-custom-joint-joelho');
    expect(btn().attributes('aria-pressed')).toBe('false');
    await btn().trigger('click');
    expect(btn().attributes('aria-pressed')).toBe('true');
    await btn().trigger('click');
    expect(btn().attributes('aria-pressed')).toBe('false');
  });
});

describe('CustomExercisesModal — validação', () => {
  it('bloqueia envio com nome curto e mostra resumo', async () => {
    const wrapper = mountModal();
    await wrapper.find('#input-custom-name').setValue('ab');
    await wrapper.find('#custom-exercise-form').trigger('submit');

    expect(wrapper.emitted('save')).toBeUndefined();
    const summary = wrapper.find('#custom-exercises-error-summary');
    expect(summary.exists()).toBe(true);
    expect(wrapper.find('#error-custom-name').text()).toBeTruthy();
  });

  it('limpa o resumo ao corrigir e enviar de novo', async () => {
    const wrapper = mountModal();
    await wrapper.find('#input-custom-name').setValue('ab');
    await wrapper.find('#custom-exercise-form').trigger('submit');
    expect(wrapper.find('#custom-exercises-error-summary').exists()).toBe(true);

    await wrapper.find('#input-custom-name').setValue('Elevação Lateral com Elástico');
    await wrapper.find('#custom-exercise-form').trigger('submit');

    expect(wrapper.emitted('save')).toBeTruthy();
    expect(wrapper.emitted('save')[0][0].name).toBe('Elevação Lateral com Elástico');
  });

  it('marca campo inválido para leitores de tela', async () => {
    const wrapper = mountModal();
    await wrapper.find('#input-custom-name').setValue('ab');
    await wrapper.find('#custom-exercise-form').trigger('submit');
    expect(wrapper.find('#input-custom-name').attributes('aria-invalid')).toBe('true');
    expect(wrapper.find('#input-custom-name').attributes('aria-describedby')).toBe('error-custom-name');
  });

  it('limpa o formulário depois de salvar', async () => {
    const wrapper = mountModal();
    await wrapper.find('#input-custom-name').setValue('Elevação Lateral com Elástico');
    await wrapper.find('#custom-exercise-form').trigger('submit');

    expect(wrapper.emitted('save')).toBeTruthy();
    expect(wrapper.find('#input-custom-name').element.value).toBe('');
  });
});

describe('CustomExercisesModal — edição', () => {
  it('carrega os dados ao editar e reemitiu com o mesmo id', async () => {
    const wrapper = mountModal({ exercises: [existing] });
    await wrapper.find(`#btn-edit-custom-${existing.id}`).trigger('click');

    expect(wrapper.find('#input-custom-name').element.value).toBe(existing.name);
    expect(wrapper.find('#input-custom-series').element.value).toBe(existing.defaultSeries);
    expect(wrapper.find('#btn-custom-joint-ombro').attributes('aria-pressed')).toBe('true');

    await wrapper.find('#input-custom-rest').setValue('90s');
    await wrapper.find('#custom-exercise-form').trigger('submit');

    const saved = wrapper.emitted('save')[0][0];
    expect(saved.id).toBe(existing.id);
    expect(saved.rest).toBe('90s');
  });

  it('cancelar edição volta ao formulário em branco', async () => {
    const wrapper = mountModal({ exercises: [existing] });
    await wrapper.find(`#btn-edit-custom-${existing.id}`).trigger('click');
    await wrapper.find('#btn-cancel-edit-custom').trigger('click');
    expect(wrapper.find('#input-custom-name').element.value).toBe('');
  });
});

describe('CustomExercisesModal — exclusão', () => {
  it('pede confirmação antes de excluir', async () => {
    const wrapper = mountModal({ exercises: [existing] });
    await wrapper.find(`#btn-delete-custom-${existing.id}`).trigger('click');

    expect(wrapper.find('#custom-exercise-delete-confirm').exists()).toBe(true);
    expect(wrapper.emitted('delete')).toBeUndefined();
  });

  it('cancela sem emitir', async () => {
    const wrapper = mountModal({ exercises: [existing] });
    await wrapper.find(`#btn-delete-custom-${existing.id}`).trigger('click');
    await wrapper.find('#btn-cancel-delete-custom').trigger('click');

    expect(wrapper.find('#custom-exercise-delete-confirm').exists()).toBe(false);
    expect(wrapper.emitted('delete')).toBeUndefined();
  });

  it('emite delete com o id certo ao confirmar', async () => {
    const wrapper = mountModal({ exercises: [existing] });
    await wrapper.find(`#btn-delete-custom-${existing.id}`).trigger('click');
    await wrapper.find('#btn-confirm-delete-custom').trigger('click');
    expect(wrapper.emitted('delete')[0]).toEqual([existing.id]);
  });
});
describe('CustomExercisesModal — grupo pré-escolhido', () => {
  it('nasce no grupo informado por initialMuscle', () => {
    const wrapper = mountModal({ initialMuscle: 'posterior' });
    expect(wrapper.find('#select-custom-muscle').element.value).toBe('posterior');
    expect(PATTERN_OPTIONS.posterior).toContain(wrapper.find('#select-custom-pattern').element.value);
  });

  it('reage ao preset chegar com o modal já aberto', async () => {
    const wrapper = mountModal();
    expect(wrapper.find('#select-custom-muscle').element.value).toBe('peito');
    await wrapper.setProps({ initialMuscle: 'triceps' });
    expect(wrapper.find('#select-custom-muscle').element.value).toBe('triceps');
    expect(PATTERN_OPTIONS.triceps).toContain(wrapper.find('#select-custom-pattern').element.value);
  });

  it('ignora grupo desconhecido em vez de quebrar o formulário', () => {
    const wrapper = mountModal({ initialMuscle: 'gluteo_que_nao_existe' });
    expect(wrapper.find('#select-custom-muscle').element.value).toBe('peito');
  });

  it('não sobrescrebe o grupo de um exercício em edição', async () => {
    const wrapper = mountModal({ exercises: [existing] });
    await wrapper.find(`#btn-edit-custom-${existing.id}`).trigger('click');
    await wrapper.setProps({ initialMuscle: 'costas' });
    expect(wrapper.find('#select-custom-muscle').element.value).toBe('peito');
  });
});
