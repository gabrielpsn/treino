import { test, expect } from '@playwright/test';
import { EXERCISE_CATALOG } from '../../src/engine/knowledge/exercises.js';
import { filterSafeExercises } from '../../src/engine/generators/workoutGenerator.js';

/**
 * Home, 3 dias. O mock da IA escolhe os exercícios com o mesmo filtro que o
 * Worker usa para montar o catálogo enviado: se o teste inventasse um id
 * inseguro, ele estaria testando o filtro de segurança, não a integração.
 */
async function onboard(page, { name = 'Aluno IA', restrictions = [] } = {}) {
  await page.goto('/');
  // Contexto novo = sem perfil salvo: o modal abre depois das migrações do
  // IndexedDB. Os testes sempre passam por aqui, então não existe caminho que
  // pule o cadastro — clicar na aba antes do hidratar é o que causava a corrida
  // com o overlay do modal abrindo em cima.
  const modal = page.locator('#onboarding-modal');
  await expect(modal).toBeVisible({ timeout: 15000 });

  await page.locator('#input-user-name').fill(name);
  await page.locator('#input-age').fill('30');
  await page.locator('#input-weight').fill('82');
  await page.locator('#input-height').fill('175');

  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-days-3').click();
  await page.locator('#btn-exp-beginner').click();
  await page.locator('#btn-onboarding-next').click();
  await page.locator('#btn-equip-home').click();

  for (const restriction of restrictions) {
    await page.locator(`#btn-joint-${restriction}`).click();
  }

  await page.locator('#btn-onboarding-submit').click();
  await expect(page.locator('#onboarding-modal')).not.toBeVisible({ timeout: 5000 });

  await page.locator('#tab-btn-workout').click();
}

const HOME_PROFILE = { restrictions: [], equipment: 'home' };

function safeIdsFor({ restrictions = [], equipment = 'home' } = {}) {
  return filterSafeExercises(EXERCISE_CATALOG, { restrictions, equipment })
    .slice(0, 8)
    .map(ex => ex.id);
}

/** Plano que a validação do cliente aceita: 4 exercícios por ficha. */
function planFromIds(splitIds, ids) {
  // TDEE do perfil do teste: mulher, 82 kg, 175 cm, 30 anos, 3 dias.
  const tdee = Math.round(Math.round(10 * 82 + 6.25 * 175 - 5 * 30 - 161) * 1.25);
  return {
    rationale: 'Comecei pelos exercícios compostos.',
    targetCalories: tdee + 380,
    proteinGrams: 164,
    carbsGrams: 240,
    fatGrams: 74,
    splits: splitIds.map((splitId, index) => ({
      splitId,
      focus: `Ficha ${index + 1} da IA`,
      exercises: ids.slice(0, 4).map((id, i) => ({ id, sets: 3 + (i % 2), reps: '10-12', restSeconds: 75 }))
    }))
  };
}

/** Responde como o Worker responderia, com a mesma forma de corpo. */
async function mockAiOk(page, { ids, delayMs = 0 } = {}) {
  const requests = [];
  await page.route('**/api/gemini/plan', async route => {
    const sent = JSON.parse(route.request().postData() ?? '{}');
    requests.push(sent);

    if (delayMs) await new Promise(resolve => setTimeout(resolve, delayMs));

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ plan: planFromIds(sent.splits.map(s => s.id), ids) })
    });
  });
  return requests;
}

/** Resposta do Worker com erro já traduzido para o cliente. */
async function mockAiError(page, { status, code, error }) {
  await page.route('**/api/gemini/plan', route => route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify({ error, code })
  }));
}

