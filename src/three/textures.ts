import * as THREE from 'three'

/**
 * Procedural textures generated on a 2D canvas at runtime.
 * Keeps the hero free of large image downloads while still giving the
 * materials surface variation (paint roughness, scratches, concrete, label print).
 */

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  return { c, ctx }
}

/** Deterministic PRNG so every visit renders the same "imperfections". */
function rng(seed = 1) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function finish(c: HTMLCanvasElement, opts: { srgb?: boolean; repeat?: [number, number]; aniso?: number } = {}) {
  const t = new THREE.CanvasTexture(c)
  if (opts.srgb) t.colorSpace = THREE.SRGBColorSpace
  if (opts.repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(opts.repeat[0], opts.repeat[1])
  }
  t.anisotropy = opts.aniso ?? 4
  t.needsUpdate = true
  return t
}

/** Roughness map for powder-coated paint: fine orange-peel noise, faint handling scuffs, a few hairline scratches. */
export function paintRoughness(size = 512) {
  const { c, ctx } = canvas(size, size)
  const r = rng(7)
  // base mid-grey => roughness multiplier ~0.5
  ctx.fillStyle = 'rgb(120,120,120)'
  ctx.fillRect(0, 0, size, size)
  const img = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 22
    img.data[i] = img.data[i + 1] = img.data[i + 2] = 120 + n
  }
  ctx.putImageData(img, 0, 0)
  // soft blotches: handling marks (slightly rougher)
  for (let i = 0; i < 26; i++) {
    const x = r() * size
    const y = r() * size
    const rad = 10 + r() * 60
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
    g.addColorStop(0, `rgba(170,170,170,${0.10 + r() * 0.12})`)
    g.addColorStop(1, 'rgba(170,170,170,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
  // hairline scratches
  ctx.lineCap = 'round'
  for (let i = 0; i < 40; i++) {
    const x = r() * size
    const y = r() * size
    const len = 6 + r() * 40
    const a = (r() - 0.5) * 0.9
    ctx.strokeStyle = `rgba(210,210,210,${0.15 + r() * 0.3})`
    ctx.lineWidth = 0.6 + r() * 0.6
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len)
    ctx.stroke()
  }
  return finish(c, { repeat: [2, 2] })
}

/** Printed instruction label wrapped around the cylinder. Generic and illustrative — no product claims. */
export function labelTexture() {
  const W = 900
  const H = 1024
  const { c, ctx } = canvas(W, H)
  const r = rng(3)
  // paper
  ctx.fillStyle = '#ece9e1'
  ctx.fillRect(0, 0, W, H)
  // subtle paper grain
  const img = ctx.getImageData(0, 0, W, H)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 10
    img.data[i] += n
    img.data[i + 1] += n
    img.data[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)

  // title band
  ctx.fillStyle = '#b0141c'
  ctx.fillRect(0, 40, W, 150)
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '800 92px Arial, Helvetica, sans-serif'
  ctx.fillText('FIRE', W / 2, 92)
  ctx.font = '700 46px Arial, Helvetica, sans-serif'
  ctx.fillText('EXTINGUISHER', W / 2, 155)

  ctx.fillStyle = '#16191d'
  ctx.font = '800 56px Arial, Helvetica, sans-serif'
  ctx.fillText('ABC DRY POWDER', W / 2, 260)
  ctx.font = '500 26px Arial, Helvetica, sans-serif'
  ctx.fillStyle = '#4a4f55'
  ctx.fillText('STORED PRESSURE TYPE', W / 2, 308)

  // fire class pictograms
  const classes = ['A', 'B', 'C']
  const box = 150
  const gap = 34
  const startX = (W - (box * 3 + gap * 2)) / 2
  classes.forEach((k, i) => {
    const x = startX + i * (box + gap)
    const y = 360
    ctx.fillStyle = '#16191d'
    roundRect(ctx, x, y, box, box, 18)
    ctx.fill()
    ctx.fillStyle = '#ece9e1'
    ctx.font = '800 92px Arial, Helvetica, sans-serif'
    ctx.fillText(k, x + box / 2, y + box / 2 + 4)
  })

  // operating steps: four small illustrated panels
  const pw = 170
  const pg = 22
  const px = (W - (pw * 4 + pg * 3)) / 2
  for (let i = 0; i < 4; i++) {
    const x = px + i * (pw + pg)
    const y = 560
    ctx.strokeStyle = '#16191d'
    ctx.lineWidth = 4
    roundRect(ctx, x, y, pw, 150, 10)
    ctx.stroke()
    ctx.fillStyle = '#b0141c'
    ctx.font = '800 40px Arial, Helvetica, sans-serif'
    ctx.fillText(String(i + 1), x + 30, y + 34)
    // abstract pictogram
    ctx.fillStyle = '#16191d'
    ctx.fillRect(x + 70, y + 40, 22, 80)
    ctx.beginPath()
    ctx.arc(x + 81, y + 40, 14, Math.PI, 0)
    ctx.fill()
    ctx.fillRect(x + 96 + i * 6, y + 70, 40, 8)
  }

  // body copy (rendered as grey lines — illegible at viewing distance, like real fine print)
  ctx.fillStyle = '#6a7077'
  for (let row = 0; row < 9; row++) {
    const y = 760 + row * 24
    const w = 620 + r() * 160
    ctx.fillRect((W - w) / 2, y, w, 8)
  }
  ctx.fillStyle = '#b0141c'
  ctx.fillRect(0, H - 40, W, 40)
  return finish(c, { srgb: true, aniso: 8 })
}

