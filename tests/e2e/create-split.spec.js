import { test, expect } from '@playwright/test';
import { completeOnboarding, ensureOnboarded } from './helpers/onboarding.js';

async function onboardHome(page, name = 'Atleta Custom') {
  await page.goto('/');
  await expect(page.locator('#onboarding-modal')).toBeVisible();

  await completeOnboarding(page, { name: name, age: 28, weight: 78, height: 178, days: 3, experience: 'intermediate', equipment: 'gym' });

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
  
  // Mede o contraste real (WCAG) em vez de checar nomes de classe: o layout
  // mudou de tema escuro para claro e o que importa é a legibilidade.
  const weightStyle = await readContrast(weightInput);
  expect(weightStyle.borderWidth).toBeGreaterThanOrEqual(1);
  expect(weightStyle.contrast).toBeGreaterThanOrEqual(4.5);

  await page.locator('#btn-open-create-split').click();
  const splitTitleInput = page.locator('#input-split-title');
  await expect(splitTitleInput).toBeVisible();
  const titleStyle = await readContrast(splitTitleInput);
  expect(titleStyle.borderWidth).toBeGreaterThanOrEqual(1);
  expect(titleStyle.contrast).toBeGreaterThanOrEqual(4.5);
});

/** Contraste entre a cor do texto e o fundo efetivo do campo, e a espessura da borda. */
async function readContrast(locator) {
  return locator.evaluate(el => {
    const parse = c => (c.match(/[\d.]+/g) || []).map(Number);
    const lum = ([r, g, b]) => {
      const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    let node = el;
    let bg = [255, 255, 255];
    while (node) {
      const c = parse(getComputedStyle(node).backgroundColor);
      if (c.length >= 3 && (c.length < 4 || c[3] > 0.5)) { bg = c.slice(0, 3); break; }
      node = node.parentElement;
    }
    const style = getComputedStyle(el);
    const fg = parse(style.color).slice(0, 3);
    const [l1, l2] = [lum(fg), lum(bg)].sort((a, b) => b - a);
    const borders = [style.borderTopWidth, style.borderBottomWidth, el.parentElement ? getComputedStyle(el.parentElement).borderTopWidth : '0']
      .map(parseFloat);
    return { contrast: (l1 + 0.05) / (l2 + 0.05), borderWidth: Math.max(...borders) };
  });
}
