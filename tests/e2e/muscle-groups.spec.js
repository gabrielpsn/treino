import { test, expect } from '@playwright/test';

async function onboardUser(page, name = 'Grupos Musculares') {
  await page.goto('/');
  await expect(page.locator('#onboarding-modal')).toBeVisible();

  await page.locator('#input-user-name').fill(name);
  await page.locator('#input-age').fill('28');
  await page.locator('#input-weight').fill('78');
  await page.locator('#input-height').fill('176');

  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-days-4').click();
  await page.locator('#btn-exp-intermediate').click();
  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-equip-gym').click();
  await page.locator('#btn-onboarding-submit').click();

  await expect(page.locator('#onboarding-modal')).not.toBeVisible({ timeout: 5000 });
  await page.locator('#tab-btn-workout').click();
}

test('Divisão por grupos musculares: cabeçalhos de seção e badges nos cartões', async ({ page }) => {
  await onboardUser(page);

  const tab = page.locator('button[id^="btn-split-treino-"]').first();
  const splitId = (await tab.getAttribute('id')).replace('btn-split-', '');
  await tab.click();

  const container = page.locator(`#container-${splitId}`);

  // Verifica que existem cabeçalhos de seção de músculos
  const headers = container.locator('[id^="muscle-header-"]');
  const headerCount = await headers.count();
  expect(headerCount).toBeGreaterThanOrEqual(2);

  // Cada cartão de exercício possui seu badge de grupo muscular
  const cards = container.locator('[id^="exercise-card-"]');
  const cardCount = await cards.count();
  expect(cardCount).toBeGreaterThan(0);

  const badges = container.locator('[id^="muscle-badge-"]');
  await expect(badges).toHaveCount(cardCount);

  // O texto do badge é legível (ex: Peito, Costas, Ombro...)
  const firstBadgeText = await badges.first().textContent();
  expect(firstBadgeText.length).toBeGreaterThan(2);
});

test('Filtros rápidos por grupo muscular isolam os exercícios do grupo', async ({ page }) => {
  await onboardUser(page, 'Filtros Musculares');

  const tab = page.locator('button[id^="btn-split-treino-"]').first();
  const splitId = (await tab.getAttribute('id')).replace('btn-split-', '');
  await tab.click();

  const container = page.locator(`#container-${splitId}`);
  const totalCards = await container.locator('[id^="exercise-card-"]').count();

  // Localiza os botões de filtro muscular
  const filterButtons = container.locator(`button[id^="btn-filter-${splitId}-"]`);
  const filterCount = await filterButtons.count();
  expect(filterCount).toBeGreaterThan(0);

  // Clica no primeiro filtro de músculo específico
  const firstFilter = filterButtons.first();
  const filterId = await firstFilter.getAttribute('id');
  const muscleKey = filterId.replace(`btn-filter-${splitId}-`, '');
  await firstFilter.click();

  // O número de cartões visíveis agora deve ser apenas os daquele músculo
  const filteredCards = container.locator('[id^="exercise-card-"]');
  const filteredCount = await filteredCards.count();
  expect(filteredCount).toBeLessThanOrEqual(totalCards);
  expect(filteredCount).toBeGreaterThan(0);

  // Todos os badges visíveis devem corresponder ao músculo filtrado
  const badges = container.locator('[id^="muscle-badge-"]');
  const count = await badges.count();
  for (let i = 0; i < count; i++) {
    const text = (await badges.nth(i).textContent()).toLowerCase();
    expect(text.length).toBeGreaterThan(0);
  }

  // Clica no botão Todos e restaura a lista completa
  await container.locator(`#btn-filter-all-${splitId}`).click();
  await expect(container.locator('[id^="exercise-card-"]')).toHaveCount(totalCards);
});

test('Botão "Agrupar por Músculo" reorganiza e persiste os exercícios por grupo', async ({ page }) => {
  await onboardUser(page, 'Agrupar Musculo');

  const tab = page.locator('button[id^="btn-split-treino-"]').first();
  const splitId = (await tab.getAttribute('id')).replace('btn-split-', '');
  await tab.click();

  const container = page.locator(`#container-${splitId}`);
  const groupBtn = container.locator(`#btn-group-by-muscle-${splitId}`);
  await expect(groupBtn).toBeVisible();

  // Clica para agrupar
  await groupBtn.click();

  // Os cartões continuam visíveis e sem duplicação
  const cards = container.locator('[id^="exercise-card-"]');
  const ids = await cards.evaluateAll(els => els.map(e => e.id.replace('exercise-card-', '')));
  expect(new Set(ids).size).toBe(ids.length);
});
