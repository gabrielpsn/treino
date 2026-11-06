import { test, expect } from '@playwright/test';

const MOBILE = { width: 390, height: 844 };

test.use({ viewport: MOBILE });

async function onboardApp(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const closeBtn = page.locator('#btn-close-onboarding');
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    await expect(page.locator('#onboarding-modal')).toBeHidden();
  }
}

test('Mobile: barra inferior de navegação na base permite alternar seções com o polegar', async ({ page }) => {
  await onboardApp(page);

  const bottomNav = page.locator('#mobile-bottom-nav');
  await expect(bottomNav).toBeVisible();

  // Testar alternância para Dieta
  await page.locator('#mobile-nav-nutrition').click();
  await expect(page.locator('#screen-nutrition')).toBeVisible();

  // Testar alternância para Calendário / Agenda
  await page.locator('#mobile-nav-frequency').click();
  await expect(page.locator('#screen-frequency')).toBeVisible();

  // Testar alternância para Histórico
  await page.locator('#mobile-nav-history').click();
  await expect(page.locator('#screen-history')).toBeVisible();

  // Voltar para Treino
  await page.locator('#mobile-nav-workout').click();
  await expect(page.locator('#screen-workout')).toBeVisible();
});

test('Mobile: botão central destacado (FAB) abre o Modo Treino diretamente', async ({ page }) => {
  await onboardApp(page);

  const fab = page.locator('#mobile-nav-training-fab');
  await expect(fab).toBeVisible();

  await fab.click();
  const trainingMode = page.locator('#training-mode');
  await expect(trainingMode).toBeVisible();

  // Sair do Modo Treino
  await page.locator('#btn-exit-training-mode').click();
  await expect(trainingMode).toBeHidden();
});

test('Mobile: barra inferior mantém alvos de toque adequados para uso com uma mão', async ({ page }) => {
  await onboardApp(page);

  for (const id of ['#mobile-nav-workout', '#mobile-nav-nutrition', '#mobile-nav-training-fab', '#mobile-nav-frequency', '#mobile-nav-history']) {
    const btn = page.locator(id);
    const box = await btn.boundingBox();
    expect(box).not.toBeNull();
    expect(box.height, `${id} tem altura menor que 44px`).toBeGreaterThanOrEqual(44);
    expect(box.width, `${id} tem largura menor que 44px`).toBeGreaterThanOrEqual(44);
  }
});
