import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BackupImportModal from '../../src/components/BackupImportModal.vue';

const summary = {
  exportedAt: '2026-03-10T12:00:00.000Z',
  userName: 'Ana',
  equipment: 'home',
  daysPerWeek: 4,
  splits: 3,
  exercises: 18,
  customExercises: 2,
  sessions: 7,
  sets: 42
};

function mountModal(props = {}) {
  return mount(BackupImportModal, {
    props: { isOpen: true, backup: { summary }, fileName: 'treino-backup.json', warnings: [], ...props }
  });
}

describe('BackupImportModal', () => {
  it('não renderiza quando está fechado', () => {
    const wrapper = mountModal({ isOpen: false });
    expect(wrapper.find('#backup-import-modal').exists()).toBe(false);
  });

  it('mostra o nome do arquivo e as contagens do backup', () => {
    const wrapper = mountModal();
    expect(wrapper.text()).toContain('treino-backup.json');
    expect(wrapper.find('#backup-stat-user').text()).toBe('Ana');
    expect(wrapper.find('#backup-stat-splits').text()).toBe('3');
    expect(wrapper.find('#backup-stat-exercises').text()).toBe('18');
    expect(wrapper.find('#backup-stat-custom').text()).toBe('2');
    expect(wrapper.find('#backup-stat-sessions').text()).toBe('7');
    expect(wrapper.find('#backup-stat-sets').text()).toBe('42');
  });

  it('avisa que a restauração substitui os dados atuais', () => {
    // O texto precisa dizer "substitui": é o que separa o botão de um restore
    // inofensivo de uma perda de dados que o usuário não percebeu.
    expect(mountModal().text()).toContain('substitui');
  });

  it('lista os ajustes que serão feitos ao restaurar', () => {
    const wrapper = mountModal({
      warnings: ['Backup antigo, sem versão: os exercícios próprios não serão restaurados.']
    });
    const list = wrapper.find('#backup-import-warnings');
    expect(list.exists()).toBe(true);
    expect(list.text()).toContain('Backup antigo');
  });

  it('esconde a lista de avisos quando não há nenhum', () => {
    expect(mountModal().find('#backup-import-warnings').exists()).toBe(false);
  });

  it('trata backup sem nome e sem data sem quebrar', () => {
    const wrapper = mountModal({
      backup: { summary: { ...summary, userName: null, exportedAt: null } }
    });
    expect(wrapper.find('#backup-stat-user').text()).toBe('sem nome');
    expect(wrapper.find('#backup-stat-date').text()).toBe('data desconhecida');
  });

  it('marca data inválida em vez de imprimir Invalid Date', () => {
    const wrapper = mountModal({
      backup: { summary: { ...summary, exportedAt: 'não é uma data' } }
    });
    expect(wrapper.find('#backup-stat-date').text()).toBe('data inválida');
  });

  it('emite confirm e close', async () => {
    const wrapper = mountModal();
    await wrapper.find('#btn-confirm-backup-import').trigger('click');
    await wrapper.find('#btn-cancel-backup-import').trigger('click');
    expect(wrapper.emitted('confirm')).toHaveLength(1);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});