import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from '../../worker/index.js';

const PLAN_PATH = 'https://treino.example/api/gemini/plan';

const validCatalog = [
  { id: 'supino_reto_halteres', name: 'Supino Reto com Halteres', muscle: 'peito', pattern: 'push_horizontal', equipment: 'gym_or_home', jointStress: [], referenceSets: '3x 8-10 reps', referenceRestSeconds: '90s' }
];

const validSplits = [{ id: 'treino-a' }];

/**
 * happy-dom filtra headers "proibidos" na construção do Request, igual um
 * navegador faz — o Origin é exatamente um deles. No navegador ele é enviado
 * pelo próprio navegador em todo POST, então no teste ele é setado depois de
 * construir o Request.
 */
function post(body, { origin, ip } = {}) {
  const request = new Request(PLAN_PATH, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body
  });

  if (origin) request.headers.set('origin', origin);
  if (ip) request.headers.set('cf-connecting-ip', ip);

  return request;
}

// O limite de frequência é estado do módulo. Cada teste usa um IP próprio para
// não herdar a cota dos testes anteriores — é o que acontece em produção também,
// onde o limite é por IP.
let ipCounter = 0;
function nextIp() {
  ipCounter += 1;
  return `203.0.113.${ipCounter}`;
}

function planRequest(overrides = {}, requestOptions = {}) {
  return post(JSON.stringify({
    profile: { userName: 'Rafael', goal: 'hypertrophy', weightKg: 80 },
    catalog: validCatalog,
    splits: validSplits,
    ...overrides
  }), { ip: nextIp(), ...requestOptions });
}

function geminiOk(plan) {
  return new Response(
    JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(plan) }] } }] }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
}

const env = {
  GEMINI_API_KEY: 'chave-de-teste',
  ASSETS: { fetch: vi.fn(async () => new Response('index.html')) }
};

