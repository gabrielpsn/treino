import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // O app é servido na raiz do domínio; fixar isso evita que o base mude
  // silenciosamente e quebre o escopo do service worker.
  base: '/',
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'overload_AI.svg', 'pwa-192x192.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-512x512.svg'],
      manifest: {
        name: 'Overload AI — Treino & Dieta com Inteligência Artificial',
        short_name: 'Overload AI',
        description: 'Plano de treino, sobrecarga progressiva, dieta e evolução com Inteligência Artificial',
        lang: 'pt-BR',
        dir: 'ltr',
        theme_color: '#0066FF',
        background_color: '#08090B',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'overload_AI.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
