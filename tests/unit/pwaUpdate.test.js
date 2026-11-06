import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePwaUpdate } from '../../src/composables/usePwaUpdate';

describe('usePwaUpdate', () => {
  let originalNavigator;
  let mockSw;
  let listeners;

  beforeEach(() => {
    listeners = {};
    mockSw = {
      addEventListener: vi.fn((event, cb) => {
        listeners[event] = cb;
      }),
      register: vi.fn(),
      controller: { postMessage: vi.fn() }
    };

    originalNavigator = global.navigator;
    Object.defineProperty(global, 'navigator', {
      value: {
        ...originalNavigator,
        serviceWorker: mockSw,
        onLine: true
      },
      configurable: true,
      writable: true
    });
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true
    });
    vi.restoreAllMocks();
  });

  it('inicia com needRefresh como false', () => {
    const { needRefresh } = usePwaUpdate();
    expect(needRefresh.value).toBe(false);
  });

  it('registra o service worker oficial /sw.js', async () => {
    const mockReg = {
      waiting: null,
      addEventListener: vi.fn(),
      update: vi.fn().mockResolvedValue()
    };
    mockSw.register.mockResolvedValue(mockReg);

    const { register } = usePwaUpdate();
    register();

    expect(mockSw.addEventListener).toHaveBeenCalledWith('controllerchange', expect.any(Function));
    expect(mockSw.register).toHaveBeenCalledWith('/sw.js', { scope: '/' });
  });

  it('detecta quando já existe um service worker aguardando ativação', async () => {
    const mockWaiting = { postMessage: vi.fn() };
    const mockReg = {
      waiting: mockWaiting,
      addEventListener: vi.fn(),
      update: vi.fn().mockResolvedValue()
    };
    mockSw.register.mockResolvedValue(mockReg);

    const { register, needRefresh } = usePwaUpdate();
    register();

    // Espera resolução da promise do register
    await Promise.resolve();

    expect(needRefresh.value).toBe(true);
  });

  it('envia mensagem SKIP_WAITING ao chamar updateApp', async () => {
    const mockWaiting = { postMessage: vi.fn() };
    const mockReg = {
      waiting: mockWaiting,
      addEventListener: vi.fn(),
      update: vi.fn().mockResolvedValue()
    };
    mockSw.register.mockResolvedValue(mockReg);

    const { register, updateApp } = usePwaUpdate();
    register();
    await Promise.resolve();

    updateApp();
    expect(mockWaiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });

  it('dismissUpdate esconde o aviso', () => {
    const { needRefresh, dismissUpdate } = usePwaUpdate();
    needRefresh.value = true;
    dismissUpdate();
    expect(needRefresh.value).toBe(false);
  });
});
