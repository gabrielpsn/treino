import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('tests/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

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
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
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

    // Garante que estamos na aba de treinos
    await page.locator('#tab-btn-workout').click();
    await expect(page.locator('#screen-workout')).toBeVisible();

    // Valida Treino A
    await page.locator('#btn-split-treino-a').click();
    await expect(page.locator('#container-treino-a')).toBeVisible();

    // Valida se o botão de instalar PWA está visível no header
    const installBtn = page.locator('#btn-install-app');
    await expect(installBtn).toBeVisible();

    // Checa se os exercícios são únicos (sem duplicatas) e têm links de imagem externa
    const exerciseTitles = page.locator('#container-treino-a a[id^="link-exercise-"], #container-treino-a h4');
    const count = await exerciseTitles.count();
    expect(count).toBeGreaterThan(0);
    const names = [];
    for (let i = 0; i < count; i++) {
      names.push(await exerciseTitles.nth(i).textContent());
    }
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);

    // Valida que o primeiro exercício possui link externo válido com target _blank
    const firstLink = page.locator('#container-treino-a a[id^="link-exercise-"]').first();
    await expect(firstLink).toBeVisible();
    await expect(firstLink).toHaveAttribute('target', '_blank');
    await expect(firstLink).toHaveAttribute('href', /https?:\/\//);

    // Marca o primeiro exercício como concluído
    const firstCheck = page.locator('#container-treino-a button[id^="btn-check-"]').first();
    await firstCheck.click();

    // Screenshot Treino A
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_tela_fichas_treino_a.png'), fullPage: true });

    // Valida aba Cardio Estratégico
    const btnCardio = page.locator('#btn-split-treino-c');
    if (await btnCardio.isVisible()) {
      await btnCardio.click();
      await expect(page.locator('#container-treino-c')).toBeVisible();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_tela_fichas_cardio_estrategico.png'), fullPage: true });
    }
  });

  test('Tela 3: Dieta & Nutrição - Cardápio de Emagrecimento & Termogênicos Naturais', async ({ page }) => {
    await prepareAppPage(page);

    // Clica na aba Dieta & Metas
    await page.locator('#tab-btn-nutrition').click();
    await expect(page.locator('#screen-nutrition')).toBeVisible();

    // Valida os suplementos ou recomendações nutricionais
    const isLossMode = await page.locator('#card-supplement-cha-verde').isVisible();
    if (isLossMode) {
      await expect(page.locator('#card-supplement-cha-verde')).toBeVisible();
      await expect(page.locator('#card-supplement-psyllium')).toBeVisible();
      await expect(page.locator('#card-supplement-creatina')).toBeVisible();
    } else {
      await expect(page.locator('h4:has-text("Creatina Monohidratada")').first()).toBeVisible();
      await expect(page.locator('h4:has-text("Hidratação Crítica")').first()).toBeVisible();
    }

    // Valida as refeições calculadas
    await expect(page.locator('#meal-card-meal-1')).toBeVisible();
    await expect(page.locator('#meal-card-meal-2')).toBeVisible();
    await expect(page.locator('#meal-card-meal-3')).toBeVisible();

    // Screenshot Tela de Dieta
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_tela_dieta_termogenicos.png'), fullPage: true });
  });

  test('Tela 4: Calendário Semanal - Compromisso e Registro de Frequência', async ({ page }) => {
    await prepareAppPage(page);

    // Clica na aba Calendário Semanal
    await page.locator('#tab-btn-frequency').click();
    await expect(page.locator('#screen-frequency')).toBeVisible();

    // Clica nos dias da semana para registrar
    await page.locator('#day-card-seg').click();
    await page.locator('#day-card-ter').click();

    // Valida contagem
    const progressText = page.locator('#week-progress-text');
    await expect(progressText).toContainText('2 / 7');

    // Screenshot Tela de Frequência
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_tela_calendario_semanal.png'), fullPage: true });
  });

});
