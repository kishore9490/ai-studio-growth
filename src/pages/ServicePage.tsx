import { Link, useParams } from 'react-router'
import { ArrowRight, ChevronRight, Info } from 'lucide-react'
import { serviceBySlug, services } from '../content/services'
import { ServiceVisual } from '../components/visuals/ServiceVisual'
import { CtaBand, FaqList, SectionIntro } from '../components/ui'
import { Meta } from '../seo'
import { NotFoundPage } from './NotFoundPage'

export function ServicePage() {
  const { slug = '' } = useParams()
  const s = serviceBySlug(slug)
  if (!s) return <NotFoundPage />
  const i = services.indexOf(s)
  const photo = s.visual === 'product' || s.visual === 'gauge'
  const flip = i % 2 === 1
  const related = [services[(i + 1) % services.length], services[(i + 2) % services.length]]
  const path = `/services/${s.slug}`
  const intent = s.slug === 'annual-maintenance-contracts' ? 'amc' : s.slug === 'fire-safety-audits' ? 'inspection' : 'booking'

  return (
    <>
      <Meta
        title={s.meta.title}
        description={s.meta.description}
        path={path}
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Services', path: '/services' },
          { name: s.name, path },
        ]}
      />

      {/* ——— Visual introduction ——— */}
      <section className="relative overflow-hidden bg-graphite pt-16 lg:pt-[4.5rem]" aria-labelledby="svc-title">
        <span
          className="display pointer-events-none absolute -bottom-[0.18em] select-none text-[clamp(10rem,32vw,30rem)] leading-none text-tech/[0.03] max-lg:hidden"
          style={flip ? { left: '-0.04em' } : { right: '-0.04em' }}
          aria-hidden="true"
        >
          {s.index}
        </span>
        <div className={`container-x relative grid gap-10 py-12 lg:min-h-[78vh] lg:items-center lg:gap-16 lg:py-20 ${flip ? 'lg:grid-cols-[1.05fr_1fr]' : 'lg:grid-cols-[1fr_1.05fr]'}`}>
          <div className={flip ? 'lg:order-2' : ''}>
            <nav aria-label="Breadcrumb" className="meta mb-10 text-muted">
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <Link to="/" className="hover:text-tech">Home</Link>
                </li>
                <ChevronRight size={12} aria-hidden="true" />
                <li>
                  <Link to="/services" className="hover:text-tech">Services</Link>
                </li>
                <ChevronRight size={12} aria-hidden="true" />
                <li aria-current="page" className="text-tech">{s.short}</li>
              </ol>
            </nav>
            <p className="eyebrow mb-5 flex items-center gap-3">
              <span className="text-signal">{s.index}</span>
              <span className="h-px w-8 bg-signal" aria-hidden="true" />
              {s.hero.kicker}
            </p>
            <h1 id="svc-title" className="display text-[clamp(2.3rem,6.2vw,5.4rem)]">
              {s.hero.title}
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-tech/70">{s.hero.intro}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to={`/contact?intent=${intent}&service=${s.slug}`} className="btn btn-primary">
                {s.cta.label} <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a href="#process" className="btn btn-ghost">
                How it works
              </a>
            </div>
          </div>
          <div className={`relative ${flip ? 'lg:order-1' : ''}`}>
            <div className={`relative overflow-hidden border border-tech/10 ${photo ? 'aspect-[4/3] lg:aspect-[5/6]' : 'aspect-[4/3] bg-graphite-2 p-6 sm:p-10'}`}>
              <ServiceVisual visual={s.visual} priority className={photo ? 'block h-full w-full' : 'block h-full w-full'} />
              {photo && <p className="meta absolute bottom-3 right-3 text-tech/50">Rendered illustration</p>}
            </div>
            <div className={`absolute -bottom-px h-1 w-1/3 bg-signal ${flip ? 'right-0' : 'left-0'}`} aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* ——— The problem ——— */}
      <section className="bg-paper py-20 text-ink lg:py-28" aria-labelledby="problem-title">
        <div className="container-x grid gap-12 lg:grid-cols-[1.1fr_1fr]">
          <SectionIntro id="problem-title" tone="light" kicker="The problem" title={s.problem.title} body={s.problem.body} />
          <ul className="self-end border-t border-ink/15">
            {s.problem.points.map((p, k) => (
              <li key={p} data-reveal className="flex gap-5 border-b border-ink/15 py-5">
                <span className="meta pt-1 text-signal-deep">{String(k + 1).padStart(2, '0')}</span>
                <span className="text-lg leading-snug">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ——— What we do ——— */}
      <section className="bg-graphite py-20 lg:py-28" aria-labelledby="offer-title">
        <div className="container-x">
          <SectionIntro id="offer-title" kicker="What we do" title={s.offer.title} />
          <ul className="mt-14 grid gap-px bg-tech/10 sm:grid-cols-2 lg:grid-cols-3">
            {s.offer.items.map((o) => (
              <li key={o.title} data-reveal className="bg-graphite p-7 transition-colors hover:bg-graphite-2">
                <span className="mb-6 block h-2 w-2 bg-signal" aria-hidden="true" />
                <h3 className="font-display text-lg font-semibold">{o.title}</h3>
                <p className="mt-3 leading-relaxed text-tech/60">{o.body}</p>
              </li>
            ))}
          </ul>
          {s.note && (
            <p data-reveal className="mt-8 flex max-w-3xl gap-3 border-l-2 border-lime/70 pl-4 text-sm leading-relaxed text-tech/65">
              <Info size={18} className="mt-0.5 shrink-0 text-lime" aria-hidden="true" />
              {s.note}
            </p>
          )}
        </div>
      </section>

      {/* ——— Process ——— */}
      <section id="process" className="scroll-mt-20 bg-graphite-2 py-20 lg:py-28" aria-labelledby="process-title">
        <div className="container-x">
          <SectionIntro id="process-title" kicker="The process" title="How it works." />
          <ol className="relative mt-14 grid gap-10 lg:grid-cols-4 lg:gap-6">
            <span className="absolute left-0 right-0 top-[1.15rem] hidden h-px bg-tech/15 lg:block" aria-hidden="true" />
            {s.process.map((p, k) => (
              <li key={p.title} data-reveal className="relative">
                <span className="relative z-10 grid h-9 w-9 place-items-center border border-signal bg-graphite-2 font-mono text-xs text-signal">{k + 1}</span>
                <h3 className="mt-6 font-display text-xl font-semibold">{p.title}</h3>
                <p className="mt-3 leading-relaxed text-tech/60">{p.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ——— FAQs ——— */}
      <section className="bg-paper py-20 text-ink lg:py-28" aria-labelledby="svc-faq-title">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <SectionIntro id="svc-faq-title" tone="light" kicker="FAQ" title={`${s.short}: questions`} />
          <FaqList items={s.faqs} tone="light" />
        </div>
      </section>

      <CtaBand
        title={s.cta.title}
        body={s.cta.body}
        primary={{ to: `/contact?intent=${intent}&service=${s.slug}`, label: s.cta.label }}
        secondary={{ to: `/contact?intent=quote&service=${s.slug}`, label: 'Request a Quote' }}
      />

      {/* ——— Related ——— */}
      <section className="bg-graphite py-16" aria-label="Related services">
        <div className="container-x grid gap-4 sm:grid-cols-2">
          {related.map((r) => (
            <Link key={r.slug} to={`/services/${r.slug}`} className="group flex items-center justify-between gap-6 border border-tech/10 p-6 transition-colors hover:border-tech/30">
              <span>
                <span className="meta text-signal">{r.index}</span>
                <span className="mt-2 block font-display text-xl font-semibold">{r.name}</span>
              </span>
              <ArrowRight className="shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
