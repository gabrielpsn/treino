import { test, expect } from '@playwright/test';

async function onboardHome(page, name = 'Atleta Custom') {
  await page.goto('/');
  await expect(page.locator('#onboarding-modal')).toBeVisible();

  await page.locator('#input-user-name').fill(name);
  await page.locator('#input-age').fill('28');
  await page.locator('#input-weight').fill('78');
  await page.locator('#input-height').fill('178');

  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-days-3').click();
  await page.locator('#btn-exp-intermediate').click();
  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-equip-gym').click();
  await page.locator('#btn-onboarding-submit').click();

  await expect(page.locator('#onboarding-modal')).not.toBeVisible({ timeout: 5000 });
  await page.locator('#tab-btn-workout').click();
}

test('Criação de Ficha: usuário pode criar uma nova divisão de treino personalizada', async ({ page }) => {
  await onboardHome(page, 'Criador de Ficha');

  // Abre modal de criação
  const btnOpenCreate = page.locator('#btn-open-create-split');
  await expect(btnOpenCreate).toBeVisible();
  await btnOpenCreate.click();

  const modal = page.locator('#create-split-modal');
  await expect(modal).toBeVisible();

  // Preenche dados da nova ficha
  await page.locator('#input-split-title').fill('Treino D (Braços & Core)');
  await page.locator('#input-split-subtitle').fill('Foco em bíceps, tríceps e abdômen');
  await page.locator('#btn-color-purple').click();

  // Seleciona um exercício inicial na lista se houver
  const firstExercise = modal.locator('div[class*="cursor-pointer"]').first();
  if (await firstExercise.isVisible()) {
    await firstExercise.click();
  }

  // Submete
  await page.locator('#btn-confirm-create-split').click();
  await expect(modal).toBeHidden();

  // A nova aba deve estar visível e navegável
  const newSplitTab = page.locator('button:has-text("Treino D")');
  await expect(newSplitTab).toBeVisible();
  await newSplitTab.click();

  // O container do treino deve exibir o título completo da nova ficha
  await expect(page.locator('text=Treino D (Braços & Core)')).toBeVisible();
});

test('Edição de Ficha: usuário pode renomear uma ficha existente e alterar foco', async ({ page }) => {
  await onboardHome(page, 'Editor de Ficha');

  // Pega a primeira ficha
  const firstSplitTab = page.locator('button[id^="btn-split-treino-"]').first();
  const splitId = (await firstSplitTab.getAttribute('id')).replace('btn-split-', '');
  await firstSplitTab.click();

  const editBtn = page.locator(`#btn-edit-split-${splitId}`);
  await expect(editBtn).toBeVisible();
  await editBtn.click();

  const modal = page.locator('#create-split-modal');
  await expect(modal).toBeVisible();
  await expect(page.locator('#create-split-title')).toContainText('Editar Ficha de Treino');

  // Altera o título
  await page.locator('#input-split-title').fill('Treino A (Superiores Foco Peito)');
  await page.locator('#btn-color-rose').click();
  await page.locator('#btn-confirm-create-split').click();

  await expect(modal).toBeHidden();
  await expect(page.locator('text=Treino A (Superiores Foco Peito)')).toBeVisible();
});

test('Exclusão de Ficha: usuário pode excluir uma ficha com confirmação de segurança', async ({ page }) => {
  await onboardHome(page, 'Exclusor de Ficha');

  // Cria uma ficha temporária para excluir
  await page.locator('#btn-open-create-split').click();
  await page.locator('#input-split-title').fill('Treino Temporário');
  await page.locator('#btn-confirm-create-split').click();

  const tempTab = page.locator('button:has-text("Treino Temporário")');
  await expect(tempTab).toBeVisible();
  await tempTab.click();

  // Localiza o botão de excluir
  const deleteBtn = page.locator('button[id^="btn-delete-split-"]').first();
  await expect(deleteBtn).toBeVisible();
  const deleteId = (await deleteBtn.getAttribute('id')).replace('btn-delete-split-', '');
  await deleteBtn.click();

  // Confirmação deve aparecer
  const confirmBox = page.locator(`#confirm-delete-split-${deleteId}`);
  await expect(confirmBox).toBeVisible();
  await expect(confirmBox).toContainText('excluir a ficha Treino Temporário');

  // Confirma exclusão
  await page.locator(`#btn-confirm-delete-split-${deleteId}`).click();

  // A aba temporária deve sumir
  await expect(page.locator('button:has-text("Treino Temporário")')).toHaveCount(0);
});

test('Contraste de campos: inputs essenciais possuem bordas reforçadas e tipografia legível', async ({ page }) => {
  await onboardHome(page, 'Teste Contraste');

  // Seleciona a primeira ficha
  const firstSplitTab = page.locator('button[id^="btn-split-treino-"]').first();
  await firstSplitTab.click();

  // Verifica contraste no container dos inputs de carga
  const weightInput = page.locator('input[id^="input-weight-"]').first();
  await expect(weightInput).toBeVisible();
  
  const weightContainer = weightInput.locator('xpath=..');
  const containerClass = await weightContainer.getAttribute('class');
  expect(containerClass).toContain('border-2');
  expect(containerClass).toContain('border-slate-600');

  // Verifica contraste nos campos de formulário modal
  await page.locator('#btn-open-create-split').click();
  const splitTitleInput = page.locator('#input-split-title');
  await expect(splitTitleInput).toBeVisible();
  const titleClass = await splitTitleInput.getAttribute('class');
  expect(titleClass).toContain('border-2');
  expect(titleClass).toContain('border-slate-600');
  expect(titleClass).toContain('text-white');
});
