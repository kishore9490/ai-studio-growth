import { useEffect, useRef, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { ArrowRight, MessageCircle, Phone, Plus } from 'lucide-react'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { prefersReducedMotion } from '../lib/env'
import { hasPhone, hasWhatsApp, site, telHref, whatsappHref } from '../config/site'

export function SectionIntro({
  kicker,
  title,
  body,
  tone = 'dark',
  className = '',
  id,
}: {
  kicker: string
  title: ReactNode
  body?: ReactNode
  tone?: 'dark' | 'light'
  className?: string
  id?: string
}) {
  return (
    <div className={`max-w-3xl ${className}`}>
      <p data-reveal className={`eyebrow mb-5 flex items-center gap-3 ${tone === 'light' ? '!text-ink/60' : ''}`}>
        <span className="h-px w-8 bg-signal" aria-hidden="true" />
        {kicker}
      </p>
      <h2 id={id} data-reveal className="display-tight text-[clamp(2rem,4.6vw,3.75rem)] uppercase">
        {title}
      </h2>
      {body && (
        <p data-reveal className={`mt-6 max-w-2xl text-lg leading-relaxed ${tone === 'light' ? 'text-ink/70' : 'text-tech/70'}`}>
          {body}
        </p>
      )}
    </div>
  )
}

export function FaqList({ items, tone = 'dark' }: { items: { q: string; a: string }[]; tone?: 'dark' | 'light' }) {
  const line = tone === 'light' ? 'border-ink/15' : 'border-tech/12'
  return (
    <div className={`border-t ${line}`}>
      {items.map((f) => (
        <details key={f.q} data-reveal className={`group border-b ${line}`}>
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
            <span className="font-display text-lg font-semibold leading-snug sm:text-xl">{f.q}</span>
            <Plus size={22} className="mt-1 shrink-0 text-signal transition-transform duration-300 group-open:rotate-45" aria-hidden="true" />
          </summary>
          <p className={`max-w-3xl pb-7 leading-relaxed ${tone === 'light' ? 'text-ink/70' : 'text-tech/70'}`}>{f.a}</p>
        </details>
      ))}
    </div>
  )
}

export function CtaBand({
  title,
  body,
  primary = { to: '/contact?intent=booking', label: 'Book a Service' },
  secondary = { to: '/contact?intent=quote', label: 'Request a Quote' },
}: {
  title: string
  body: string
  primary?: { to: string; label: string }
  secondary?: { to: string; label: string } | null
}) {
  return (
    <section className="relative overflow-hidden bg-signal-deep">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_85%_0%,#F04438_0%,rgba(168,23,32,0)_55%)]" aria-hidden="true" />
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="container-x relative grid gap-10 py-20 lg:grid-cols-[1.4fr_1fr] lg:items-end lg:py-28">
        <div>
          <h2 data-reveal className="display text-[clamp(2.2rem,6vw,5rem)]">
            {title}
          </h2>
          <p data-reveal className="mt-6 max-w-xl text-lg text-white/80">
            {body}
          </p>
        </div>
        <div data-reveal className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
          <Link to={primary.to} className="btn btn-dark">
            {primary.label} <ArrowRight size={18} aria-hidden="true" />
          </Link>
          {secondary && (
            <Link to={secondary.to} className="btn border border-white/40 text-white hover:bg-white/10">
              {secondary.label}
            </Link>
          )}
          {(hasPhone() || hasWhatsApp()) && (
            <div className="flex gap-3">
              {hasPhone() && (
                <a href={telHref()} className="btn flex-1 border border-white/40 text-white hover:bg-white/10">
                  <Phone size={16} aria-hidden="true" /> Call
                </a>
              )}
              {hasWhatsApp() && (
                <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="btn flex-1 border border-white/40 text-white hover:bg-white/10">
                  <MessageCircle size={16} aria-hidden="true" /> WhatsApp
                </a>
              )}
            </div>
          )}
          <p className="sr-only">{site.name}</p>
        </div>
      </div>
    </section>
  )
}

/**
 * Subtle perspective tilt that follows a mouse/pen pointer. Touch input is ignored, so on touchscreens
 * the card behaves as a normal link (tap = navigate) with no hover-only content.
 */
export function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    const qx = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3.out' })
    const qy = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3.out' })
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      qx(x * 7)
      qy(-y * 7)
      el.style.setProperty('--mx', `${(x + 0.5) * 100}%`)
      el.style.setProperty('--my', `${(y + 0.5) * 100}%`)
    }
    const leave = () => {
      qx(0)
      qy(0)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [])
  return (
    <div className="[perspective:1200px]">
      <div ref={ref} className={`relative [transform-style:preserve-3d] ${className}`}>
        {children}
      </div>
    </div>
  )
}

/** Batched entrance animation for every [data-reveal] element on the current route. */
export function useReveal() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (prefersReducedMotion()) return
    const els = gsap.utils.toArray<HTMLElement>('main [data-reveal]').filter((el) => el.getBoundingClientRect().top > window.innerHeight * 0.9)
    if (!els.length) return
    gsap.set(els, { autoAlpha: 0, y: 28 })
    const triggers = ScrollTrigger.batch(els, {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, overwrite: true }),
    })
    return () => {
      triggers.forEach((st) => st.kill())
      gsap.set(els, { clearProps: 'opacity,visibility,transform' })
    }
  }, [pathname])
}
