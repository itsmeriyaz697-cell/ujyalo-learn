import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        // Overridable so a test harness can run its own API on a free port
        // instead of assuming 8787 is available. Default unchanged.
        target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
  preview: { host: '0.0.0.0', port: 4173 },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          markdown: ['react-markdown', 'remark-gfm', 'remark-math', 'rehype-katex'],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Rules tests need the Firestore emulator; run them with `npm run test:rules`.
    exclude: ['tests/rules/**', 'node_modules/**'],
    globals: true,
  },
});
