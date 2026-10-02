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
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-512x512.svg'],
      manifest: {
        // O app serve hipertrofia E emagrecimento; o manifest antigo só citava hipertrofia.
        name: 'TreinoPro — Treino & Dieta Personalizados',
        short_name: 'TreinoPro',
        description: 'Plano de treino, carga, dieta e evolução personalizados para hipertrofia ou emagrecimento',
        lang: 'pt-BR',
        dir: 'ltr',
        theme_color: '#090d16',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
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
          },
          {
            src: 'pwa-512x512.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      }
    })
  ],
})
