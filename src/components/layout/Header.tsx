import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { ArrowRight, ChevronDown, Menu, Phone, X } from 'lucide-react'
import { hasPhone, site, telHref } from '../../config/site'
import { services } from '../../content/services'
import { Logo } from './Logo'

export function Header() {
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)
  const [svcOpen, setSvcOpen] = useState(false)
  const location = useLocation()
  const svcRef = useRef<HTMLDivElement>(null)
  const menuBtn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menus on navigation.
  useEffect(() => {
    setOpen(false)
    setSvcOpen(false)
  }, [location.pathname, location.search])

  // Mobile drawer: lock page scroll, close on Escape, return focus.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      menuBtn.current?.focus()
    }
  }, [open])

  // Desktop services menu: close on outside click / Escape.
  useEffect(() => {
    if (!svcOpen) return
    const onDown = (e: PointerEvent) => !svcRef.current?.contains(e.target as Node) && setSvcOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSvcOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [svcOpen])

  const navLink = 'font-display text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-tech/75 transition-colors hover:text-tech aria-[current=page]:text-tech'

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
        solid || open ? 'border-b border-tech/10 bg-graphite/85 backdrop-blur-md' : 'border-b border-transparent'
      }`}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:bg-signal focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <div className="container-x flex h-16 items-center justify-between gap-6 lg:h-[4.5rem]">
        <Link to="/" className="shrink-0" aria-label={`${site.name} home`}>
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-9 lg:flex">
          <div ref={svcRef} className="relative">
            <button
              type="button"
              className={`${navLink} flex items-center gap-1.5`}
              aria-expanded={svcOpen}
              aria-controls="services-menu"
              onClick={() => setSvcOpen((v) => !v)}
            >
              Services <ChevronDown size={14} className={`transition-transform ${svcOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            <div
              id="services-menu"
              hidden={!svcOpen}
              className="absolute left-1/2 top-full mt-5 w-[34rem] -translate-x-1/2 border border-tech/10 bg-graphite-2/95 p-3 shadow-2xl shadow-black/60 backdrop-blur-md"
            >
              <ul className="grid grid-cols-2 gap-1">
                {services.map((s) => (
                  <li key={s.slug}>
                    <Link to={`/services/${s.slug}`} className="group flex items-start gap-3 p-3 transition-colors hover:bg-tech/5">
                      <span className="meta pt-0.5 text-signal">{s.index}</span>
                      <span>
                        <span className="block font-display text-sm font-semibold text-tech">{s.name}</span>
                        <span className="mt-1 block text-xs leading-snug text-muted">{s.summary}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to="/services" className="link-arrow mt-2 flex border-t border-tech/10 px-3 pb-1 pt-3 text-tech/80 hover:text-tech">
                All services <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <NavLink to="/about" className={navLink}>
            About
          </NavLink>
          <NavLink to="/contact" className={navLink}>
            Contact
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          {hasPhone() && (
            <a href={telHref()} className="btn btn-ghost hidden !min-h-10 !px-3 xl:inline-flex" aria-label={`Call ${site.contact.phoneDisplay || site.contact.phone}`}>
              <Phone size={16} aria-hidden="true" />
              <span className="normal-case tracking-normal">{site.contact.phoneDisplay || site.contact.phone}</span>
            </a>
          )}
          <Link to="/contact?intent=booking" className="btn btn-primary !min-h-10 !px-4 max-sm:hidden">
            Book a Service
          </Link>
          <button
            ref={menuBtn}
            type="button"
            className="grid h-11 w-11 place-items-center text-tech lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ——— Mobile drawer ——— */}
      <div id="mobile-menu" hidden={!open} className="h-[calc(100dvh-4rem)] overflow-y-auto bg-graphite lg:hidden">
        <nav aria-label="Mobile" className="container-x flex min-h-full flex-col pb-10 pt-6">
          <p className="eyebrow mb-3">Services</p>
          <ul className="divide-y divide-tech/10 border-y border-tech/10">
            {services.map((s) => (
              <li key={s.slug}>
                <Link to={`/services/${s.slug}`} className="flex items-center gap-4 py-4">
                  <span className="meta text-signal">{s.index}</span>
                  <span className="font-display text-lg font-semibold">{s.name}</span>
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-6 space-y-1">
            {[
              ['/services', 'All services'],
              ['/about', 'About'],
              ['/contact', 'Contact'],
            ].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="display-tight block py-2 text-3xl uppercase">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto grid gap-3 pt-10">
            <Link to="/contact?intent=booking" className="btn btn-primary w-full">
              Book a Service
            </Link>
            <Link to="/contact?intent=quote" className="btn btn-ghost w-full">
              Request a Quote
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
