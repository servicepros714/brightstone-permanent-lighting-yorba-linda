import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Inline config stops Vite searching parent folders, where a stray postcss.config.js can break the build.
  css: { postcss: { plugins: [] } },
  build: { outDir: 'dist', sourcemap: false },
});
