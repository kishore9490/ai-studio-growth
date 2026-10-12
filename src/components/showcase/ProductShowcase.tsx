import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { RotateCcw, RotateCw, X } from 'lucide-react'
import type { PartId } from '../../three/Extinguisher'
import type { ShowcaseBus } from '../../three/ShowcaseScene'
import { hasWebGL, prefersReducedMotion, renderQuality } from '../../lib/env'
import { ErrorBoundary } from '../ErrorBoundary'
import { SectionIntro } from '../ui'

const ShowcaseScene = lazy(() => import('../../three/ShowcaseScene'))

const PARTS: { id: PartId; name: string; body: string }[] = [
  {
    id: 'gauge',
    name: 'Pressure gauge',
    body: 'Indicates whether a stored-pressure extinguisher is pressurised. During inspection the needle is compared with the manufacturer’s markings. A reading in range does not, on its own, confirm the unit is serviceable.',
  },
  {
    id: 'pin',
    name: 'Safety pin & tamper seal',
    body: 'The pin stops the lever being squeezed accidentally. A broken or missing seal suggests the unit may have been used or tampered with, so it should be inspected.',
  },
  {
    id: 'lever',
    name: 'Handle & operating lever',
    body: 'The unit is carried by the lower handle. Squeezing the lever towards it opens the valve and releases the agent. Follow the operating instructions printed on the label.',
  },
  {
    id: 'hose',
    name: 'Discharge hose & nozzle',
    body: 'Directs the agent at the base of the fire. Checked at every service for cracks, perishing, loose fittings and blockages.',
  },
  {
    id: 'body',
    name: 'Cylinder & label',
    body: 'The label shows the agent, the fire classes it is rated for and the operating instructions. The shell is inspected for corrosion and damage, and pressure-tested at set intervals.',
  },
]

export function ProductShowcase() {
  const wrap = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<PartId | null>(null)
  const [mount, setMount] = useState(false)
  const [webgl, setWebgl] = useState<boolean | null>(null)
  const [active, setActive] = useState(false)
  const [ready, setReady] = useState(false)
  const quality = useMemo(() => (typeof window === 'undefined' ? 'low' : renderQuality()), [])
  const bus = useMemo<ShowcaseBus>(() => ({ selected: null, drag: 0, reducedMotion: false, markerEls: {} }), [])
  bus.selected = selected
  bus.onReady = () => setReady(true)

  useEffect(() => {
    bus.reducedMotion = prefersReducedMotion()
    setWebgl(hasWebGL())
    const el = wrap.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        setActive(e.isIntersecting)
        if (e.isIntersecting) setMount(true)
      },
      { rootMargin: '300px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [bus])

  // Drag to rotate (mouse/pen/touch). `touch-action: pan-y` keeps vertical page scrolling on touchscreens.
  useEffect(() => {
    const el = stage.current
    if (!el) return
    let x0: number | null = null
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('button')) return
      x0 = e.clientX
    }
    const move = (e: PointerEvent) => {
      if (x0 === null) return
      bus.drag += (e.clientX - x0) * 0.012
      x0 = e.clientX
    }
    const up = () => (x0 = null)
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [bus])

  const select = (id: PartId | null) => {
    bus.drag = 0
    setSelected((cur) => (cur === id ? null : id))
  }
  const part = PARTS.find((p) => p.id === selected)
  const show3d = webgl === true

  return (
    <section ref={wrap} className="relative overflow-hidden bg-graphite-2 py-24 lg:py-32" aria-labelledby="showcase-title">
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:items-center">
          <div>
            <SectionIntro
              id="showcase-title"
              kicker="Inside the extinguisher"
              title={<>Know what you are looking at.</>}
              body="Select a component to see what it does and what is checked during servicing. Drag the model to turn it."
            />
            <ul className="mt-10 grid gap-2" aria-label="Extinguisher components">
              {PARTS.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => select(p.id)}
                    aria-pressed={selected === p.id}
                    aria-controls="part-info"
                    className="group flex w-full items-center gap-4 border border-tech/10 px-4 py-3.5 text-left transition-colors hover:border-tech/30 aria-pressed:border-signal aria-pressed:bg-signal/10"
                  >
                    <span className="meta text-muted group-aria-pressed:text-signal">0{i + 1}</span>
                    <span className="font-display font-semibold">{p.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div
              ref={stage}
              className="relative aspect-[4/5] w-full touch-pan-y select-none overflow-hidden border border-tech/10 bg-[#12161c] sm:aspect-[5/4] lg:aspect-[4/3.6]"
            >
              {/* static render until (or instead of) the live scene */}
              <img
                src="/images/render-product-800.webp"
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
                style={{ opacity: show3d && ready ? 0 : 1 }}
              />
              {show3d && mount && (
                <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: ready ? 1 : 0 }}>
                  <ErrorBoundary fallback={null} onError={() => setWebgl(false)}>
                    <Suspense fallback={null}>
                      <ShowcaseScene bus={bus} active={active} quality={quality} selected={selected} />
                    </Suspense>
                  </ErrorBoundary>
                </div>
              )}
              {show3d &&
                ready &&
                PARTS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="hotspot"
                    aria-pressed={selected === p.id}
                    aria-label={`Show details: ${p.name}`}
                    onClick={() => select(p.id)}
                    ref={(el) => {
                      bus.markerEls[p.id] = el
                    }}
                    style={{ visibility: 'hidden' }}
                  >
                    <span />
                  </button>
                ))}
              {show3d && ready && (
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <button type="button" className="grid h-11 w-11 place-items-center border border-tech/20 bg-graphite/70 hover:border-tech/50" aria-label="Rotate left" onClick={() => (bus.drag -= 0.6)}>
                    <RotateCcw size={18} aria-hidden="true" />
                  </button>
                  <button type="button" className="grid h-11 w-11 place-items-center border border-tech/20 bg-graphite/70 hover:border-tech/50" aria-label="Rotate right" onClick={() => (bus.drag += 0.6)}>
                    <RotateCw size={18} aria-hidden="true" />
                  </button>
                </div>
              )}
              <p className="meta pointer-events-none absolute right-3 top-3 text-tech/50">Illustrative model</p>
            </div>

            <div id="part-info" aria-live="polite" className="mt-4 min-h-[8.5rem] border-l-2 border-signal bg-graphite/40 p-5">
              {part ? (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-lg font-semibold">{part.name}</p>
                    <p className="mt-2 leading-relaxed text-tech/75">{part.body}</p>
                  </div>
                  <button type="button" onClick={() => setSelected(null)} className="grid h-10 w-10 shrink-0 place-items-center text-tech/70 hover:text-tech" aria-label="Close component details">
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <p className="text-tech/60">
                  Choose a component from the list{show3d ? ' or tap a marker on the model' : ''}. These notes are general guidance — they do not replace the manufacturer’s instructions or hands-on training.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
