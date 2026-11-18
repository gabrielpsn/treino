/**
 * Utilitários HTTP compartilhados pelas rotas novas do Worker (contas, sync,
 * ligas, modo personal, lembretes e coach semanal).
 */

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders
    }
  });
}

export function errorResponse(err) {
  if (err instanceof HttpError) {
    return json({ error: err.message, code: err.code }, err.status);
  }
  console.error('[api] erro inesperado:', err?.stack || err);
  return json({ error: 'Erro interno. Tente de novo em instantes.', code: 'internal' }, 500);
}

export async function readJson(request, maxBytes = 64 * 1024) {
  const text = await request.text();
  if (text.length > maxBytes) {
    throw new HttpError(413, 'payload_too_large', 'Dados grandes demais para enviar.');
  }
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not object');
    return parsed;
  } catch {
    throw new HttpError(400, 'bad_request', 'Corpo da requisição inválido.');
  }
}

/** Limitador por chave em memória (por isolate): barreira contra loops e robôs ingênuos. */
export function createRateLimiter({ windowMs = 60_000, max = 60 } = {}) {
  const buckets = new Map();
  return function check(key) {
    const now = Date.now();
    if (buckets.size > 2000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    bucket.count++;
    return bucket.count <= max;
  };
}

export function assertSameOrigin(request, url) {
  const origin = request.headers.get('origin');
  if (!origin) return;
  let host;
  try {
    host = new URL(origin).host;
  } catch {
    throw new HttpError(403, 'forbidden_origin', 'Origem não permitida.');
  }
  if (host !== url.host) throw new HttpError(403, 'forbidden_origin', 'Origem não permitida.');
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(text) {
  return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}

export function base64url(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64urlDecode(text) {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((text.length + 3) % 4);
  const bin = atob(b64);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

export function randomToken(bytes = 32) {
  return base64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export function randomId(prefix = '') {
  return `${prefix}${randomToken(12)}`;
}

// Sem 0/O, 1/I/L: o código é ditado em voz alta e digitado no celular.
const INVITE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function inviteCode(length = 8) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return [...bytes].map(b => INVITE_ALPHABET[b % INVITE_ALPHABET.length]).join('');
}

export function normalizeInviteCode(value) {
  return String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
}

export function cleanText(value, max, fallback = '') {
  const text = String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
  return text || fallback;
}

export const WEEK_KEY_RE = /^\d{4}-W\d{2}$/;
