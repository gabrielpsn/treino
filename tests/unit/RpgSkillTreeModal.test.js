import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RpgSkillTreeModal from '../../src/components/RpgSkillTreeModal.vue';

describe('RpgSkillTreeModal', () => {
  it('renderiza os 4 ramos de habilidade com seus níveis e arquétipo dominante', () => {
    const wrapper = mount(RpgSkillTreeModal, {
      props: {
        isOpen: true,
        rpgBranches: {
          push: 400, // Nv. 2
          pull: 100, // Nv. 1
          legs: 600, // Nv. 3 (Dominante)
          core: 150  // Nv. 2
        }
      }
    });

    expect(wrapper.find('#modal-rpg-skill-tree').exists()).toBe(true);
    expect(wrapper.text()).toContain('Tronco Superior');
    expect(wrapper.text()).toContain('Dorsal & Puxada');
    expect(wrapper.text()).toContain('Membros Inferiores');
    expect(wrapper.text()).toContain('Blindagem & Centro');

    // Membros Inferiores tem mais XP, logo é o arquétipo dominante
    expect(wrapper.text()).toContain('Colosso do Leg Day');

    // Cards individuais existem
    expect(wrapper.find('#branch-card-push').exists()).toBe(true);
    expect(wrapper.find('#branch-card-legs').exists()).toBe(true);
  });

  it('emite close ao clicar no botão fechar', async () => {
    const wrapper = mount(RpgSkillTreeModal, {
      props: {
        isOpen: true
      }
    });

    await wrapper.find('#btn-close-skill-tree').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
