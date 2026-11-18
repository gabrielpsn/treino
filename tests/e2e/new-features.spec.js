import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { completeOnboarding } from './helpers/onboarding.js';
import { EXERCISE_CATALOG } from '../../src/engine/knowledge/exercises.js';

/**
 * Funcionalidades novas: evolução corporal, vídeo de execução, coach semanal,
 * ligas reais, modo personal e backup na nuvem. As rotas online são simuladas
 * com page.route — o dev server não tem o Worker.
 */

async function onboard(page, options = {}) {
  await page.goto('/');
  await completeOnboarding(page, { name: 'Nova Feature', equipment: 'gym', ...options });
  await page.locator('#tab-btn-workout').click();
}

async function openDrawerItem(page, id) {
  await page.locator('#btn-open-menu').click();
  await expect(page.locator('#app-side-drawer')).toBeVisible();
  await page.locator(`#btn-drawer-${id}`).click();
}

/** Simula o Worker: conta, ligas e personal em memória. */
async function mockOnlineApi(page, { inboxPlans = [], syncBackup = null } = {}) {
  const calls = [];
  const leagues = [];
  await page.route('**/api/**', async route => {
    const req = route.request();
    const url = new URL(req.url());
    const body = req.postData() ? JSON.parse(req.postData()) : null;
    calls.push({ method: req.method(), path: url.pathname, body, auth: req.headers().authorization });
    const reply = (status, data) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (url.pathname === '/api/account') return reply(201, { accessCode: 'acc1.tok1' });
    if (url.pathname === '/api/sync' && req.method() === 'GET') return reply(200, { backup: syncBackup, updatedAt: syncBackup ? '2026-03-01T00:00:00.000Z' : null });
    if (url.pathname === '/api/sync') return reply(200, { updatedAt: '2026-03-02T00:00:00.000Z' });
    if (url.pathname === '/api/leagues' && req.method() === 'GET') return reply(200, { leagues });
    if (url.pathname === '/api/leagues' && req.method() === 'POST') {
      leagues.push({ id: 'l1', name: body.name, inviteCode: 'ABCD2345', isOwner: true, nickname: body.nickname, members: 1 });
      return reply(201, { id: 'l1', inviteCode: 'ABCD2345' });
    }
    if (url.pathname === '/api/leagues/l1/score') return reply(200, { score: body.score });
    if (url.pathname === '/api/leagues/l1') {
      return reply(200, {
        id: 'l1', name: leagues[0].name, inviteCode: 'ABCD2345', isOwner: true, weekKey: url.searchParams.get('week'),
        ranking: [{ position: 1, nickname: 'Rival Real', score: 999, isMe: false }, { position: 2, nickname: leagues[0].nickname, score: 0, isMe: true }]
      });
    }
    if (url.pathname === '/api/trainer/memberships') return reply(200, { classes: [{ id: 'c1', name: 'Turma Manhã', displayName: 'Aluno', summaryUpdatedAt: null }] });
    if (url.pathname === '/api/trainer/inbox' && req.method() === 'GET') return reply(200, { plans: inboxPlans });
    if (url.pathname.startsWith('/api/trainer/inbox/')) return reply(200, { status: body.accepted ? 'accepted' : 'declined' });
    if (url.pathname === '/api/trainer/classes') return reply(200, { classes: [] });
    if (url.pathname === '/api/trainer/summary') return reply(200, { classes: 1 });
    if (url.pathname === '/api/coach/weekly') return reply(200, { text: 'Semana sólida.\n- Aumente 2,5 kg no supino.' });
    if (url.pathname === '/api/gemini/plan') return reply(503, { error: 'sem IA', code: 'ai_disabled' });
    return reply(404, { error: 'não simulado', code: 'not_found' });
  });
  return calls;
}