/** Captura o fetch feito pelo Worker para o Gemini. */
function mockGemini(implementation) {
  const spy = vi.fn(implementation);
  vi.stubGlobal('fetch', spy);
  return spy;
}

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('Worker — rota da IA', () => {
  it('rejeita qualquer método que não seja POST', async () => {
    for (const method of ['GET', 'PUT', 'DELETE']) {
      const response = await worker.fetch(new Request(PLAN_PATH, { method, headers: { 'cf-connecting-ip': nextIp() } }), env);
      expect(response.status, method).toBe(405);
      expect(response.headers.get('allow')).toBe('POST');
    }
  });

  it('recusa origem de outro site: a cota é do dono do app', async () => {
    const response = await worker.fetch(
      post('{}', { origin: 'https://site-malvado.example', ip: nextIp() }),
      env
    );

    expect(response.status).toBe(403);
    expect((await response.json()).code).toBe('forbidden_origin');
  });

  it('recusa requisição sem a chave configurada, sem chamar o Gemini', async () => {
    const gemini = mockGemini(async () => geminiOk({}));
    const response = await worker.fetch(planRequest(), { ASSETS: env.ASSETS });

    expect(response.status).toBe(503);
    expect((await response.json()).code).toBe('ai_disabled');
    expect(gemini).not.toHaveBeenCalled();
  });

  it('recusa corpo grande demais antes de gastar cota', async () => {
    const gemini = mockGemini(async () => geminiOk({}));
    const huge = 'x'.repeat(30 * 1024);
    const response = await worker.fetch(
      post(JSON.stringify({ profile: { note: huge }, catalog: validCatalog, splits: validSplits }), { ip: nextIp() }),
      env
    );

    expect(response.status).toBe(413);
    expect(gemini).not.toHaveBeenCalled();
  });

  it('recusa JSON inválido e catálogo ausente', async () => {
    mockGemini(async () => geminiOk({}));

    const broken = await worker.fetch(post('isso não é json', { ip: nextIp() }), env);
    expect(broken.status).toBe(400);

    const noCatalog = await worker.fetch(
      post(JSON.stringify({ profile: {}, catalog: [], splits: validSplits }), { ip: nextIp() }),
      env
    );
    expect(noCatalog.status).toBe(400);
  });

  it('limita a frequência por IP: a cota é paga por requisição', async () => {
    mockGemini(async () => geminiOk({ splits: [{ splitId: 'treino-a', exercises: [] }] }));

    const sharedIp = nextIp();
    const request = () => worker.fetch(planRequest({}, { ip: sharedIp }), env);

    for (let i = 0; i < 8; i++) {
      const response = await request();
      expect(response.status, `requisição ${i + 1}`).toBe(200);
    }

    const blocked = await request();
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0);
  });

  it('não vaza a chave nem o corpo do erro do Gemini', async () => {
    mockGemini(async () => new Response(
      'API key not valid. Please pass a valid API key. chave-de-teste',
      { status: 400 }
    ));

    const response = await worker.fetch(planRequest(), env);
    const body = await response.text();

    expect(response.status).toBe(502);
    expect(body).not.toContain('chave-de-teste');
    expect(body).not.toContain('API key');
    expect(JSON.parse(body).code).toBe('ai_upstream_error');
  });

  it('traduz timeout do Gemini em erro compreensível', async () => {
    mockGemini(async (_url, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    }));

    const response = await worker.fetch(planRequest(), { ...env, REQUEST_TIMEOUT_MS: 50 });
    expect(response.status).toBe(504);
    expect((await response.json()).code).toBe('ai_timeout');
  });

  it('não aceita ficha vazia como se fosse sucesso', async () => {
    mockGemini(async () => geminiOk({ splits: [] }));
    const response = await worker.fetch(planRequest(), env);
    expect(response.status).toBe(502);
    expect((await response.json()).code).toBe('ai_empty_plan');
  });

  it('aceita JSON embrulhado em cerca de código', async () => {
    const plan = {
      rationale: 'Priorizei compound primeiro.',
      targetCalories: 2400,
      proteinGrams: 160,
      carbsGrams: 260,
      fatGrams: 70,
      splits: [{ splitId: 'treino-a', focus: 'Peito', exercises: [{ id: 'supino_reto_halteres', sets: 3, reps: '8-10', restSeconds: 90 }] }]
    };
    mockGemini(async () => new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: '```json\n' + JSON.stringify(plan) + '\n```' }] } }]
    }), { status: 200 }));

    const response = await worker.fetch(planRequest(), env);
    expect(response.status).toBe(200);
    expect((await response.json()).plan.splits[0].exercises[0].id).toBe('supino_reto_halteres');
  });

  it('manda a chave no header e nunca no corpo', async () => {
    const gemini = mockGemini(async () => geminiOk({
      splits: [{ splitId: 'treino-a', focus: 'Peito', exercises: [{ id: 'supino_reto_halteres', sets: 3, reps: '8', restSeconds: 90 }] }]
    }));

    await worker.fetch(planRequest(), env);

    const [url, init] = gemini.mock.calls[0];
    expect(url).toContain(':generateContent');
    expect(init.headers['x-goog-api-key']).toBe('chave-de-teste');
    expect(init.body).not.toContain('chave-de-teste');
  });

  it('não manda o nome do usuário para o terceiro', async () => {
    const gemini = mockGemini(async () => geminiOk({
      splits: [{ splitId: 'treino-a', focus: 'Peito', exercises: [{ id: 'supino_reto_halteres', sets: 3, reps: '8', restSeconds: 90 }] }]
    }));

    await worker.fetch(planRequest(), env);

    const prompt = gemini.mock.calls[0][1].body;
    expect(prompt).not.toContain('Rafael');
    expect(prompt).toContain('supino_reto_halteres');
  });

  it('pede a resposta no esquema e com limite de tokens', async () => {
    const gemini = mockGemini(async () => geminiOk({
      splits: [{ splitId: 'treino-a', focus: 'Peito', exercises: [{ id: 'supino_reto_halteres', sets: 3, reps: '8', restSeconds: 90 }] }]
    }));

    await worker.fetch(planRequest(), env);

    const sent = JSON.parse(gemini.mock.calls[0][1].body);
    expect(sent.generationConfig.responseMimeType).toBe('application/json');
    expect(sent.generationConfig.responseSchema).toBeTruthy();
    expect(sent.generationConfig.maxOutputTokens).toBeLessThanOrEqual(8192);
    expect(sent.systemInstruction.parts[0].text).toContain('id');
  });

  it('usa o modelo e a base configurados no servidor', async () => {
    const gemini = mockGemini(async () => geminiOk({
      splits: [{ splitId: 'treino-a', focus: 'Peito', exercises: [{ id: 'supino_reto_halteres', sets: 3, reps: '8', restSeconds: 90 }] }]
    }));

    await worker.fetch(planRequest(), {
      ...env,
      GEMINI_MODEL: 'gemini-2.0-flash',
      GEMINI_API_BASE: 'https://example.test/v1beta'
    });

    expect(gemini.mock.calls[0][0]).toBe('https://example.test/v1beta/models/gemini-2.0-flash:generateContent');
  });
});

describe('Worker — o resto é app estático', () => {
  it('repassa qualquer outra rota para os assets', async () => {
    const assets = { fetch: vi.fn(async () => new Response('treino')) };
    const response = await worker.fetch(new Request('https://treino.example/'), { ...env, ASSETS: assets });

    expect(assets.fetch).toHaveBeenCalled();
    expect(await response.text()).toBe('treino');
  });

  it('devolve 404 quando não há asset configurado', async () => {
    const response = await worker.fetch(new Request('https://treino.example/'), {
      GEMINI_API_KEY: 'chave-de-teste'
    });
    expect(response.status).toBe(404);
  });
});