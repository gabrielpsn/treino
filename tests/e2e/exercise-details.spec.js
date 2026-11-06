import { test, expect } from '@playwright/test';

async function onboardUser(page) {
  await page.goto('/');
  await expect(page.locator('#onboarding-modal')).toBeVisible();

  await page.locator('#input-user-name').fill('Rodrigo Treino');
  await page.locator('#input-age').fill('27');
  await page.locator('#input-weight').fill('75');
  await page.locator('#input-height').fill('175');

  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-days-3').click();
  await page.locator('#btn-exp-intermediate').click();
  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-equip-gym').click();
  await page.locator('#btn-onboarding-submit').click();

  await expect(page.locator('#onboarding-modal')).toBeHidden({ timeout: 5000 });
  await page.locator('#tab-btn-workout').click();
}

test.describe('Demonstração Visual dos Exercícios & Mapa Anatômico', () => {
  test('abre modal de detalhes ao clicar na miniatura ou botão Exemplo', async ({ page }) => {
    await onboardUser(page);

    // Clica no botão Exemplo do primeiro exercício
    const detailBtn = page.locator('button[id^="btn-details-"]').first();
    await expect(detailBtn).toBeVisible();
    await detailBtn.click();

    // Modal de detalhes abre
    const modal = page.locator('#exercise-details-modal');
    await expect(modal).toBeVisible();

    // Verifica nome do exercício e badge de músculo
    await expect(page.locator('#detail-exercise-name')).toBeVisible();
    await expect(page.locator('#detail-exercise-muscle-badge')).toBeVisible();

    // Verifica aba Imagem padrão
    await expect(page.locator('#detail-panel-image')).toBeVisible();

    // Fecha modal pelo botão Voltar
    await page.locator('#btn-close-exercise-details').click();
    await expect(modal).toBeHidden();
  });

  test('alterna entre as abas Imagem, Músculo e Descrição', async ({ page }) => {
    await onboardUser(page);

    const thumbBtn = page.locator('button[id^="btn-thumb-"]').first();
    await expect(thumbBtn).toBeVisible();
    await thumbBtn.click();

    const modal = page.locator('#exercise-details-modal');
    await expect(modal).toBeVisible();

    // Alterna para aba Músculo (mostra SVG com corpo anatômico e músculos destacados)
    await page.locator('#tab-btn-detail-muscle').click();
    await expect(page.locator('#detail-panel-muscle')).toBeVisible();
    await expect(page.locator('#detail-body-front')).toBeVisible();

    // Alterna para aba Descrição (mostra biomecânica, dicas de execução e cadência)
    await page.locator('#tab-btn-detail-description').click();
    await expect(page.locator('#detail-panel-description')).toBeVisible();
    await expect(page.locator('#detail-exercise-tips')).toBeVisible();

    // Fecha modal
    await page.locator('#btn-close-exercise-details-x').click();
    await expect(modal).toBeHidden();
  });

  test('permite abrir o mapa anatômico interativo da sessão no topo do treino', async ({ page }) => {
    await onboardUser(page);

    const toggleMapBtn = page.locator('button[id^="btn-toggle-body-map-"]').first();
    await expect(toggleMapBtn).toBeVisible();
    await toggleMapBtn.click();

    // Painel do mapa anatômico da sessão expande
    const bodyMapPanel = page.locator('div[id^="split-body-map-"]').first();
    await expect(bodyMapPanel).toBeVisible();

    // Contém a visualização dos músculos
    await expect(bodyMapPanel.locator('svg')).toHaveCount(2); // Frente & Costas
  });
});
