import { test, expect } from '@playwright/test';

/**
 * Alvos de toque e layout no celular.
 *
 * O app é uma PWA usada em pé, no ginásio, com uma mão só. Os testes anteriores
 * rodavam no viewport padrão do desktop, então um botão de 28px passava sem que
 * ninguém notasse: no toque real ele é menor que a ponta do dedo.
 */

const MOBILE = { width: 390, height: 844 }; // iPhone 14/15/16

test.use({ viewport: MOBILE });

async function onboardHome(page, name = 'Mobile Check') {
  await page.goto('/');
  await expect(page.locator('#onboarding-modal')).toBeVisible();

  await page.locator('#input-user-name').fill(name);
  await page.locator('#input-age').fill('30');
  await page.locator('#input-weight').fill('80');
  await page.locator('#input-height').fill('175');
  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-days-3').click();
  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-equip-home').click();
  await page.locator('#btn-onboarding-submit').click();
  await expect(page.locator('#onboarding-modal')).not.toBeVisible({ timeout: 5000 });
  await page.locator('#tab-btn-workout').click();
}

async function openFirstSplit(page) {
  const tab = page.locator('button[id^="btn-split-treino-"]').first();
  const splitId = (await tab.getAttribute('id')).replace('btn-split-', '');
  await tab.click();
  return { splitId, container: page.locator(`#container-${splitId}`) };
}

/** Retângulo visível de um elemento, já recortado à viewport. */
async function visibleBox(locator) {
  const box = await locator.boundingBox();
  expect(box, 'elemento sem boundingBox (fora da viewport?)').not.toBeNull();
  return box;
}

test('Celular: nenhuma ação da ficha fica abaixo de 44px de alvo', async ({ page }) => {
  await onboardHome(page);
  const { container } = await openFirstSplit(page);

  const exerciseIds = await container.locator('[id^="exercise-card-"]')
    .evaluateAll(els => els.map(e => e.id.replace('exercise-card-', '')));
  expect(exerciseIds.length).toBeGreaterThan(0);

  // 44px é o mínimo recomendado para toque (Apple HIG). Os quatro botões de ação
  // e o de concluir série são o que o usuário acerta o dia inteiro.
  for (const id of exerciseIds) {
    for (const prefix of ['btn-check', 'btn-swap', 'btn-up', 'btn-down', 'btn-remove']) {
      const button = container.locator(`#${prefix}-${id}`);
      if (await button.count() === 0) continue;

      const box = await visibleBox(button);
      expect(box.height, `${prefix}-${id} tem ${Math.round(box.height)}px de altura`)
        .toBeGreaterThanOrEqual(44);
      expect(box.width, `${prefix}-${id} tem ${Math.round(box.width)}px de largura`)
        .toBeGreaterThanOrEqual(44);
    }
  }
});

test('Celular: os alvos de toque não se sobrepõem entre si', async ({ page }) => {
  await onboardHome(page, 'Mobile Alvos');
  const { container } = await openFirstSplit(page);

  const firstId = (await container.locator('[id^="exercise-card-"]').first()
    .getAttribute('id')).replace('exercise-card-', '');

  const boxes = [];
  for (const prefix of ['btn-check', 'btn-swap', 'btn-up', 'btn-down', 'btn-remove']) {
    boxes.push({ prefix, box: await visibleBox(container.locator(`#${prefix}-${firstId}`)) });
  }

  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i].box;
      const b = boxes[j].box;
      const overlap = a.x < b.x + b.width && a.x + a.width > b.x
        && a.y < b.y + b.height && a.y + a.height > b.y;
      // Botões de 44px com gap pequeno encostam: encostar é aceitável desde que
      // não se sobreponham de fato.
      expect(overlap, `${boxes[i].prefix} e ${boxes[j].prefix} se sobrepõem`).toBe(false);
    }
  }
});

