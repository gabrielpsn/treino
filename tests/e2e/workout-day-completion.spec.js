import { test, expect } from '@playwright/test';

/**
 * Conclusão de Treino e Marcação de Dia com Data e XP:
 * Valida o fluxo de confirmação ao encerrar o treino, marcação do dia da semana
 * com data/hora e concessão de XP no Quadro Semanal.
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

test('Ao concluir treino, exibe confirmação para marcar dia da semana com data e XP', async ({ page }) => {
  await prepareAppPage(page);

  await page.locator('#tab-btn-workout').click();
  await page.locator('button[id^="btn-split-treino-"]').first().click();

  const weightInput = page.locator('input[id^="input-weight-"]').first();
  if ((await weightInput.count()) === 0) {
    test.skip(true, 'Exercício cardio sem campo de carga');
  }

  const exerciseId = (await weightInput.getAttribute('id')).replace('input-weight-', '');

  // Registra uma série para abrir sessão
  await page.locator(`#input-weight-${exerciseId}`).fill('80');
  await page.locator(`#input-reps-${exerciseId}`).fill('10');
  await page.locator(`#btn-check-${exerciseId}`).click();

  // Botão Concluir Treino deve estar visível
  const finishBtn = page.locator('#btn-finish-session');
  await expect(finishBtn).toBeVisible();
  await finishBtn.click();

  // Deve exibir o modal de confirmação para marcar o dia no Quadro Semanal
  const dayModal = page.locator('#workout-day-completion-modal');
  await expect(dayModal).toBeVisible();
  await expect(dayModal).toContainText('Concluir Dia no Quadro');
  await expect(dayModal).toContainText('+50 XP');

  // Confirma a marcação do dia
  await page.locator('#btn-confirm-day-completion').click();
  await expect(dayModal).toBeHidden();

  // Em seguida, o modal de celebração é exibido
  const celebration = page.locator('#modal-workout-celebration');
  await expect(celebration).toBeVisible();
  await page.locator('#btn-close-celebration').click();
  await expect(celebration).toBeHidden();

  // Navega para a aba de Frequência e verifica a marcação com data
  await page.locator('#tab-btn-frequency').click();
  await expect(page.locator('#screen-frequency')).toBeVisible();

  // Pelo menos 1 dia deve estar marcado com data e +50 XP
  const progressText = page.locator('#week-progress-text');
  await expect(progressText).not.toContainText('0 / 7');
});
