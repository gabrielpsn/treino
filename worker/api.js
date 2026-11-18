/**
 * Rotas com estado no servidor (Cloudflare D1):
 *
 *   /api/account           conta anônima (id + token secreto)
 *   /api/sync              backup na nuvem por código
 *   /api/leagues...        ligas reais entre amigos, por convite
 *   /api/trainer...        modo personal trainer (turmas, resumo do aluno, envio de ficha)
 *   /api/push...           lembretes de treino (Web Push)
 *   /api/coach/weekly      resumo semanal comentado pela IA
 *
 * Autenticação: `Authorization: Bearer <accountId>.<token>`. O servidor só
 * guarda o SHA-256 do token; quem perde o código perde o acesso — por isso o
 * app mostra o código para o usuário guardar.
 */

import {
  HttpError,
  WEEK_KEY_RE,
  assertSameOrigin,
  cleanText,
  createRateLimiter,
  errorResponse,
  inviteCode,
  json,
  normalizeInviteCode,
  randomId,
  randomToken,
  readJson,
  sha256Hex
} from './http.js';
import { getVapidPublicKey } from './push.js';
import { handleWeeklyCoach } from './coach.js';

export const MAX_SYNC_BYTES = 2 * 1024 * 1024;
export const LIMITS = {
  leaguesPerAccount: 10,
  membersPerLeague: 50,
  classesPerTrainer: 10,
  studentsPerClass: 100,
  pendingPlansPerStudent: 5,
  summaryBytes: 32 * 1024,
  planBytes: 96 * 1024
};

const limiter = createRateLimiter({ windowMs: 60_000, max: 60 });
const now = () => new Date().toISOString();

function requireDb(env) {
  if (!env.DB) {
    throw new HttpError(503, 'storage_unavailable', 'Recursos online indisponíveis no momento.');
  }
  return env.DB;
}

async function requireAccount(request, env) {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/);
  if (!match) throw new HttpError(401, 'unauthorized', 'Código de acesso ausente ou inválido.');
  const [, accountId, token] = match;
  const row = await requireDb(env)
    .prepare('SELECT id, token_hash FROM accounts WHERE id = ?')
    .bind(accountId)
    .first();
  if (!row || row.token_hash !== (await sha256Hex(token))) {
    throw new HttpError(401, 'unauthorized', 'Código de acesso inválido.');
  }
  return accountId;
}

// ---------------------------------------------------------------------------
// Conta
// ---------------------------------------------------------------------------

async function createAccount(env) {
  const db = requireDb(env);
  const id = randomId('a');
  const token = randomToken(24);
  await db
    .prepare('INSERT INTO accounts (id, token_hash, created_at) VALUES (?, ?, ?)')
    .bind(id, await sha256Hex(token), now())
    .run();
  return json({ accountId: id, token, accessCode: `${id}.${token}` }, 201);
}

async function deleteAccount(request, env) {
  const accountId = await requireAccount(request, env);
  const db = requireDb(env);
  // Sem depender de ON DELETE CASCADE (D1 só aplica com foreign_keys ligado).
  await db.batch([
    db.prepare('DELETE FROM sync_snapshots WHERE account_id = ?').bind(accountId),
    db.prepare('DELETE FROM league_scores WHERE account_id = ?').bind(accountId),
    db.prepare('DELETE FROM league_members WHERE account_id = ?').bind(accountId),
    db.prepare('DELETE FROM class_students WHERE student_id = ?').bind(accountId),
    db.prepare('DELETE FROM trainer_plans WHERE student_id = ?').bind(accountId),
    db.prepare('DELETE FROM trainer_plans WHERE class_id IN (SELECT id FROM trainer_classes WHERE trainer_id = ?)').bind(accountId),
    db.prepare('DELETE FROM class_students WHERE class_id IN (SELECT id FROM trainer_classes WHERE trainer_id = ?)').bind(accountId),
    db.prepare('DELETE FROM trainer_classes WHERE trainer_id = ?').bind(accountId),
    db.prepare('DELETE FROM league_scores WHERE league_id IN (SELECT id FROM leagues WHERE owner_id = ?)').bind(accountId),
    db.prepare('DELETE FROM league_members WHERE league_id IN (SELECT id FROM leagues WHERE owner_id = ?)').bind(accountId),
    db.prepare('DELETE FROM leagues WHERE owner_id = ?').bind(accountId),
    db.prepare('DELETE FROM accounts WHERE id = ?').bind(accountId)
  ]);
  return json({ deleted: true });
}

