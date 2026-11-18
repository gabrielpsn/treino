// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import worker from '../../worker/index.js';
import { createD1 } from './helpers/d1.js';
import { isReminderDue, runReminders, vapidAuthorization } from '../../worker/push.js';
import { sanitizeWeeklySummary, buildCoachPrompt } from '../../worker/coach.js';
import { base64url, base64urlDecode } from '../../worker/http.js';

const ORIGIN = 'https://treino.example';
let env;
let ipCounter = 0;

beforeEach(() => {
  env = { DB: createD1() };
});

function call(method, path, { body, auth, headers = {} } = {}) {
  const h = { 'cf-connecting-ip': `10.1.${Math.floor(ipCounter / 250)}.${ipCounter++ % 250}`, ...headers };
  if (body !== undefined) h['content-type'] = 'application/json';
  if (auth) h.authorization = `Bearer ${auth}`;
  return worker.fetch(new Request(`${ORIGIN}${path}`, {
    method,
    headers: h,
    body: body === undefined ? undefined : JSON.stringify(body)
  }), env);
}

async function account() {
  const res = await call('POST', '/api/account');
  expect(res.status).toBe(201);
  return (await res.json()).accessCode;
}

const backup = { kind: 'treinopro-backup', version: 1, userProfile: { userName: 'Ana' }, sessions: [] };

