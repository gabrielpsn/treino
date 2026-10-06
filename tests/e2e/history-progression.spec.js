import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

/**
 * Evolução de carga por exercício. Sessões de dias diferentes não dá para
 * fabricar pela UI (o app reabre a sessão do dia), então o histórico vem de um
 * backup importado — o mesmo caminho que o usuário usaria ao trocar de aparelho.
 */

const BACKUP_NAME = 'treino-backup-progressao.json';

async function onboardHome(page) {
  await page.goto('/');
  await expect(page.locator('#onboarding-modal')).toBeVisible();

  await page.locator('#input-user-name').fill('Progressão Teste');
  await page.locator('#input-age').fill('29');
  await page.locator('#input-weight').fill('80');
  await page.locator('#input-height').fill('177');
  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-days-3').click();
  await page.locator('#btn-exp-beginner').click();
  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-equip-home').click();
  await page.locator('#btn-onboarding-submit').click();

  await expect(page.locator('#onboarding-modal')).not.toBeVisible({ timeout: 5000 });
  await page.locator('#tab-btn-workout').click();
}

async function exportBackup(page) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#btn-export-backup').click()
  ]);
  return JSON.parse(await readFile(await download.path(), 'utf-8'));
}

async function importBackup(page, content) {
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.locator('#btn-import-backup').click()
  ]);
  await chooser.setFiles({
    name: BACKUP_NAME,
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(content))
  });

  const modal = page.locator('#backup-import-modal');
  await expect(modal).toBeVisible();
  await modal.locator('#btn-confirm-backup-import').click();
  await expect(modal).toBeHidden({ timeout: 5000 });
}

/** Primeira ficha e primeiro exercício: o alvo da progressão injetada. */
async function firstExercise(page) {
  const tab = page.locator('button[id^="btn-split-treino-"]').first();
  const splitId = (await tab.getAttribute('id')).replace('btn-split-', '');
  await tab.click();

  const card = page.locator(`#container-${splitId} [id^="exercise-card-"]`).first();
  const exerciseId = (await card.getAttribute('id')).replace('exercise-card-', '');
  const name = (await card.locator('h4, a').first().textContent()).trim();
  return { splitId, exerciseId, name };
}

function sessionWithSet(id, dayKey, splitId, exerciseId, weight) {
  const startedAt = `${dayKey}T10:00:00.000Z`;
  return {
    id,
    dayKey,
    weekKey: '2026-W40',
    startedAt,
    finishedAt: `${dayKey}T11:00:00.000Z`,
    splitId,
    goal: null,
    source: 'live',
    createdAt: startedAt,
    sets: [{
      sessionId: id,
      exerciseId,
      splitId,
      weight: String(weight),
      reps: '10',
      isDone: true,
      recordedAt: startedAt
    }]
  };
}

test('Histórico: gráfico mostra a progressão de carga com delta desde o 1º treino', async ({ page }) => {
  await onboardHome(page);
  const target = await firstExercise(page);

  const backup = await exportBackup(page);
  backup.sessions = [
    sessionWithSet('sess-1', '2026-09-01', target.splitId, target.exerciseId, 40),
    sessionWithSet('sess-2', '2026-09-08', target.splitId, target.exerciseId, 42.5),
    sessionWithSet('sess-3', '2026-09-15', target.splitId, target.exerciseId, 45)
  ];
  await importBackup(page, backup);

  await page.locator('#tab-btn-history').click();
  await expect(page.locator('#screen-history')).toBeVisible();

  const chart = page.locator('#history-exercise-chart');
  await expect(chart).toBeVisible();
  await expect(page.locator('#history-exercise-select')).toHaveValue(target.exerciseId);
  await expect(chart.locator('circle')).toHaveCount(3);
  await expect(page.locator('#history-exercise-delta')).toContainText('+5 kg');
});

test('Histórico: exercício com uma única sessão não vira gráfico', async ({ page }) => {
  await onboardHome(page);
  const target = await firstExercise(page);

  const backup = await exportBackup(page);
  backup.sessions = [sessionWithSet('sess-unico', '2026-09-01', target.splitId, target.exerciseId, 40)];
  await importBackup(page, backup);

  await page.locator('#tab-btn-history').click();
  await expect(page.locator('#screen-history')).toBeVisible();

  // A sessão aparece na lista, mas sem segundo ponto não há linha a desenhar.
  await expect(page.locator('article[id^="history-session-"]')).toHaveCount(1);
  await expect(page.locator('#history-exercise-chart')).toHaveCount(0);
});
