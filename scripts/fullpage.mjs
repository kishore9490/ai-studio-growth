// Dev utility: full-page screenshot (WebGL disabled for speed unless --gl), reports console errors.
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let pw
try { pw = require('playwright') } catch { pw = require('/opt/node22/lib/node_modules/playwright') }
const [url, out, size, ...flags] = process.argv.slice(2)
const [w, h] = size.split('x').map(Number)
const args = flags.includes('--gl') ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--disable-gpu', '--disable-webgl', '--disable-3d-apis']
const browser = await pw.chromium.launch({ args })
const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: flags.includes('--mobile'), hasTouch: flags.includes('--mobile'), reducedMotion: 'reduce' })
const page = await ctx.newPage()
const logs = []
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`) })
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
await page.screenshot({ path: out, fullPage: true, timeout: 120000 })
console.log('horizontal overflow px:', overflow)
console.log(logs.slice(0, 15).join('\n') || 'no console errors')
await browser.close()