test('Celular: o botão de remover é vermelho e visivelmente maior que os outros', async ({ page }) => {
  await onboardHome(page, 'Mobile Remover');
  const { container } = await openFirstSplit(page);

  const firstId = (await container.locator('[id^="exercise-card-"]').first()
    .getAttribute('id')).replace('exercise-card-', '');

  const remove = await visibleBox(container.locator(`#btn-remove-${firstId}`));
  const up = await visibleBox(container.locator(`#btn-up-${firstId}`));

  // Remover apaga histórico: não pode ter a mesma leitura de "ajuste" dos outros.
  expect(remove.width).toBeGreaterThan(up.width);

  const color = await container.locator(`#btn-remove-${firstId}`)
    .evaluate(el => getComputedStyle(el).color);
  const rgb = color.match(/\d+/g)?.map(Number) ?? [];
  const [r, g, b] = rgb;
  // Vermelho dominante: r alto e muito acima de g e b.
  expect(r).toBeGreaterThan(180);
  expect(r).toBeGreaterThan(g + 40);
  expect(r).toBeGreaterThan(b + 40);
});

test('Celular: a confirmação de remover tem alvo grande e cabe na tela', async ({ page }) => {
  await onboardHome(page, 'Mobile Confirm');
  const { container } = await openFirstSplit(page);

  const firstId = (await container.locator('[id^="exercise-card-"]').first()
    .getAttribute('id')).replace('exercise-card-', '');

  await container.locator(`#btn-remove-${firstId}`).click();

  const confirm = container.locator(`#btn-confirm-remove-${firstId}`);
  const cancel = container.locator(`#btn-cancel-remove-${firstId}`);
  await expect(confirm).toBeVisible();

  for (const [label, button] of [['confirmar', confirm], ['cancelar', cancel]]) {
    const box = await visibleBox(button);
    expect(box.height, `${label} tem ${Math.round(box.height)}px`).toBeGreaterThanOrEqual(44);
    expect(box.x + box.width).toBeLessThanOrEqual(MOBILE.width + 1);
  }
});

test('Celular: o menu gruda no topo sem cobrir o cabeçalho', async ({ page }) => {
  await onboardHome(page, 'Mobile Header');
  await page.waitForTimeout(400);

  const header = page.locator('header');
  const nav = page.locator('nav');

  const headerBox = await visibleBox(header);
  const navBox = await visibleBox(nav);

  // No topo da página o menu vem logo abaixo do cabeçalho, sem sobreposição.
  // Antes as duas eram sticky com deslocamento fixo em pixel; se a conta errar
  // (e ela errava assim que o título quebrava no celular), o menu fica
  // escondido atrás do cabeçalho.
  expect(navBox.y, 'menu começa acima do fim do cabeçalho')
    .toBeGreaterThanOrEqual(headerBox.y + headerBox.height - 1);

  // E o menu tem que estar de fato visível na primeira dobra.
  expect(navBox.y + navBox.height).toBeLessThanOrEqual(MOBILE.height);
  await expect(page.locator('#tab-btn-workout')).toBeInViewport();

  // Rolar a página: o menu continua colado no topo e legível. O cabeçalho
  // rola junto, então ele não rouba altura útil durante o treino.
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(400);

  const navScrolled = await visibleBox(nav);
  expect(navScrolled.y, 'menu não gruda no topo depois de rolar')
    .toBeLessThanOrEqual(1);
  await expect(page.locator('#tab-btn-workout')).toBeInViewport();

  // E o botão de concluir série continua tocável com o menu grudado: é o que
  // trava quando o conteúdo passa por baixo dele e o toque acerta o menu.
  const check = page.locator('[id^="btn-check-"]').first();
  await check.click();
  await expect(check).toHaveAttribute('aria-pressed', 'true');
});

test('Celular: o banner de erro empurra o conteúdo em vez de cobrir o menu', async ({ page }) => {
  await onboardHome(page, 'Mobile Banner');

  // Caminho que realmente produz o banner: restaurar um arquivo inválido.
  await page.locator('#input-backup-file').setInputFiles({
    name: 'nao-e-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from('isso aqui nao e json'),
  });

  const banner = page.locator('#storage-error-banner');
  await expect(banner).toBeVisible();

  const nav = await visibleBox(page.locator('nav'));
  const bannerBox = await visibleBox(banner);

  // O banner vivia grudado em top-57px, a mesma altura do cabeçalho: ele
  // cobria o menu e, com a conta errada, desaparecia da tela.
  expect(bannerBox.y, 'banner cobre o menu')
    .toBeGreaterThanOrEqual(nav.y + nav.height - 1);
  expect(bannerBox.y + bannerBox.height).toBeLessThanOrEqual(MOBILE.height);
  expect(bannerBox.x + bannerBox.width).toBeLessThanOrEqual(MOBILE.width);

  // E o banner ainda tem que ser legível e dispensável.
  const dismiss = page.locator('#btn-dismiss-storage-error');
  const dismissBox = await visibleBox(dismiss);
  expect(dismissBox.height).toBeGreaterThanOrEqual(24);
  await dismiss.click();
  await expect(banner).toHaveCount(0);
});

