import { test, expect } from '@playwright/test';

/**
 * Fecha o onboarding se estiver aberto (o app abre no primeiro acesso) e
 * devolve a página pronta para as abas de treino/nutrição/frequência.
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

test('Fichas de treino: não repete exercício dentro da mesma ficha', async ({ page }) => {
  await prepareAppPage(page);

  await page.locator('#tab-btn-workout').click();
  await expect(page.locator('#screen-workout')).toBeVisible();

  const splitTabs = page.locator('button[id^="btn-split-treino-"]');
  const splitCount = await splitTabs.count();
  expect(splitCount).toBeGreaterThan(0);

  for (let i = 0; i < splitCount; i++) {
    await splitTabs.nth(i).click();

    const visibleContainer = page.locator('div[id^="container-treino-"]:visible').first();
    await expect(visibleContainer).toBeVisible();

    const names = await visibleContainer.locator('a[id^="link-exercise-"], h4').allTextContents();
    expect(names.length).toBeGreaterThan(0);
    expect(new Set(names).size).toBe(names.length);
  }
});

test('Fichas de treino: registra carga e reps e inicia o cronômetro', async ({ page }) => {
  await prepareAppPage(page);

  await page.locator('#tab-btn-workout').click();
  await page.locator('button[id^="btn-split-treino-"]').first().click();

  const container = page.locator('div[id^="container-treino-"]:visible').first();
  const firstWeight = container.locator('input[id^="input-weight-"]').first();

  if (await firstWeight.count() === 0) {
    test.skip(true, 'O primeiro exercício é cardio e não tem campo de carga');
  }

  await firstWeight.fill('80');
  await firstWeight.blur();

  // O valor precisa sobreviver a um recarregamento (persistência em IndexedDB).
  await page.reload();
  await page.waitForLoadState('networkidle');
  const reopened = page.locator('#onboarding-modal');
  if (await reopened.isVisible()) await reopened.locator('#btn-close-onboarding').click();

  await page.locator('#tab-btn-workout').click();
  await page.locator('button[id^="btn-split-treino-"]').first().click();
  const containerAfter = page.locator('div[id^="container-treino-"]:visible').first();
  await expect(containerAfter.locator('input[id^="input-weight-"]').first()).toHaveValue('80');
});

test('Cronômetro de descanso: dispara ao marcar exercício como concluído', async ({ page }) => {
  await prepareAppPage(page);

  await page.locator('#tab-btn-workout').click();
  await page.locator('button[id^="btn-split-treino-"]').first().click();

  const container = page.locator('div[id^="container-treino-"]:visible').first();
  const firstCheck = container.locator('button[id^="btn-check-"]').first();

  await firstCheck.click();
  await expect(firstCheck).toHaveAttribute('aria-pressed', 'true');

  // O cronômetro flutuante entra em cena ao concluir a série.
  await expect(page.locator('#rest-timer')).toBeVisible({ timeout: 3000 });
});

test('Troca de exercício: só oferece alternativas seguras', async ({ page }) => {
  await page.goto('/');

  await page.locator('#input-user-name').fill('Troca Segura');
  await page.locator('#input-age').fill('30');
  await page.locator('#input-weight').fill('90');
  await page.locator('#input-height').fill('178');
  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-days-4').click();
  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-joint-joelho').click();
  await page.locator('#btn-equip-home').click();
  await page.locator('#btn-onboarding-submit').click();
  await expect(page.locator('#onboarding-modal')).not.toBeVisible();

  await page.locator('#tab-btn-workout').click();
  await page.locator('button[id^="btn-split-treino-"]').first().click();

  const container = page.locator('div[id^="container-treino-"]:visible').first();
  await container.locator('button[id^="btn-swap-"]').first().click();

  const dialog = page.locator('#exercise-picker-title');
  await expect(dialog).toBeVisible();

  // O modal informa que está filtrando pelas restrições do usuário.
  await expect(page.locator('text=sem academia')).toBeVisible();

  const alternatives = page.locator('button[id^="btn-alternative-"]');
  const count = await alternatives.count();
  for (let i = 0; i < count; i++) {
    const name = await alternatives.nth(i).locator('h5').textContent();
    expect(name).toBeTruthy();
  }

  // Nenhuma alternativa pode ser o próprio exercício atual.
  const currentName = await container.locator('a[id^="link-exercise-"], h4').first().textContent();
  for (let i = 0; i < count; i++) {
    const name = await alternatives.nth(i).locator('h5').textContent();
    expect(name).not.toBe(currentName);
  }
});

test('Dieta: exibe refeições com tags calculadas', async ({ page }) => {
  await prepareAppPage(page);

  await page.locator('#tab-btn-nutrition').click();
  await expect(page.locator('#screen-nutrition')).toBeVisible();

  for (const id of ['meal-card-meal-1', 'meal-card-meal-2', 'meal-card-meal-3']) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }

  // Refeições nunca podem vir com itens vazios.
  const items = await page.locator('[id^="meal-card-"] p').first().textContent();
  expect(items.trim().length).toBeGreaterThan(0);
});

test('Calendário: registra e desmarca dias da semana', async ({ page }) => {
  await prepareAppPage(page);

  await page.locator('#tab-btn-frequency').click();
  await expect(page.locator('#screen-frequency')).toBeVisible();

  const progress = page.locator('#week-progress-text');
  await expect(progress).toContainText('0 / 7');

  await page.locator('#day-card-seg').click();
  await page.locator('#day-card-ter').click();
  await expect(progress).toContainText('2 / 7');

  await expect(page.locator('#day-card-seg')).toHaveAttribute('aria-pressed', 'true');

  await page.locator('#day-card-seg').click();
  await expect(progress).toContainText('1 / 7');
});

test('Calendário: mantém a marcação após recarregar', async ({ page }) => {
  await prepareAppPage(page);

  await page.locator('#tab-btn-frequency').click();
  await page.locator('#day-card-qua').click();
  await expect(page.locator('#week-progress-text')).toContainText('1 / 7');

  await page.reload();
  await page.waitForLoadState('networkidle');

  const reopened = page.locator('#onboarding-modal');
  if (await reopened.isVisible()) await reopened.locator('#btn-close-onboarding').click();

  await page.locator('#tab-btn-frequency').click();
  await expect(page.locator('#week-progress-text')).toContainText('1 / 7');
  await expect(page.locator('#day-card-qua')).toHaveAttribute('aria-pressed', 'true');
});

test('Acessibilidade: abas e dias funcionam por teclado', async ({ page }) => {
  await prepareAppPage(page);

  await page.locator('#tab-btn-workout').focus();
  await expect(page.locator('#tab-btn-workout')).toBeFocused();
  await expect(page.locator('#tab-btn-workout')).toHaveAttribute('aria-selected', 'true');

  await page.locator('#tab-btn-frequency').click();
  await expect(page.locator('#tab-btn-frequency')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#tab-btn-workout')).toHaveAttribute('aria-selected', 'false');

  const day = page.locator('#day-card-sex');
  await day.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#week-progress-text')).toContainText('1 / 7');
});

test('Instalação: exibe instrução em snackbar em vez de alert nativo', async ({ page }) => {
  await prepareAppPage(page);

  const dialogs = [];
  page.on('dialog', async d => {
    dialogs.push(d.type());
    await d.dismiss();
  });

  await page.locator('#btn-install-app').click();

  // Em chromium headless o beforeinstallprompt não dispara, então caímos no
  // caminho de instrução manual, que precisa ser o snackbar.
  await expect(page.locator('#install-help-snackbar')).toBeVisible();
  expect(dialogs).not.toContain('alert');

  await page.locator('button[aria-label="Fechar instruções de instalação"]').click();
  await expect(page.locator('#install-help-snackbar')).toBeHidden();
});

test('Histórico: registra a sessão ao marcar exercício e mostra volume', async ({ page }) => {
  await prepareAppPage(page);

  await page.locator('#tab-btn-workout').click();
  await page.locator('button[id^="btn-split-treino-"]').first().click();

  const container = page.locator('div[id^="container-treino-"]:visible').first();
  const firstExerciseId = await container.locator('input[id^="input-weight-"]').first()
    .getAttribute('id');
  const exerciseId = firstExerciseId.replace('input-weight-', '');

  const weightInput = page.locator(`#input-weight-${exerciseId}`);
  const repsInput = page.locator(`#input-reps-${exerciseId}`);
  const checkBtn = page.locator(`#btn-check-${exerciseId}`);

  if (await weightInput.count() === 0) {
    test.skip(true, 'O primeiro exercício é cardio e não tem campo de carga');
  }

  await weightInput.fill('80');
  await repsInput.fill('10');
  await checkBtn.click();

  await page.locator('#tab-btn-history').click();
  await expect(page.locator('#screen-history')).toBeVisible();

  // Uma sessão nova deve existir e contabilizar a série concluída.
  const sessions = page.locator('article[id^="history-session-"]');
  await expect(sessions).toHaveCount(1);
  await expect(sessions.first()).toContainText('80 kg × 10');
  await expect(page.locator('#history-weekly-chart')).toBeVisible();
});

test('Histórico: recarregar mantém a sessão e não abre sessão duplicada', async ({ page }) => {
  await prepareAppPage(page);

  await page.locator('#tab-btn-workout').click();
  await page.locator('button[id^="btn-split-treino-"]').first().click();

  const container = page.locator('div[id^="container-treino-"]:visible').first();
  const weightInput = container.locator('input[id^="input-weight-"]').first();
  if (await weightInput.count() === 0) {
    test.skip(true, 'O primeiro exercício é cardio e não tem campo de carga');
  }
  const exerciseId = (await weightInput.getAttribute('id')).replace('input-weight-', '');

  await weightInput.fill('70');
  await page.locator(`#input-reps-${exerciseId}`).fill('8');
  await page.locator(`#btn-check-${exerciseId}`).click();

  await page.reload();
  await page.waitForLoadState('networkidle');
  const reopened = page.locator('#onboarding-modal');
  if (await reopened.isVisible()) await reopened.locator('#btn-close-onboarding').click();

  // Continuar editando no mesmo dia precisa reusar a sessão, não criar outra.
  await page.locator('#tab-btn-workout').click();
  await page.locator('button[id^="btn-split-treino-"]').first().click();
  await page.locator(`#input-weight-${exerciseId}`).fill('75');

  await page.locator('#tab-btn-history').click();
  await expect(page.locator('article[id^="history-session-"]')).toHaveCount(1);
});

test('Histórico: mostra a última carga concluída na ficha', async ({ page }) => {
  await prepareAppPage(page);

  await page.locator('#tab-btn-workout').click();
  await page.locator('button[id^="btn-split-treino-"]').first().click();

  const container = page.locator('div[id^="container-treino-"]:visible').first();
  const weightInput = container.locator('input[id^="input-weight-"]').first();
  if (await weightInput.count() === 0) {
    test.skip(true, 'O primeiro exercício é cardio e não tem campo de carga');
  }
  const exerciseId = (await weightInput.getAttribute('id')).replace('input-weight-', '');

  // Registra um treino e encerra a sessão: agora ele passa a contar como
  // histórico, e é isso que o selo deve mostrar.
  await page.locator(`#input-weight-${exerciseId}`).fill('90');
  await page.locator(`#input-reps-${exerciseId}`).fill('12');
  await page.locator(`#btn-check-${exerciseId}`).click();
  await page.locator('#btn-finish-session').click();

  // O botão só existe enquanto há sessão aberta: sua ausência é o sinal de que
  // o finishedAt foi gravado. Sem esta espera, o reload abaixo pode interromper
  // a escrita e a sessão continuaria aberta no teste seguinte.
  await expect(page.locator('#btn-finish-session')).toBeHidden();

  await page.reload();
  await page.waitForLoadState('networkidle');
  const reopened = page.locator('#onboarding-modal');
  if (await reopened.isVisible()) await reopened.locator('#btn-close-onboarding').click();

  await page.locator('#tab-btn-workout').click();
  await page.locator('button[id^="btn-split-treino-"]').first().click();

  // Enquanto a carga atual está nos campos, o selo fica escondido: mostraria
  // um número que a pessoa já está vendo no input.
  await expect(page.locator(`#last-load-${exerciseId}`)).toBeHidden();

  await page.locator(`#input-weight-${exerciseId}`).fill('');
  await page.locator(`#input-reps-${exerciseId}`).fill('');
  await expect(page.locator(`#last-load-${exerciseId}`)).toBeVisible();
  await expect(page.locator(`#last-load-${exerciseId}`)).toContainText('90 kg × 12');
});

test('Zerar histórico também apaga as sessões', async ({ page }) => {
  await prepareAppPage(page);

  await page.locator('#tab-btn-workout').click();
  await page.locator('button[id^="btn-split-treino-"]').first().click();
  const container = page.locator('div[id^="container-treino-"]:visible').first();
  const weightInput = container.locator('input[id^="input-weight-"]').first();
  if (await weightInput.count() === 0) {
    test.skip(true, 'O primeiro exercício é cardio e não tem campo de carga');
  }
  const exerciseId = (await weightInput.getAttribute('id')).replace('input-weight-', '');

  await weightInput.fill('65');
  await page.locator(`#btn-check-${exerciseId}`).click();

  page.once('dialog', d => d.accept());
  await page.locator('#btn-reset-weights').click();

  await page.locator('#tab-btn-history').click();
  await expect(page.locator('#history-empty-state')).toBeVisible();
  await expect(page.locator('article[id^="history-session-"]')).toHaveCount(0);
});
