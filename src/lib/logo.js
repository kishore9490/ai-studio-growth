// Generates a clean, vector academy logo as an SVG data URL.
// Uses only system fonts so the SVG renders identically when rasterised.

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
}

const FONT = "'Helvetica Neue', Arial, Helvetica, sans-serif";

function initialsText(initials, y, maxWidth, fill) {
  const len = Math.max(1, initials.length);
  const size = Math.min(64, Math.floor(maxWidth / (len * 0.68)));
  return `<text x="100" y="${y}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-weight="700" font-size="${size}" letter-spacing="${len > 2 ? 1 : 2}" fill="${fill}">${esc(initials)}</text>`;
}

export function makeLogoSvg({ style, initials, primary, secondary }) {
  const p = primary;
  const s = secondary;
  let body = '';
  switch (style) {
    case 'cross':
      body = `
        <circle cx="100" cy="100" r="92" fill="${p}"/>
        <circle cx="100" cy="100" r="80" fill="none" stroke="${s}" stroke-width="4"/>
        <path d="M84 46h32a6 6 0 0 1 6 6v26h26a6 6 0 0 1 6 6v32a6 6 0 0 1-6 6h-26v26a6 6 0 0 1-6 6H84a6 6 0 0 1-6-6v-26H52a6 6 0 0 1-6-6V84a6 6 0 0 1 6-6h26V52a6 6 0 0 1 6-6z" fill="#fff"/>
        <polyline points="40,102 70,102 80,86 92,124 104,70 114,112 122,102 160,102" fill="none" stroke="${s}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
      break;
    case 'shield':
      body = `
        <path d="M100 8l78 26v58c0 50-34 86-78 102C56 178 22 142 22 92V34z" fill="${p}"/>
        <path d="M100 22l64 21v49c0 41-27 71-64 86-37-15-64-45-64-86V43z" fill="none" stroke="${s}" stroke-width="4"/>
        <path d="M94 38h12v12h12v12h-12v12H94V62H82V50h12z" fill="${s}"/>
        ${initialsText(initials, 120, 112, '#fff')}`;
      break;
    case 'monogram':
      body = `
        <circle cx="100" cy="100" r="94" fill="${s}"/>
        <circle cx="100" cy="100" r="84" fill="${p}"/>
        ${initialsText(initials, 104, 120, '#fff')}
        <rect x="70" y="140" width="60" height="4" rx="2" fill="${s}"/>
        <path d="M95 40h10v10h10v10h-10v10H95V60H85V50h10z" fill="${s}"/>`;
      break;
    case 'code':
    default:
      body = `
        <rect x="6" y="6" width="188" height="188" rx="44" fill="${p}"/>
        <path d="M62 52 30 100l32 48" fill="none" stroke="${s}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M138 52l32 48-32 48" fill="none" stroke="${s}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M89 62h22a4 4 0 0 1 4 4v19h19a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4h-19v19a4 4 0 0 1-4 4H89a4 4 0 0 1-4-4v-19H66a4 4 0 0 1-4-4V89a4 4 0 0 1 4-4h19V66a4 4 0 0 1 4-4z" fill="#fff"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="400" height="400">${body}</svg>`;
}

export function svgToDataUrl(svg) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// Find the box around the visible artwork, ignoring transparent and near-white margins.
function contentBox(ctx, w, h) {
  const px = ctx.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = px[i + 3];
      const nearWhite = px[i] > 244 && px[i + 1] > 244 && px[i + 2] > 244;
      if (a > 16 && !nearWhite) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('This image could not be read. Please use a PNG, JPG, SVG or WEBP file.'));
    img.src = src;
  });
}

// Rasterise any image source to a PNG data URL (max side `max` px).
// With `trim`, empty white/transparent space around the artwork is cut away so
// square logo files with big margins still sit at a sensible size in the header.
export async function toPngDataUrl(src, max = 600, { trim = true } = {}) {
  const img = await loadImage(src);
  let w = img.naturalWidth || 1000;
  let h = img.naturalHeight || 1000;
  // Work at a generous size first so trimming keeps detail.
  const work = Math.min(1, 2000 / Math.max(w, h));
  w = Math.max(1, Math.round(w * work));
  h = Math.max(1, Math.round(h * work));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);

  let box = { x: 0, y: 0, w, h };
  if (trim) {
    const found = contentBox(ctx, w, h);
    if (found && found.w * found.h < w * h * 0.92) {
      const pad = Math.round(Math.max(found.w, found.h) * 0.02);
      const x = Math.max(0, found.x - pad);
      const y = Math.max(0, found.y - pad);
      box = { x, y, w: Math.min(w - x, found.w + pad * 2), h: Math.min(h - y, found.h + pad * 2) };
    }
  }
  const k = Math.min(1, max / Math.max(box.w, box.h));
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(box.w * k));
  out.height = Math.max(1, Math.round(box.h * k));
  out.getContext('2d').drawImage(c, box.x, box.y, box.w, box.h, 0, 0, out.width, out.height);
  return out.toDataURL('image/png');
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('The file could not be read.'));
    r.readAsDataURL(file);
  });
}