test('Evolução corporal: registra peso e medida, e as fotos ficam só no aparelho', async ({ page }) => {
  await onboard(page);
  await openDrawerItem(page, 'body-progress');

  const modal = page.locator('#modal-body-progress');
  await expect(modal).toBeVisible();
  await page.locator('#input-body-weight').fill('82.4');
  await page.locator('#input-body-waistCm').fill('91');
  await page.locator('#btn-save-body-entry').click();
  await expect(page.locator('#body-entry-list')).toContainText('82.4 kg');
  await expect(page.locator('#body-entry-list')).toContainText('Cintura 91cm');

  await page.locator('#modal-body-progress-tab-diet').click();
  await expect(page.locator('#diet-adjustment')).toContainText('Ainda coletando dados');

  await page.locator('#modal-body-progress-tab-photos').click();
  await expect(modal).toContainText('só neste aparelho');

  // A medição sobrevive ao recarregar.
  await page.reload();
  await openDrawerItem(page, 'body-progress');
  await expect(page.locator('#body-entry-list')).toContainText('82.4 kg');
});

test('Vídeo de execução: busca no YouTube e link próprio validado', async ({ page }) => {
  await onboard(page);
  await page.locator('button[id^="btn-details-"]').first().click();
  await expect(page.locator('#exercise-details-modal')).toBeVisible();

  const youtube = page.locator('#link-youtube-search');
  await expect(youtube).toHaveAttribute('href', /youtube\.com\/results\?search_query=/);
  await expect(youtube).toHaveAttribute('rel', /noopener/);

  await page.locator('#input-exercise-video').fill('https://site-qualquer.com/video');
  await page.locator('#btn-save-exercise-video').click();
  await expect(page.locator('#exercise-video-error')).toBeVisible();

  await page.locator('#input-exercise-video').fill('https://youtu.be/abc123');
  await page.locator('#btn-save-exercise-video').click();
  await expect(page.locator('#link-custom-video')).toHaveAttribute('href', 'https://youtu.be/abc123');
});

test('Coach da semana: texto local no histórico e análise da IA sob demanda', async ({ page }) => {
  await mockOnlineApi(page);
  await onboard(page);
  await page.locator('#tab-btn-history').click();
  await expect(page.locator('#weekly-coach-card')).toBeVisible();
  await expect(page.locator('#weekly-coach-text')).toContainText('treino');
  await page.locator('#btn-weekly-coach-ai').click();
  await expect(page.locator('#weekly-coach-text')).toContainText('Aumente 2,5 kg no supino');
});

test('Liga com amigos: ativa recursos online, cria liga e vê ranking real', async ({ page }) => {
  const calls = await mockOnlineApi(page);
  await onboard(page);
  await openDrawerItem(page, 'friends-league');

  await page.locator('#btn-online-activate').click();
  await page.locator('#input-league-nickname').fill('Eu Mesmo');
  await page.locator('#input-new-league-name').fill('Academia do Bairro');
  await page.locator('#btn-create-league').click();

  const ranking = page.locator('#friends-league-ranking');
  await expect(ranking).toContainText('Rival Real');
  await expect(ranking).toContainText('(você)');
  expect(calls.some(c => c.path === '/api/leagues/l1/score' && c.auth === 'Bearer acc1.tok1')).toBe(true);
});

