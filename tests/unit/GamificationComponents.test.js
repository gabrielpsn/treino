import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import GamificationIronStatus from '../../src/components/GamificationIronStatus.vue';
import WorkoutTonnageLiveWidget from '../../src/components/WorkoutTonnageLiveWidget.vue';
import WorkoutCelebrationModal from '../../src/components/WorkoutCelebrationModal.vue';

describe('Gamification Vue Components', () => {
  describe('GamificationIronStatus', () => {
    it('renderiza nível, patente e ofensiva', () => {
      const wrapper = mount(GamificationIronStatus, {
        props: {
          totalXp: 1200,
          streak: 4,
          shields: 2
        }
      });

      expect(wrapper.find('#widget-iron-status').exists()).toBe(true);
      expect(wrapper.text()).toContain('Nv.');
      expect(wrapper.text()).toContain('4 sem');
      expect(wrapper.text()).toContain('2/2');
    });
  });

  describe('WorkoutTonnageLiveWidget', () => {
    it('renderiza tonelagem em tempo real e equivalência', () => {
      const wrapper = mount(WorkoutTonnageLiveWidget, {
        props: {
          tonnageKg: 3500,
          doneSets: 8,
          totalSets: 12,
          prsCount: 1,
          earnedXp: 180,
          realWorldEquivalence: '3.5 carros populares levantados'
        }
      });

      expect(wrapper.find('#widget-live-tonnage').exists()).toBe(true);
      expect(wrapper.text()).toContain('3.500');
      expect(wrapper.text()).toContain('carros populares');
      expect(wrapper.text()).toContain('8 de 12');
      expect(wrapper.find('#badge-session-prs').text()).toContain('1 Novo PR');
    });
  });

  describe('WorkoutCelebrationModal', () => {
    it('renderiza quando isOpen é true e emite close', async () => {
      const wrapper = mount(WorkoutCelebrationModal, {
        props: {
          isOpen: true,
          tonnageKg: 6200,
          doneSets: 15,
          earnedXp: 280,
          realWorldEquivalence: '1 elefante africano erguido',
          newBadges: [
            { id: 'century_club', title: 'Clube dos Três Dígitos', description: 'Levantou 100 kg', icon: '🏆', xpReward: 300 }
          ]
        }
      });

      expect(wrapper.find('#modal-workout-celebration').exists()).toBe(true);
      expect(wrapper.text()).toContain('Treino Concluído!');
      expect(wrapper.text()).toContain('6.200');
      expect(wrapper.text()).toContain('Clube dos Três Dígitos');

      await wrapper.find('#btn-close-celebration').trigger('click');
      expect(wrapper.emitted('close')).toHaveLength(1);
    });
  });
});
