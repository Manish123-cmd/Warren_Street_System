import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const pages = ['index', 'frozen-pastries', 'creams', 'setting-proover', 'wastage', 'orders'];

export default defineConfig({
  base: './',
  root: 'frontend',
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    assetsDir: 'react-assets',
    rollupOptions: {
      input: Object.fromEntries(pages.map(page => [page, resolve(`frontend/${page}.html`)])),
    },
  },
});
