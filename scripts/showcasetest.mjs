// Verifies the interactive showcase: scene loads, markers project, selecting a part rotates + highlights it.
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let pw
try { pw = require('playwright') } catch { pw = require('/opt/node22/lib/node_modules/playwright') }
const [url, out] = process.argv.slice(2)
const b = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await b.newPage({ viewport: { width: 1280, height: 860 } })
const errs = []
page.on('pageerror', (e) => errs.push(e.message))
await page.goto(url + '/?quality=low', { waitUntil: 'load' })
await page.locator('#showcase-title').scrollIntoViewIfNeeded()
await page.waitForFunction(() => document.querySelectorAll('.hotspot').length === 5, null, { timeout: 120000, polling: 500 })
await page.waitForTimeout(6000)
const stage = page.locator('.hotspot').first().locator('..')
const visible = await page.evaluate(() => [...document.querySelectorAll('.hotspot')].filter((h) => h.style.visibility === 'visible').map((h) => h.getAttribute('aria-label').replace('Show details: ', '')))
console.log('visible markers:', visible.join(', '))
await stage.screenshot({ path: `${out}-0.png` })
await page.getByRole('button', { name: /^0\d\s*Pressure gauge$/ }).click()
await page.waitForTimeout(8000)
console.log('info panel:', (await page.locator('#part-info').innerText()).slice(0, 80))
await stage.screenshot({ path: `${out}-1.png` })
await page.getByRole('button', { name: /^0\d\s*Handle & operating lever$/ }).click()
await page.waitForTimeout(8000)
await stage.screenshot({ path: `${out}-2.png` })
const vis2 = await page.evaluate(() => [...document.querySelectorAll('.hotspot')].filter((h) => h.style.visibility === 'visible').length)
// click a projected marker directly
const marker = page.locator('.hotspot[style*="visible"]').first()
const label = await marker.getAttribute('aria-label')
await marker.click()
await page.waitForTimeout(1500)
console.log('marker click:', label, '→ pressed =', await marker.getAttribute('aria-pressed'), '| visible markers now', vis2)
console.log(errs.length ? 'ERRORS ' + errs.join(' | ') : 'no page errors')
await b.close()