test('Modo personal: aluno aceita a ficha enviada e ela vira a ficha ativa', async ({ page }) => {
  const exercises = EXERCISE_CATALOG.filter(e => e.equipment === 'gym_or_home' || e.equipment === 'gym').slice(0, 3);
  const calls = await mockOnlineApi(page, {
    inboxPlans: [{
      id: 'p1',
      className: 'Turma Manhã',
      note: 'Capriche na técnica',
      createdAt: '2026-03-01T00:00:00.000Z',
      workoutSplits: [{ id: 'treino-a', title: 'Treino do Personal', exercises: exercises.map(e => ({ ...e, videoUrl: 'https://youtu.be/xyz' })) }]
    }]
  });
  await onboard(page);
  await openDrawerItem(page, 'trainer');
  await page.locator('#btn-online-activate').click();

  await expect(page.locator('#trainer-inbox')).toContainText('Capriche na técnica');
  await page.locator('#btn-accept-plan-p1').click();

  await expect(page.locator('#modal-trainer')).toBeHidden();
  await expect(page.locator('#ai-plan-status')).toContainText('enviada pelo seu personal');
  await expect(page.locator(`#exercise-card-${exercises[0].id}`)).toBeVisible();

  // O resumo enviado ao personal não leva o nome do usuário.
  const summary = calls.find(c => c.path === '/api/trainer/summary');
  expect(JSON.stringify(summary.body)).not.toContain('Nova Feature');
});

test('Aparelho novo: restaura pela nuvem direto do onboarding', async ({ page }) => {
  // Backup mínimo válido de outro aparelho.
  const syncBackup = {
    kind: 'treinopro-backup',
    version: 1,
    exportedAt: '2026-03-01T00:00:00.000Z',
    userProfile: {
      id: 'current_user', userName: 'Vindo da Nuvem', goal: 'hypertrophy', gender: 'female', ageYears: 30,
      weightKg: 62, heightCm: 165, daysPerWeek: 3, experienceLevel: 'beginner', equipment: 'gym',
      dietaryPreference: 'omnivore', restrictions: [], isConfigured: true
    },
    activePlan: null,
    customExercises: [],
    workoutLogs: [],
    weeklyChecks: [],
    sessions: []
  };
  await mockOnlineApi(page, { syncBackup });
  await page.goto('/');
  await expect(page.locator('#onboarding-modal')).toBeVisible();
  await page.locator('#btn-onboarding-restore-cloud').click();

  await page.locator('#input-cloud-code').fill('acc1.tok1');
  await page.locator('#btn-cloud-link').click();

  const importModal = page.locator('#backup-import-modal');
  await expect(importModal).toBeVisible();
  await expect(importModal.locator('#backup-stat-user')).toHaveText('Vindo da Nuvem');
  await importModal.locator('#btn-confirm-backup-import').click();

  await expect(page.locator('#onboarding-modal')).toBeHidden();
  await expect(page.locator('header')).toContainText('Vindo da Nuvem');
});

async function exportBackup(page) {
  await page.locator('#btn-open-menu').click();
  await expect(page.locator('#app-side-drawer')).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#btn-export-backup').click()
  ]);
  return JSON.parse(await readFile(await download.path(), 'utf-8'));
}