/** Illustrative pressure gauge dial. Deliberately neutral: no "OK" or approval zone is implied. */
export function gaugeTexture() {
  const S = 512
  const { c, ctx } = canvas(S, S)
  const cx = S / 2
  const cy = S / 2
  ctx.fillStyle = '#f2f2ee'
  ctx.beginPath()
  ctx.arc(cx, cy, S / 2, 0, Math.PI * 2)
  ctx.fill()
  const a0 = Math.PI * 0.8
  const a1 = Math.PI * 2.2
  const arc = (from: number, to: number, color: string, w: number, rad: number) => {
    ctx.strokeStyle = color
    ctx.lineWidth = w
    ctx.beginPath()
    ctx.arc(cx, cy, rad, from, to)
    ctx.stroke()
  }
  const span = a1 - a0
  arc(a0, a0 + span * 0.22, '#c4161c', 34, 180)
  arc(a0 + span * 0.22, a0 + span * 0.78, '#3a4048', 34, 180)
  arc(a0 + span * 0.78, a1, '#c4161c', 34, 180)
  // ticks
  ctx.strokeStyle = '#16191d'
  for (let i = 0; i <= 20; i++) {
    const a = a0 + (span * i) / 20
    const long = i % 5 === 0
    const r1 = long ? 130 : 145
    ctx.lineWidth = long ? 6 : 3
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1)
    ctx.lineTo(cx + Math.cos(a) * 160, cy + Math.sin(a) * 160)
    ctx.stroke()
  }
  ctx.fillStyle = '#16191d'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '700 34px Arial, Helvetica, sans-serif'
  ctx.fillText('PRESSURE', cx, cy + 96)
  ctx.font = '500 24px Arial, Helvetica, sans-serif'
  ctx.fillText('bar', cx, cy + 132)
  // needle (drawn on the dial; a separate mesh would be overkill)
  const na = a0 + span * 0.5
  ctx.strokeStyle = '#111'
  ctx.lineWidth = 10
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - Math.cos(na) * 26, cy - Math.sin(na) * 26)
  ctx.lineTo(cx + Math.cos(na) * 150, cy + Math.sin(na) * 150)
  ctx.stroke()
  ctx.fillStyle = '#111'
  ctx.beginPath()
  ctx.arc(cx, cy, 20, 0, Math.PI * 2)
  ctx.fill()
  return finish(c, { srgb: true, aniso: 8 })
}

/** Polished concrete: low-frequency mottling + fine aggregate. Used as floor roughness/colour. */
export function concreteTexture(size = 1024) {
  const { c, ctx } = canvas(size, size)
  const r = rng(11)
  ctx.fillStyle = 'rgb(128,128,128)'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 180; i++) {
    const x = r() * size
    const y = r() * size
    const rad = 40 + r() * 220
    const v = r() > 0.5 ? 255 : 0
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
    g.addColorStop(0, `rgba(${v},${v},${v},${0.04 + r() * 0.06})`)
    g.addColorStop(1, `rgba(${v},${v},${v},0)`)
    ctx.fillStyle = g
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
  const img = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 26
    img.data[i] += n
    img.data[i + 1] += n
    img.data[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)
  // saw-cut control joints
  ctx.strokeStyle = 'rgba(0,0,0,0.55)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(0, 1)
  ctx.lineTo(size, 1)
  ctx.moveTo(1, 0)
  ctx.lineTo(1, size)
  ctx.stroke()
  return finish(c, { repeat: [8, 8], aniso: 8 })
}

/** Soft radial sprite for haze cards and light pools. */
export function softSprite(size = 256) {
  const { c, ctx } = canvas(size, size)
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return finish(c)
}

/** Illuminated "fire point" sign for the distant wall. */
export function signTexture() {
  const { c, ctx } = canvas(512, 256)
  ctx.fillStyle = '#c4161c'
  ctx.fillRect(0, 0, 512, 256)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '800 64px Arial, Helvetica, sans-serif'
  ctx.fillText('FIRE POINT', 256, 96)
  ctx.font = '600 34px Arial, Helvetica, sans-serif'
  ctx.fillText('EXTINGUISHER  ·  ALARM', 256, 176)
  return finish(c, { srgb: true })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
