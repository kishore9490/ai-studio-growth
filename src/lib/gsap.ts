import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP)
  // Avoid re-layout jumps when the mobile URL bar shows/hides.
  ScrollTrigger.config({ ignoreMobileResize: true })
  // Keep animation time tied to real time. With default lag smoothing, a struggling GPU (long frames)
  // makes the camera intro crawl for many seconds and lag behind the scroll position.
  gsap.ticker.lagSmoothing(0)
}

export { gsap, ScrollTrigger, useGSAP }
