/** Client capability detection. All functions are SSR-safe (return conservative defaults on the server). */

export const isBrowser = typeof window !== 'undefined'

export function prefersReducedMotion() {
  return isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

let webglCache: boolean | null = null
export function hasWebGL() {
  if (!isBrowser) return false
  if (webglCache !== null) return webglCache
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2') || c.getContext('webgl')
    webglCache = !!gl
    // release the probe context immediately
    ;(gl as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webglCache = false
  }
  return webglCache
}

/** Rendering tier: 'low' for touch-first / small / low-core devices, 'high' otherwise. */
export function renderQuality(): 'high' | 'low' {
  if (!isBrowser) return 'low'
  const forced = new URLSearchParams(location.search).get('quality')
  if (forced === 'high' || forced === 'low') return forced
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const small = window.innerWidth < 900
  const cores = navigator.hardwareConcurrency || 4
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  if (coarse || small || cores <= 4 || mem <= 4) return 'low'
  return 'high'
}

/** Slow connections (Save-Data or 2G/3G) get the pre-rendered still instead of the 3D scene. */
export function prefersLightweight() {
  if (!isBrowser) return false
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  return !!c && (c.saveData === true || /(^|-)2g|3g/.test(c.effectiveType || ''))
}

export function captureMode() {
  return isBrowser && new URLSearchParams(location.search).has('capture')
}

export function onIdle(cb: () => void, timeout = 1200) {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void }
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(cb, { timeout })
    return () => w.cancelIdleCallback?.(id)
  }
  const id = window.setTimeout(cb, 200)
  return () => window.clearTimeout(id)
}