describe('contas', () => {
  it('sem D1 configurado responde 503', async () => {
    env = {};
    const res = await call('POST', '/api/account');
    expect(res.status).toBe(503);
  });

  it('rota protegida recusa token ausente ou errado', async () => {
    const code = await account();
    expect((await call('GET', '/api/sync')).status).toBe(401);
    expect((await call('GET', '/api/sync', { auth: `${code.split('.')[0]}.errado` })).status).toBe(401);
  });

  it('guarda só o hash do token', async () => {
    const code = await account();
    const row = env.DB.raw.prepare('SELECT token_hash FROM accounts').get();
    expect(row.token_hash).not.toContain(code.split('.')[1]);
    expect(row.token_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('recusa origem de outro site', async () => {
    const res = await call('POST', '/api/account', { headers: { origin: 'https://outro.site' } });
    expect(res.status).toBe(403);
  });

  it('excluir conta apaga sync e participação em ligas', async () => {
    const code = await account();
    await call('PUT', '/api/sync', { auth: code, body: { backup } });
    await call('POST', '/api/leagues', { auth: code, body: { name: 'L', nickname: 'Eu' } });
    expect((await call('DELETE', '/api/account', { auth: code })).status).toBe(200);
    expect(env.DB.raw.prepare('SELECT COUNT(*) AS n FROM sync_snapshots').get().n).toBe(0);
    expect(env.DB.raw.prepare('SELECT COUNT(*) AS n FROM leagues').get().n).toBe(0);
    expect((await call('GET', '/api/sync', { auth: code })).status).toBe(401);
  });
});

describe('sync na nuvem', () => {
  it('envia e baixa o mesmo backup', async () => {
    const code = await account();
    const empty = await (await call('GET', '/api/sync', { auth: code })).json();
    expect(empty.backup).toBeNull();

    const put = await call('PUT', '/api/sync', { auth: code, body: { backup, baseUpdatedAt: null } });
    expect(put.status).toBe(200);
    const { updatedAt } = await put.json();

    const got = await (await call('GET', '/api/sync', { auth: code })).json();
    expect(got.backup).toEqual(backup);
    expect(got.updatedAt).toBe(updatedAt);
  });

  it('recusa sobrescrever dados mais novos de outro aparelho (409), salvo com force', async () => {
    const code = await account();
    await call('PUT', '/api/sync', { auth: code, body: { backup, baseUpdatedAt: null } });
    const stale = await call('PUT', '/api/sync', { auth: code, body: { backup, baseUpdatedAt: '2020-01-01T00:00:00.000Z' } });
    expect(stale.status).toBe(409);
    const forced = await call('PUT', '/api/sync', { auth: code, body: { backup, baseUpdatedAt: '2020-01-01T00:00:00.000Z', force: true } });
    expect(forced.status).toBe(200);
  });

  it('recusa conteúdo que não é backup', async () => {
    const code = await account();
    expect((await call('PUT', '/api/sync', { auth: code, body: { backup: { qualquer: 1 } } })).status).toBe(400);
  });
});

describe('ligas reais', () => {
  it('cria, convida, pontua e mostra ranking só com apelidos', async () => {
    const ana = await account();
    const bia = await account();
    const created = await (await call('POST', '/api/leagues', { auth: ana, body: { name: 'Academia', nickname: 'Ana' } })).json();
    expect(created.inviteCode).toMatch(/^[A-Z2-9]{8}$/);

    const joined = await call('POST', '/api/leagues/join', { auth: bia, body: { inviteCode: created.inviteCode.toLowerCase(), nickname: 'Bia' } });
    expect(joined.status).toBe(200);

    await call('POST', `/api/leagues/${created.id}/score`, { auth: ana, body: { weekKey: '2026-W10', score: 120 } });
    await call('POST', `/api/leagues/${created.id}/score`, { auth: bia, body: { weekKey: '2026-W10', score: 300 } });
    await call('POST', `/api/leagues/${created.id}/score`, { auth: bia, body: { weekKey: '2026-W10', score: 310 } });

    const board = await (await call('GET', `/api/leagues/${created.id}?week=2026-W10`, { auth: ana })).json();
    expect(board.ranking).toEqual([
      { position: 1, nickname: 'Bia', score: 310, isMe: false },
      { position: 2, nickname: 'Ana', score: 120, isMe: true }
    ]);

    const mine = await (await call('GET', '/api/leagues', { auth: bia })).json();
    expect(mine.leagues).toHaveLength(1);
    expect(mine.leagues[0]).toMatchObject({ name: 'Academia', isOwner: false, members: 2 });
  });

  it('quem não é membro não vê a liga e código errado dá 404', async () => {
    const ana = await account();
    const eve = await account();
    const { id } = await (await call('POST', '/api/leagues', { auth: ana, body: { name: 'L' } })).json();
    expect((await call('GET', `/api/leagues/${id}?week=2026-W10`, { auth: eve })).status).toBe(404);
    expect((await call('POST', `/api/leagues/${id}/score`, { auth: eve, body: { weekKey: '2026-W10', score: 1 } })).status).toBe(404);
    expect((await call('POST', '/api/leagues/join', { auth: eve, body: { inviteCode: 'NAOEXISTE' } })).status).toBe(404);
  });

  it('pontuação absurda é limitada e semana inválida recusada', async () => {
    const ana = await account();
    const { id } = await (await call('POST', '/api/leagues', { auth: ana, body: {} })).json();
    const res = await call('POST', `/api/leagues/${id}/score`, { auth: ana, body: { weekKey: '2026-W10', score: 9e9 } });
    expect((await res.json()).score).toBe(100000);
    expect((await call('POST', `/api/leagues/${id}/score`, { auth: ana, body: { weekKey: 'x', score: 1 } })).status).toBe(400);
  });

  it('dono saindo encerra a liga; membro saindo só sai', async () => {
    const ana = await account();
    const bia = await account();
    const { id, inviteCode } = await (await call('POST', '/api/leagues', { auth: ana, body: {} })).json();
    await call('POST', '/api/leagues/join', { auth: bia, body: { inviteCode } });
    expect(await (await call('POST', `/api/leagues/${id}/leave`, { auth: bia })).json()).toEqual({ left: true, deleted: false });
    expect(await (await call('POST', `/api/leagues/${id}/leave`, { auth: ana })).json()).toEqual({ left: true, deleted: true });
    expect(env.DB.raw.prepare('SELECT COUNT(*) AS n FROM leagues').get().n).toBe(0);
  });
});

describe('modo personal trainer', () => {
  const splits = [{ id: 'treino-a', title: 'Treino A', exercises: [{ id: 'supino_reto_halteres' }] }];

  it('fluxo completo: turma, aluno, resumo, envio e aceite de ficha', async () => {
    const personal = await account();
    const aluno = await account();
    const cls = await (await call('POST', '/api/trainer/classes', { auth: personal, body: { name: 'Manhã' } })).json();

    expect((await call('POST', '/api/trainer/join', { auth: aluno, body: { inviteCode: cls.inviteCode, displayName: 'João' } })).status).toBe(200);
    expect((await call('PUT', '/api/trainer/summary', { auth: aluno, body: { summary: { sessionsLast7d: 3 } } })).status).toBe(200);

    const list = await (await call('GET', '/api/trainer/classes', { auth: personal })).json();
    const student = list.classes[0].students[0];
    expect(student.displayName).toBe('João');

    const detail = await (await call('GET', `/api/trainer/classes/${cls.id}/students/${student.id}`, { auth: personal })).json();
    expect(detail.summary).toEqual({ sessionsLast7d: 3 });

    const sent = await call('POST', `/api/trainer/classes/${cls.id}/students/${student.id}/plans`, {
      auth: personal, body: { workoutSplits: splits, note: 'Foco em técnica' }
    });
    expect(sent.status).toBe(201);

    const inbox = await (await call('GET', '/api/trainer/inbox', { auth: aluno })).json();
    expect(inbox.plans).toHaveLength(1);
    expect(inbox.plans[0]).toMatchObject({ className: 'Manhã', note: 'Foco em técnica', workoutSplits: splits });

    const ack = await call('POST', `/api/trainer/inbox/${inbox.plans[0].id}`, { auth: aluno, body: { accepted: true } });
    expect(await ack.json()).toEqual({ status: 'accepted' });
    expect((await call('POST', `/api/trainer/inbox/${inbox.plans[0].id}`, { auth: aluno, body: { accepted: true } })).status).toBe(404);

    const after = await (await call('GET', '/api/trainer/classes', { auth: personal })).json();
    expect(after.classes[0].students[0].lastPlanStatus).toBe('accepted');
  });

  it('outro personal não acessa o aluno e aluno que sai some da turma', async () => {
    const personal = await account();
    const intruso = await account();
    const aluno = await account();
    const cls = await (await call('POST', '/api/trainer/classes', { auth: personal, body: {} })).json();
    await call('POST', '/api/trainer/join', { auth: aluno, body: { inviteCode: cls.inviteCode } });
    const studentId = (await (await call('GET', '/api/trainer/classes', { auth: personal })).json()).classes[0].students[0].id;

    expect((await call('GET', `/api/trainer/classes/${cls.id}/students/${studentId}`, { auth: intruso })).status).toBe(404);
    expect((await call('POST', `/api/trainer/classes/${cls.id}/students/${studentId}/plans`, { auth: intruso, body: { workoutSplits: splits } })).status).toBe(404);

    await call('POST', `/api/trainer/memberships/${cls.id}/leave`, { auth: aluno });
    const list = await (await call('GET', '/api/trainer/classes', { auth: personal })).json();
    expect(list.classes[0].students).toHaveLength(0);
  });

  it('personal não entra na própria turma e ficha vazia é recusada', async () => {
    const personal = await account();
    const aluno = await account();
    const cls = await (await call('POST', '/api/trainer/classes', { auth: personal, body: {} })).json();
    expect((await call('POST', '/api/trainer/join', { auth: personal, body: { inviteCode: cls.inviteCode } })).status).toBe(400);
    await call('POST', '/api/trainer/join', { auth: aluno, body: { inviteCode: cls.inviteCode } });
    const studentId = (await (await call('GET', '/api/trainer/classes', { auth: personal })).json()).classes[0].students[0].id;
    expect((await call('POST', `/api/trainer/classes/${cls.id}/students/${studentId}/plans`, { auth: personal, body: { workoutSplits: [] } })).status).toBe(400);
  });
});

async function vapidKeys() {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  return { pair, privateJwk: JSON.stringify(jwk), publicKey: base64url(raw) };
}

describe('lembretes (Web Push)', () => {
  const subscription = { endpoint: 'https://push.example/abc' };

  it('valida dias, horário e fuso na inscrição', async () => {
    expect((await call('POST', '/api/push/subscribe', { body: { subscription, days: [], time: '07:00', tzOffsetMinutes: 180 } })).status).toBe(400);
    expect((await call('POST', '/api/push/subscribe', { body: { subscription, days: [1], time: '25:00', tzOffsetMinutes: 180 } })).status).toBe(400);
    expect((await call('POST', '/api/push/subscribe', { body: { subscription: { endpoint: 'http://x' }, days: [1], time: '07:00', tzOffsetMinutes: 180 } })).status).toBe(400);
    const ok = await call('POST', '/api/push/subscribe', { body: { subscription, days: [1, 3, 3, 9], time: '07:00', tzOffsetMinutes: 180 } });
    expect(await ok.json()).toEqual({ subscribed: true, days: [1, 3], time: '07:00' });
    await call('POST', '/api/push/unsubscribe', { body: { endpoint: subscription.endpoint } });
    expect(env.DB.raw.prepare('SELECT COUNT(*) AS n FROM push_subscriptions').get().n).toBe(0);
  });

  it('isReminderDue respeita fuso e janela de 15 minutos', () => {
    // Segunda-feira 2026-03-02 10:05 UTC = 07:05 em Brasília (offset +180).
    const now = Date.parse('2026-03-02T10:05:00Z');
    expect(isReminderDue({ days: [1], time: '07:00', tzOffset: 180 }, now)).toBe(true);
    expect(isReminderDue({ days: [2], time: '07:00', tzOffset: 180 }, now)).toBe(false);
    expect(isReminderDue({ days: [1], time: '06:40', tzOffset: 180 }, now)).toBe(false);
    expect(isReminderDue({ days: [1], time: '07:10', tzOffset: 180 }, now)).toBe(false);
  });

  it('chave pública não configurada responde 503', async () => {
    expect((await call('GET', '/api/push/public-key')).status).toBe(503);
  });

  it('JWT VAPID é verificável com a chave pública', async () => {
    const keys = await vapidKeys();
    env.VAPID_PUBLIC_KEY = keys.publicKey;
    env.VAPID_PRIVATE_JWK = keys.privateJwk;
    const header = await vapidAuthorization('https://push.example/abc', env, 1_700_000_000);
    const [, jwt, k] = header.match(/^vapid t=([^,]+), k=(.+)$/);
    expect(k).toBe(keys.publicKey);
    const [h, c, sig] = jwt.split('.');
    const claims = JSON.parse(new TextDecoder().decode(base64urlDecode(c)));
    expect(claims.aud).toBe('https://push.example');
    const valid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' }, keys.pair.publicKey, base64urlDecode(sig), new TextEncoder().encode(`${h}.${c}`)
    );
    expect(valid).toBe(true);
  });

  it('cron envia os vencidos, não repete e remove inscrição expirada (410)', async () => {
    const keys = await vapidKeys();
    env.VAPID_PUBLIC_KEY = keys.publicKey;
    env.VAPID_PRIVATE_JWK = keys.privateJwk;
    await call('POST', '/api/push/subscribe', { body: { subscription: { endpoint: 'https://push.example/ok' }, days: [1], time: '07:00', tzOffsetMinutes: 180 } });
    await call('POST', '/api/push/subscribe', { body: { subscription: { endpoint: 'https://push.example/gone' }, days: [1], time: '07:00', tzOffsetMinutes: 180 } });
    await call('POST', '/api/push/subscribe', { body: { subscription: { endpoint: 'https://push.example/later' }, days: [1], time: '20:00', tzOffsetMinutes: 180 } });

    const fetchImpl = vi.fn(async url => new Response(null, { status: url.endsWith('/gone') ? 410 : 201 }));
    const now = Date.parse('2026-03-02T10:05:00Z');
    expect(await runReminders(env, { now, fetchImpl })).toEqual({ sent: 1, removed: 1 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[0][1].headers.authorization).toMatch(/^vapid t=/);

    expect(await runReminders(env, { now: now + 5 * 60_000, fetchImpl })).toEqual({ sent: 0, removed: 0 });
  });
});

describe('coach semanal', () => {
  it('saneia o resumo e não deixa texto livre virar instrução', () => {
    const s = sanitizeWeeklySummary({ goal: 'hack', sessions: 999, prs: ['Supino 100kg', { x: 1 }], stalled: 'x' });
    expect(s.goal).toBe('hypertrophy');
    expect(s.sessions).toBe(21);
    expect(s.stalled).toEqual([]);
    expect(buildCoachPrompt(s)).toContain('Recordes pessoais: Supino 100kg, [object Object]');
  });

  it('usa o Workers AI e limpa markdown', async () => {
    env.AI = { run: vi.fn(async () => ({ response: '## Ótima semana\n**Mantenha** o ritmo.' })) };
    const res = await call('POST', '/api/coach/weekly', { body: { summary: { goal: 'strength', sessions: 3, plannedSessions: 4 } } });
    expect(res.status).toBe(200);
    expect((await res.json()).text).toBe('Ótima semana\nMantenha o ritmo.');
    const prompt = env.AI.run.mock.calls[0][1].messages[1].content;
    expect(prompt).toContain('Treinos na semana: 3 de 4');
  });

  it('sem motor de IA responde 503', async () => {
    expect((await call('POST', '/api/coach/weekly', { body: { summary: {} } })).status).toBe(503);
  });
});

describe('roteador', () => {
  it('método errado em rota conhecida dá 405', async () => {
    const res = await call('PATCH', '/api/sync');
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toContain('GET');
  });
});
