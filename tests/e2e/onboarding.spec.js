import { test, expect } from '@playwright/test';

/**
 * Fluxo completo de cadastro em modo emagrecimento, percorrendo as três etapas
 * do onboarding e verificando o plano gerado.
 */
test('Onboarding: monta plano de emagrecimento a partir do perfil', async ({ page }) => {
  await page.goto('/');

  const modal = page.locator('#onboarding-modal');
  await expect(modal).toBeVisible();

  await page.locator('#input-user-name').fill('Mariana Silva');
  await page.locator('#btn-goal-weight-loss').click();
  await page.locator('#btn-gender-female').click();

  await page.locator('#input-age').fill('39');
  await page.locator('#input-weight').fill('86');
  await page.locator('#input-height').fill('156');

  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-days-3').click();
  await page.locator('#btn-exp-beginner').click();

  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-equip-gym').click();
  await page.locator('#btn-joint-joelho').click();

  await page.locator('#btn-onboarding-submit').click();
  await expect(modal).not.toBeVisible({ timeout: 5000 });

  await expect(page.locator('#app-user-subtitle')).toContainText('Olá, Mariana Silva');
  await expect(page.locator('#app-title')).toContainText('Emagrecimento Saudável');
  await expect(page.locator('#section-weight-loss-diagnosis')).toBeVisible();

  // 86kg / 1.56^2 = 35.3
  await expect(page.locator('#section-weight-loss-diagnosis')).toContainText('35.3');
  await expect(page.locator('#section-weight-loss-diagnosis')).toContainText('Faixa Saudável');
});

test('Onboarding: bloqueia envio com biometria inválida e volta ao passo do erro', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#onboarding-modal')).toBeVisible();

  await page.locator('#input-user-name').fill('');
  await page.locator('#input-weight').fill('5');
  await page.locator('#input-height').fill('156');
  await page.locator('#input-age').fill('39');

  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-onboarding-next').click();
  await expect(page.locator('#btn-onboarding-submit')).toBeVisible();

  await page.locator('#btn-onboarding-submit').click();

  // O modal precisa continuar aberto e o usuário ser levado de volta ao passo
  // que contém os campos inválidos, com o motivo visível.
  await expect(page.locator('#onboarding-modal')).toBeVisible();
  await expect(page.locator('#onboarding-error-summary')).toBeVisible();
  await expect(page.locator('#error-user-name')).toBeVisible();
  await expect(page.locator('#error-weight')).toBeVisible();

  // Corrigir e reenviar deve concluir o cadastro.
  await page.locator('#input-user-name').fill('Joana');
  await page.locator('#input-weight').fill('70');
  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-onboarding-submit').click();

  await expect(page.locator('#onboarding-modal')).not.toBeVisible();
  await expect(page.locator('#app-user-subtitle')).toContainText('Olá, Joana');
});

test('Fichas: gera treino sem exercício conflitante com a restrição de joelho', async ({ page }) => {
  await page.goto('/');
  await page.locator('#input-user-name').fill('Teste Joelho');
  await page.locator('#btn-gender-male').click();
  await page.locator('#input-age').fill('30');
  await page.locator('#input-weight').fill('90');
  await page.locator('#input-height').fill('178');
  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-days-4').click();
  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-joint-joelho').click();
  await page.locator('#btn-onboarding-submit').click();
  await expect(page.locator('#onboarding-modal')).not.toBeVisible();

  // Catálogo de referência: nenhum exercício com jointStress 'joelho' pode aparecer.
  const idsWithKnee = ['agachamento_livre', 'agachamento_goblet', 'leg_press', 'leg_extension', 'cadeira_abdutora'];
  for (const id of idsWithKnee) {
    const card = page.locator(`#exercise-card-${id}`);
    if (await card.count() > 0) {
      await expect(card).toHaveCount(0);
    }
  }
});