test.describe('perfil sem restrição', () => {
  // Antes existia um beforeEach de nível raiz, que roda TAMBÉM nos testes do
  // describe de restrição — o cadastro acontecia duas vezes e a segunda rodada
  // clicava na aba enquanto o modal fechava, causando interferência de overlay.
  test.beforeEach(async ({ page }) => {
    await onboard(page);
  });

test('Antes de gerar, a tela diz que a ficha veio da fórmula', async ({ page }) => {
  await expect(page.locator('#ai-plan-status')).toHaveText(/fórmula/i);
});

test('Gerar com IA salva a ficha e ela continua depois do reload', async ({ page }) => {
  await mockAiOk(page, { ids: safeIdsFor(HOME_PROFILE) });

  await page.locator('#btn-generate-ai-plan').click();
  await expect(page.locator('#ai-plan-status')).toHaveText(/Ficha gerada por IA/);
  await expect(page.locator('#ai-plan-status')).toHaveText(/kcal/);

  const tab = page.locator('button[id^="btn-split-treino-"]').first();
  const splitId = (await tab.getAttribute('id')).replace('btn-split-', '');
  await tab.click();
  await expect(page.locator(`#container-${splitId} [id^="exercise-card-"]`)).toHaveCount(4);

  // Sem persistir, a sugestão viraria uma ficha que existe só na tela.
  await page.reload();
  await page.locator('#tab-btn-workout').click();
  await expect(page.locator('#ai-plan-status')).toHaveText(/montada por IA/i);
});

test('O botão mostra o progresso e trava enquanto a IA responde', async ({ page }) => {
  await mockAiOk(page, { ids: safeIdsFor(HOME_PROFILE), delayMs: 1200 });

  const button = page.locator('#btn-generate-ai-plan');
  await button.click();

  await expect(button).toBeDisabled();
  await expect(button).toHaveText(/Gerando/);
  await expect(page.locator('#ai-plan-status')).toHaveText(/Consultando a IA/);

  await expect(button).toBeEnabled({ timeout: 15000 });
  await expect(page.locator('#ai-plan-status')).toHaveText(/Ficha gerada por IA/);
});

test('A ficha enviada não leva o nome do usuário e leva o TDEE', async ({ page }) => {
  const requests = await mockAiOk(page, { ids: safeIdsFor(HOME_PROFILE) });

  await page.locator('#btn-generate-ai-plan').click();
  await expect(page.locator('#ai-plan-status')).toHaveText(/Ficha gerada por IA/);

  expect(requests).toHaveLength(1);
  const [sent] = requests;
  expect(JSON.stringify(sent)).not.toContain('Aluno IA');
  expect(sent.profile.ageYears).toBe(30);
  expect(sent.profile.weightKg).toBe(82);
  expect(sent.tdee).toBeGreaterThan(1000);
  expect(sent.catalog.length).toBe(EXERCISE_CATALOG.length);
  expect(sent.catalog[0].id).toBe(EXERCISE_CATALOG[0].id);
  expect(sent.splits.length).toBeGreaterThan(0);
});

test('IA que inventa exercício não troca a ficha atual', async ({ page }) => {
  const before = await page.locator('[id^="exercise-card-"]').count();

  await mockAiError(page, {
    status: 200,
    code: 'unused',
    error: 'unused'
  });
  await page.route('**/api/gemini/plan', async route => {
    const sent = JSON.parse(route.request().postData() ?? '{}');
    const [splitId] = sent.splits.map(s => s.id);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        plan: {
          rationale: 'Inventei um equipamento novo.',
          targetCalories: 2000,
          proteinGrams: 160,
          carbsGrams: 220,
          fatGrams: 70,
          splits: [{
            splitId,
            focus: 'Peito',
            exercises: [{ id: 'supino_reto_de_halteres_quantum', sets: 3, reps: '10', restSeconds: 90 }]
          }]
        }
      })
    });
  });

  await page.locator('#btn-generate-ai-plan').click();
  await expect(page.locator('#ai-plan-status')).toHaveText(/não existe no catálogo/i);
  await expect(page.locator('#ai-plan-status')).toHaveClass(/text-rose-300/);
  await expect(page.locator('[id^="exercise-card-"]')).toHaveCount(before);

  await page.reload();
  await page.locator('#tab-btn-workout').click();
  await expect(page.locator('#ai-plan-status')).toHaveText(/fórmula/i);
});

test('IA que repete exercício na mesma ficha é descartada', async ({ page }) => {
  const [first, second, third, fourth] = safeIdsFor(HOME_PROFILE);
  await page.route('**/api/gemini/plan', async route => {
    const sent = JSON.parse(route.request().postData() ?? '{}');
    const [splitId] = sent.splits.map(s => s.id);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        plan: {
          rationale: 'Repeti o supino.',
          targetCalories: 2000,
          proteinGrams: 160,
          carbsGrams: 220,
          fatGrams: 70,
          splits: [{
            splitId,
            focus: 'Peito',
            exercises: [first, first, second, third, fourth]
              .map(id => ({ id, sets: 3, reps: '10', restSeconds: 90 }))
          }]
        }
      })
    });
  });

  await page.locator('#btn-generate-ai-plan').click();
  await expect(page.locator('#ai-plan-status')).toHaveText(/repetiu um exercício/i);
});

