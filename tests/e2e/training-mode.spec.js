import { test, expect } from '@playwright/test';

/**
 * Modo Treino: tela cheia com fila de exercícios, entradas de carga/reps e
 * cronômetro da sessão. Usa o mesmo setup dos demais specs — perfil fechado,
 * plano default já carregado.
 */
async function prepareAppPage(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const closeBtn = page.locator('#btn-close-onboarding');
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    await expect(page.locator('#onboarding-modal')).toBeHidden();
  }
}

async function openTrainingMode(page) {
  await page.locator('#tab-btn-workout').click();
  await page.locator('button[id^="btn-split-treino-"]').first().click();
  await page.locator('#btn-open-training-mode').click();
  const mode = page.getByRole('dialog', { name: 'Modo Treino' });
  await expect(mode).toBeVisible();
  return mode;
}

test('Abre em tela cheia com cronômetro e progresso, e sai pelo botão', async ({ page }) => {
  await prepareAppPage(page);
  const mode = await openTrainingMode(page);

  await expect(mode.locator('#training-timer')).toHaveText(/^\d{1,2}:\d{2}$/);
  await expect(mode.locator('#training-progress')).toHaveText(/^\d+\/\d+ concluídos\s*$/);

  const progress = await mode.locator('#training-progress').textContent();
  const [done, total] = progress.match(/(\d+)\/(\d+)/).slice(1).map(Number);
  expect(total).toBeGreaterThan(0);
  expect(done).toBe(0);

  await mode.locator('#btn-exit-training-mode').click();
  await expect(mode).toBeHidden();
  await expect(page.locator('#btn-open-training-mode')).toBeVisible();
});

test('Concluir exercício avança o foco e dispara o descanso', async ({ page }) => {
  await prepareAppPage(page);
  const mode = await openTrainingMode(page);

  const firstFocus = await mode.locator('section h2').textContent();
  await mode.locator('#btn-training-check').click();

  await expect(mode.locator('#training-progress')).toHaveText(/^1\/\d+ concluídos\s*$/);
  await expect(page.locator('#rest-timer')).toBeVisible();

  const secondFocus = await mode.locator('section h2').textContent();
  expect(secondFocus).not.toBe(firstFocus);

  // O exercício concluído continua na lista, marcado.
  const doneItem = mode.locator(`button[id^="training-item-"]`).filter({ hasText: firstFocus });
  await expect(doneItem.locator('span[aria-hidden="true"]').first()).toHaveText('✓');
});

test('Carga digitada no modo aparece na ficha principal', async ({ page }) => {
  await prepareAppPage(page);
  const mode = await openTrainingMode(page);

  const weightInput = mode.locator('#training-input-weight');
  if ((await weightInput.count()) === 0) {
    test.skip(true, 'O primeiro exercício pendente é cardio e não tem campo de carga');
  }

  const focusName = (await mode.locator('section h2').textContent()).trim();
  await weightInput.fill('55.5');

  await mode.locator('#btn-exit-training-mode').click();
  const card = page.locator('[id^="exercise-card-"]').filter({ hasText: focusName });
  await expect(card.locator('input[id^="input-weight-"]')).toHaveValue('55.5');
});

test('Tocar num exercício da fila leva o cartão atual para ele', async ({ page }) => {
  await prepareAppPage(page);
  const mode = await openTrainingMode(page);

  const items = mode.locator('button[id^="training-item-"]');
  const targetName = (await items.nth(1).locator('span').first().textContent()).trim();
  await items.nth(1).click();

  expect((await mode.locator('section h2').textContent()).trim()).toBe(targetName);
});

test('Marcar todos concluídos mostra o estado final', async ({ page }) => {
  await prepareAppPage(page);
  const mode = await openTrainingMode(page);

  const total = await mode.locator('button[id^="training-item-"]').count();
  for (let i = 0; i < total; i++) {
    await mode.locator('#btn-training-check').click();
  }

  await expect(mode.locator('#training-all-done')).toBeVisible();
  await expect(mode.locator('#training-progress')).toHaveText(new RegExp(`^${total}/${total} concluídos\\s*$`));
});

test('Concluir treino no modo encerra a sessão e fecha a tela', async ({ page }) => {
  await prepareAppPage(page);
  const mode = await openTrainingMode(page);

  // Só existe sessão aberta depois da primeira marcação.
  await mode.locator('#btn-training-check').click();
  await expect(page.locator('#btn-finish-session')).toBeVisible();

  await mode.locator('#btn-training-finish').click();
  await expect(mode).toBeHidden();
  await expect(page.locator('#btn-finish-session')).toBeHidden();
});
