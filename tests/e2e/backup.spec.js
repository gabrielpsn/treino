import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

/**
 * Backup e restauração de ponta a ponta: exportar gera um arquivo de verdade,
 * limpar o aparelho e restaurar o arquivo precisa devolver exatamente o estado.
 * Testar só a módulo deixaria passar um bug em que o botão exporta um objeto
 * que o import não sabe ler.
 */

const BACKUP_NAME = 'treino-backup-teste.json';

async function onboardHome(page, name = 'Backup Teste') {
  await page.goto('/');
  await expect(page.locator('#onboarding-modal')).toBeVisible();

  await page.locator('#input-user-name').fill(name);
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

async function createCustomExercise(page, name) {
  await page.locator('#btn-open-custom-exercises').click();
  await expect(page.locator('#custom-exercises-modal')).toBeVisible();
  await page.locator('#input-custom-name').fill(name);
  await page.locator('#select-custom-muscle').selectOption('peito');
  await page.locator('#btn-save-custom-exercise').click();
  await expect(page.locator('#input-custom-name')).toHaveValue('');
  await page.locator('#btn-close-custom-exercises').click();
  await expect(page.locator('#custom-exercises-modal')).toBeHidden({ timeout: 5000 });
}

async function firstSplitOrder(page) {
  const tab = page.locator('button[id^="btn-split-treino-"]').first();
  const splitId = (await tab.getAttribute('id')).replace('btn-split-', '');
  await tab.click();
  const ids = await page.locator(`#container-${splitId} [id^="exercise-card-"]`)
    .evaluateAll(els => els.map(e => e.id.replace('exercise-card-', '')));
  return { splitId, ids };
}

/** Exporta o backup e devolve o objeto JSON baixado. */
async function exportBackup(page) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#btn-export-backup').click()
  ]);
  const path = await download.path();
  return JSON.parse(await readFile(path, 'utf-8'));
}

/** Troca o backup do aparelho: usa o file chooser do input escondido. */
async function selectBackupFile(page, content) {
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.locator('#btn-import-backup').click()
  ]);
  await chooser.setFiles({
    name: BACKUP_NAME,
    mimeType: 'application/json',
    buffer: Buffer.from(typeof content === 'string' ? content : JSON.stringify(content))
  });
}

test('Backup: o arquivo exportado leva perfil, plano e exercícios próprios', async ({ page }) => {
  await onboardHome(page, 'Ana Backup');
  await createCustomExercise(page, 'Supino na Arquinha');

  const backup = await exportBackup(page);

  expect(backup.kind).toBe('treinopro-backup');
  expect(backup.version).toBe(1);
  expect(backup.exportedAt).toBeTruthy();
  expect(backup.userProfile.userName).toBe('Ana Backup');
  expect(backup.userProfile.equipment).toBe('home');
  expect(backup.activePlan.workoutSplits.length).toBeGreaterThan(0);
  expect(backup.customExercises).toHaveLength(1);
  expect(backup.customExercises[0].name).toBe('Supino na Arquinha');
  // Toda sessão precisa vir com as suas séries embutidas: são elas que o
  // histórico usa para calcular volume.
  for (const session of backup.sessions) {
    expect(Array.isArray(session.sets)).toBe(true);
  }
});

test('Backup: arquivo inválido mostra o motivo e não mexe em nada', async ({ page }) => {
  await onboardHome(page, 'Ana Backup Ruim');
  const before = await firstSplitOrder(page);

  await selectBackupFile(page, 'isso nao e um json');

  await expect(page.locator('#storage-error-banner')).toBeVisible();
  await expect(page.locator('#storage-error-banner')).toContainText('JSON');
  await expect(page.locator('#backup-import-modal')).toBeHidden();

  // O erro não pode ter limpado o treino: é o pior resultado possível num
  // arquivo que o usuário escolheu por engano.
  const after = await firstSplitOrder(page);
  expect(after.ids).toEqual(before.ids);
});

test('Backup: JSON de outro app é recusado pelo nome do arquivo', async ({ page }) => {
  await onboardHome(page, 'Ana Outros Dados');
  await selectBackupFile(page, { foo: 'bar' });

  await expect(page.locator('#storage-error-banner')).toContainText('não é um backup do TreinoPro');
  await expect(page.locator('#backup-import-modal')).toBeHidden();
});

