import { defineConfig } from 'vitest/config';

/**
 * Config for the Firestore rules suite only.
 *
 * Kept separate from the main config because these tests need the Firestore
 * emulator (and therefore Java), which `npm test` must not require.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    globals: true,
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
