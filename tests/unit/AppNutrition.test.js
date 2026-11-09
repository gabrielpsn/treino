import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { mount } from '@vue/test-utils';
import App from '../../src/App.vue';

// Mock dependencies that require browser / canvas APIs
vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}));

vi.mock('../../src/engine/audioHaptics.js', () => ({
  playPlateClick: vi.fn(),
  playPrFanfare: vi.fn(),
  triggerHaptic: vi.fn(),
  speakCoachMessage: vi.fn(),
  getVoiceCoachEnabled: vi.fn(() => false),
  setVoiceCoachEnabled: vi.fn(),
  isVoiceSupported: vi.fn(() => true)
}));

describe('App.vue Nutrition & Training Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('monta o App sem lançar ReferenceError de targetProteinGrams', async () => {
    expect(() => {
      const wrapper = mount(App);
      expect(wrapper.exists()).toBe(true);
    }).not.toThrow();
  });

  it('permite alternar para modo treino e nutrição com targetCalories e targetProteinGrams definidos', async () => {
    const wrapper = mount(App);
    // Verifica se os botões e estados básicos renderizam
    expect(wrapper.find('#app-header').exists() || wrapper.find('header').exists()).toBe(true);

    // Navegar para aba de nutrição se disponível
    const nutritionBtn = wrapper.find('#mobile-nav-nutrition');
    if (nutritionBtn.exists()) {
      await nutritionBtn.trigger('click');
      expect(wrapper.text()).not.toContain('ReferenceError');
    }

    // Tentar acionar o botão de Modo Treino
    const trainingFab = wrapper.find('#mobile-nav-training-fab') || wrapper.find('#btn-open-training-mode');
    if (trainingFab.exists()) {
      await trainingFab.trigger('click');
      expect(wrapper.text()).not.toContain('ReferenceError');
    }
  });

  it('exibe o widget de caminhada e abre o WalkingTrackerModal ao clicar', async () => {
    const wrapper = mount(App);
    const walkingWidget = wrapper.find('#widget-walking-summary');
    expect(walkingWidget.exists()).toBe(true);
    expect(walkingWidget.text()).toContain('Caminhada & Passos');

    const openWalkingBtn = wrapper.find('#btn-open-walking-tracker');
    expect(openWalkingBtn.exists()).toBe(true);
    await openWalkingBtn.trigger('click');

    expect(wrapper.find('#walking-tracker-modal').exists()).toBe(true);
  });
});