test('Backup: restauração devolve o estado do arquivo após limpar o aparelho', async ({ page }) => {
  await onboardHome(page, 'Ana Original');
  await createCustomExercise(page, 'Supino na Arquinha');
  const original = await firstSplitOrder(page);

  // Registra uma carga para haver histórico no backup.
  const firstExercise = original.ids[0];
  await page.locator(`#input-weight-${firstExercise}`).fill('25');
  await page.locator(`#input-reps-${firstExercise}`).fill('12');
  await page.locator(`#btn-check-${firstExercise}`).click();
  await expect(page.locator(`#btn-check-${firstExercise}`)).toHaveAttribute('aria-pressed', 'true');

  const backup = await exportBackup(page);

  // Simula a perda total de dados: um app novo, com outro treino e sem o
  // exercício próprio. É o cenário que o backup existe para resolver.
  await page.evaluate(async () => {
    const request = indexedDB.deleteDatabase('TreinoProDB');
    await new Promise((resolve, reject) => {
      request.onsuccess = resolve;
      request.onerror = () => reject(request.error);
      request.onblocked = resolve;
    });
  });
  await page.goto('/');
  await expect(page.locator('#onboarding-modal')).toBeVisible();

  // O onboarding cobre o cabeçalho. Fechá-lo é o caminho do próprio app: o botão
  // de fechar existe justamente para isso, e é o que libera o botão de backup.
  await page.locator('#btn-close-onboarding').click();
  await expect(page.locator('#onboarding-modal')).toBeHidden();

  await selectBackupFile(page, backup);

  const modal = page.locator('#backup-import-modal');
  await expect(modal).toBeVisible();
  await expect(modal.locator('#backup-stat-user')).toHaveText('Ana Original');
  await expect(modal.locator('#backup-stat-custom')).toHaveText('1');
  await expect(modal.locator('#backup-stat-splits')).toHaveText(String(backup.activePlan.workoutSplits.length));

  await modal.locator('#btn-confirm-backup-import').click();
  await expect(modal).toBeHidden({ timeout: 5000 });

  // Perfil restaurado: o app não pode pedir onboarding de novo.
  await expect(page.locator('#onboarding-modal')).toBeHidden();
  await page.locator('#tab-btn-workout').click();

  const restored = await firstSplitOrder(page);
  expect(restored.splitId).toBe(original.splitId);
  expect(restored.ids).toEqual(original.ids);

  // O exercício próprio voltou para a lista do usuário.
  await page.locator('#btn-open-custom-exercises').click();
  await expect(page.locator('#custom-exercises-modal')).toBeVisible();
  await expect(page.locator('#custom-exercise-custom_supino_na_arquinha')).toBeVisible();
  await page.locator('#btn-close-custom-exercises').click();

  // E o log de carga voltou: o campo do exercício mostra o valor do backup.
  // O selo de "último treino" ficaria oculto aqui de propósito, já que o
  // workout_logs restaurado é justamente o estado atual dos campos.
  await expect(page.locator(`#input-weight-${firstExercise}`)).toHaveValue('25');
  await expect(page.locator(`#input-reps-${firstExercise}`)).toHaveValue('12');
});

test('Backup: cancelar a confirmação não altera nenhum dado', async ({ page }) => {
  await onboardHome(page, 'Ana Cancela');
  const before = await firstSplitOrder(page);

  const backup = await exportBackup(page);
  await selectBackupFile(page, backup);
  await expect(page.locator('#backup-import-modal')).toBeVisible();

  await page.locator('#btn-cancel-backup-import').click();
  await expect(page.locator('#backup-import-modal')).toBeHidden();

  const after = await firstSplitOrder(page);
  expect(after.ids).toEqual(before.ids);
});

test('Backup: o mesmo arquivo pode ser importado duas vezes seguidas', async ({ page }) => {
  await onboardHome(page, 'Ana Repete');
  await createCustomExercise(page, 'Agachamento na Cadeira');

  const backup = await exportBackup(page);

  for (let round = 0; round < 2; round++) {
    await selectBackupFile(page, backup);
    await expect(page.locator('#backup-import-modal')).toBeVisible();
    await page.locator('#btn-confirm-backup-import').click();
    await expect(page.locator('#backup-import-modal')).toBeHidden({ timeout: 5000 });
  }

  // Importar duas vezes não pode duplicar o exercício próprio: o id é a chave.
  await page.locator('#btn-open-custom-exercises').click();
  await expect(page.locator('#custom-exercises-modal')).toBeVisible();
  await expect(page.locator('#custom-exercise-custom_agachamento_na_cadeira')).toHaveCount(1);
});

test('Backup: arquivo do formato antigo é recusado antes de tocar no app', async ({ page }) => {
  await onboardHome(page, 'Ana Formato Antigo');
  const before = await firstSplitOrder(page);

  // Formato anterior à versão: parece um backup (tem perfil e plano) mas não
  // passou por validação alguma. O app precisa recusar em vez de adivinhar.
  await selectBackupFile(page, {
    userProfile: { userName: 'Backup Antigo', goal: 'hypertrophy', equipment: 'gym', restrictions: [] },
    activePlan: { id: 'current_active_plan', workoutSplits: [{ id: 'treino-a', title: 'Treino A', exercises: [] }] },
    workoutLogs: {},
    weeklyChecks: [],
    sessions: [],
    exportedAt: '2026-01-05T10:00:00.000Z'
  });

  await expect(page.locator('#storage-error-banner')).toContainText('não é um backup do TreinoPro');
  await expect(page.locator('#backup-import-modal')).toBeHidden();

  // O treino atual segue intacto: recusa não pode custar o dia do usuário.
  expect((await firstSplitOrder(page)).ids).toEqual(before.ids);
});