import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build` -> normal static site in dist/
// `npm run build:single` -> one self-contained HTML file in dist-single/ (open it directly, no server needed)
export default defineConfig(({ mode }) => ({
  plugins: mode === 'single' ? [react(), viteSingleFile()] : [react()],
  base: './',
  build: mode === 'single' ? { outDir: 'dist-single', assetsInlineLimit: 100000000, chunkSizeWarningLimit: 5000 } : { chunkSizeWarningLimit: 2000 },
}));
