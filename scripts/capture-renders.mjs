/**
 * Renders the pre-rendered stills used as hero poster/fallback, service imagery and the social card
 * directly from the live 3D scene (?capture mode), so every image matches the real art direction.
 * Usage: start the dev server, then `node scripts/capture-renders.mjs [baseUrl]`.
 */
import { createRequire } from 'module'
import { writeFileSync } from 'fs'
const require = createRequire(import.meta.url)
let pw
try { pw = require('playwright') } catch { pw = require('/opt/node22/lib/node_modules/playwright') }

const base = process.argv[2] || 'http://127.0.0.1:5173'
const only = process.argv[3] ? process.argv[3].split(',') : null
const out = new URL('../public/images/', import.meta.url)
const jobs = [
  // name, shot, viewport, extra query, outputs [{w,h,type,q}]
  { name: 'hero-a-wide', shot: 'A', vw: 1920, vh: 1080, outs: [{ w: 1920, h: 1080, type: 'webp', q: 0.62 }] },
  { name: 'hero-a-narrow', shot: 'A', vw: 780, vh: 1688, outs: [{ w: 780, h: 1688, type: 'webp', q: 0.6 }] },
  { name: 'hero-b-wide', shot: 'B', vw: 1920, vh: 1080, outs: [{ w: 1920, h: 1080, type: 'webp', q: 0.78 }] },
  { name: 'hero-b-narrow', shot: 'B', vw: 780, vh: 1688, outs: [{ w: 780, h: 1688, type: 'webp', q: 0.76 }] },
  { name: 'render-product', shot: 'B', vw: 1400, vh: 1000, q: '&center', outs: [{ w: 1400, h: 1000, type: 'webp', q: 0.8, suffix: '-1400' }, { w: 800, h: 571, type: 'webp', q: 0.8, suffix: '-800' }] },
  { name: 'render-detail', shot: 'C', vw: 1400, vh: 1000, q: '&center', outs: [{ w: 1400, h: 1000, type: 'webp', q: 0.8, suffix: '-1400' }, { w: 800, h: 571, type: 'webp', q: 0.8, suffix: '-800' }] },
  { name: 'og-image', shot: 'B', vw: 1200, vh: 630, outs: [{ w: 1200, h: 630, type: 'jpeg', q: 0.86 }] },
]

const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
// Sequential: software-rendered WebGL in CI containers cannot run several scenes at once.
for (const j of jobs.filter((x) => !only || only.includes(x.name))) {
  {
    const page = await browser.newPage({ viewport: { width: j.vw, height: j.vh }, deviceScaleFactor: 1 })
    await page.goto(`${base}/?capture&quality=high&shot=${j.shot}${j.q || ''}`, { waitUntil: 'load' })
    await page.waitForFunction(() => window.__heroReady === true, null, { timeout: 180000, polling: 500 })
    await page.waitForTimeout(6000) // contact shadows / reflector settle
    for (const o of j.outs) {
      const url = await page.evaluate(
        ({ w, h, type, q }) => {
          const src = document.querySelector('[data-hero] canvas')
          const c = document.createElement('canvas')
          c.width = w
          c.height = h
          c.getContext('2d').drawImage(src, 0, 0, w, h)
          return c.toDataURL(`image/${type}`, q)
        },
        o,
      )
      const ext = o.type === 'jpeg' ? 'jpg' : o.type
      const file = new URL(`${j.name}${o.suffix || ''}.${ext}`, out)
      const buf = Buffer.from(url.split(',')[1], 'base64')
      writeFileSync(file, buf)
      console.log(file.pathname.split('/').pop(), Math.round(buf.length / 1024) + ' KB')
    }
    await page.close()
  }
}
await browser.close()
