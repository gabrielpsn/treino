import { test, expect } from '@playwright/test';

/**
 * Devolve os cards de exercício visíveis em qualquer ficha. Só a aba ativa é
 * renderizada (`v-if="currentSplitTab === split.id"`), então um teste que procura
 * um exercício na ficha errada falha mesmo com o plano correto.
 */
async function allExerciseCardIds(page) {
  const ids = [];
  for (const split of ['treino-a', 'treino-b', 'treino-c', 'treino-d', 'treino-e']) {
    const tab = page.locator(`#btn-split-${split}`);
    if (await tab.count() === 0) continue;
    await tab.click();
    const cards = await page.locator(`#container-${split} [id^="exercise-card-"]`)
      .evaluateAll(els => els.map(e => e.id.replace('exercise-card-', '')));
    ids.push(...cards);
  }
  return ids;
}

/**
 * Cadastro completo em equipamento "casa" com dor no joelho. É o perfil mais
 * restritivo do app: antes de existir alternativa sem carga de joelho, o
 * gerador omitia os slots de quadríceps e o treino ficava incompleto.
 */
async function completeOnboardingHomeWithKnee(page) {
  await page.goto('/');
  await expect(page.locator('#onboarding-modal')).toBeVisible();

  await page.locator('#input-user-name').fill('Teste Casa');
  await page.locator('#btn-gender-male').click();
  await page.locator('#input-age').fill('34');
  await page.locator('#input-weight').fill('88');
  await page.locator('#input-height').fill('180');

  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-days-4').click();
  await page.locator('#btn-exp-beginner').click();

  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-equip-home').click();
  await page.locator('#btn-joint-joelho').click();

  await page.locator('#btn-onboarding-submit').click();
  await expect(page.locator('#onboarding-modal')).not.toBeVisible({ timeout: 5000 });
}

/**
 * Reabre a tela de exercícios próprios, cria um e devolve o modal fechado.
 */
async function createCustomExercise(page, { name, muscle, joint = null }) {
  await page.locator('#btn-open-custom-exercises').click();
  await expect(page.locator('#custom-exercises-modal')).toBeVisible();

  await page.locator('#input-custom-name').fill(name);
  await page.locator('#select-custom-muscle').selectOption(muscle);
  await page.locator('#btn-custom-equipment-home').click();
  if (joint) await page.locator(`#btn-custom-joint-${joint}`).click();
  await page.locator('#input-custom-series').fill('3x 15 reps');
  await page.locator('#input-custom-rest').fill('45s');
  await page.locator('#btn-save-custom-exercise').click();

  // O modal permanece aberto de propósito: a tela é uma lista e o usuário
  // normalmente quer cadastrar vários exercícios seguidos.
  await expect(page.locator('#input-custom-name')).toHaveValue('');
  await page.locator('#btn-close-custom-exercises').click();
  await expect(page.locator('#custom-exercises-modal')).toBeHidden({ timeout: 5000 });
}

test('Ficha em casa: nenhum slot fica vazio com dor no joelho', async ({ page }) => {
  await completeOnboardingHomeWithKnee(page);

  // O sintoma original era o slot sumindo da ficha (exercício omitido com
  // console.warn), não um exercício inseguesto aparecendo.
  const warnings = [];
  page.on('console', msg => {
    if (msg.text().includes('Slot omitido')) warnings.push(msg.text());
  });

  for (const split of ['treino-a', 'treino-b', 'treino-c', 'treino-d']) {
    const tab = page.locator(`#btn-split-${split}`);
    if (await tab.count() === 0) continue;
    await tab.click();
    const count = await page.locator(`#container-${split} [id^="exercise-card-"]`).count();
    expect(count, `ficha ${split} ficou com ${count} exercícios`).toBeGreaterThanOrEqual(6);
  }

  expect(warnings).toEqual([]);
});

test('Ficha em casa: quadríceps aparece mesmo com dor no joelho', async ({ page }) => {
  await completeOnboardingHomeWithKnee(page);

  // Agachamento isométrico é o slot de quadríceps sem carga de joelho.
  expect(await allExerciseCardIds(page)).toContain('agachamento_isometrico_parede');
});

test('CRUD: cria exercício próprio e ele entra no plano', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  if (await page.locator('#btn-close-onboarding').isVisible()) {
    await page.locator('#btn-close-onboarding').click();
  }

  await createCustomExercise(page, { name: 'Elevação Lateral no Elástico', muscle: 'ombro' });

  // Lista do modal mostra o exercício criado.
  await page.locator('#btn-open-custom-exercises').click();
  await expect(page.locator('#custom-exercise-custom_elevacao_lateral_no_elastico')).toBeVisible();
  await page.locator('#btn-close-custom-exercises').click();

  // E ele entra no plano, ocupando o slot do grupo muscular escolhido.
  expect(await allExerciseCardIds(page)).toContain('custom_elevacao_lateral_no_elastico');
});

