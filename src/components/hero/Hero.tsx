import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap'
import { captureMode, hasWebGL, onIdle, prefersLightweight, renderQuality } from '../../lib/env'
import { createHeroBus, HERO_ANNOTATIONS, NARROW, WIDE } from '../../three/heroRig'
import { ErrorBoundary } from '../ErrorBoundary'
import { heroCopy } from '../../content/home'

const HeroScene = lazy(() => import('../../three/HeroScene'))

type Mode = 'pending' | '3d' | 'fallback'

/**
 * Cinematic hero. Server-rendered HTML contains the headline, copy, CTAs and an opening-frame still,
 * so the message is visible before any JavaScript or 3D loads. The WebGL scene is loaded on idle,
 * then fades in at Shot A and dollies to Shot B. Scrolling (pinned, scrubbed) drives Shots C and D.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null)
  const bus = useMemo(createHeroBus, [])
  const [mode, setMode] = useState<Mode>('pending')
  const [ready, setReady] = useState(false)
  const [active, setActive] = useState(true)
  const [quality, setQuality] = useState<'high' | 'low'>('low')
  const startIntro = useRef<() => void>(() => {})
  const capture = useMemo(captureMode, [])

  // Decide between the live scene and the pre-rendered fallback.
  useEffect(() => {
    if (!hasWebGL() || prefersLightweight()) {
      setMode('fallback')
      return
    }
    setQuality(renderQuality())
    return onIdle(() => setMode('3d'), 600)
  }, [])

  // Pause rendering entirely when the hero is off-screen.
  useEffect(() => {
    if (!root.current || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: '100px' })
    io.observe(root.current!)
    return () => io.disconnect()
  }, [])

  bus.onReady = () => {
    setReady(true)
    startIntro.current()
    ;(window as Window & { __heroReady?: boolean }).__heroReady = true
  }

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(
        { wide: '(min-width: 1024px)', narrow: '(max-width: 1023px)', reduce: '(prefers-reduced-motion: reduce)' },
        (ctx) => {
          const { wide, reduce } = ctx.conditions as { wide: boolean; narrow: boolean; reduce: boolean }
          const params = new URLSearchParams(location.search)
          const shot = params.get('shot')
          let poses = wide ? WIDE : NARROW
          // capture utility: centred framing for stills used outside the hero
          if (capture && params.has('center')) {
            poses = Object.fromEntries(Object.entries(poses).map(([k, p]) => [k, { ...p, sx: 0, sy: 0 }])) as typeof poses
          }
          bus.poses = poses
          bus.reducedMotion = reduce || !!shot
          Object.assign(bus.scroll, poses.B)

          // ——— Shot A → B: time-based camera intro (starts once the scene has rendered) ———
          const introTween = gsap.to(bus.intro, { p: 1, duration: 2.6, ease: 'power3.inOut', paused: true })
          if (reduce || shot === 'B' || shot === 'C' || shot === 'D') {
            bus.intro.p = 1
          } else if (shot === 'A') {
            bus.intro.p = 0
          } else {
            bus.intro.p = 0
            startIntro.current = () => introTween.play()
            if (bus.ready) introTween.play()
          }
          if (shot === 'C' || shot === 'D') Object.assign(bus.scroll, poses[shot])

          // ——— Headline entrance (DOM): lines rise from a mask; copy and CTAs follow ———
          if (!reduce && !capture) {
            gsap.from('[data-line]', { yPercent: 108, duration: 1.1, ease: 'expo.out', stagger: 0.09, delay: 0.25 })
            gsap.from('[data-rise]', { y: 18, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.75 })
            gsap.from('[data-chrome]', { autoAlpha: 0, duration: 1.2, ease: 'power2.out', delay: 1.4 })
          }

          if (reduce || capture || shot) return

          // ——— Shots B → C → D: one scrubbed master timeline, pinned for a limited distance ———
          const tl = gsap.timeline({
            defaults: { ease: 'power2.inOut' },
            scrollTrigger: {
              trigger: root.current,
              start: 'top top',
              end: wide ? '+=230%' : '+=170%',
              pin: true,
              scrub: 0.9,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          })
          tl.to(bus.scroll, { ...poses.C, duration: 1 }, 0)
            .to('[data-stage="intro"]', { autoAlpha: 0, y: -48, duration: 0.4, ease: 'power2.in' }, 0.04)
            .fromTo('[data-stage="detail"]', { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 0.62)
            .fromTo('[data-annot]', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18, stagger: 0.1, ease: 'none' }, 0.72)
            .to('[data-annot]', { autoAlpha: 0, duration: 0.16, stagger: 0.03, ease: 'none' }, 1.55)
            .to('[data-stage="detail"]', { autoAlpha: 0, y: -36, duration: 0.3, ease: 'power2.in' }, 1.58)
            .to(bus.scroll, { ...poses.D, duration: 1.15 }, 1.62)
            .fromTo('[data-stage="reveal"]', { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 2.25)
            .fromTo('[data-rail-fill]', { scaleY: 0 }, { scaleY: 1, duration: 2.9, ease: 'none' }, 0)
            .to({}, { duration: 0.25 }, 2.65) // short hold on the final composition before release
          ;['[data-step="1"]', '[data-step="2"]', '[data-step="3"]'].forEach((sel, i) => {
            tl.fromTo(sel, { opacity: 0.35 }, { opacity: 1, duration: 0.15, ease: 'none' }, [0, 0.62, 2.2][i])
            if (i < 2) tl.to(sel, { opacity: 0.35, duration: 0.15, ease: 'none' }, [0.6, 2.18][i])
          })

          return () => {
            introTween.kill()
          }
        },
      )
      return () => mm.revert()
    },
    { scope: root },
  )

  // Fonts and lazy content change layout height; keep trigger positions accurate.
  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
  }, [])

  return (
    <section
      ref={root}
      className="relative isolate h-[100svh] min-h-[600px] w-full overflow-hidden bg-graphite"
      aria-labelledby="hero-title"
      data-hero
      data-mode={mode}
      data-ready={ready}
    >
      {/* ——— Visual layer ——— */}
      <div className="absolute inset-0 -z-10">
        <picture>
          <source media="(max-width: 1023px)" srcSet={mode === 'fallback' ? '/images/hero-b-narrow.webp' : '/images/hero-a-narrow.webp'} />
          <img
            src={mode === 'fallback' ? '/images/hero-b-wide.webp' : '/images/hero-a-wide.webp'}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms]"
            style={{ opacity: ready ? 0 : 1 }}
          />
        </picture>
        {mode === '3d' && (
          <div className="absolute inset-0 transition-opacity duration-[1400ms] ease-out" style={{ opacity: ready ? 1 : 0 }}>
            <ErrorBoundary fallback={null} onError={() => setMode('fallback')}>
              <Suspense fallback={null}>
                <HeroScene bus={bus} quality={quality} active={active} capture={capture} />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}
        {/* legibility gradients — keep type readable without dimming the product */}
        {!capture && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(7,9,12,0.88)_0%,rgba(7,9,12,0.55)_32%,rgba(7,9,12,0)_58%)] max-lg:bg-[linear-gradient(180deg,rgba(7,9,12,0.86)_0%,rgba(7,9,12,0.25)_32%,rgba(7,9,12,0)_50%,rgba(7,9,12,0.3)_68%,rgba(7,9,12,0.92)_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-graphite lg:h-48" />
          </>
        )}
      </div>

      {/* ——— Projected technical annotations (positioned every frame by the scene) ——— */}
      {!capture && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {HERO_ANNOTATIONS.map((a) => (
            <div
              key={a.id}
              data-annot
              className="annot invisible opacity-0 [--len:44px] lg:[--len:118px]"
              ref={(el) => {
                bus.annotationEls[a.id] = el
              }}
            >
              <div className="annot-dot -translate-x-1/2 -translate-y-1/2" />
              <div
                className="absolute left-0 top-0 h-px origin-left bg-tech/60"
                style={{ width: 'var(--len)', transform: `rotate(${Math.atan2(a.dy, a.dx)}rad)` }}
              />
              <div
                className="absolute w-max max-w-[8.5rem] lg:max-w-[15rem]"
                style={{
                  left: `calc(var(--len) * ${(a.dx * Math.SQRT1_2).toFixed(3)} *  1)`,
                  top: `calc(var(--len) * ${(a.dy * Math.SQRT1_2).toFixed(3)})`,
                  transform: `translate(${a.dx < 0 ? '-100%' : '0'}, ${a.dy < 0 ? '-100%' : '0'}) translate(${a.dx < 0 ? '-8px' : '8px'}, ${a.dy < 0 ? '-4px' : '4px'})`,
                  textAlign: a.dx < 0 ? 'right' : 'left',
                }}
              >
                <p className="font-display text-[0.8rem] font-semibold uppercase leading-tight tracking-wide text-tech lg:text-sm">{a.title}</p>
                <p className="meta mt-1 hidden text-muted lg:block">{a.note}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ——— Copy layer ——— */}
      {!capture && (
        <div className="container-x relative flex h-full flex-col pb-8 pt-24 lg:justify-center lg:pb-0 lg:pt-20">
          {/* Stage 1 — headline and calls to action */}
          <div data-stage="intro" className="flex h-full flex-col lg:block lg:h-auto lg:max-w-[46rem]">
            <p data-rise className="eyebrow mb-4 flex items-center gap-3 max-sm:text-[0.62rem] max-sm:tracking-[0.12em] lg:mb-7">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-signal" aria-hidden="true" />
              {heroCopy.eyebrow}
            </p>
            <h1 id="hero-title" className="display text-[clamp(1.95rem,10.2vw,5rem)] lg:text-[clamp(3.4rem,5.6vw,6.3rem)]">
              {heroCopy.titleLines.map((line, i) => (
                <span key={i} className="block overflow-hidden pb-[0.06em]">
                  <span data-line className={`block ${i === heroCopy.titleLines.length - 1 ? 'text-signal' : ''}`}>
                    {line}
                  </span>
                </span>
              ))}
            </h1>
            <div className="mt-auto lg:mt-0">
              <p data-rise className="mt-5 max-w-[34rem] text-[0.98rem] leading-relaxed text-tech/80 max-lg:[@media(max-height:700px)]:text-[0.88rem] max-lg:[@media(max-height:700px)]:leading-snug lg:mt-8 lg:text-lg">
                {heroCopy.lede}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3 lg:mt-10">
                <Link data-rise to="/contact?intent=booking" className="btn btn-primary max-xs:w-full">
                  {heroCopy.primaryCta}
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <a data-rise href="#services" className="btn btn-ghost max-xs:flex-1 max-lg:[@media(max-height:700px)]:hidden">
                  {heroCopy.secondaryCta}
                </a>
                <Link data-rise to="/contact?intent=quote" className="link-arrow ml-1 py-3 text-tech/80 hover:text-tech max-sm:hidden">
                  {heroCopy.tertiaryCta}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>

          {/* Stage 2 — detail shot caption */}
          <div data-stage="detail" className="invisible absolute inset-x-0 top-24 opacity-0 lg:top-auto lg:bottom-[14vh]" aria-hidden="true">
            <div className="container-x">
              <p className="eyebrow mb-3 text-lime">02 — Detail</p>
              <p className="display-tight max-w-[22rem] text-[clamp(1.6rem,6vw,2.1rem)] uppercase lg:max-w-[30rem] lg:text-[clamp(2rem,3vw,3rem)]">
                {heroCopy.detailTitle}
              </p>
              <p className="mt-3 hidden max-w-[26rem] text-tech/70 lg:block">{heroCopy.detailBody}</p>
            </div>
          </div>

          {/* Stage 3 — full reveal hand-off */}
          <div data-stage="reveal" className="invisible absolute inset-x-0 bottom-10 opacity-0 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2" aria-hidden="true">
            <div className="container-x flex justify-start lg:justify-end">
              <div className="max-w-[30rem] lg:text-right">
                <p className="eyebrow mb-3 text-lime">03 — Ready</p>
                <p className="display-tight text-[clamp(1.8rem,7vw,2.4rem)] uppercase lg:text-[clamp(2.2rem,3.6vw,3.6rem)]">{heroCopy.revealTitle}</p>
                <p className="mt-3 text-tech/70">{heroCopy.revealBody}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ——— Scroll progress rail (desktop) ——— */}
      {!capture && (
        <div data-chrome className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 items-stretch gap-4 xl:flex" aria-hidden="true">
          <div className="relative w-px bg-tech/15">
            <div data-rail-fill className="absolute inset-0 origin-top scale-y-0 bg-signal" />
          </div>
          <ol className="meta flex flex-col justify-between gap-16 py-1 text-tech">
            <li data-step="1">01 Product</li>
            <li data-step="2" className="opacity-35">02 Detail</li>
            <li data-step="3" className="opacity-35">03 Ready</li>
          </ol>
        </div>
      )}
      {!capture && (
        <a
          data-chrome
          href="#intro"
          className="meta absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-tech/60 hover:text-tech lg:flex"
        >
          Scroll to explore <ArrowDown size={14} aria-hidden="true" />
        </a>
      )}
      <noscript>
        <img src="/images/hero-b-wide.webp" alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      </noscript>
    </section>
  )
}
