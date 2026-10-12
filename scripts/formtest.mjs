// End-to-end enquiry form test: validation, submission, success/error states.
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let pw
try { pw = require('playwright') } catch { pw = require('/opt/node22/lib/node_modules/playwright') }
const [url, out, expect] = process.argv.slice(2)
const b = await pw.chromium.launch({ args: ['--disable-webgl', '--disable-3d-apis'] })
const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.goto(url, { waitUntil: 'networkidle' })
// 1. empty submit → validation errors, focus moves to first invalid field
await page.click('button[type=submit]')
const errCount = await page.locator('[aria-invalid=true]').count()
const focused = await page.evaluate(() => document.activeElement?.getAttribute('name'))
console.log('validation: invalid fields =', errCount, '| focused =', focused)
// 2. bad phone stays invalid
await page.fill('[name=phone]', '12345')
await page.fill('[name=name]', 'Asha Rao')
console.log('bad phone msg:', await page.locator('[name=phone] ~ p').textContent().catch(() => '-'))
// 3. fill valid
await page.fill('[name=phone]', '+91 98450 12345')
await page.fill('[name=email]', 'asha@example.in')
await page.selectOption('[name=service]', 'refilling-and-maintenance')
console.log('quantity field shown for refilling:', await page.locator('[name=quantity]').count() === 1)
await page.fill('[name=quantity]', '24')
await page.fill('[name=city]', 'Bengaluru')
await page.check('[name=consent]')
await page.waitForTimeout(2600) // past the anti-bot minimum completion time
await page.click('button[type=submit]')
await page.waitForTimeout(2500)
const status = await page.locator('[role=status], [role=alert]').first().innerText().catch(() => 'none')
console.log('result:', status.replace(/\s+/g, ' ').slice(0, 220))
await page.screenshot({ path: out, fullPage: false })
console.log(errors.length ? 'PAGE ERRORS: ' + errors.join(' | ') : 'no page errors')
await b.close()
