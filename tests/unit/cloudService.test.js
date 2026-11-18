import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  apiRequest, CloudError, createCloudAccount, loadCloudAccount, pushSnapshot,
  linkWithAccessCode, isValidAccessCode, urlBase64ToUint8Array, saveCloudAccount
} from '../../src/services/cloud.js';

function res(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

beforeEach(() => saveCloudAccount(null));

describe('cloud service', () => {
  it('traduz erro do servidor e falha de rede', async () => {
    await expect(apiRequest('/x', { fetchImpl: async () => res(409, { error: 'Conflito', code: 'conflict' }) }))
      .rejects.toMatchObject({ status: 409, code: 'conflict', message: 'Conflito' });
    await expect(apiRequest('/x', { fetchImpl: async () => { throw new TypeError('offline'); } }))
      .rejects.toBeInstanceOf(CloudError);
  });

  it('cria conta, guarda o código e envia token no sync', async () => {
    const fetchImpl = vi.fn(async (url, init) => {
      if (url === '/api/account') return res(201, { accessCode: 'aId.tok' });
      return res(200, { updatedAt: '2026-03-01T00:00:00.000Z' });
    });
    const account = await createCloudAccount({ fetchImpl });
    expect(loadCloudAccount().accessCode).toBe('aId.tok');

    const next = await pushSnapshot(account, { kind: 'treinopro-backup' }, { fetchImpl });
    const [, init] = fetchImpl.mock.calls[1];
    expect(init.headers.authorization).toBe('Bearer aId.tok');
    expect(JSON.parse(init.body).baseUpdatedAt).toBeNull();
    expect(next.lastSyncAt).toBe('2026-03-01T00:00:00.000Z');
  });

  it('vincular com código inválido falha sem chamar o servidor', async () => {
    const fetchImpl = vi.fn();
    await expect(linkWithAccessCode('sem-ponto', { fetchImpl })).rejects.toMatchObject({ code: 'bad_code' });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(isValidAccessCode(' a.b ')).toBe(true);
  });

  it('decodifica a chave VAPID', () => {
    expect(urlBase64ToUint8Array('AQID')).toEqual(new Uint8Array([1, 2, 3]));
  });
});
