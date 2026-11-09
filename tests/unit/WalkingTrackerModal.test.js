import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import WalkingTrackerModal from '../../src/components/WalkingTrackerModal.vue';

vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}));

vi.mock('../../src/engine/audioHaptics.js', () => ({
  playPlateClick: vi.fn(),
  playPrFanfare: vi.fn(),
  triggerHaptic: vi.fn(),
  speakCoachMessage: vi.fn()
}));

describe('WalkingTrackerModal', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('não renderiza o modal quando isOpen é false', () => {
    const wrapper = mount(WalkingTrackerModal, {
      props: {
        isOpen: false
      }
    });

    expect(wrapper.find('#walking-tracker-modal').exists()).toBe(false);
  });

  it('renderiza o modal com métricas de passos e km quando isOpen é true', () => {
    const wrapper = mount(WalkingTrackerModal, {
      props: {
        isOpen: true,
        userHeightCm: 175,
        userWeightKg: 75,
        todayDateStr: '2026-11-09'
      }
    });

    expect(wrapper.find('#walking-tracker-modal').exists()).toBe(true);
    expect(wrapper.find('#display-total-steps').exists()).toBe(true);
    expect(wrapper.find('#display-total-km').exists()).toBe(true);
    expect(wrapper.find('#btn-start-walking').exists()).toBe(true);
  });

  it('adiciona passos rápidos manualmente e emite steps-updated', async () => {
    const wrapper = mount(WalkingTrackerModal, {
      props: {
        isOpen: true,
        userHeightCm: 170,
        userWeightKg: 70,
        todayDateStr: '2026-11-09'
      }
    });

    const add500Btn = wrapper.find('#btn-add-500-steps');
    expect(add500Btn.exists()).toBe(true);
    await add500Btn.trigger('click');

    expect(wrapper.find('#display-total-steps').text()).toContain('500');
    expect(wrapper.emitted('steps-updated')).toBeTruthy();
    expect(wrapper.emitted('steps-updated')[0][0].steps).toBe(500);
  });

  it('emite goal-reached quando a meta diária é atingida', async () => {
    const wrapper = mount(WalkingTrackerModal, {
      props: {
        isOpen: true,
        userHeightCm: 170,
        userWeightKg: 70,
        todayDateStr: '2026-11-09'
      }
    });

    // Clica 8 vezes em +1000 passos para bater 8000
    const add1000Btn = wrapper.find('#btn-add-1000-steps');
    for (let i = 0; i < 8; i++) {
      await add1000Btn.trigger('click');
    }

    expect(wrapper.emitted('goal-reached')).toBeTruthy();
    expect(wrapper.emitted('goal-reached')[0][0].steps).toBeGreaterThanOrEqual(8000);
  });

  it('inicia e pausa sessão de caminhada', async () => {
    const wrapper = mount(WalkingTrackerModal, {
      props: {
        isOpen: true,
        userHeightCm: 170,
        userWeightKg: 70,
        todayDateStr: '2026-11-09'
      }
    });

    await wrapper.find('#btn-start-walking').trigger('click');
    expect(wrapper.find('#btn-pause-walking').exists()).toBe(true);
    expect(wrapper.find('#btn-finish-walking').exists()).toBe(true);

    await wrapper.find('#btn-pause-walking').trigger('click');
    expect(wrapper.find('#btn-pause-walking').text()).toContain('Retomar');

    await wrapper.find('#btn-finish-walking').trigger('click');
    expect(wrapper.find('#btn-start-walking').exists()).toBe(true);
  });
});
