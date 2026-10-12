import { useSearchParams } from 'react-router'
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { EnquiryForm, type Intent } from '../components/forms/EnquiryForm'
import { hasEmail, hasPhone, hasWhatsApp, mailHref, site, telHref, whatsappHref } from '../config/site'
import { Meta } from '../seo'

const HEADINGS: Record<Intent, { kicker: string; title: string; body: string }> = {
  booking: { kicker: 'Book a service', title: 'Book a service visit.', body: 'Tell us what you need and where. We will call to confirm a time that works.' },
  quote: { kicker: 'Request a quote', title: 'Request a quotation.', body: 'Share the details of your premises and requirements. We will come back with a clear, written quotation.' },
  amc: { kicker: 'AMC survey', title: 'Schedule an AMC survey.', body: 'We list what is on site and propose a maintenance scope and schedule that fits.' },
  inspection: { kicker: 'Schedule an inspection', title: 'Schedule an inspection.', body: 'Tell us about the premises and any concerns. We will propose a scope and a date.' },
  general: { kicker: 'Contact', title: 'Contact our team.', body: 'Questions about equipment, servicing, systems or training — send us a message.' },
}

export function ContactPage() {
  const [params] = useSearchParams()
  const raw = params.get('intent') as Intent | null
  const intent: Intent = raw && raw in HEADINGS ? raw : 'general'
  const h = HEADINGS[intent]
  const c = site.contact
  const direct = hasPhone() || hasWhatsApp() || hasEmail() || c.addressLines.length > 0

  return (
    <>
      <Meta
        title="Contact & Book a Service"
        path="/contact"
        description="Book a fire safety service, request a quotation or schedule an inspection. Fire extinguishers, AMCs, alarm and sprinkler systems, audits and training."
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Contact', path: '/contact' },
        ]}
      />
      <section className="relative bg-graphite pb-24 pt-28 lg:pt-40" aria-labelledby="contact-h1">
        <div className="grid-bg pointer-events-none absolute inset-x-0 top-0 h-[28rem] [mask-image:linear-gradient(180deg,#000,transparent)]" aria-hidden="true" />
        <div className="container-x relative grid gap-14 lg:grid-cols-[1fr_1.5fr] lg:gap-20">
          <div>
            <p className="eyebrow mb-6 flex items-center gap-3">
              <span className="h-px w-8 bg-signal" aria-hidden="true" /> {h.kicker}
            </p>
            <h1 id="contact-h1" className="display text-[clamp(2.3rem,5.5vw,4.8rem)]">
              {h.title}
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-tech/70">{h.body}</p>

            {direct && (
              <ul className="mt-12 space-y-4 border-t border-tech/10 pt-8">
                {hasPhone() && (
                  <li>
                    <a href={telHref()} className="group flex items-center gap-4">
                      <span className="grid h-12 w-12 place-items-center border border-tech/15 group-hover:border-signal">
                        <Phone size={18} className="text-signal" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="meta block text-muted">Call</span>
                        <span className="font-display text-lg font-semibold">{c.phoneDisplay || c.phone}</span>
                      </span>
                    </a>
                  </li>
                )}
                {hasWhatsApp() && (
                  <li>
                    <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4">
                      <span className="grid h-12 w-12 place-items-center border border-tech/15 group-hover:border-signal">
                        <MessageCircle size={18} className="text-signal" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="meta block text-muted">WhatsApp</span>
                        <span className="font-display text-lg font-semibold">Message us</span>
                      </span>
                    </a>
                  </li>
                )}
                {hasEmail() && (
                  <li>
                    <a href={mailHref()} className="group flex items-center gap-4">
                      <span className="grid h-12 w-12 place-items-center border border-tech/15 group-hover:border-signal">
                        <Mail size={18} className="text-signal" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="meta block text-muted">Email</span>
                        <span className="font-display text-lg font-semibold break-all">{c.email}</span>
                      </span>
                    </a>
                  </li>
                )}
                {c.addressLines.length > 0 && (
                  <li className="flex items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center border border-tech/15">
                      <MapPin size={18} className="text-signal" aria-hidden="true" />
                    </span>
                    <address className="not-italic text-tech/80">
                      {c.addressLines.map((l) => (
                        <span key={l} className="block">{l}</span>
                      ))}
                      {c.mapUrl && (
                        <a href={c.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-tech underline underline-offset-4">
                          Open in Maps
                        </a>
                      )}
                    </address>
                  </li>
                )}
                {c.hours && (
                  <li className="flex items-center gap-4 text-tech/70">
                    <span className="grid h-12 w-12 place-items-center border border-tech/15">
                      <Clock size={18} className="text-signal" aria-hidden="true" />
                    </span>
                    {c.hours}
                  </li>
                )}
              </ul>
            )}
            <p className="mt-12 max-w-sm border-l-2 border-signal pl-4 text-sm leading-relaxed text-tech/70">
              This form is for service requests. In a fire or emergency, call <a href="tel:101" className="font-semibold text-tech underline">101</a> or{' '}
              <a href="tel:112" className="font-semibold text-tech underline">112</a> immediately.
            </p>
          </div>
          <div className="border border-tech/10 bg-graphite-2/50 p-5 sm:p-10">
            <EnquiryForm key={intent + (params.get('service') ?? '')} intent={intent} defaultService={params.get('service') ?? undefined} />
          </div>
        </div>
      </section>
    </>
  )
}
