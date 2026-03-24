/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    legacy(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icons/*.webp', 'splash/*.png'],

      manifest: {
        name: 'Zenythium Fitness',
        short_name: 'Zenythium',
        description: 'Фитнес-трекер: тренировки, программы, прогресс',
        theme_color: '#121212',
        background_color: '#121212',
        display: 'standalone',
        orientation: 'portrait',
        scope: './',
        start_url: './',
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

        // Don't pre-cache source maps
        globIgnores: ['**/*.map'],

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
  },
  base: './',
})
