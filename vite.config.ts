import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    modulePreload: false,
    rollupOptions: {
      input: resolve(__dirname, 'app.html')
    }
  }
});
