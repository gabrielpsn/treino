/**
 * Lembretes de treino por Web Push.
 *
 * O envio é SEM payload: o navegador recebe só o "toque" e o service worker
 * mostra a notificação com texto fixo. Isso dispensa a criptografia aes128gcm
 * do corpo — só a assinatura VAPID (ES256) é necessária, feita com WebCrypto.
 *
 * Configuração:
 *   VAPID_PUBLIC_KEY   (var)    chave pública P-256 em base64url (65 bytes, não comprimida)
 *   VAPID_PRIVATE_JWK  (secret) JWK da chave privada correspondente
 *   VAPID_SUBJECT      (var)    "mailto:..." ou URL do app (opcional; padrão: origem do app)
 * Gere as duas chaves com `node scripts/generate-vapid.mjs`.
 */

import { HttpError, base64url } from './http.js';

const REMINDER_WINDOW_MINUTES = 15;
const MAX_PER_RUN = 500;

export function getVapidPublicKey(env) {
  if (!env.VAPID_PUBLIC_KEY) {
    throw new HttpError(503, 'push_unavailable', 'Lembretes ainda não foram configurados no servidor.');
  }
  return env.VAPID_PUBLIC_KEY;
}

let cachedKey = null;
async function signingKey(env) {
  if (cachedKey?.raw === env.VAPID_PRIVATE_JWK) return cachedKey.key;
  const jwk = JSON.parse(env.VAPID_PRIVATE_JWK);
  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', d: jwk.d, x: jwk.x, y: jwk.y, ext: true },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  cachedKey = { raw: env.VAPID_PRIVATE_JWK, key };
  return key;
}

export async function vapidAuthorization(endpoint, env, nowSeconds = Math.floor(Date.now() / 1000)) {
  const audience = new URL(endpoint).origin;
  const encoder = new TextEncoder();
  const header = base64url(encoder.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = base64url(encoder.encode(JSON.stringify({
    aud: audience,
    exp: nowSeconds + 12 * 3600,
    sub: env.VAPID_SUBJECT || 'mailto:lembretes@overload.app'
  })));
  const unsigned = `${header}.${claims}`;
  // WebCrypto devolve a assinatura em formato bruto r||s (64 bytes), que é
  // exatamente o que o JWS ES256 espera.
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    await signingKey(env),
    encoder.encode(unsigned)
  );
  return `vapid t=${unsigned}.${base64url(new Uint8Array(signature))}, k=${env.VAPID_PUBLIC_KEY}`;
}

export async function sendPush(endpoint, env, fetchImpl = fetch) {
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      authorization: await vapidAuthorization(endpoint, env),
      ttl: String(4 * 3600),
      urgency: 'normal',
      'content-length': '0'
    }
  });
  return response.status;
}

/**
 * O lembrete está "vencido" nesta rodada do cron se o horário local escolhido
 * caiu nos últimos 15 minutos de um dos dias marcados.
 */
export function isReminderDue({ days, time, tzOffset }, nowMs, windowMinutes = REMINDER_WINDOW_MINUTES) {
  const [hh, mm] = String(time).split(':').map(Number);
  // tzOffset segue Date#getTimezoneOffset: minutos a SOMAR no local para dar UTC.
  const local = new Date(nowMs - tzOffset * 60_000);
  const localMinutes = local.getUTCHours() * 60 + local.getUTCMinutes();
  const target = hh * 60 + mm;
  const diff = localMinutes - target;
  if (diff < 0 || diff >= windowMinutes) return false;
  return days.includes(local.getUTCDay());
}

export async function runReminders(env, { now = Date.now(), fetchImpl = fetch } = {}) {
  if (!env.DB || !env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_JWK) return { sent: 0, removed: 0 };

  const { results } = await env.DB
    .prepare('SELECT id, endpoint, days, time, tz_offset, last_sent_at FROM push_subscriptions LIMIT ?')
    .bind(MAX_PER_RUN * 4)
    .all();

  let sent = 0;
  let removed = 0;
  const nowIso = new Date(now).toISOString();
  for (const row of results) {
    if (sent >= MAX_PER_RUN) break;
    const due = isReminderDue({ days: JSON.parse(row.days), time: row.time, tzOffset: row.tz_offset }, now);
    // Não manda duas vezes no mesmo dia se o cron rodar de novo na janela.
    const sentRecently = row.last_sent_at && now - Date.parse(row.last_sent_at) < 6 * 3600_000;
    if (!due || sentRecently) continue;

    try {
      const status = await sendPush(row.endpoint, env, fetchImpl);
      if (status === 404 || status === 410) {
        await env.DB.prepare('DELETE FROM push_subscriptions WHERE id = ?').bind(row.id).run();
        removed++;
      } else if (status >= 200 && status < 300) {
        await env.DB.prepare('UPDATE push_subscriptions SET last_sent_at = ? WHERE id = ?').bind(nowIso, row.id).run();
        sent++;
      } else {
        console.warn(`[push] envio recusado (${status})`);
      }
    } catch (err) {
      console.warn('[push] falha de rede no envio:', err?.message ?? err);
    }
  }
  return { sent, removed };
}
