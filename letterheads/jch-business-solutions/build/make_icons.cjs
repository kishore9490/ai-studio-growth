// Renders small round icon chips (white Lucide glyph on brand blue) as transparent PNGs.
const { chromium } = require('playwright');
const path = require('path');
const ICONS = {
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
};
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ deviceScaleFactor: 4, viewport: { width: 200, height: 200 } });
  for (const [name, body] of Object.entries(ICONS)) {
    await p.setContent(`<html><body style="margin:0;background:transparent">
      <div id="c" style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#0050AA,#1E96DA);display:grid;place-items:center">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${body}</svg></div></body></html>`);
    await p.locator('#c').screenshot({ path: path.join(__dirname, `icon-${name}.png`), omitBackground: true });
  }
  await b.close();
})();
