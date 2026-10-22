import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import vueDevTools from 'vite-plugin-vue-devtools';

// https://vite.dev/config/
export default defineConfig({
  base: '/qvgdl/',
  plugins: [vue(), tailwindcss(), vueDevTools()],
  resolve: { alias: { '@': resolve(dirname(fileURLToPath(import.meta.url)), './src') } }
});