test('CRUD: exercício próprio bloqueado por restrição não entra no plano', async ({ page }) => {
  await completeOnboardingHomeWithKnee(page);

  // Agachamento com carga real sobrecarrega o joelho. Marcando 'joelho' como
  // articulação, o filtro de segurança do gerador tem que descartá-lo igual
  // descarta um exercício de fábrica — o caminho alternativo para burlar a
  // restrição seria declarar jointStress vazio.
  await createCustomExercise(page, {
    name: 'Agachamento com Halteres',
    muscle: 'quadriceps',
    joint: 'joelho'
  });

  const ids = await allExerciseCardIds(page);
  expect(ids).not.toContain('custom_agachamento_com_halteres');
  // E o slot continua preenchido por alternativa segura.
  expect(ids).toContain('agachamento_isometrico_parede');
});

test('CRUD: bloqueia envio inválido e mostra o erro no campo', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  if (await page.locator('#btn-close-onboarding').isVisible()) {
    await page.locator('#btn-close-onboarding').click();
  }

  await page.locator('#btn-open-custom-exercises').click();
  await page.locator('#input-custom-name').fill('ab');
  await page.locator('#btn-save-custom-exercise').click();

  await expect(page.locator('#custom-exercises-error-summary')).toBeVisible();
  await expect(page.locator('#error-custom-name')).toBeVisible();
  await expect(page.locator('#input-custom-name')).toHaveAttribute('aria-invalid', 'true');
  // O modal continua aberto: o usuário não perde o que já digitou.
  await expect(page.locator('#custom-exercises-modal')).toBeVisible();
});

test('CRUD: editar exercício próprio atualiza o nome na ficha', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  if (await page.locator('#btn-close-onboarding').isVisible()) {
    await page.locator('#btn-close-onboarding').click();
  }

  await createCustomExercise(page, { name: 'Crucifixo no Elástico', muscle: 'peito' });
  const id = 'custom_crucifixo_no_elastico';
  expect(await allExerciseCardIds(page)).toContain(id);

  await page.locator('#btn-open-custom-exercises').click();
  await page.locator(`#btn-edit-custom-${id}`).click();
  await expect(page.locator('#input-custom-name')).toHaveValue('Crucifixo no Elástico');

  await page.locator('#input-custom-name').fill('Crucifixo Alto no Elástico');
  await page.locator('#btn-save-custom-exercise').click();
  await expect(page.locator('#input-custom-name')).toHaveValue('');

  await expect(page.locator(`#custom-exercise-${id}`)).toContainText('Crucifixo Alto no Elástico');
});

test('CRUD: excluir pede confirmação e some da ficha', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  if (await page.locator('#btn-close-onboarding').isVisible()) {
    await page.locator('#btn-close-onboarding').click();
  }

  await createCustomExercise(page, { name: 'Remada Unilateral', muscle: 'costas' });
  const id = 'custom_remada_unilateral';
  expect(await allExerciseCardIds(page)).toContain(id);

  await page.locator('#btn-open-custom-exercises').click();
  await page.locator(`#btn-delete-custom-${id}`).click();
  await expect(page.locator('#custom-exercise-delete-confirm')).toBeVisible();

  await page.locator('#btn-confirm-delete-custom').click();
  await expect(page.locator(`#custom-exercise-${id}`)).toHaveCount(0);
  await page.locator('#btn-close-custom-exercises').click();

  expect(await allExerciseCardIds(page)).not.toContain(id);
});

test('CRUD: exercício próprio sobrevive ao recarregar a página', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  if (await page.locator('#btn-close-onboarding').isVisible()) {
    await page.locator('#btn-close-onboarding').click();
  }

  await createCustomExercise(page, { name: 'Nordic Curl em Casa', muscle: 'posterior' });

  await page.reload();
  await page.waitForLoadState('networkidle');

  expect(await allExerciseCardIds(page)).toContain('custom_nordic_curl_em_casa');
});

test('CRUD: padrão incompatível com o grupo não pode ser salvo', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  if (await page.locator('#btn-close-onboarding').isVisible()) {
    await page.locator('#btn-close-onboarding').click();
  }

  await page.locator('#btn-open-custom-exercises').click();
  await page.locator('#input-custom-name').fill('Remada com Elástico');
  await page.locator('#select-custom-muscle').selectOption('costas');

  // O seletor de padrão só oferece padrões de costas depois de trocar o grupo.
  const patternOptions = await page.locator('#select-custom-pattern option')
    .evaluateAll(opts => opts.map(o => o.value).filter(Boolean));
  expect(patternOptions.sort()).toEqual(['lat_isolation', 'pull_horizontal', 'pull_vertical']);
  expect(patternOptions).not.toContain('squat');
});