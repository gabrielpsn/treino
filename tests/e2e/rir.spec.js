import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

/**
 * RIR por exercício: digitado na ficha, aparece no modo treino, volta no
 * histórico e sobrevive ao round-trip do backup.
 */

const BACKUP_NAME = 'treino-backup-rir.json';

async function onboardHome(page) {
  await page.goto('/');
  await expect(page.locator('#onboarding-modal')).toBeVisible();

  await page.locator('#input-user-name').fill('RIR Teste');
  await page.locator('#input-age').fill('31');
  await page.locator('#input-weight').fill('75');
  await page.locator('#input-height').fill('174');
  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-days-3').click();
  await page.locator('#btn-exp-beginner').click();
  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-equip-home').click();
  await page.locator('#btn-onboarding-submit').click();

  await expect(page.locator('#onboarding-modal')).not.toBeVisible({ timeout: 5000 });
  await page.locator('#tab-btn-workout').click();
}

async function firstExercise(page) {
  const tab = page.locator('button[id^="btn-split-treino-"]').first();
  const splitId = (await tab.getAttribute('id')).replace('btn-split-', '');
  await tab.click();

  const card = page.locator(`#container-${splitId} [id^="exercise-card-"]`).first();
  const exerciseId = (await card.getAttribute('id')).replace('exercise-card-', '');
  return { splitId, exerciseId };
}

async function exportBackup(page) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#btn-export-backup').click()
  ]);
  return JSON.parse(await readFile(await download.path(), 'utf-8'));
}

test('RIR digitado na ficha chega ao modo treino, ao histórico e ao backup', async ({ page }) => {
  await onboardHome(page);
  const { splitId, exerciseId } = await firstExercise(page);

  await page.locator(`#input-weight-${exerciseId}`).fill('60');
  await page.locator(`#input-reps-${exerciseId}`).fill('10');
  await page.locator(`#input-rir-${exerciseId}`).fill('2');

  // Foco do modo treino é o primeiro exercício pendente: o valor persistido
  // tem que aparecer lá sem digitar de novo.
  await page.locator('#btn-open-training-mode').click();
  const rirInput = page.locator('#training-input-rir');
  await expect(page.locator('#training-mode')).toBeVisible();
  await expect(rirInput).toHaveValue('2');
  await page.locator('#btn-exit-training-mode').click();
  await expect(page.locator('#training-mode')).toBeHidden();

  // Mesmo valor após fechar e reabrir: leitura vinda do banco, não do estado da tela.
  await page.reload();
  await page.locator('#tab-btn-workout').click();
  await page.locator(`button[id^="btn-split-${splitId}"]`).click();
  await expect(page.locator(`#input-rir-${exerciseId}`)).toHaveValue('2');

  await page.locator(`#input-rir-${exerciseId}`).fill('3');
  await expect(page.locator(`#input-rir-${exerciseId}`)).toHaveValue('3');

  const backup = await exportBackup(page);
  const set = backup.sessions.at(-1)?.sets.find(s => s.exerciseId === exerciseId);
  const log = backup.workoutLogs.find(row => row.exerciseId === exerciseId);
  expect(set?.rir).toBe('3');
  expect(log?.rir).toBe('3');

  await page.locator('#tab-btn-history').click();
  await expect(page.locator('#screen-history')).toBeVisible();
  await expect(page.locator('[id^="history-session-body-"]').first()).toContainText('RIR 3');
});
