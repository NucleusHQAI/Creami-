/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// PWA config (vite-plugin-pwa) is added in the installability task — not yet in scope.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    // .claude/worktrees holds sibling agents' full checkouts (see .gitignore) —
    // without this, vitest crawls into them and runs their in-progress tests too.
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'],
  },
})
