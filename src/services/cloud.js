/**
 * Cliente das rotas online do Worker: conta anônima, sync, ligas reais,
 * modo personal, lembretes e coach semanal.
 *
 * O "código de acesso" (`<accountId>.<token>`) fica só no aparelho. Quem tem o
 * código acessa os dados — por isso a tela de sync pede para o usuário guardá-lo.
 */

export const CLOUD_ACCOUNT_KEY = 'overload_cloud_account';
const ACCESS_CODE_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

export class CloudError extends Error {
  constructor(message, { status = 0, code = 'network' } = {}) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function storage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function loadCloudAccount() {
  try {
    const raw = storage()?.getItem(CLOUD_ACCOUNT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return ACCESS_CODE_RE.test(parsed?.accessCode ?? '') ? parsed : null;
  } catch {
    return null;
  }
}

export function saveCloudAccount(account) {
  try {
    if (account) storage()?.setItem(CLOUD_ACCOUNT_KEY, JSON.stringify(account));
    else storage()?.removeItem(CLOUD_ACCOUNT_KEY);
  } catch {
    // Sem storage o app segue sem recursos online.
  }
}

export function isValidAccessCode(code) {
  return ACCESS_CODE_RE.test(String(code ?? '').trim());
}

export async function apiRequest(path, { method = 'GET', body, accessCode, fetchImpl = fetch } = {}) {
  const headers = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (accessCode) headers.authorization = `Bearer ${accessCode}`;

  let response;
  try {
    response = await fetchImpl(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw new CloudError('Sem conexão com o servidor. Verifique a internet.', { code: 'network' });
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    throw new CloudError(data?.error || 'O servidor não conseguiu atender agora.', {
      status: response.status,
      code: data?.code || 'http_error'
    });
  }
  return data;
}

function requireAccess(account) {
  if (!account?.accessCode) throw new CloudError('Ative os recursos online primeiro.', { code: 'no_account' });
  return account.accessCode;
}

// --- Conta -----------------------------------------------------------------

export async function createCloudAccount(opts = {}) {
  const data = await apiRequest('/api/account', { method: 'POST', ...opts });
  const account = { accessCode: data.accessCode, createdAt: new Date().toISOString(), lastSyncAt: null };
  saveCloudAccount(account);
  return account;
}

export async function deleteCloudAccount(account, opts = {}) {
  await apiRequest('/api/account', { method: 'DELETE', accessCode: requireAccess(account), ...opts });
  saveCloudAccount(null);
}

// --- Sync ------------------------------------------------------------------

export async function pushSnapshot(account, backup, { force = false, ...opts } = {}) {
  const data = await apiRequest('/api/sync', {
    method: 'PUT',
    accessCode: requireAccess(account),
    body: { backup, baseUpdatedAt: account.lastSyncAt ?? null, force },
    ...opts
  });
  const next = { ...account, lastSyncAt: data.updatedAt };
  saveCloudAccount(next);
  return next;
}

export async function pullSnapshot(account, opts = {}) {
  return apiRequest('/api/sync', { accessCode: requireAccess(account), ...opts });
}

/** Liga este aparelho a um código existente (trazido de outro aparelho). */
export async function linkWithAccessCode(code, opts = {}) {
  const accessCode = String(code ?? '').trim();
  if (!isValidAccessCode(accessCode)) throw new CloudError('Código inválido.', { code: 'bad_code' });
  const data = await pullSnapshot({ accessCode }, opts);
  const account = { accessCode, createdAt: new Date().toISOString(), lastSyncAt: data.updatedAt ?? null };
  saveCloudAccount(account);
  return { account, snapshot: data };
}

// --- Ligas -----------------------------------------------------------------

export const listLeagues = (account, opts) =>
  apiRequest('/api/leagues', { accessCode: requireAccess(account), ...opts });
export const createLeague = (account, { name, nickname }, opts) =>
  apiRequest('/api/leagues', { method: 'POST', accessCode: requireAccess(account), body: { name, nickname }, ...opts });
export const joinLeague = (account, { inviteCode, nickname }, opts) =>
  apiRequest('/api/leagues/join', { method: 'POST', accessCode: requireAccess(account), body: { inviteCode, nickname }, ...opts });
export const getLeague = (account, leagueId, weekKey, opts) =>
  apiRequest(`/api/leagues/${encodeURIComponent(leagueId)}?week=${encodeURIComponent(weekKey)}`, { accessCode: requireAccess(account), ...opts });
export const postLeagueScore = (account, leagueId, weekKey, score, opts) =>
  apiRequest(`/api/leagues/${encodeURIComponent(leagueId)}/score`, { method: 'POST', accessCode: requireAccess(account), body: { weekKey, score }, ...opts });
export const leaveLeague = (account, leagueId, opts) =>
  apiRequest(`/api/leagues/${encodeURIComponent(leagueId)}/leave`, { method: 'POST', accessCode: requireAccess(account), ...opts });

// --- Modo personal -----------------------------------------------------------

export const listTrainerClasses = (account, opts) =>
  apiRequest('/api/trainer/classes', { accessCode: requireAccess(account), ...opts });
export const createTrainerClass = (account, name, opts) =>
  apiRequest('/api/trainer/classes', { method: 'POST', accessCode: requireAccess(account), body: { name }, ...opts });
export const getStudent = (account, classId, studentId, opts) =>
  apiRequest(`/api/trainer/classes/${encodeURIComponent(classId)}/students/${encodeURIComponent(studentId)}`, { accessCode: requireAccess(account), ...opts });
export const sendPlanToStudent = (account, classId, studentId, { workoutSplits, note }, opts) =>
  apiRequest(`/api/trainer/classes/${encodeURIComponent(classId)}/students/${encodeURIComponent(studentId)}/plans`, {
    method: 'POST', accessCode: requireAccess(account), body: { workoutSplits, note }, ...opts
  });
export const joinTrainerClass = (account, { inviteCode, displayName }, opts) =>
  apiRequest('/api/trainer/join', { method: 'POST', accessCode: requireAccess(account), body: { inviteCode, displayName }, ...opts });
export const listMyTrainerMemberships = (account, opts) =>
  apiRequest('/api/trainer/memberships', { accessCode: requireAccess(account), ...opts });
export const leaveTrainerClass = (account, classId, opts) =>
  apiRequest(`/api/trainer/memberships/${encodeURIComponent(classId)}/leave`, { method: 'POST', accessCode: requireAccess(account), ...opts });
export const uploadStudentSummary = (account, summary, opts) =>
  apiRequest('/api/trainer/summary', { method: 'PUT', accessCode: requireAccess(account), body: { summary }, ...opts });
export const getTrainerInbox = (account, opts) =>
  apiRequest('/api/trainer/inbox', { accessCode: requireAccess(account), ...opts });
export const respondToTrainerPlan = (account, planId, accepted, opts) =>
  apiRequest(`/api/trainer/inbox/${encodeURIComponent(planId)}`, { method: 'POST', accessCode: requireAccess(account), body: { accepted }, ...opts });

// --- Coach -------------------------------------------------------------------

export async function requestWeeklyCoach(summary, opts = {}) {
  const data = await apiRequest('/api/coach/weekly', { method: 'POST', body: { summary }, ...opts });
  return data.text;
}

// --- Lembretes (Web Push) ------------------------------------------------------

export const REMINDER_SETTINGS_KEY = 'overload_reminder_settings';

export function loadReminderSettings() {
  try {
    const raw = storage()?.getItem(REMINDER_SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && Array.isArray(parsed.days) && typeof parsed.time === 'string') return parsed;
  } catch {
    // ignora
  }
  return { enabled: false, days: [1, 3, 5], time: '18:00' };
}

export function saveReminderSettings(settings) {
  try {
    storage()?.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignora
  }
}

export function pushSupported() {
  return typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;
}

export function urlBase64ToUint8Array(base64) {
  const padded = base64.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((base64.length + 3) % 4);
  const raw = atob(padded);
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

export async function enableReminders({ days, time }, opts = {}) {
  if (!pushSupported()) {
    throw new CloudError('Este navegador não suporta notificações. No iPhone, instale o app na tela inicial primeiro.', { code: 'unsupported' });
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new CloudError('Permissão de notificação negada. Libere nas configurações do navegador.', { code: 'denied' });
  }
  const { publicKey } = await apiRequest('/api/push/public-key', opts);
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
  }
  await apiRequest('/api/push/subscribe', {
    method: 'POST',
    body: { subscription: subscription.toJSON(), days, time, tzOffsetMinutes: new Date().getTimezoneOffset() },
    ...opts
  });
  const settings = { enabled: true, days, time };
  saveReminderSettings(settings);
  return settings;
}

export async function disableReminders(opts = {}) {
  const current = loadReminderSettings();
  if (pushSupported()) {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await apiRequest('/api/push/unsubscribe', { method: 'POST', body: { endpoint: subscription.endpoint }, ...opts }).catch(() => {});
      await subscription.unsubscribe().catch(() => {});
    }
  }
  const settings = { ...current, enabled: false };
  saveReminderSettings(settings);
  return settings;
}
