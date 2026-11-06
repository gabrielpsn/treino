import { ref } from 'vue';

/**
 * Composable para gerenciamento de ciclo de vida do Service Worker (PWA).
 * Detecta quando uma nova versão do app foi construída e está aguardando ativação,
 * alertando o usuário para atualizar a página e recarregar os novos assets.
 */
export function usePwaUpdate() {
  const needRefresh = ref(false);
  const offlineReady = ref(false);
  const isUpdating = ref(false);
  let swRegistration = null;

  function register() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Em ambiente de dev server do Vite, /sw.js responde com o fallback do index.html (MIME text/html).
    // Registramos no ambiente de produção, em testes ou quando explicitamente solicitado.
    if (import.meta.env?.DEV && !import.meta.env?.TEST && !window.__ENABLE_DEV_SW__) {
      return;
    }

    // Ouvir quando o novo service worker assume o controle para recarregar a janela
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    // Registrar o Service Worker oficial gerado pelo VitePWA (/sw.js)
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => {
        swRegistration = reg;

        // Caso 1: Já havia um service worker aguardando antes do carregamento atual
        if (reg.waiting) {
          needRefresh.value = true;
        }

        // Caso 2: Um novo service worker foi descoberto e instalado em segundo plano
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Existe um controller ativo: este novo worker é uma ATUALIZAÇÃO!
                needRefresh.value = true;
              } else {
                // Primeiro acesso: conteúdo pronto para funcionar offline
                offlineReady.value = true;
              }
            }
          });
        });

        // Verificação periódica de novas versões (a cada 30 minutos)
        setInterval(() => {
          if (navigator.onLine && reg) {
            reg.update().catch(() => {});
          }
        }, 30 * 60 * 1000);

        // Verificação ao retornar ao app / focar na janela (comum no celular)
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && navigator.onLine && reg) {
            reg.update().catch(() => {});
          }
        });

        window.addEventListener('focus', () => {
          if (navigator.onLine && reg) {
            reg.update().catch(() => {});
          }
        });
      })
      .catch((err) => {
        console.warn('[PWA] Não foi possível registrar o Service Worker:', err);
      });
  }

  /**
   * Força o Service Worker em espera a assumir o controle (SKIP_WAITING)
   * e recarrega a página com o novo código.
   */
  function updateApp() {
    isUpdating.value = true;
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }

  function dismissUpdate() {
    needRefresh.value = false;
  }

  return {
    needRefresh,
    offlineReady,
    isUpdating,
    register,
    updateApp,
    dismissUpdate
  };
}
