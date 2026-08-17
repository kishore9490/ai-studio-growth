/**
 * Bundles the built app into one self-contained HTML file.
 *
 * Used for sharing a runnable build where there is no server to host assets or
 * rewrite SPA routes: the CSS and JS are inlined and the app is built with hash
 * routing, so the single file works from any origin — or from disk.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist-static/', import.meta.url).pathname;
const assets = join(dist, 'assets');
const files = readdirSync(assets);

const js = readFileSync(join(assets, files.find((f) => f.endsWith('.js'))), 'utf8');
const css = readFileSync(join(assets, files.find((f) => f.endsWith('.css'))), 'utf8');

// A literal </script> inside the bundle would close the inline tag early.
const safeJs = js.replaceAll('</script', '<\\/script');

const page = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BID Trust</title>
    <style>
      html, body { height: 100%; margin: 0; background: #f8fafc; }
      #root { min-height: 100vh; }
    </style>
    <style>${css}</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">${safeJs}</script>
  </body>
</html>
`;

const out = join(dist, 'bid-trust-standalone.html');
writeFileSync(out, page);
console.log(`single-file build → ${out} (${(page.length / 1024 / 1024).toFixed(2)} MB)`);
