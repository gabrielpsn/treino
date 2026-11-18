import { expect } from '@playwright/test';

/**
 * Cadastro inicial compartilhado pelos specs E2E.
 *
 * Desde que os dados iniciais viraram obrigatórios (objetivo, sexo, biometria,
 * rotina, equipamento e dieta), o modal não pode mais ser fechado no primeiro
 * acesso nem vem pré-preenchido. Os padrões abaixo são os mesmos valores que o
 * formulário trazia antes disso, para que os specs antigos continuem gerando o
 * mesmo plano.
 */
export const DEFAULT_ONBOARDING = {
  name: 'Atleta Teste',
  goal: 'hypertrophy',
  gender: 'male',
  age: 25,
  weight: 74,
  height: 175,
  days: 4,
  experience: 'intermediate',
  equipment: 'gym',
  diet: 'omnivore',
  joints: []
};

/** Preenche e envia o onboarding. Espera o modal já estar aberto ou abrindo. */
export async function completeOnboarding(page, options = {}) {
  const o = { ...DEFAULT_ONBOARDING, ...options };
  const modal = page.locator('#onboarding-modal');
  await expect(modal).toBeVisible({ timeout: 15000 });

  await page.locator('#input-user-name').fill(String(o.name));
  await page.locator(`#btn-goal-${o.goal}`).click();
  await page.locator(`#btn-gender-${o.gender}`).click();
  await page.locator('#input-age').fill(String(o.age));
  await page.locator('#input-weight').fill(String(o.weight));
  await page.locator('#input-height').fill(String(o.height));
  await page.locator('#btn-onboarding-next').click();

  await page.locator(`#btn-days-${o.days}`).click();
  await page.locator(`#btn-exp-${o.experience}`).click();
  await page.locator('#btn-onboarding-next').click();

  await page.locator(`#btn-equip-${o.equipment}`).click();
  await page.locator(`#btn-dietary-${o.diet}`).click();
  for (const joint of o.joints) {
    await page.locator(`#btn-joint-${joint}`).click();
  }

  await page.locator('#btn-onboarding-submit').click();
  await expect(modal).toBeHidden({ timeout: 5000 });
}

/**
 * Para specs que só precisam do app pronto: se o onboarding abrir (contexto
 * novo, sem perfil), conclui com o perfil padrão; se já houver perfil, segue.
 */
export async function ensureOnboarded(page, options = {}) {
  const modal = page.locator('#onboarding-modal');
  try {
    await modal.waitFor({ state: 'visible', timeout: 5000 });
  } catch {
    return;
  }
  await completeOnboarding(page, options);
}
