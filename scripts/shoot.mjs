// Dev utility: screenshot pages at given viewports, optionally at scroll positions.
// usage: node scripts/shoot.mjs <url> <outPrefix> <w>x<h> [scrollY,...] [--wait=ms] [--reduced]
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let pw
try { pw = require('playwright') } catch { pw = require('/opt/node22/lib/node_modules/playwright') }
const [url, out, size, scrolls = '0', ...flags] = process.argv.slice(2)
const [w, h] = size.split('x').map(Number)
const wait = Number((flags.find((f) => f.startsWith('--wait=')) || '--wait=6000').split('=')[1])
const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: flags.includes('--reduced') ? 'reduce' : 'no-preference', isMobile: flags.includes('--mobile'), hasTouch: flags.includes('--mobile') })
const page = await ctx.newPage()
const logs = []
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`) })
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
await page.goto(url, { waitUntil: 'load' })
await page.waitForFunction(() => window.__heroReady === true, null, { timeout: 60000 }).catch(() => logs.push('hero not ready'))
await page.waitForTimeout(wait)
console.log('fps-ish', await page.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(n / 2) }; requestAnimationFrame(f) })))
let i = 0
for (const y of scrolls.split(',').map(Number)) {
  await page.evaluate((y) => window.scrollTo(0, y), y)
  await page.waitForTimeout(y === 0 ? 300 : 2500)
  await page.screenshot({ path: `${out}-${i++}.png`, timeout: 180000 })
}
console.log(logs.slice(0, 20).join('\n') || 'no console errors')
await browser.close()
