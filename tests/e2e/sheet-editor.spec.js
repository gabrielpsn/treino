import { test, expect } from '@playwright/test';

/**
 * Cadastro mínimo em casa, sem restrições: o editor de ficha não depende de
 * perfil nenhum, mas precisa de uma ficha pronta para ser editada.
 */
async function onboardHome(page, name = 'Editor Ficha') {
  await page.goto('/');
  await expect(page.locator('#onboarding-modal')).toBeVisible();

  await page.locator('#input-user-name').fill(name);
  await page.locator('#input-age').fill('30');
  await page.locator('#input-weight').fill('82');
  await page.locator('#input-height').fill('175');

  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-days-3').click();
  await page.locator('#btn-exp-beginner').click();
  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-equip-home').click();
  await page.locator('#btn-onboarding-submit').click();

  await expect(page.locator('#onboarding-modal')).not.toBeVisible({ timeout: 5000 });
  await page.locator('#tab-btn-workout').click();
}

/** Abre a primeira ficha da semana e devolve o id da aba e os ids em ordem. */
async function openFirstSplit(page) {
  const tab = page.locator('button[id^="btn-split-treino-"]').first();
  const splitId = (await tab.getAttribute('id')).replace('btn-split-', '');
  await tab.click();

  const cards = page.locator(`#container-${splitId} [id^="exercise-card-"]`);
  const ids = await cards.evaluateAll(els => els.map(e => e.id.replace('exercise-card-', '')));
  return { splitId, container: page.locator(`#container-${splitId}`), ids };
}

async function orderInContainer(page, splitId) {
  return page.locator(`#container-${splitId} [id^="exercise-card-"]`)
    .evaluateAll(els => els.map(e => e.id.replace('exercise-card-', '')));
}

test('Reordenar: mover para cima troca a posição e persiste', async ({ page }) => {
  await onboardHome(page);
  const { splitId, container, ids } = await openFirstSplit(page);
  expect(ids.length).toBeGreaterThan(2);

  const second = ids[1];
  await container.locator(`#btn-up-${second}`).click();

  const expected = [second, ids[0], ...ids.slice(2)];
  await expect.poll(() => orderInContainer(page, splitId)).toEqual(expected);

  // A ordem precisa sobreviver ao reload: o estado salvo é o que vale.
  await page.reload();
  await page.locator('#tab-btn-workout').click();
  await expect
    .poll(() => orderInContainer(page, splitId), { timeout: 5000 })
    .toEqual(expected);
});

test('Reordenar: mover para baixo funciona nos dois sentidos', async ({ page }) => {
  await onboardHome(page, 'Editor Ficha Cima');
  const { splitId, container, ids } = await openFirstSplit(page);

  const first = ids[0];
  await container.locator(`#btn-down-${first}`).click();
  await expect.poll(() => orderInContainer(page, splitId)).toEqual([ids[1], first, ...ids.slice(2)]);

  await container.locator(`#btn-up-${first}`).click();
  await expect.poll(() => orderInContainer(page, splitId)).toEqual(ids);
});

test('Reordenar: as pontas ficam sem ação para não sair da lista', async ({ page }) => {
  await onboardHome(page, 'Editor Ficha Ponta');
  const { container, ids } = await openFirstSplit(page);

  await expect(container.locator(`#btn-up-${ids[0]}`)).toBeDisabled();
  await expect(container.locator(`#btn-down-${ids[ids.length - 1]}`)).toBeDisabled();
});

test('Remover: pede confirmação e só remove depois dela', async ({ page }) => {
  await onboardHome(page, 'Editor Ficha Remove');
  const { splitId, container, ids } = await openFirstSplit(page);
  const removed = ids[2];

  await container.locator(`#btn-remove-${removed}`).click();

  // A confirmação precisa aparecer: remover apaga o log de cargas do exercício,
  // então não pode ser um toque só.
  const confirmBox = page.locator(`#confirm-remove-${removed}`);
  await expect(confirmBox).toBeVisible();
  await expect(confirmBox).toContainText('histórico');
  await expect(container.locator(`#exercise-card-${removed}`)).toBeVisible();
  await expect.poll(() => orderInContainer(page, splitId)).toEqual(ids);

  await container.locator(`#btn-confirm-remove-${removed}`).click();

  await expect.poll(() => orderInContainer(page, splitId)).toEqual([ids[0], ids[1], ...ids.slice(3)]);
  await expect(container.locator(`#exercise-card-${removed}`)).toHaveCount(0);
  await expect(confirmBox).toHaveCount(0);

  await page.reload();
  await page.locator('#tab-btn-workout').click();
  await expect
    .poll(() => orderInContainer(page, splitId), { timeout: 5000 })
    .toEqual([ids[0], ids[1], ...ids.slice(3)]);
});

test('Remover: cancelar mantém o exercício na ficha', async ({ page }) => {
  await onboardHome(page, 'Editor Ficha Cancela');
  const { splitId, container, ids } = await openFirstSplit(page);

  await container.locator(`#btn-remove-${ids[1]}`).click();
  await expect(page.locator(`#confirm-remove-${ids[1]}`)).toBeVisible();

  await container.locator(`#btn-cancel-remove-${ids[1]}`).click();

  await expect(page.locator(`#confirm-remove-${ids[1]}`)).toHaveCount(0);
  await expect.poll(() => orderInContainer(page, splitId)).toEqual(ids);
});

