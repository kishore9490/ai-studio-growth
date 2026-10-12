// Drives the hero storyboard forward and backward, screenshotting each stage and logging state.
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let pw
try { pw = require('playwright') } catch { pw = require('/opt/node22/lib/node_modules/playwright') }
const [url, out, size, positions, ...flags] = process.argv.slice(2)
const [w, h] = size.split('x').map(Number)
const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: flags.includes('--mobile'), hasTouch: flags.includes('--mobile') })
const page = await ctx.newPage()
const logs = []
page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/THREE.Clock/.test(m.text())) logs.push(`[${m.type()}] ${m.text()}`) })
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
await page.goto(url, { waitUntil: 'load' })
await page.waitForFunction(() => window.__heroReady === true, null, { timeout: 90000, polling: 500 }).catch(async (e) => {
  console.log('NOT READY', await page.evaluate(() => ({ mode: document.querySelector('[data-hero]')?.dataset.mode, canvas: !!document.querySelector('[data-hero] canvas') })), logs.join('\n'))
  throw e
})
await page.waitForTimeout(5000)
let i = 0
for (const p of positions.split(',')) {
  const y = Math.round(Number(p) * h)
  await page.evaluate((y) => window.scrollTo(0, y), y)
  await page.waitForTimeout(Number(process.env.SETTLE || 4500))
  const state = await page.evaluate(() => {
    const vis = (s) => [...document.querySelectorAll(s)].map((e) => Number(getComputedStyle(e).opacity).toFixed(2)).join('/')
    return { y: scrollY, intro: vis('[data-stage="intro"]'), detail: vis('[data-stage="detail"]'), reveal: vis('[data-stage="reveal"]'), annot: vis('[data-annot]'), heroTop: Math.round(document.querySelector('[data-hero]').getBoundingClientRect().top), bus: window.__heroBus && { p: window.__heroBus.intro.p, pz: window.__heroBus.scroll.pz, ready: window.__heroBus.ready, A: window.__heroBus.poses.A.pz } }
  })
  console.log(`#${i} scroll=${p}h`, JSON.stringify(state))
  await page.screenshot({ path: `${out}-${i++}.png`, timeout: 120000 })
}
console.log(logs.join('\n') || 'no console errors')
await browser.close()