async function importBackup(page, content) {
  await page.locator('#btn-open-menu').click();
  await expect(page.locator('#app-side-drawer')).toBeVisible();
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.locator('#btn-import-backup').click()
  ]);
  await chooser.setFiles({ name: 'deload.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(content)) });
  const modal = page.locator('#backup-import-modal');
  await expect(modal).toBeVisible();
  await modal.locator('#btn-confirm-backup-import').click();
  await expect(modal).toBeHidden({ timeout: 5000 });
}

test('Deload: cargas estagnadas geram sugestão e, aceita, a ficha mostra a carga leve', async ({ page }) => {
  await onboard(page);
  const tab = page.locator('button[id^="btn-split-treino-"]').first();
  const splitId = (await tab.getAttribute('id')).replace('btn-split-', '');
  await tab.click();
  const ids = await page.locator(`#container-${splitId} [id^="exercise-card-"]`)
    .evaluateAll(els => els.map(e => e.id.replace('exercise-card-', '')).slice(0, 3));
  expect(ids.length).toBe(3);

  const backup = await exportBackup(page);
  const DAY = 86_400_000;
  // Cinco sessões nas últimas 4 semanas com exatamente a mesma carga.
  backup.sessions = [26, 20, 14, 8, 2].map((daysAgo, i) => {
    const startedAt = new Date(Date.now() - daysAgo * DAY).toISOString();
    return {
      id: i + 1,
      dayKey: startedAt.slice(0, 10),
      weekKey: null,
      startedAt,
      finishedAt: startedAt,
      splitId,
      goal: null,
      source: 'test',
      note: null,
      createdAt: startedAt,
      sets: ids.map(exerciseId => ({
        sessionId: i + 1, exerciseId, splitId, setNumber: 1, weight: '50', reps: '8', rir: '0', isDone: true, recordedAt: startedAt
      }))
    };
  });
  await importBackup(page, backup);
  await page.locator('#tab-btn-workout').click();

  const banner = page.locator('#deload-banner');
  await expect(banner).toBeVisible();
  await expect(banner).toContainText('sem evolução');
  await page.locator('#btn-start-deload').click();
  await expect(banner).toContainText('Semana de deload ativa');

  await page.locator(`#btn-split-${splitId}`).click();
  await expect(page.locator(`#deload-load-${ids[0]}`)).toContainText('30 kg');

  // Encerrar volta ao normal e não sugere de novo na mesma semana.
  await page.locator('#btn-end-deload').click();
  await expect(banner).toBeHidden();
});

test.describe('celular', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Início: card "Treino de hoje" abre o Modo Treino, que fica acima da barra inferior', async ({ page }) => {
    await page.goto('/');
    await completeOnboarding(page, { name: 'Iniciante Celular' });

    const card = page.locator('#today-workout-card');
    await expect(card).toBeInViewport();
    await expect(page.locator('#first-steps')).toBeVisible();
    await page.locator('#btn-start-today').click();

    const mode = page.getByRole('dialog', { name: 'Modo Treino' });
    await expect(mode).toBeVisible();
    // O botão de concluir não pode ficar coberto pela barra de navegação.
    const finish = mode.locator('footer button').first();
    const box = await finish.boundingBox();
    const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('footer') !== null, [box.x + box.width / 2, box.y + box.height / 2]);
    expect(hit).toBe(true);
    await expect(mode.getByRole('button', { name: 'Sair do modo treino' })).toBeInViewport();
  });

  test('Ficha: editar só aparece no modo de edição e termos têm explicação', async ({ page }) => {
    await page.goto('/');
    await completeOnboarding(page, { name: 'Iniciante Ficha' });
    await page.locator('#mobile-nav-workout').click();
    await expect(page.locator('[id^="btn-remove-"]')).toHaveCount(0);
    await page.locator('button[id^="btn-sheet-edit-"]:visible').first().click();
    await expect(page.locator('[id^="btn-remove-"]').first()).toBeVisible();

    await page.locator('[id^="help-rir-"]').first().click();
    await expect(page.getByRole('note')).toContainText('repetições a mais');
  });
});