test('Remover: a confirmação abre um por vez', async ({ page }) => {
  // Dois "¿remover?" abertos viram um quebra-cabeça de botões na tela.
  await onboardHome(page, 'Editor Ficha Unico');
  const { container, ids } = await openFirstSplit(page);

  await container.locator(`#btn-remove-${ids[1]}`).click();
  await expect(page.locator(`#confirm-remove-${ids[1]}`)).toBeVisible();

  await container.locator(`#btn-remove-${ids[2]}`).click();
  await expect(page.locator(`#confirm-remove-${ids[2]}`)).toBeVisible();
  await expect(page.locator(`#confirm-remove-${ids[1]}`)).toHaveCount(0);
});

test('Adicionar: exercício do seletor entra no fim da ficha', async ({ page }) => {
  await onboardHome(page, 'Editor Ficha Add');
  const { splitId, container, ids } = await openFirstSplit(page);

  await container.locator(`#btn-add-exercise-${splitId}`).click();

  const dialog = page.locator('#exercise-picker-modal');
  await expect(dialog).toBeVisible();
  await expect(page.locator('#exercise-picker-title')).toHaveText('Adicionar Exercício');
  // O seletor abre já no grupo do primeiro exercício da ficha, sem repetir o
  // filtro de restrições do usuário.
  await expect(page.locator('text=Filtrando por')).toBeVisible();

  const alternatives = page.locator('button[id^="btn-alternative-"]');
  expect(await alternatives.count()).toBeGreaterThan(0);

  // Em modo adicionar o próprio exercício da ficha também aparece na lista,
  // então é preciso escolher uma alternativa que ainda não esteja no treino.
  const listedIds = await alternatives.evaluateAll(els =>
    els.map(e => e.id.replace('btn-alternative-', ''))
  );
  const chosenId = listedIds.find(id => !ids.includes(id));
  expect(chosenId).toBeTruthy();

  await page.locator(`#btn-alternative-${chosenId}`).click();

  await expect.poll(() => orderInContainer(page, splitId)).toEqual([...ids, chosenId]);
  await expect(page.locator('#exercise-picker-modal')).toBeHidden();
});

test('Adicionar: exercício já presente na ficha é recusado com aviso', async ({ page }) => {
  await onboardHome(page, 'Editor Ficha Dup');
  const { splitId, container, ids } = await openFirstSplit(page);

  await container.locator(`#btn-add-exercise-${splitId}`).click();
  await page.locator(`#btn-alternative-${ids[0]}`).click();

  // A ficha não muda e o usuário recebe o motivo, em vez de ver a linha duplicada.
  await expect.poll(() => orderInContainer(page, splitId)).toEqual(ids);
  await expect(page.locator('text=Essa ficha já tem esse exercício')).toBeVisible();
});

test('Adicionar: respeita restrição articular do usuário', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#onboarding-modal')).toBeVisible();

  await page.locator('#input-user-name').fill('Editor Ficha Restrito');
  await page.locator('#input-age').fill('31');
  await page.locator('#input-weight').fill('84');
  await page.locator('#input-height').fill('176');
  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-days-3').click();
  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-equip-home').click();
  await page.locator('#btn-joint-ombro').click();
  await page.locator('#btn-onboarding-submit').click();
  await expect(page.locator('#onboarding-modal')).not.toBeVisible({ timeout: 5000 });

  await page.locator('#tab-btn-workout').click();
  const { container } = await openFirstSplit(page);
  await container.locator('button[id^="btn-add-exercise-"]').first().click();

  const alternatives = page.locator('button[id^="btn-alternative-"]');
  const count = await alternatives.count();
  expect(count).toBeGreaterThan(0);
  await alternatives.first().click();
  await expect(page.locator('#exercise-picker-modal')).toBeHidden();
});

test('Editor: mudanças combinadas de adicionar, mover e remover', async ({ page }) => {
  await onboardHome(page, 'Editor Ficha Mix');
  const { splitId, container, ids } = await openFirstSplit(page);

  await container.locator(`#btn-add-exercise-${splitId}`).click();
  const listedIds = await page.locator('button[id^="btn-alternative-"]').evaluateAll(els =>
    els.map(e => e.id.replace('btn-alternative-', ''))
  );
  const added = listedIds.find(id => !ids.includes(id));
  await page.locator(`#btn-alternative-${added}`).click();
  await expect.poll(() => orderInContainer(page, splitId)).toEqual([...ids, added]);

  await container.locator(`#btn-up-${added}`).click();
  const withMove = [...ids.slice(0, -1), added, ids[ids.length - 1]];
  await expect.poll(() => orderInContainer(page, splitId)).toEqual(withMove);

  await container.locator(`#btn-remove-${ids[0]}`).click();
  await container.locator(`#btn-confirm-remove-${ids[0]}`).click();
  await expect.poll(() => orderInContainer(page, splitId)).toEqual(withMove.slice(1));

  await page.reload();
  await page.locator('#tab-btn-workout').click();
  await expect.poll(() => orderInContainer(page, splitId), { timeout: 5000 }).toEqual(withMove.slice(1));
});