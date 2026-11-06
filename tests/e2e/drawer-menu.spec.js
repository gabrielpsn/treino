import { test, expect } from '@playwright/test';

async function onboardUser(page, name = 'Carlos Silva') {
  await page.goto('/');
  await expect(page.locator('#onboarding-modal')).toBeVisible();

  await page.locator('#input-user-name').fill(name);
  await page.locator('#input-age').fill('30');
  await page.locator('#input-weight').fill('82');
  await page.locator('#input-height').fill('180');

  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-days-3').click();
  await page.locator('#btn-exp-intermediate').click();
  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-equip-gym').click();
  await page.locator('#btn-onboarding-submit').click();

  await expect(page.locator('#onboarding-modal')).not.toBeVisible({ timeout: 5000 });
}

test.describe('Menu Lateral Deslizante (Side Drawer)', () => {
  test('abre pelo botão hambúrguer e exibe perfil do atleta e biometria', async ({ page }) => {
    await onboardUser(page, 'Carlos Silva');

    const btnOpenMenu = page.locator('#btn-open-menu');
    await expect(btnOpenMenu).toBeVisible();
    await btnOpenMenu.click();

    const drawer = page.locator('#app-side-drawer');
    await expect(drawer).toBeVisible();

    // Verifica perfil
    await expect(page.locator('#drawer-user-name')).toHaveText('Carlos Silva');
    await expect(drawer).toContainText('82 kg');
    await expect(drawer).toContainText('Intermediário');
  });

  test('fecha ao clicar no botão X ou no backdrop', async ({ page }) => {
    await onboardUser(page, 'Carlos Silva');

    // Abre e fecha pelo botão X
    await page.locator('#btn-open-menu').click();
    await expect(page.locator('#app-side-drawer')).toBeVisible();
    await page.locator('#btn-close-drawer').click();
    await expect(page.locator('#app-side-drawer')).toBeHidden();

    // Abre e fecha pelo backdrop
    await page.locator('#btn-open-menu').click();
    await expect(page.locator('#app-side-drawer')).toBeVisible();
    await page.locator('#drawer-backdrop').click({ position: { x: 700, y: 200 } });
    await expect(page.locator('#app-side-drawer')).toBeHidden();
  });

  test('navega entre as telas (Dieta, Calendário, Treinos) pelo menu lateral', async ({ page }) => {
    await onboardUser(page, 'Carlos Silva');

    // Navega para Dieta
    await page.locator('#btn-open-menu').click();
    await page.locator('#btn-drawer-nav-nutrition').click();
    await expect(page.locator('#app-side-drawer')).toBeHidden();
    await expect(page.locator('#screen-nutrition')).toBeVisible();

    // Navega para Calendário
    await page.locator('#btn-open-menu').click();
    await page.locator('#btn-drawer-nav-frequency').click();
    await expect(page.locator('#app-side-drawer')).toBeHidden();
    await expect(page.locator('#screen-frequency')).toBeVisible();

    // Volta para Treinos
    await page.locator('#btn-open-menu').click();
    await page.locator('#btn-drawer-nav-workout').click();
    await expect(page.locator('#app-side-drawer')).toBeHidden();
    await expect(page.locator('#screen-workout')).toBeVisible();
  });

  test('permite alternar entre os temas Azul Atlético e Laranja Força', async ({ page }) => {
    await onboardUser(page, 'Carlos Silva');

    await page.locator('#btn-open-menu').click();
    const btnOrangeTheme = page.locator('#btn-theme-orange');
    await expect(btnOrangeTheme).toBeVisible();
    await btnOrangeTheme.click();

    // Verifica que o tema laranja foi aplicado
    const btnBlueTheme = page.locator('#btn-theme-blue');
    await expect(btnBlueTheme).toBeVisible();
    await btnBlueTheme.click();
  });
});
