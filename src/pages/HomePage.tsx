import { Link } from 'react-router'
import { ArrowRight, ArrowUpRight, BadgeCheck, CircleCheck } from 'lucide-react'
import { Hero } from '../components/hero/Hero'
import { ProductShowcase } from '../components/showcase/ProductShowcase'
import { BuildingSystems } from '../components/visuals/BuildingSystems'
import { ServiceVisual } from '../components/visuals/ServiceVisual'
import { CtaBand, FaqList, SectionIntro, TiltCard } from '../components/ui'
import { amcYear, homeFaqs, industries, introCopy, providerChecklist } from '../content/home'
import { services } from '../content/services'
import { site } from '../config/site'
import { Meta } from '../seo'

export function HomePage() {
  return (
    <>
      <Meta
        title=""
        path="/"
        description="Fire extinguisher sales, refilling and maintenance, AMCs, fire alarm and sprinkler systems, fire safety audits and training for commercial, industrial and residential premises."
      />
      <Hero />

      {/* ——— 2. Introduction & value proposition ——— */}
      <section id="intro" className="relative bg-graphite pb-24 pt-20 lg:pb-32 lg:pt-28" aria-labelledby="intro-title">
        <div className="container-x">
          <p data-reveal className="eyebrow mb-8 flex items-center gap-3">
            <span className="h-px w-8 bg-signal" aria-hidden="true" />
            {introCopy.kicker}
          </p>
          <h2 id="intro-title" data-reveal className="display-tight max-w-5xl text-[clamp(1.75rem,3.8vw,3.4rem)] text-tech">
            {introCopy.statement}
          </h2>
          <p data-reveal className="mt-8 max-w-2xl text-lg leading-relaxed text-tech/65">
            {introCopy.body}
          </p>
          <div className="mt-16 grid border-t border-tech/10 sm:grid-cols-2 lg:mt-24 lg:grid-cols-4">
            {introCopy.pillars.map((p, i) => (
              <div key={p.k} data-reveal className={`border-b border-tech/10 py-8 sm:px-6 lg:border-b-0 ${i > 0 ? 'lg:border-l' : ''} ${i % 2 ? 'sm:border-l' : ''} sm:first:pl-0 lg:first:pl-0`}>
                <p className="meta text-signal">
                  0{i + 1} / {p.k}
                </p>
                <h3 className="mt-5 font-display text-xl font-semibold">{p.t}</h3>
                <p className="mt-3 leading-relaxed text-tech/60">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— 3. Services (light catalogue) ——— */}
      <section id="services" className="relative scroll-mt-16 bg-paper py-24 text-ink lg:py-32" aria-labelledby="services-title">
        <div className="grid-bg-light pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="container-x relative">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <SectionIntro id="services-title" tone="light" kicker="Our solutions" title="Six services. One accountable team." />
            <Link to="/services" className="link-arrow shrink-0 text-ink hover:text-signal-deep">
              View all services <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3">
            {services.map((s) => (
              <li key={s.slug} data-reveal>
                <TiltCard className="group h-full">
                  <Link
                    to={`/services/${s.slug}`}
                    className="relative flex h-full flex-col overflow-hidden bg-ink text-tech shadow-[0_30px_60px_-30px_rgba(17,21,26,0.6)] outline-offset-4"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-graphite">
                      <ServiceVisual visual={s.visual} className="block h-full w-full transition-transform duration-700 ease-[var(--ease-cine)] group-hover:scale-[1.04]" />
                      <div
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        style={{ background: 'radial-gradient(400px circle at var(--mx,50%) var(--my,50%), rgba(240,68,56,0.18), transparent 60%)' }}
                        aria-hidden="true"
                      />
                      <span className="meta absolute left-4 top-4 bg-graphite/80 px-2 py-1 text-tech">{s.index}</span>
                    </div>
                    <div className="flex flex-1 flex-col p-6 lg:p-7">
                      <h3 className="font-display text-xl font-semibold [font-variation-settings:'wdth'_108]">{s.name}</h3>
                      <p className="mt-3 flex-1 leading-relaxed text-tech/65">{s.summary}</p>
                      <span className="link-arrow mt-6 text-tech group-hover:text-signal">
                        Explore <ArrowUpRight size={16} aria-hidden="true" />
                      </span>
                    </div>
                    <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-signal transition-transform duration-500 group-hover:scale-x-100" aria-hidden="true" />
                  </Link>
                </TiltCard>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ——— 4. Interactive product showcase ——— */}
      <ProductShowcase />

      {/* ——— 5. Fire protection systems ——— */}
      <section className="relative bg-graphite py-24 lg:py-32" aria-labelledby="systems-title">
        <div className="container-x">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <SectionIntro
              id="systems-title"
              kicker="Fire protection systems"
              title="Layers that work together."
              body="Detection raises the alarm early. Sprinklers act automatically. Portable extinguishers handle a small fire in its first moments. Clear routes get people out."
            />
            <Link to="/services/fire-alarm-and-sprinkler-systems" className="link-arrow shrink-0 text-tech hover:text-signal">
              Alarm & sprinkler systems <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div data-reveal className="mt-14 border border-tech/10 bg-graphite-2/60 p-4 sm:p-8">
            <BuildingSystems />
          </div>
        </div>
      </section>

      {/* ——— 6. Industries ——— */}
      <section className="relative bg-graphite-2 py-24 lg:py-32" aria-labelledby="industries-title">
        <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.6fr]">
          <SectionIntro
            id="industries-title"
            kicker="Where we work"
            title="Built for the way your premises are used."
            body="Every type of building has its own hazards and occupants. We plan equipment, servicing and training around how your space is actually used."
          />
          <ul className="grid border-t border-tech/10 sm:grid-cols-2">
            {industries.map((ind, i) => (
              <li key={ind.name} data-reveal className={`group border-b border-tech/10 py-6 sm:px-6 ${i % 2 ? 'sm:border-l' : 'sm:pl-0'}`}>
                <p className="flex items-baseline gap-4">
                  <span className="meta text-muted transition-colors group-hover:text-signal">{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-display text-xl font-semibold">{ind.name}</span>
                </p>
                <p className="mt-2 pl-9 text-sm text-tech/55">{ind.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ——— 7. Maintenance & AMC ——— */}
      <section className="relative overflow-hidden bg-graphite py-24 lg:py-32" aria-labelledby="amc-title">
        <div className="pointer-events-none absolute -right-40 top-0 h-[36rem] w-[36rem] rounded-full bg-signal/10 blur-3xl" aria-hidden="true" />
        <div className="container-x relative">
          <SectionIntro
            id="amc-title"
            kicker="Maintenance & AMC"
            title="Plan the year. Not the emergency."
            body="An Annual Maintenance Contract turns scattered call-outs into a schedule: one register, planned visits, refills as they fall due and records kept together."
          />
          <ol className="mt-16 grid gap-px bg-tech/10 sm:grid-cols-2 lg:grid-cols-4">
            {amcYear.map((q, i) => (
              <li key={q.m} data-reveal className="relative bg-graphite p-7 pt-10">
                <span className="absolute left-0 top-0 h-0.5 bg-signal" style={{ width: `${(i + 1) * 25}%` }} aria-hidden="true" />
                <p className="display text-5xl text-tech/15">{q.m}</p>
                <h3 className="mt-6 font-display text-lg font-semibold">{q.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-tech/60">{q.d}</p>
              </li>
            ))}
          </ol>
          <p className="meta mt-4 text-muted">Illustrative schedule — the actual frequency and scope are agreed for each site.</p>
          <div className="mt-12 flex flex-wrap gap-3">
            <Link to="/services/annual-maintenance-contracts" className="btn btn-ghost">
              How an AMC works
            </Link>
            <Link to="/contact?intent=amc" className="btn btn-primary">
              Schedule a Survey <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ——— 8. Trust ——— */}
      <section className="relative bg-paper py-24 text-ink lg:py-32" aria-labelledby="trust-title">
        <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.3fr]">
          {site.credentials.length > 0 ? (
            <>
              <SectionIntro id="trust-title" tone="light" kicker="Credentials" title="Verified and on record." body="Registrations and qualifications held by the company. Reference numbers are shown as printed on each document." />
              <ul className="grid gap-4">
                {site.credentials.map((c) => (
                  <li key={c.title} data-reveal className="flex gap-4 border border-ink/10 bg-white p-6">
                    <BadgeCheck className="mt-0.5 shrink-0 text-signal-deep" aria-hidden="true" />
                    <div>
                      <p className="font-display text-lg font-semibold">{c.title}</p>
                      <p className="mt-1 text-ink/65">{c.issuer}</p>
                      {c.reference && <p className="meta mt-2 text-ink/50">Ref. {c.reference}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <SectionIntro
                id="trust-title"
                tone="light"
                kicker="Choosing a provider"
                title="Questions worth asking any fire safety company."
                body="Fire safety work should be verifiable. These are the questions we expect — and welcome — from every customer."
              />
              <ul className="grid gap-3">
                {providerChecklist.map((t) => (
                  <li key={t} data-reveal className="flex gap-4 border border-ink/10 bg-white p-5">
                    <CircleCheck className="mt-0.5 shrink-0 text-signal-deep" size={20} aria-hidden="true" />
                    <p className="leading-relaxed text-ink/80">{t}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      {/* ——— 9. FAQ ——— */}
      <section className="bg-paper pb-24 text-ink lg:pb-32" aria-labelledby="faq-title">
        <div className="container-x grid gap-12 border-t border-ink/10 pt-24 lg:grid-cols-[1fr_1.6fr] lg:pt-32">
          <SectionIntro id="faq-title" tone="light" kicker="FAQ" title="Common questions." />
          <FaqList items={homeFaqs} tone="light" />
        </div>
      </section>

      {/* ——— 10. Booking CTA ——— */}
      <CtaBand title="Book a service." body="Tell us what is on site and what you need. We will come back with next steps and a clear quotation." />
    </>
  )
}
