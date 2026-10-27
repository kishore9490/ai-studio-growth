import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';

// Modes:
//   (default)     EMCA web app            -> dist/
//   single        EMCA single HTML file   -> dist-single/
//   jch           JCH web app (dev/build) -> dist-jch/
//   jch-single    JCH single HTML file    -> dist-jch-single/
export default defineConfig(({ mode }) => {
  const brand = mode.startsWith('jch') ? 'jch' : 'emca';
  const single = mode.endsWith('single');
  const titles = { emca: 'EMCA Letterhead Studio', jch: 'JCH Letterhead Studio' };
  const outDir = { emca: single ? 'dist-single' : 'dist', jch: single ? 'dist-jch-single' : 'dist-jch' }[brand];
  return {
    plugins: [
      react(),
      { name: 'brand-title', transformIndexHtml: (html) => html.replace('%APP_TITLE%', titles[brand]) },
      ...(single ? [viteSingleFile()] : []),
    ],
    resolve: { alias: { '@brand': fileURLToPath(new URL(`./src/brands/${brand}.js`, import.meta.url)) } },
    base: './',
    build: { outDir, chunkSizeWarningLimit: 5000, ...(single ? { assetsInlineLimit: 100000000 } : {}) },
  };
});
