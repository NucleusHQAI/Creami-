/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

const disablePwaForUnsafeWindowsPath =
  process.platform === 'win32' && __dirname.includes("'")

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Workbox 7 emits unescaped absolute imports when a Windows path contains
      // an apostrophe. Netlify and normal paths still build the full PWA.
      disable: disablePwaForUnsafeWindowsPath,
      strategies: 'generateSW',
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'CREAMi Deluxe Recipe Book',
        short_name: 'CREAMi',
        description: 'Protein ice cream recipes for the Ninja CREAMi Deluxe',
        theme_color: '#fffaf2',
        background_color: '#fffaf2',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    // Local agent worktree folders hold full sibling checkouts (see .gitignore) —
    // without these, Vitest crawls into them and runs their tests too.
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**', '.worktrees/**'],
  },
})
