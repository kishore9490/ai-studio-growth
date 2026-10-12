// Lab measurement of LCP, CLS and interaction latency (Event Timing) in headless Chromium.
// usage: node scripts/perf.mjs <url> <profile: mobile|desktop> [--gl]
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let pw
try { pw = require('playwright') } catch { pw = require('/opt/node22/lib/node_modules/playwright') }
const [url, profile, ...flags] = process.argv.slice(2)
const mobile = profile === 'mobile'
const args = flags.includes('--gl') ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--disable-webgl', '--disable-3d-apis']
const b = await pw.chromium.launch({ args })
const ctx = await b.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const cdp = await ctx.newCDPSession(page)
await cdp.send('Network.enable')
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
if (mobile) {
  // Lighthouse-like "slow 4G" + 4x CPU slowdown
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
}
await page.addInitScript(() => {
  window.__m = { lcp: 0, lcpEl: '', cls: 0, inp: 0 }
  new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__m.lcp = e.startTime; (window.__m.all ||= []).push(Math.round(e.startTime) + ':' + (e.element?.tagName||'') + ':' + (e.element?.textContent||'').slice(0,30) + ':' + e.size); window.__m.lcpEl = (e.element?.tagName || '') + ' ' + (e.url || '').split('/').pop() } }).observe({ type: 'largest-contentful-paint', buffered: true })
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value }).observe({ type: 'layout-shift', buffered: true })
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.inp = Math.max(window.__m.inp, e.duration) }).observe({ type: 'event', buffered: true, durationThreshold: 16 })
})
const t0 = Date.now()
await page.goto(url, { waitUntil: 'load', timeout: 120000 })
const loadMs = Date.now() - t0
await page.waitForTimeout(6000)
// interactions: open an FAQ / menu, then scroll the page to accumulate layout shifts
const sel = (await page.$('summary')) ? 'summary' : 'header button'
await page.click(sel).catch(() => {})
await page.waitForTimeout(800)
for (let y = 0; y < 4000; y += 500) { await page.mouse.wheel(0, 500); await page.waitForTimeout(250) }
await page.waitForTimeout(1000)
const m = await page.evaluate(() => window.__m)
const bytes = await page.evaluate(() => performance.getEntriesByType('resource').reduce((a, r) => a + (r.transferSize || 0), 0) + (performance.getEntriesByType('navigation')[0]?.transferSize || 0))
if (process.env.LCPDEBUG) console.log(m.all, await page.evaluate(() => Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime)), await page.evaluate(() => performance.getEntriesByType('resource').filter(r=>r.initiatorType!=='img').map(r => Math.round(r.responseEnd) + ' ' + r.name.split('/').pop()).join(' | ')))
console.log(`${profile}${flags.includes('--gl') ? '+webgl' : ''} ${url.replace(/^https?:\/\/[^/]+/, '')}  LCP=${Math.round(m.lcp)}ms (${m.lcpEl.trim()})  CLS=${m.cls.toFixed(3)}  maxInteraction=${Math.round(m.inp)}ms  load=${loadMs}ms  transferred=${Math.round(bytes / 1024)}KB`)
await b.close()