// ---------------------------------------------------------------------------
// Sync
// ---------------------------------------------------------------------------

async function getSync(request, env) {
  const accountId = await requireAccount(request, env);
  const row = await requireDb(env)
    .prepare('SELECT payload, updated_at FROM sync_snapshots WHERE account_id = ?')
    .bind(accountId)
    .first();
  if (!row) return json({ backup: null, updatedAt: null });
  return json({ backup: JSON.parse(row.payload), updatedAt: row.updated_at });
}

async function putSync(request, env) {
  const accountId = await requireAccount(request, env);
  const body = await readJson(request, MAX_SYNC_BYTES + 1024);
  const backup = body.backup;
  if (!backup || typeof backup !== 'object' || backup.kind !== 'treinopro-backup') {
    throw new HttpError(400, 'bad_request', 'O conteúdo enviado não é um backup do app.');
  }
  const payload = JSON.stringify(backup);
  if (payload.length > MAX_SYNC_BYTES) {
    throw new HttpError(413, 'payload_too_large', 'Backup grande demais para a nuvem.');
  }
  const db = requireDb(env);

  // Proteção contra sobrescrever um retrato mais novo de outro aparelho.
  if (typeof body.baseUpdatedAt === 'string' || body.baseUpdatedAt === null) {
    const current = await db
      .prepare('SELECT updated_at FROM sync_snapshots WHERE account_id = ?')
      .bind(accountId)
      .first();
    if (current && current.updated_at !== body.baseUpdatedAt && !body.force) {
      throw new HttpError(409, 'conflict', 'A nuvem tem dados mais novos de outro aparelho.');
    }
  }

  const updatedAt = now();
  await db
    .prepare(
      `INSERT INTO sync_snapshots (account_id, payload, size, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(account_id) DO UPDATE SET payload = excluded.payload, size = excluded.size, updated_at = excluded.updated_at`
    )
    .bind(accountId, payload, payload.length, updatedAt)
    .run();
  return json({ updatedAt, size: payload.length });
}

// ---------------------------------------------------------------------------
// Ligas
// ---------------------------------------------------------------------------

async function listMyLeagues(request, env) {
  const accountId = await requireAccount(request, env);
  const { results } = await requireDb(env)
    .prepare(
      `SELECT l.id, l.name, l.invite_code, l.owner_id = ? AS is_owner, m.nickname,
              (SELECT COUNT(*) FROM league_members x WHERE x.league_id = l.id) AS members
       FROM leagues l JOIN league_members m ON m.league_id = l.id AND m.account_id = ?
       ORDER BY l.created_at`
    )
    .bind(accountId, accountId)
    .all();
  return json({
    leagues: results.map(r => ({
      id: r.id, name: r.name, inviteCode: r.invite_code, isOwner: !!r.is_owner, nickname: r.nickname, members: r.members
    }))
  });
}

async function countMemberships(db, accountId) {
  const row = await db.prepare('SELECT COUNT(*) AS n FROM league_members WHERE account_id = ?').bind(accountId).first();
  return row?.n ?? 0;
}

