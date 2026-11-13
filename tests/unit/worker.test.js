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

describe('Worker — Cloudflare Workers AI nativo (Opção 2 100% gratuita)', () => {
  const dummyPlan = {
    rationale: 'Foco em compostos com alta densidade motora.',
    targetCalories: 2500,
    proteinGrams: 165,
    carbsGrams: 280,
    fatGrams: 70,
    splits: [
      {
        splitId: 'treino-a',
        focus: 'Peito e Tríceps',
        exercises: [{ id: 'supino_reto_halteres', sets: 4, reps: '8-10', restSeconds: 90 }]
      }
    ]
  };

  it('executa nativamente via env.AI.run quando binding AI está presente', async () => {
    const aiRun = vi.fn(async () => ({
      response: JSON.stringify(dummyPlan)
    }));

    const response = await worker.fetch(planRequest(), {
      AI: { run: aiRun },
      ASSETS: env.ASSETS
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.plan.targetCalories).toBe(2500);
    expect(body.plan.splits[0].exercises[0].id).toBe('supino_reto_halteres');
    expect(aiRun).toHaveBeenCalled();
    expect(aiRun.mock.calls[0][0]).toBe('@cf/meta/llama-3.1-8b-instruct-fast');
  });

  it('aceita resposta do Workers AI com cercas de markdown (```json ... ```)', async () => {
    const aiRun = vi.fn(async () => ({
      response: '```json\n' + JSON.stringify(dummyPlan) + '\n```'
    }));

    const response = await worker.fetch(planRequest(), {
      AI: { run: aiRun },
      ASSETS: env.ASSETS
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.plan.proteinGrams).toBe(165);
  });

  it('repara automaticamente JSON com reps sem aspas (ex: 8-10) e unidades em números (ex: 170g)', async () => {
    const rawMalformatted = `{
      "rationale": "Treino sinérgico",
      "targetCalories": 2500kcal,
      "proteinGrams": 170g,
      "carbsGrams": 280g,
      "fatGrams": 70g,
      "splits": [
        {
          "splitId": "treino-a",
          "focus": "Peito",
          "exercises": [
            {"id": "supino_reto_halteres", "sets": 3, "reps": 8-10, "restSeconds": 90s}
          ]
        }
      ]
    }`;

    const aiRun = vi.fn(async () => ({
      response: rawMalformatted
    }));

    const response = await worker.fetch(planRequest(), {
      AI: { run: aiRun },
      ASSETS: env.ASSETS
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.plan.proteinGrams).toBe(170);
    expect(body.plan.targetCalories).toBe(2500);
    expect(body.plan.splits[0].exercises[0].reps).toBe('8-10');
  });

  it('recupera JSON truncado no final fechando chaves e colchetes abertos', async () => {
    const truncated = `{"rationale": "Treino sinérgico", "targetCalories": 2400, "splits": [{"splitId": "treino-a", "exercises": [{"id": "supino_reto_halteres", "sets": 3, "reps": "8-10"`;

    const aiRun = vi.fn(async () => ({
      response: truncated
    }));

    const response = await worker.fetch(planRequest(), {
      AI: { run: aiRun },
      ASSETS: env.ASSETS
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.plan.splits[0].exercises[0].id).toBe('supino_reto_halteres');
  });

  it('retorna a lista de refeições (meals) quando o Workers AI devolve o plano alimentar', async () => {
    const planWithMeals = {
      ...dummyPlan,
      meals: [
        {
          id: 'meal-1',
          order: 1,
          title: 'Café da Manhã Anabólico',
          tag: 'Desjejum',
          objective: 'Quebra de jejum proteica',
          items: '3 ovos mexidos + 2 fatias de pão integral + 1 banana com aveia',
          calories: 550,
          protein: 32,
          carbs: 65,
          fat: 15
        }
      ]
    };

    const aiRun = vi.fn(async () => ({
      response: JSON.stringify(planWithMeals)
    }));

    const response = await worker.fetch(planRequest(), {
      AI: { run: aiRun },
      ASSETS: env.ASSETS
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.plan.meals).toHaveLength(1);
    expect(body.plan.meals[0].title).toBe('Café da Manhã Anabólico');
    expect(body.plan.meals[0].calories).toBe(550);
  });

  it('rejeita resposta vazia do Workers AI', async () => {
    const aiRun = vi.fn(async () => ({
      response: JSON.stringify({ splits: [] })
    }));

    const response = await worker.fetch(planRequest(), {
      AI: { run: aiRun },
      ASSETS: env.ASSETS
    });

    expect(response.status).toBe(502);
    expect((await response.json()).code).toBe('ai_empty_plan');
  });

  it('traduz timeout ou falha do Workers AI em status HTTP adequado', async () => {
    const aiRun = vi.fn(async () => {
      const err = new Error('Workers AI request timeout');
      err.name = 'AbortError';
      throw err;
    });

    const response = await worker.fetch(planRequest(), {
      AI: { run: aiRun },
      ASSETS: env.ASSETS
    });

    expect(response.status).toBe(504);
    expect((await response.json()).code).toBe('ai_timeout');
  });

  it('filtra exercícios com estresse articular proibido e substitui por exercício seguro', async () => {
    const catalogWithUnsafe = [
      { id: 'desenvolvimento_barra', name: 'Desenvolvimento', muscle: 'ombro', pattern: 'press', equipment: 'gym', jointStress: ['ombro'] },
      { id: 'elevacao_lateral_halteres', name: 'Elevação Lateral', muscle: 'ombro', pattern: 'isolation', equipment: 'gym', jointStress: [] }
    ];

    const modelResponse = {
      splits: [
        {
          splitId: 'treino-a',
          focus: 'Ombros',
          exercises: [{ id: 'desenvolvimento_barra', sets: 4, reps: '8-10', restSeconds: 60 }]
        }
      ]
    };

    const aiRun = vi.fn(async () => ({
      response: JSON.stringify(modelResponse)
    }));

    const response = await worker.fetch(planRequest({
      profile: { restrictions: ['ombro'], equipment: 'gym' },
      catalog: catalogWithUnsafe
    }), {
      AI: { run: aiRun },
      ASSETS: env.ASSETS
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    const splitEx = body.plan.splits[0].exercises;
    // O exercício que estressa ombro não pode estar presente
    expect(splitEx.some(e => e.id === 'desenvolvimento_barra')).toBe(false);
    // E foi substituído pelo exercício seguro
    expect(splitEx.some(e => e.id === 'elevacao_lateral_halteres')).toBe(true);
  });

  it('garante que a ficha Treino A (Push) receba tríceps se a IA omitir', async () => {
    const pushCatalog = [
      { id: 'supino_reto', name: 'Supino Reto', muscle: 'peito', pattern: 'push_horizontal', equipment: 'gym', jointStress: [] },
      { id: 'supino_inclinado', name: 'Supino Inclinado', muscle: 'peito', pattern: 'push_incline', equipment: 'gym', jointStress: [] },
      { id: 'crucifixo', name: 'Crucifixo', muscle: 'peito', pattern: 'fly', equipment: 'gym', jointStress: [] },
      { id: 'elevacao_lateral', name: 'Elevação Lateral', muscle: 'ombro', pattern: 'lateral_raise', equipment: 'gym', jointStress: [] },
      { id: 'desenvolvimento', name: 'Desenvolvimento', muscle: 'ombro', pattern: 'push_vertical', equipment: 'gym', jointStress: [] },
      { id: 'triceps_pulley', name: 'Tríceps Pulley', muscle: 'triceps', pattern: 'triceps_extension', equipment: 'gym', jointStress: [] }
    ];

    // IA retornou apenas peito e ombro (0 tríceps)
    const modelResponse = {
      splits: [
        {
          splitId: 'treino-a',
          focus: 'Peito e Ombros',
          exercises: [
            { id: 'supino_reto', sets: 4, reps: '8-10', restSeconds: 90 },
            { id: 'supino_inclinado', sets: 3, reps: '10', restSeconds: 90 },
            { id: 'crucifixo', sets: 3, reps: '12', restSeconds: 60 },
            { id: 'elevacao_lateral', sets: 3, reps: '12', restSeconds: 60 },
            { id: 'desenvolvimento', sets: 3, reps: '10', restSeconds: 90 }
          ]
        }
      ]
    };

    const aiRun = vi.fn(async () => ({
      response: JSON.stringify(modelResponse)
    }));

    const response = await worker.fetch(planRequest({
      profile: { goal: 'hypertrophy', weightKg: 80, restrictions: [], equipment: 'gym' },
      catalog: pushCatalog,
      splits: [{ id: 'treino-a', title: 'Treino A (Push)', subtitle: 'Peito, ombros e tríceps' }]
    }), {
      AI: { run: aiRun },
      ASSETS: env.ASSETS
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    const splitEx = body.plan.splits[0].exercises;
    // O tríceps OBRIGATORIAMENTE deve estar presente
    expect(splitEx.some(e => e.id === 'triceps_pulley')).toBe(true);
  });
});

describe('Worker — rota de feedback e avaliação', () => {
  const FEEDBACK_URL = 'https://treino.example/api/feedback';

  it('recebe avaliação com sucesso e retorna confirmação', async () => {
    const req = new Request(FEEDBACK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cf-connecting-ip': nextIp() },
      body: JSON.stringify({
        rating: 5,
        category: 'treino',
        comment: 'App fantástico!',
        userName: 'Gabriel'
      })
    });

    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.feedbackId).toBeDefined();
  });

  it('recusa métodos não POST na rota de feedback', async () => {
    const req = new Request(FEEDBACK_URL, {
      method: 'GET',
      headers: { 'cf-connecting-ip': nextIp() }
    });

    const res = await worker.fetch(req, env);
    expect(res.status).toBe(405);
  });

  it('recusa requisições com origem não autorizada', async () => {
    const req = new Request(FEEDBACK_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'cf-connecting-ip': nextIp()
      },
      body: JSON.stringify({ rating: 5 })
    });
    req.headers.set('origin', 'https://outro-site.com');

    const res = await worker.fetch(req, env);
    expect(res.status).toBe(403);
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