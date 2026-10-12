import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { services } from '../content/services'
import { ServiceVisual } from '../components/visuals/ServiceVisual'
import { CtaBand } from '../components/ui'
import { Meta } from '../seo'

export function ServicesPage() {
  return (
    <>
      <Meta
        title="Fire Safety Services"
        path="/services"
        description="Fire extinguisher sales, refilling and maintenance, AMCs, fire alarm and sprinkler systems, fire safety audits and training."
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Services', path: '/services' },
        ]}
      />
      <section className="bg-graphite pb-16 pt-32 lg:pb-24 lg:pt-44" aria-labelledby="services-h1">
        <div className="container-x">
          <p className="eyebrow mb-6 flex items-center gap-3">
            <span className="h-px w-8 bg-signal" aria-hidden="true" /> Services
          </p>
          <h1 id="services-h1" className="display max-w-5xl text-[clamp(2.5rem,7vw,6rem)]">
            Protection, end to end.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-tech/65">
            From choosing the right extinguisher to keeping alarm and sprinkler systems tested — and making sure people know what to do. Use one service or combine them.
          </p>
        </div>
      </section>
      <section className="bg-graphite pb-24" aria-label="All services">
        <ul className="container-x grid gap-px bg-tech/10">
          {services.map((s, i) => (
            <li key={s.slug} data-reveal>
              <Link to={`/services/${s.slug}`} className="group grid items-center gap-6 bg-graphite py-8 transition-colors hover:bg-graphite-2 md:grid-cols-[5rem_1fr_16rem] md:gap-10 md:px-6">
                <span className="display text-4xl text-tech/20 transition-colors group-hover:text-signal">{s.index}</span>
                <span>
                  <span className="block font-display text-2xl font-semibold sm:text-3xl [font-variation-settings:'wdth'_110]">{s.name}</span>
                  <span className="mt-3 block max-w-2xl leading-relaxed text-tech/60">{s.summary}</span>
                  <span className="link-arrow mt-5 text-tech group-hover:text-signal">
                    Learn more <ArrowUpRight size={16} aria-hidden="true" />
                  </span>
                </span>
                <span className={`relative hidden aspect-[4/3] overflow-hidden border border-tech/10 md:block ${i % 2 ? '' : ''}`}>
                  <ServiceVisual visual={s.visual} className="block h-full w-full" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <CtaBand title="Not sure where to start?" body="Describe your premises and what you have on site. We will suggest the right combination of services." />
    </>
  )
}