async function createLeague(request, env) {
  const accountId = await requireAccount(request, env);
  const body = await readJson(request);
  const db = requireDb(env);
  if ((await countMemberships(db, accountId)) >= LIMITS.leaguesPerAccount) {
    throw new HttpError(409, 'limit_reached', `Você já participa de ${LIMITS.leaguesPerAccount} ligas.`);
  }
  const id = randomId('l');
  const code = inviteCode();
  const createdAt = now();
  await db.batch([
    db.prepare('INSERT INTO leagues (id, name, invite_code, owner_id, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(id, cleanText(body.name, 40, 'Liga dos Amigos'), code, accountId, createdAt),
    db.prepare('INSERT INTO league_members (league_id, account_id, nickname, joined_at) VALUES (?, ?, ?, ?)')
      .bind(id, accountId, cleanText(body.nickname, 24, 'Atleta'), createdAt)
  ]);
  return json({ id, inviteCode: code }, 201);
}

async function joinLeague(request, env) {
  const accountId = await requireAccount(request, env);
  const body = await readJson(request);
  const db = requireDb(env);
  const code = normalizeInviteCode(body.inviteCode);
  const league = await db.prepare('SELECT id, name FROM leagues WHERE invite_code = ?').bind(code).first();
  if (!league) throw new HttpError(404, 'not_found', 'Código de liga não encontrado.');

  const already = await db
    .prepare('SELECT 1 AS ok FROM league_members WHERE league_id = ? AND account_id = ?')
    .bind(league.id, accountId)
    .first();
  if (!already) {
    if ((await countMemberships(db, accountId)) >= LIMITS.leaguesPerAccount) {
      throw new HttpError(409, 'limit_reached', `Você já participa de ${LIMITS.leaguesPerAccount} ligas.`);
    }
    const size = await db.prepare('SELECT COUNT(*) AS n FROM league_members WHERE league_id = ?').bind(league.id).first();
    if ((size?.n ?? 0) >= LIMITS.membersPerLeague) {
      throw new HttpError(409, 'league_full', 'Esta liga está cheia.');
    }
    await db
      .prepare('INSERT INTO league_members (league_id, account_id, nickname, joined_at) VALUES (?, ?, ?, ?)')
      .bind(league.id, accountId, cleanText(body.nickname, 24, 'Atleta'), now())
      .run();
  }
  return json({ id: league.id, name: league.name });
}

async function requireMembership(db, leagueId, accountId) {
  const row = await db
    .prepare('SELECT 1 AS ok FROM league_members WHERE league_id = ? AND account_id = ?')
    .bind(leagueId, accountId)
    .first();
  if (!row) throw new HttpError(404, 'not_found', 'Liga não encontrada.');
}

async function postLeagueScore(request, env, leagueId) {
  const accountId = await requireAccount(request, env);
  const body = await readJson(request);
  const db = requireDb(env);
  await requireMembership(db, leagueId, accountId);
  if (!WEEK_KEY_RE.test(String(body.weekKey))) throw new HttpError(400, 'bad_request', 'Semana inválida.');
  // Teto generoso: impede número absurdo sem tentar validar o treino no servidor.
  const score = Math.max(0, Math.min(100_000, Math.round(Number(body.score) || 0)));
  await db
    .prepare(
      `INSERT INTO league_scores (league_id, account_id, week_key, score, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(league_id, account_id, week_key) DO UPDATE SET score = excluded.score, updated_at = excluded.updated_at`
    )
    .bind(leagueId, accountId, body.weekKey, score, now())
    .run();
  return json({ score });
}

async function getLeague(request, env, leagueId, url) {
  const accountId = await requireAccount(request, env);
  const db = requireDb(env);
  await requireMembership(db, leagueId, accountId);
  const weekKey = url.searchParams.get('week') || '';
  if (!WEEK_KEY_RE.test(weekKey)) throw new HttpError(400, 'bad_request', 'Semana inválida.');

  const league = await db.prepare('SELECT id, name, invite_code, owner_id FROM leagues WHERE id = ?').bind(leagueId).first();
  const { results } = await db
    .prepare(
      `SELECT m.account_id, m.nickname, COALESCE(s.score, 0) AS score
       FROM league_members m
       LEFT JOIN league_scores s ON s.league_id = m.league_id AND s.account_id = m.account_id AND s.week_key = ?
       WHERE m.league_id = ?
       ORDER BY score DESC, m.joined_at ASC`
    )
    .bind(weekKey, leagueId)
    .all();

  return json({
    id: league.id,
    name: league.name,
    inviteCode: league.invite_code,
    isOwner: league.owner_id === accountId,
    weekKey,
    // O id das outras contas não sai do servidor: só apelido e pontos.
    ranking: results.map((r, i) => ({ position: i + 1, nickname: r.nickname, score: r.score, isMe: r.account_id === accountId }))
  });
}

async function leaveLeague(request, env, leagueId) {
  const accountId = await requireAccount(request, env);
  const db = requireDb(env);
  await requireMembership(db, leagueId, accountId);
  const league = await db.prepare('SELECT owner_id FROM leagues WHERE id = ?').bind(leagueId).first();
  if (league?.owner_id === accountId) {
    // Dono saindo encerra a liga: não existe transferência de posse.
    await db.batch([
      db.prepare('DELETE FROM league_scores WHERE league_id = ?').bind(leagueId),
      db.prepare('DELETE FROM league_members WHERE league_id = ?').bind(leagueId),
      db.prepare('DELETE FROM leagues WHERE id = ?').bind(leagueId)
    ]);
    return json({ left: true, deleted: true });
  }
  await db.batch([
    db.prepare('DELETE FROM league_scores WHERE league_id = ? AND account_id = ?').bind(leagueId, accountId),
    db.prepare('DELETE FROM league_members WHERE league_id = ? AND account_id = ?').bind(leagueId, accountId)
  ]);
  return json({ left: true, deleted: false });
}

// ---------------------------------------------------------------------------
// Modo personal trainer
// ---------------------------------------------------------------------------

async function requireOwnClass(db, classId, trainerId) {
  const row = await db
    .prepare('SELECT id, name, invite_code FROM trainer_classes WHERE id = ? AND trainer_id = ?')
    .bind(classId, trainerId)
    .first();
  if (!row) throw new HttpError(404, 'not_found', 'Turma não encontrada.');
  return row;
}

async function createClass(request, env) {
  const trainerId = await requireAccount(request, env);
  const body = await readJson(request);
  const db = requireDb(env);
  const count = await db.prepare('SELECT COUNT(*) AS n FROM trainer_classes WHERE trainer_id = ?').bind(trainerId).first();
  if ((count?.n ?? 0) >= LIMITS.classesPerTrainer) {
    throw new HttpError(409, 'limit_reached', `Limite de ${LIMITS.classesPerTrainer} turmas atingido.`);
  }
  const id = randomId('c');
  const code = inviteCode();
  await db
    .prepare('INSERT INTO trainer_classes (id, trainer_id, name, invite_code, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(id, trainerId, cleanText(body.name, 40, 'Minha turma'), code, now())
    .run();
  return json({ id, inviteCode: code }, 201);
}

async function listClasses(request, env) {
  const trainerId = await requireAccount(request, env);
  const db = requireDb(env);
  const { results: classes } = await db
    .prepare('SELECT id, name, invite_code FROM trainer_classes WHERE trainer_id = ? ORDER BY created_at')
    .bind(trainerId)
    .all();
  const { results: students } = await db
    .prepare(
      `SELECT s.class_id, s.student_id, s.display_name, s.joined_at, s.summary_updated_at,
              (SELECT status FROM trainer_plans p WHERE p.class_id = s.class_id AND p.student_id = s.student_id
               ORDER BY p.created_at DESC LIMIT 1) AS last_plan_status
       FROM class_students s JOIN trainer_classes c ON c.id = s.class_id
       WHERE c.trainer_id = ? ORDER BY s.joined_at`
    )
    .bind(trainerId)
    .all();
  return json({
    classes: classes.map(c => ({
      id: c.id,
      name: c.name,
      inviteCode: c.invite_code,
      students: students
        .filter(s => s.class_id === c.id)
        .map(s => ({
          id: s.student_id,
          displayName: s.display_name,
          joinedAt: s.joined_at,
          summaryUpdatedAt: s.summary_updated_at,
          lastPlanStatus: s.last_plan_status ?? null
        }))
    }))
  });
}

async function joinClass(request, env) {
  const studentId = await requireAccount(request, env);
  const body = await readJson(request);
  const db = requireDb(env);
  const cls = await db
    .prepare('SELECT id, name, trainer_id FROM trainer_classes WHERE invite_code = ?')
    .bind(normalizeInviteCode(body.inviteCode))
    .first();
  if (!cls) throw new HttpError(404, 'not_found', 'Código de turma não encontrado.');
  if (cls.trainer_id === studentId) throw new HttpError(400, 'bad_request', 'Você é o personal desta turma.');

  const size = await db.prepare('SELECT COUNT(*) AS n FROM class_students WHERE class_id = ?').bind(cls.id).first();
  const already = await db
    .prepare('SELECT 1 AS ok FROM class_students WHERE class_id = ? AND student_id = ?')
    .bind(cls.id, studentId)
    .first();
  if (!already && (size?.n ?? 0) >= LIMITS.studentsPerClass) {
    throw new HttpError(409, 'class_full', 'Esta turma está cheia.');
  }
  await db
    .prepare(
      `INSERT INTO class_students (class_id, student_id, display_name, joined_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(class_id, student_id) DO UPDATE SET display_name = excluded.display_name`
    )
    .bind(cls.id, studentId, cleanText(body.displayName, 40, 'Aluno'), now())
    .run();
  return json({ id: cls.id, name: cls.name });
}

async function listMyClasses(request, env) {
  const studentId = await requireAccount(request, env);
  const { results } = await requireDb(env)
    .prepare(
      `SELECT c.id, c.name, s.display_name, s.summary_updated_at
       FROM class_students s JOIN trainer_classes c ON c.id = s.class_id WHERE s.student_id = ?`
    )
    .bind(studentId)
    .all();
  return json({
    classes: results.map(r => ({ id: r.id, name: r.name, displayName: r.display_name, summaryUpdatedAt: r.summary_updated_at }))
  });
}

async function leaveClass(request, env, classId) {
  const studentId = await requireAccount(request, env);
  const db = requireDb(env);
  await db.batch([
    db.prepare('DELETE FROM trainer_plans WHERE class_id = ? AND student_id = ?').bind(classId, studentId),
    db.prepare('DELETE FROM class_students WHERE class_id = ? AND student_id = ?').bind(classId, studentId)
  ]);
  return json({ left: true });
}

async function putSummary(request, env) {
  const studentId = await requireAccount(request, env);
  const body = await readJson(request, LIMITS.summaryBytes + 1024);
  if (!body.summary || typeof body.summary !== 'object') {
    throw new HttpError(400, 'bad_request', 'Resumo inválido.');
  }
  const payload = JSON.stringify(body.summary);
  if (payload.length > LIMITS.summaryBytes) throw new HttpError(413, 'payload_too_large', 'Resumo grande demais.');
  const result = await requireDb(env)
    .prepare('UPDATE class_students SET summary = ?, summary_updated_at = ? WHERE student_id = ?')
    .bind(payload, now(), studentId)
    .run();
  return json({ classes: result?.meta?.changes ?? 0 });
}

async function getStudent(request, env, classId, studentId) {
  const trainerId = await requireAccount(request, env);
  const db = requireDb(env);
  await requireOwnClass(db, classId, trainerId);
  const row = await db
    .prepare('SELECT display_name, joined_at, summary, summary_updated_at FROM class_students WHERE class_id = ? AND student_id = ?')
    .bind(classId, studentId)
    .first();
  if (!row) throw new HttpError(404, 'not_found', 'Aluno não encontrado.');
  const { results: plans } = await db
    .prepare('SELECT id, note, status, created_at, responded_at FROM trainer_plans WHERE class_id = ? AND student_id = ? ORDER BY created_at DESC LIMIT 10')
    .bind(classId, studentId)
    .all();
  return json({
    displayName: row.display_name,
    joinedAt: row.joined_at,
    summary: row.summary ? JSON.parse(row.summary) : null,
    summaryUpdatedAt: row.summary_updated_at,
    plans: plans.map(p => ({ id: p.id, note: p.note, status: p.status, createdAt: p.created_at, respondedAt: p.responded_at }))
  });
}

async function sendPlan(request, env, classId, studentId) {
  const trainerId = await requireAccount(request, env);
  const body = await readJson(request, LIMITS.planBytes + 2048);
  const db = requireDb(env);
  await requireOwnClass(db, classId, trainerId);
  const member = await db
    .prepare('SELECT 1 AS ok FROM class_students WHERE class_id = ? AND student_id = ?')
    .bind(classId, studentId)
    .first();
  if (!member) throw new HttpError(404, 'not_found', 'Aluno não encontrado.');

  const splits = Array.isArray(body.workoutSplits) ? body.workoutSplits : null;
  if (!splits || splits.length === 0 || splits.length > 7) {
    throw new HttpError(400, 'bad_request', 'A ficha precisa ter de 1 a 7 treinos.');
  }
  const payload = JSON.stringify({ workoutSplits: splits });
  if (payload.length > LIMITS.planBytes) throw new HttpError(413, 'payload_too_large', 'Ficha grande demais.');

  const pending = await db
    .prepare("SELECT COUNT(*) AS n FROM trainer_plans WHERE student_id = ? AND status = 'pending'")
    .bind(studentId)
    .first();
  if ((pending?.n ?? 0) >= LIMITS.pendingPlansPerStudent) {
    throw new HttpError(409, 'limit_reached', 'O aluno já tem fichas pendentes demais.');
  }

  const id = randomId('p');
  await db
    .prepare('INSERT INTO trainer_plans (id, class_id, student_id, payload, note, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, classId, studentId, payload, cleanText(body.note, 500), 'pending', now())
    .run();
  return json({ id }, 201);
}

async function getInbox(request, env) {
  const studentId = await requireAccount(request, env);
  const { results } = await requireDb(env)
    .prepare(
      `SELECT p.id, p.payload, p.note, p.created_at, c.name AS class_name
       FROM trainer_plans p JOIN trainer_classes c ON c.id = p.class_id
       WHERE p.student_id = ? AND p.status = 'pending' ORDER BY p.created_at`
    )
    .bind(studentId)
    .all();
  return json({
    plans: results.map(p => ({
      id: p.id, className: p.class_name, note: p.note, createdAt: p.created_at, ...JSON.parse(p.payload)
    }))
  });
}

async function respondPlan(request, env, planId) {
  const studentId = await requireAccount(request, env);
  const body = await readJson(request);
  const status = body.accepted === true ? 'accepted' : 'declined';
  const result = await requireDb(env)
    .prepare("UPDATE trainer_plans SET status = ?, responded_at = ? WHERE id = ? AND student_id = ? AND status = 'pending'")
    .bind(status, now(), planId, studentId)
    .run();
  if (!result?.meta?.changes) throw new HttpError(404, 'not_found', 'Ficha não encontrada ou já respondida.');
  return json({ status });
}

// ---------------------------------------------------------------------------
// Lembretes (Web Push)
// ---------------------------------------------------------------------------

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

async function subscribePush(request, env) {
  const body = await readJson(request, 8 * 1024);
  const endpoint = String(body.subscription?.endpoint ?? '');
  let endpointUrl;
  try {
    endpointUrl = new URL(endpoint);
  } catch {
    throw new HttpError(400, 'bad_request', 'Inscrição de notificação inválida.');
  }
  if (endpointUrl.protocol !== 'https:') throw new HttpError(400, 'bad_request', 'Inscrição de notificação inválida.');

  const days = Array.isArray(body.days)
    ? [...new Set(body.days.map(Number).filter(d => Number.isInteger(d) && d >= 0 && d <= 6))].sort()
    : [];
  if (days.length === 0) throw new HttpError(400, 'bad_request', 'Escolha pelo menos um dia.');
  if (!TIME_RE.test(String(body.time))) throw new HttpError(400, 'bad_request', 'Horário inválido.');
  const tzOffset = Math.round(Number(body.tzOffsetMinutes));
  if (!Number.isFinite(tzOffset) || Math.abs(tzOffset) > 14 * 60) {
    throw new HttpError(400, 'bad_request', 'Fuso horário inválido.');
  }

  const id = await sha256Hex(endpoint);
  await requireDb(env)
    .prepare(
      `INSERT INTO push_subscriptions (id, endpoint, days, time, tz_offset, created_at) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET days = excluded.days, time = excluded.time, tz_offset = excluded.tz_offset`
    )
    .bind(id, endpoint, JSON.stringify(days), body.time, tzOffset, now())
    .run();
  return json({ subscribed: true, days, time: body.time });
}

async function unsubscribePush(request, env) {
  const body = await readJson(request, 8 * 1024);
  const endpoint = String(body.endpoint ?? '');
  if (!endpoint) throw new HttpError(400, 'bad_request', 'Inscrição inválida.');
  await requireDb(env).prepare('DELETE FROM push_subscriptions WHERE id = ?').bind(await sha256Hex(endpoint)).run();
  return json({ unsubscribed: true });
}

// ---------------------------------------------------------------------------
// Roteador
// ---------------------------------------------------------------------------

const ROUTES = [
  ['POST', /^\/api\/account$/, (req, env) => createAccount(env)],
  ['DELETE', /^\/api\/account$/, (req, env) => deleteAccount(req, env)],
  ['GET', /^\/api\/sync$/, (req, env) => getSync(req, env)],
  ['PUT', /^\/api\/sync$/, (req, env) => putSync(req, env)],
  ['GET', /^\/api\/leagues$/, (req, env) => listMyLeagues(req, env)],
  ['POST', /^\/api\/leagues$/, (req, env) => createLeague(req, env)],
  ['POST', /^\/api\/leagues\/join$/, (req, env) => joinLeague(req, env)],
  ['GET', /^\/api\/leagues\/([A-Za-z0-9_-]+)$/, (req, env, m, url) => getLeague(req, env, m[1], url)],
  ['POST', /^\/api\/leagues\/([A-Za-z0-9_-]+)\/score$/, (req, env, m) => postLeagueScore(req, env, m[1])],
  ['POST', /^\/api\/leagues\/([A-Za-z0-9_-]+)\/leave$/, (req, env, m) => leaveLeague(req, env, m[1])],
  ['GET', /^\/api\/trainer\/classes$/, (req, env) => listClasses(req, env)],
  ['POST', /^\/api\/trainer\/classes$/, (req, env) => createClass(req, env)],
  ['GET', /^\/api\/trainer\/classes\/([A-Za-z0-9_-]+)\/students\/([A-Za-z0-9_-]+)$/, (req, env, m) => getStudent(req, env, m[1], m[2])],
  ['POST', /^\/api\/trainer\/classes\/([A-Za-z0-9_-]+)\/students\/([A-Za-z0-9_-]+)\/plans$/, (req, env, m) => sendPlan(req, env, m[1], m[2])],
  ['POST', /^\/api\/trainer\/join$/, (req, env) => joinClass(req, env)],
  ['GET', /^\/api\/trainer\/memberships$/, (req, env) => listMyClasses(req, env)],
  ['POST', /^\/api\/trainer\/memberships\/([A-Za-z0-9_-]+)\/leave$/, (req, env, m) => leaveClass(req, env, m[1])],
  ['PUT', /^\/api\/trainer\/summary$/, (req, env) => putSummary(req, env)],
  ['GET', /^\/api\/trainer\/inbox$/, (req, env) => getInbox(req, env)],
  ['POST', /^\/api\/trainer\/inbox\/([A-Za-z0-9_-]+)$/, (req, env, m) => respondPlan(req, env, m[1])],
  ['GET', /^\/api\/push\/public-key$/, (req, env) => json({ publicKey: getVapidPublicKey(env) })],
  ['POST', /^\/api\/push\/subscribe$/, (req, env) => subscribePush(req, env)],
  ['POST', /^\/api\/push\/unsubscribe$/, (req, env) => unsubscribePush(req, env)],
  ['POST', /^\/api\/coach\/weekly$/, (req, env) => handleWeeklyCoach(req, env)]
];

export function isApiPath(pathname) {
  return ROUTES.some(([, re]) => re.test(pathname));
}

export async function handleApi(request, env) {
  const url = new URL(request.url);
  try {
    assertSameOrigin(request, url);
    const matching = ROUTES.filter(([, re]) => re.test(url.pathname));
    const route = matching.find(([method]) => method === request.method);
    if (!route) {
      return json({ error: 'Método não permitido.', code: 'method_not_allowed' }, 405, {
        allow: matching.map(([m]) => m).join(', ')
      });
    }
    if (!limiter(request.headers.get('cf-connecting-ip') ?? 'desconhecido')) {
      throw new HttpError(429, 'rate_limited', 'Muitos pedidos seguidos. Tente de novo em instantes.');
    }
    const match = url.pathname.match(route[1]);
    return await route[2](request, env, match, url);
  } catch (err) {
    return errorResponse(err);
  }
}
