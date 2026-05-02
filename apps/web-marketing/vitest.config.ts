/// <reference types="vitest" />
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * C7 — Vitest config for the marketing site.
 *
 * Mirrors `apps/web-consumer/vitest.config.ts`. Tests under
 * `src/__tests__/` are unit-level only — Zod schemas, Zustand stores,
 * fetch wrappers. They use the lightweight `node` environment and shim
 * sessionStorage / localStorage / fetch per test.
 *
 * If component-rendering tests land later we'll switch to `jsdom` and
 * pull in `@testing-library/react` as a workspace devDep.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/**/*.ts'],
      lines: 70,
      branches: 70,
      functions: 70,
      statements: 70,
    },
  },
});
