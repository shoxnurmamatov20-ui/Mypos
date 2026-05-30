/// <reference types="vitest" />
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * B7 — Vitest config for the consumer marketplace.
 *
 * The tests in `src/__tests__/` are unit-level: they exercise data
 * fetching, mappers and stores. They use the lightweight `node`
 * environment (default) and shim `localStorage` per test for the cart
 * persistence cases. When component-rendering tests land we'll switch to
 * `jsdom` for any file under `**\/components.test.tsx`.
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
      include: ['src/lib/**/*.ts', 'src/stores/**/*.ts'],
      exclude: ['src/lib/api.ts'],
      lines: 70,
      branches: 70,
      functions: 70,
      statements: 70,
    },
  },
});
