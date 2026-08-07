import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { webcrypto } from 'node:crypto';

// Ensure `globalThis.crypto.getRandomValues` exists for some dependencies
try {
  if (!globalThis.crypto && webcrypto) globalThis.crypto = webcrypto;
} catch (e) {
  // ignore if not available; Vite will fail later if truly required
}

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});