test('IA que sugere meta absurda é descartada', async ({ page }) => {
  await page.route('**/api/gemini/plan', async route => {
    const sent = JSON.parse(route.request().postData() ?? '{}');
    const [splitId] = sent.splits.map(s => s.id);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        plan: {
          rationale: 'Quase um jejum.',
          targetCalories: 600,
          proteinGrams: 160,
          carbsGrams: 220,
          fatGrams: 70,
          splits: [{
            splitId,
            focus: 'Peito',
            exercises: safeIdsFor(HOME_PROFILE).slice(0, 4)
              .map(id => ({ id, sets: 3, reps: '10', restSeconds: 90 }))
          }]
        }
      })
    });
  });

  await page.locator('#btn-generate-ai-plan').click();
  await expect(page.locator('#ai-plan-status')).toHaveText(/fora de uma faixa saudável/i);
});

test('Servidor sem chave explica o motivo e mantém a ficha', async ({ page }) => {
  await mockAiError(page, {
    status: 503,
    code: 'ai_disabled',
    error: 'A geração por IA está desligada no servidor.'
  });

  await page.locator('#btn-generate-ai-plan').click();
  await expect(page.locator('#ai-plan-status')).toHaveText(/desligada no servidor/i);
  await expect(page.locator('#ai-plan-status')).toHaveClass(/text-rose-300/);

  await page.reload();
  await page.locator('#tab-btn-workout').click();
  await expect(page.locator('#ai-plan-status')).toHaveText(/fórmula/i);
});

test('Timeout do Worker vira aviso curto, não tela quebrada', async ({ page }) => {
  await mockAiError(page, {
    status: 504,
    code: 'ai_timeout',
    error: 'A IA demorou demais para responder.'
  });

  await page.locator('#btn-generate-ai-plan').click();
  await expect(page.locator('#ai-plan-status')).toHaveText(/demorou demais/i);
  await expect(page.locator('#btn-generate-ai-plan')).toBeEnabled();
  await expect(page.locator('[id^="exercise-card-"]').first()).toBeVisible();
});

test('Servidor fora do ar não derruba o app', async ({ page }) => {
  await page.route('**/api/gemini/plan', route => route.abort('failed'));

  await page.locator('#btn-generate-ai-plan').click();
  await expect(page.locator('#ai-plan-status')).toHaveText(/servidor de IA/i);
  await expect(page.locator('#storage-error-banner')).toHaveCount(0);
  await expect(page.locator('[id^="exercise-card-"]').first()).toBeVisible();
});

});

test.describe('com restrição articular declarada', () => {
  // Cadastro próprio: é o caso em que a IA "melhora" a ficha e entrega um
  // exercício que machuca. Não dá para reaproveitar o cadastro do describe
  // anterior porque o perfil já estaria na tela quando o modal fechasse.
  test.beforeEach(async ({ page }) => {
    await onboard(page, { name: 'Aluno Restrito', restrictions: ['ombro'] });
  });

  test('IA que escolhe exercício de ombro é descartada', async ({ page }) => {
    const shoulderIds = EXERCISE_CATALOG
      .filter(ex => (ex.jointStress ?? []).includes('ombro'))
      .map(ex => ex.id);

    await page.route('**/api/gemini/plan', async route => {
      const sent = JSON.parse(route.request().postData() ?? '{}');
      const [splitId] = sent.splits.map(s => s.id);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          plan: {
            rationale: 'Coloquei um elevate lateral no lugar.',
            targetCalories: 2000,
            proteinGrams: 160,
            carbsGrams: 220,
            fatGrams: 70,
            splits: [{
              splitId,
              focus: 'Ombro',
              exercises: [...safeIdsFor({ restrictions: ['ombro'], equipment: 'home' }).slice(0, 3), shoulderIds[0]]
                .map(id => ({ id, sets: 3, reps: '12', restSeconds: 60 }))
            }]
          }
        })
      });
    });

    await page.locator('#btn-generate-ai-plan').click();
    await expect(page.locator('#ai-plan-status')).toHaveText(/fora das suas restrições/i);
  });

  test('IA que respeita a restrição salva a ficha', async ({ page }) => {
    await mockAiOk(page, { ids: safeIdsFor({ restrictions: ['ombro'], equipment: 'home' }) });

    await page.locator('#btn-generate-ai-plan').click();
    await expect(page.locator('#ai-plan-status')).toHaveText(/Ficha gerada por IA/);
  });
});