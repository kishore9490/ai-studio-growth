import { Link } from 'react-router'
import { BadgeCheck, ClipboardList, FileCheck2, MapPin, Wrench, Users } from 'lucide-react'
import { site } from '../config/site'
import { services } from '../content/services'
import { CtaBand, SectionIntro } from '../components/ui'
import { Meta } from '../seo'

const principles = [
  { t: 'Assess before we sell', d: 'Recommendations follow the hazards and layout of your premises — not a standard package.' },
  { t: 'Show the work', d: 'Every service leaves a record: what was checked, what was done and what is due next.' },
  { t: 'Explain plainly', d: 'Clear reasons for every recommendation, and a written scope before any contract starts.' },
  { t: 'Respect the limits', d: 'We are clear about what an audit, a service or a training session does — and what only the fire authority can approve.' },
]

const capabilities = [
  { icon: ClipboardList, t: 'Site surveys', d: 'Walk-throughs to understand layout, occupancy, hazards and existing equipment.' },
  { icon: Wrench, t: 'Servicing & recharge', d: 'Inspection, refilling and testing of portable extinguishers.' },
  { icon: FileCheck2, t: 'Systems work', d: 'Installation, testing and maintenance of fire alarm and sprinkler systems.' },
  { icon: Users, t: 'Training delivery', d: 'Practical sessions for staff, fire wardens and residents.' },
]

export function AboutPage() {
  return (
    <>
      <Meta
        title="About Us"
        path="/about"
        description={`About ${site.name}: fire protection supply, servicing, systems, audits and training — and how we approach every site.`}
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about' },
        ]}
      />
      <section className="relative overflow-hidden bg-graphite pb-20 pt-32 lg:pb-28 lg:pt-44" aria-labelledby="about-h1">
        <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:linear-gradient(180deg,#000,transparent)]" aria-hidden="true" />
        <div className="container-x relative">
          <p className="eyebrow mb-6 flex items-center gap-3">
            <span className="h-px w-8 bg-signal" aria-hidden="true" /> About {site.name}
          </p>
          <h1 id="about-h1" className="display max-w-5xl text-[clamp(2.5rem,7vw,6rem)]">
            Ready is a <span className="text-signal">discipline.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-tech/70">
            {site.name} provides fire protection services for commercial, industrial and residential premises: supplying the right equipment, keeping it serviced,
            installing and maintaining detection and sprinkler systems, auditing sites and training the people who work in them.
          </p>
        </div>
      </section>

      <section className="bg-paper py-20 text-ink lg:py-28" aria-labelledby="approach-title">
        <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.5fr]">
          <SectionIntro id="approach-title" tone="light" kicker="Mission & approach" title="Equipment that works. People who know what to do." />
          <ol className="grid gap-px bg-ink/10 sm:grid-cols-2">
            {principles.map((p, i) => (
              <li key={p.t} data-reveal className="bg-paper p-7">
                <p className="meta text-signal-deep">0{i + 1}</p>
                <h3 className="mt-4 font-display text-xl font-semibold">{p.t}</h3>
                <p className="mt-3 leading-relaxed text-ink/65">{p.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-graphite py-20 lg:py-28" aria-labelledby="capabilities-title">
        <div className="container-x">
          <SectionIntro id="capabilities-title" kicker="Operational capabilities" title="What we do on site." />
          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map(({ icon: Icon, t, d }) => (
              <li key={t} data-reveal className="border border-tech/10 p-7">
                <Icon className="text-signal" aria-hidden="true" />
                <h3 className="mt-6 font-display text-lg font-semibold">{t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-tech/60">{d}</p>
              </li>
            ))}
          </ul>
          <div className="mt-12 flex flex-wrap gap-2">
            {services.map((s) => (
              <Link key={s.slug} to={`/services/${s.slug}`} className="meta border border-tech/15 px-3 py-2 text-tech/70 hover:border-tech/40 hover:text-tech">
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-graphite-2 py-20 lg:py-28" aria-labelledby="coverage-title">
        <div className="container-x grid gap-14 lg:grid-cols-2">
          <div>
            <SectionIntro id="coverage-title" kicker="Service coverage" title="Where we work." />
            {site.serviceAreas.length > 0 ? (
              <ul className="mt-10 flex flex-wrap gap-2">
                {site.serviceAreas.map((a) => (
                  <li key={a} className="flex items-center gap-2 border border-tech/15 px-4 py-2">
                    <MapPin size={14} className="text-signal" aria-hidden="true" /> {a}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-8 max-w-lg leading-relaxed text-tech/65">
                Tell us where your premises are when you get in touch and we will confirm whether we can serve the location.
              </p>
            )}
          </div>
          <div>
            <SectionIntro kicker="Qualifications & credentials" title="On record." />
            {site.credentials.length > 0 ? (
              <ul className="mt-10 grid gap-3">
                {site.credentials.map((c) => (
                  <li key={c.title} className="flex gap-4 border border-tech/10 p-5">
                    <BadgeCheck className="shrink-0 text-signal" aria-hidden="true" />
                    <span>
                      <span className="block font-semibold">{c.title}</span>
                      <span className="text-sm text-tech/60">{c.issuer}</span>
                      {c.reference && <span className="meta mt-1 block text-muted">Ref. {c.reference}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-8 max-w-lg leading-relaxed text-tech/65">
                Details of registrations and qualifications are available on request. Ask us for copies when you request a quotation.
              </p>
            )}
          </div>
        </div>
      </section>

      <CtaBand title="Let’s look at your site." body="Share a few details and we will suggest a sensible next step." secondary={{ to: '/services', label: 'Explore Services' }} />
    </>
  )
}