test('Celular: a navegação por abas rola horizontalmente sem cortar opções', async ({ page }) => {
  await onboardHome(page, 'Mobile Abas');

  const tabs = page.locator('nav button[id^="tab-btn-"]');
  const count = await tabs.count();
  expect(count).toBeGreaterThanOrEqual(3);

  // Todas as abas precisam ser alcançáveis: se a barra não rola e alguém
  // espremer, a última aba fica inacessível.
  const nav = page.locator('nav > div');
  const canScroll = await nav.evaluate(el => el.scrollWidth > el.clientWidth);
  const overflowsX = await nav.evaluate(el => getComputedStyle(el).overflowX);

  if (canScroll) {
    expect(overflowsX).toBe('auto');
  }

  const lastTab = tabs.nth(count - 1);
  await lastTab.scrollIntoViewIfNeeded();
  await expect(lastTab).toBeInViewport();
});

test('Celular: a ficha não gera rolagem horizontal', async ({ page }) => {
  await onboardHome(page, 'Mobile Scroll');
  const { container } = await openFirstSplit(page);
  await expect(container.locator('[id^="exercise-card-"]').first()).toBeVisible();

  // Rolagem lateral é quase sempre elemento largo demais; num celular ela
  // atrapalha mais do que ajuda.
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow, `página vaza ${overflow}px na horizontal`).toBeLessThanOrEqual(1);
});

test('Celular: os campos de carga e reps continuam utilizáveis', async ({ page }) => {
  await onboardHome(page, 'Mobile Inputs');
  const { container } = await openFirstSplit(page);

  const firstId = (await container.locator('[id^="exercise-card-"]').first()
    .getAttribute('id')).replace('exercise-card-', '');

  const weight = container.locator(`#input-weight-${firstId}`);
  if (await weight.count() === 0) test.skip(true, 'Primeiro exercício é cardio');

  const box = await visibleBox(weight);
  expect(box.height).toBeGreaterThanOrEqual(40);

  await weight.fill('30');
  await expect(weight).toHaveValue('30');

  const check = container.locator(`#btn-check-${firstId}`);
  await check.click();
  await expect(check).toHaveAttribute('aria-pressed', 'true');
});
/**
 * Tela estreita de verdade (Galaxy Fold fechado, Android antigo): 320px.
 *
 * Não é o caso comum, mas é onde os alvos de 44px disputam espaço com o texto
 * e o conteúdo vaza para fora do cartão. Um cartão mais largo que a tela
 * significa botão cortado embaixo.
 */
test('Tela estreita (320px): nada vaza e os alvos continuam grandes', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await onboardHome(page, 'Tela Estreita');
  const { container } = await openFirstSplit(page);
  await expect(container.locator('[id^="exercise-card-"]').first()).toBeVisible();

  const pageOverflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(pageOverflow, `página vaza ${pageOverflow}px`).toBeLessThanOrEqual(1);

  // Nenhum elemento pode desenhar fora da própria caixa: é assim que um botão
  // fica cortado sem a página inteiro rolar.
  const spilling = await page.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll('main *')) {
      const style = getComputedStyle(el);
      if (style.overflowX !== 'visible') continue;
      if (el.scrollWidth - el.clientWidth > 1) {
        bad.push(`${el.tagName.toLowerCase()}#${el.id || '-'}.${String(el.className).slice(0, 40)}`);
      }
    }
    return bad.slice(0, 5);
  });
  expect(spilling, `elementos vazando: ${spilling.join(', ')}`).toHaveLength(0);

  // E os alvos não podem encolher para caber na conta.
  const firstId = (await container.locator('[id^="exercise-card-"]').first()
    .getAttribute('id')).replace('exercise-card-', '');
  const remove = await visibleBox(container.locator(`#btn-remove-${firstId}`));
  expect(remove.height).toBeGreaterThanOrEqual(44);
  expect(remove.x + remove.width).toBeLessThanOrEqual(321);
});
