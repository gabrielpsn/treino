import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

vi.mock('../../src/services/cloud.js', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    requestWeeklyCoach: vi.fn(async () => 'Boa semana!\n- Suba 2,5 kg no supino.'),
    listLeagues: vi.fn(async () => ({ leagues: [{ id: 'l1', name: 'Academia', members: 2 }] })),
    postLeagueScore: vi.fn(async () => ({})),
    getLeague: vi.fn(async () => ({
      id: 'l1', name: 'Academia', inviteCode: 'ABCD2345', isOwner: true, weekKey: '2026-W10',
      ranking: [{ position: 1, nickname: 'Bia', score: 300, isMe: false }, { position: 2, nickname: 'Eu', score: 120, isMe: true }]
    })),
    listMyTrainerMemberships: vi.fn(async () => ({ classes: [{ id: 'c1', name: 'Manhã', displayName: 'João', summaryUpdatedAt: null }] })),
    getTrainerInbox: vi.fn(async () => ({ plans: [{ id: 'p1', className: 'Manhã', note: 'Foco', createdAt: '2026-03-01T00:00:00Z', workoutSplits: [{ id: 'treino-a', title: 'Treino A', exercises: [{ id: 'x', name: 'Supino' }] }] }] })),
    listTrainerClasses: vi.fn(async () => ({ classes: [] })),
    uploadStudentSummary: vi.fn(async () => ({})),
    respondToTrainerPlan: vi.fn(async () => ({ status: 'accepted' }))
  };
});

import DeloadBanner from '../../src/components/DeloadBanner.vue';
import WeeklyCoachCard from '../../src/components/WeeklyCoachCard.vue';
import FriendsLeagueModal from '../../src/components/FriendsLeagueModal.vue';
import TrainerModal from '../../src/components/TrainerModal.vue';
import RemindersModal from '../../src/components/RemindersModal.vue';
import * as cloud from '../../src/services/cloud.js';

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('DeloadBanner', () => {
  const base = { reasons: ['3 de 4 exercícios sem evolução.'], prescription: { loadFactor: 0.6, targetRir: 4 } };

  it('sugere e emite start/dismiss', async () => {
    const w = mount(DeloadBanner, { props: { evaluation: { ...base, recommended: true, inDeload: false } } });
    expect(w.text()).toContain('3 de 4 exercícios');
    await w.find('#btn-start-deload').trigger('click');
    await w.find('#btn-dismiss-deload').trigger('click');
    expect(w.emitted('start')).toHaveLength(1);
    expect(w.emitted('dismiss')).toHaveLength(1);
  });

  it('em deload mostra a prescrição; sem recomendação não aparece', () => {
    const active = mount(DeloadBanner, { props: { evaluation: { ...base, recommended: false, inDeload: true } } });
    expect(active.text()).toContain('60%');
    const none = mount(DeloadBanner, { props: { evaluation: { ...base, recommended: false, inDeload: false } } });
    expect(none.find('#deload-banner').exists()).toBe(false);
  });
});

describe('WeeklyCoachCard', () => {
  const summary = { weekKey: '2026-W10', sessions: 2, plannedSessions: 4, volumeChangePct: 10, prs: [], stalled: [], weakMuscles: [] };

  it('mostra o texto local e troca pelo da IA, guardando em cache', async () => {
    const w = mount(WeeklyCoachCard, { props: { summary } });
    expect(w.find('#weekly-coach-text').text()).toContain('2 treino(s)');
    await w.find('#btn-weekly-coach-ai').trigger('click');
    await flushPromises();
    expect(w.find('#weekly-coach-text').text()).toContain('Suba 2,5 kg');
    const again = mount(WeeklyCoachCard, { props: { summary } });
    expect(again.find('#weekly-coach-text').text()).toContain('Suba 2,5 kg');
  });
});

describe('FriendsLeagueModal', () => {
  it('sem conta pede ativação', () => {
    const w = mount(FriendsLeagueModal, { props: { isOpen: true, weekKey: '2026-W10', myScore: 120 } });
    expect(w.find('#btn-online-activate').exists()).toBe(true);
  });

  it('com conta lista ligas, publica pontuação e mostra ranking real', async () => {
    cloud.saveCloudAccount({ accessCode: 'a.b' });
    const w = mount(FriendsLeagueModal, { props: { isOpen: false, weekKey: '2026-W10', myScore: 120 } });
    await w.setProps({ isOpen: true });
    await flushPromises();
    expect(cloud.postLeagueScore).toHaveBeenCalledWith(expect.anything(), 'l1', '2026-W10', 120);
    await w.find('#btn-open-league-l1').trigger('click');
    await flushPromises();
    expect(w.find('#friends-league-ranking').text()).toContain('Bia');
    expect(w.find('#friends-league-ranking').text()).toContain('(você)');
  });
});

describe('TrainerModal', () => {
  it('aluno aceita ficha recebida e o app recebe as fichas', async () => {
    cloud.saveCloudAccount({ accessCode: 'a.b' });
    const summary = { goal: 'hypertrophy' };
    const w = mount(TrainerModal, { props: { isOpen: false, studentSummary: summary } });
    await w.setProps({ isOpen: true });
    await flushPromises();
    expect(cloud.uploadStudentSummary).toHaveBeenCalledWith(expect.anything(), summary);
    await w.find('#btn-accept-plan-p1').trigger('click');
    await flushPromises();
    expect(cloud.respondToTrainerPlan).toHaveBeenCalledWith(expect.anything(), 'p1', true);
    expect(w.emitted('accept-plan')[0][0].workoutSplits[0].id).toBe('treino-a');
  });
});

describe('RemindersModal', () => {
  it('alterna dias e explica quando o navegador não suporta push', async () => {
    const w = mount(RemindersModal, { props: { isOpen: true } });
    await w.find('#btn-reminder-day-1').trigger('click');
    expect(w.find('#btn-reminder-day-1').attributes('aria-pressed')).toBe('false');
    expect(w.text()).toContain('não suporta notificações');
  });
});