test.describe('caminhada em segundo plano', () => {
  test.use({ viewport: { width: 390, height: 844 }, permissions: ['geolocation'], geolocation: { latitude: -8.05, longitude: -34.9, accuracy: 10 } });

  async function setVisibility(page, state) {
    await page.evaluate(s => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => s });
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => s === 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    }, state);
  }

  test('fechar o modal não encerra a caminhada e, ao voltar do segundo plano, estima os passos pelo GPS', async ({ page, context }) => {
    await page.clock.install();
    await page.goto('/');
    await completeOnboarding(page, { name: 'Caminhante', height: 170 });

    await page.locator('#btn-toggle-day-summary').click();
    await page.locator('#btn-open-walking-tracker').click();
    await page.locator('#btn-start-walking').click();
    await expect(page.locator('#btn-finish-walking')).toBeVisible();
    await expect(page.locator('#walking-background-tip')).toContainText('celular pausa a contagem');

    // Dá tempo do watchPosition registrar a posição inicial.
    await page.clock.runFor(2000);

    // Fecha o modal: a caminhada continua e aparece o atalho.
    await page.locator('#btn-close-walking-modal').click();
    await expect(page.locator('#btn-walking-in-progress')).toBeVisible();

    // Minimiza, anda ~0,8 km em 10 minutos e volta.
    // No iPhone o GPS não entrega posições com o app minimizado: a posição
    // nova só chega depois de voltar.
    await setVisibility(page, 'hidden');
    await page.clock.fastForward('10:00');
    await setVisibility(page, 'visible');
    await context.setGeolocation({ latitude: -8.0428, longitude: -34.9, accuracy: 10 });
    // Deixa o relógio falso andar para o retorno do GPS ser entregue.
    await page.clock.runFor(1500);

    await page.locator('#btn-walking-in-progress').click();
    const notice = page.locator('#walking-background-notice');
    await expect(notice).toContainText('estimamos +');
    await expect(notice).toContainText('10 min');
    const total = Number((await page.locator('#display-total-steps').innerText()).replace(/\D/g, ''));
    expect(total).toBeGreaterThan(900);
    expect(total).toBeLessThan(1400);
  });

  test('passos de outro app podem ser somados manualmente', async ({ page }) => {
    await page.goto('/');
    await completeOnboarding(page, { name: 'Somador' });
    await page.locator('#btn-toggle-day-summary').click();
    await page.locator('#btn-open-walking-tracker').click();
    await page.locator('#input-manual-steps').fill('3456');
    await page.locator('#btn-add-typed-steps').click();
    await expect(page.locator('#display-total-steps')).toContainText('3.456');
  });
});

test.describe('programa iniciante', () => {
  test('iniciante recebe a oferta, começa e vê a prescrição da semana na ficha e no Modo Treino', async ({ page }) => {
    await page.goto('/');
    await completeOnboarding(page, { name: 'Bia Novata', experience: 'beginner' });

    await expect(page.locator('#program-offer')).toBeVisible();
    await page.locator('#btn-start-program').click();
    await expect(page.locator('#program-current-week')).toContainText('Semana 1: Aprender os movimentos');
    await page.locator('#modal-program-close').click();

    await expect(page.locator('#program-progress-card')).toContainText('Semana 1 de 4');
    await page.locator('#tab-btn-workout').click();
    await expect(page.locator('[id^="program-hint-"]').first()).toContainText('2 séries de 12-15');

    await page.locator('#btn-start-today').click();
    await expect(page.locator('#training-program-hint')).toContainText('4 repetições sobrando');
  });

  test('após 4 semanas mostra a reavaliação e concluir dá XP', async ({ page }) => {
    await page.goto('/');
    await completeOnboarding(page, { name: 'Bia Veterana', experience: 'beginner' });
    await page.locator('#btn-start-program').click();
    await page.locator('#modal-program-close').click();

    // Simula início há 29 dias.
    await page.evaluate(() => {
      const d = new Date(Date.now() - 29 * 86_400_000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      localStorage.setItem('overload_beginner_program', JSON.stringify({ startedOn: key }));
    });
    await page.reload();

    await page.locator('#program-review-card').click();
    await expect(page.locator('#program-review')).toBeVisible();
    await page.locator('#btn-program-complete').click();
    await expect(page.locator('#program-completed')).toBeVisible();
    await expect(page.locator('#day-summary')).toContainText('Nível');
    const xp = await page.evaluate(() => JSON.parse(localStorage.getItem('treinopro_gamification_state')).totalXp);
    expect(xp).toBeGreaterThanOrEqual(300);
  });

  test('quem não é iniciante não recebe a oferta, mas acha o programa no menu', async ({ page }) => {
    await page.goto('/');
    await completeOnboarding(page, { name: 'Carlos Firme', experience: 'intermediate' });
    await expect(page.locator('#program-offer')).toHaveCount(0);
    await page.locator('#btn-open-menu').click();
    await page.locator('#btn-drawer-program').click();
    await expect(page.locator('#btn-program-start-modal')).toBeVisible();
  });
});
