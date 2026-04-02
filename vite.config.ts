/// <reference types="vitest" />

import { readFileSync } from 'fs'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/** Единый semver с package.json / scripts/version.js / Android versionName */
const appVersion = JSON.parse(
  readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')
).version as string

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const laravelDevTarget = env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000'

  return {
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (id.includes('chart.js') || id.includes('vue-chartjs')) {
            return 'charts'
          }

          if (id.includes('vuedraggable')) {
            return 'dragdrop'
          }

          if (id.includes('@vuepic/vue-datepicker')) {
            return 'datepicker'
          }

          if (
            id.includes('@ionic/') ||
            id.includes('@capacitor/') ||
            id.includes('ionicons')
          ) {
            return 'ionic-framework'
          }

          if (
            id.includes('/vue/') ||
            id.includes('vue-router') ||
            id.includes('axios')
          ) {
            return 'app-vendor'
          }
        },
      },
    },
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icons/*.webp'],

      manifest: {
        name: 'Zenythium Fitness',
        short_name: 'Zenythium',
        description: 'Фитнес-трекер: тренировки, программы, прогресс',
        theme_color: '#121212',
        background_color: '#121212',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['fitness', 'health', 'sports'],
        icons: [
          {
            src: 'icons/icon-48.webp',
            sizes: '48x48',
            type: 'image/webp',
          },
          {
            src: 'icons/icon-72.webp',
            sizes: '72x72',
            type: 'image/webp',
          },
          {
            src: 'icons/icon-96.webp',
            sizes: '96x96',
            type: 'image/webp',
          },
          {
            src: 'icons/icon-128.webp',
            sizes: '128x128',
            type: 'image/webp',
          },
          {
            src: 'icons/icon-192.webp',
            sizes: '192x192',
            type: 'image/webp',
            purpose: 'any',
          },
          {
            src: 'icons/icon-256.webp',
            sizes: '256x256',
            type: 'image/webp',
          },
          {
            src: 'icons/icon-512.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'any maskable',
          },
        ],
      },

      workbox: {
        // Pre-cache app shell
        globPatterns: ['**/*.{js,css,html,ico,png,webp,svg,woff,woff2}'],

        // Don't pre-cache source maps or optional iOS startup images.
        // Splash screens remain available from /public, but are fetched on demand.
        globIgnores: ['**/*.map', 'splash/**'],

        // Runtime caching for external resources
        runtimeCaching: [
          // Google Fonts stylesheets
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Fonts webfont files
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Font Awesome CDN (if any)
          {
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fontawesome-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        // Skip waiting — new SW activates immediately
        skipWaiting: true,
        clientsClaim: true,

        // Don't cache API calls in service worker
        navigateFallbackDenylist: [/^\/api/],
      },

      // Dev options (optional — disable SW in dev to avoid caching issues)
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom'
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Dev: при VITE_API_SERVER_URL=proxy клиент бьёт в тот же origin (/api/v1, /sanctum/…),
    // Vite пересылает на Laravel — без CORS и с рабочими cookie Sanctum.
    proxy: {
      '/api': {
        target: laravelDevTarget,
        changeOrigin: true,
      },
      '/sanctum': {
        target: laravelDevTarget,
        changeOrigin: true,
      },
    },
  },
  // Единая модель с деплоем в корень домена и Capacitor (https://localhost/…): абсолютные пути от /.
  base: '/',
  }
})
