// Verifies hero fallbacks: reduced motion (no pin, static), and WebGL disabled (pre-rendered still).
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let pw
try { pw = require('playwright') } catch { pw = require('/opt/node22/lib/node_modules/playwright') }
const [base, out] = process.argv.slice(2)
const run = async (name, args, opts) => {
  const b = await pw.chromium.launch({ args })
  const page = await (await b.newContext(opts)).newPage()
  const logs = []
  page.on('console', (m) => m.type() === 'error' && logs.push(m.text()))
  page.on('pageerror', (e) => logs.push(e.message))
  await page.goto(base + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(8000)
  const s = await page.evaluate(() => ({
    mode: document.querySelector('[data-hero]').dataset.mode,
    pinned: !!document.querySelector('.pin-spacer'),
    h1Visible: getComputedStyle(document.querySelector('#hero-title')).opacity,
    img: document.querySelector('[data-hero] img')?.currentSrc.split('/').pop(),
    ctas: [...document.querySelectorAll('[data-hero] a')].map((a) => a.getAttribute('href')),
  }))
  await page.screenshot({ path: `${out}-${name}.png` })
  console.log(name, JSON.stringify(s), logs.length ? 'ERRORS: ' + logs.join(' | ') : 'no errors')
  await b.close()
}
await run('nowebgl', ['--disable-gpu', '--disable-webgl', '--disable-3d-apis'], { viewport: { width: 1280, height: 800 } })
await run('nowebgl-mobile', ['--disable-gpu', '--disable-webgl', '--disable-3d-apis'], { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
await run('reduced', ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'], { viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })
