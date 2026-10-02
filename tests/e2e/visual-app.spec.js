import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Screenshots vão para test-results/ (gitignored): antes eram commitados no
// repositório, somando mais de 1 MB de artefatos gerados que ninguém revisava.
const SCREENSHOT_DIR = path.resolve('test-results/screenshots');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

test.describe('Validação Visual por Tela do App de Treino', () => {

  // Helper para garantir que a página carregou e fechar o onboarding se estiver aberto
  async function prepareAppPage(page) {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const closeBtn = page.locator('#btn-close-onboarding');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  }

  test('Tela 1: Onboarding - Perfil, Solicitação do Nome e Objetivo de Perda de Peso', async ({ page }) => {
    // O app persiste em IndexedDB, não em localStorage. Limpar só o localStorage
    // não reinicia o estado: o modal nem aparecia e o perfil de um teste
    // anterior vazava para o seguinte.
    await page.goto('/');
    await page.evaluate(async () => {
      localStorage.clear();
      sessionStorage.clear();
      await new Promise(resolve => {
        const req = indexedDB.deleteDatabase('TreinoProDB');
        req.onsuccess = resolve;
        req.onerror = resolve;
        req.onblocked = resolve;
      });
    });
    await page.reload();

    // Aguarda o modal de onboarding abrir
    const modal = page.locator('#onboarding-modal');
    await expect(modal).toBeVisible();

    // Valida campo de nome
    const nameInput = page.locator('#input-user-name');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Mariana Silva');

    // Seleciona o Objetivo de Emagrecimento (prototype_mulher)
    const btnLoss = page.locator('#btn-goal-weight-loss');
    await expect(btnLoss).toBeVisible();
    await btnLoss.click();

    // Seleciona gênero feminino
    await page.locator('#btn-gender-female').click();

    // Preenche peso e altura
    await page.locator('#input-weight').fill('86');
    await page.locator('#input-height').fill('156');
    await page.locator('#input-age').fill('39');

    // Screenshot Passo 1
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_onboarding_passo1_nome_e_objetivo.png') });

    // Avança para Passo 2 (Rotina)
    await page.locator('#btn-onboarding-next').click();
    await expect(page.locator('#btn-days-4')).toBeVisible();
    await page.locator('#btn-days-4').click();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_onboarding_passo2_rotina.png') });

    // Avança para Passo 3 (Articulações & Equipamento)
    await page.locator('#btn-onboarding-next').click();
    await expect(page.locator('#btn-equip-gym')).toBeVisible();
    await page.locator('#btn-joint-joelho').click(); // marca proteção de joelho
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_onboarding_passo3_articulacoes.png') });

    // Conclui e gera o plano
    await page.locator('#btn-onboarding-submit').click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Valida exibição do nome no Header
    const userGreeting = page.locator('#app-user-subtitle');
    await expect(userGreeting).toContainText('Olá, Mariana Silva');

    // Valida banner com dados do modelo de emagrecimento
    await expect(page.locator('#app-title')).toContainText('Emagrecimento Saudável');
    await expect(page.locator('#section-weight-loss-diagnosis')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_home_emagrecimento_com_nome.png'), fullPage: true });
  });

  test('Tela 2: Fichas de Treino - Verificação de Duplicatas, Cargas e Cronômetro', async ({ page }) => {
    await prepareAppPage(page);

    await page.locator('#tab-btn-workout').click();
    await expect(page.locator('#screen-workout')).toBeVisible();

    const splitTabs = page.locator('button[id^="btn-split-treino-"]');
    const splitCount = await splitTabs.count();
    expect(splitCount).toBeGreaterThan(0);

    for (let i = 0; i < splitCount; i++) {
      await splitTabs.nth(i).click();

      const container = page.locator('div[id^="container-treino-"]:visible').first();
      await expect(container).toBeVisible();

      const names = await container.locator('a[id^="link-exercise-"], h4').allTextContents();
      expect(names.length).toBeGreaterThan(0);
      expect(new Set(names).size).toBe(names.length);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `05_tela_fichas_split_${i + 1}.png`),
        fullPage: true
      });
    }
  });

  test('Tela 3: Dieta & Nutrição - Cardápio & Termogênicos', async ({ page }) => {
    await prepareAppPage(page);

    await page.locator('#tab-btn-nutrition').click();
    await expect(page.locator('#screen-nutrition')).toBeVisible();

    await expect(page.locator('#meal-card-meal-1')).toBeVisible();
    await expect(page.locator('#meal-card-meal-2')).toBeVisible();
    await expect(page.locator('#meal-card-meal-3')).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_tela_dieta.png'), fullPage: true });
  });

  test('Tela 4: Calendário Semanal', async ({ page }) => {
    await prepareAppPage(page);

    await page.locator('#tab-btn-frequency').click();
    await expect(page.locator('#screen-frequency')).toBeVisible();

    await page.locator('#day-card-seg').click();
    await page.locator('#day-card-ter').click();

    await expect(page.locator('#week-progress-text')).toContainText('2 / 7');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_tela_calendario_semanal.png'), fullPage: true });
  });

});
