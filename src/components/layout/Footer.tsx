import { Link } from 'react-router'
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { hasEmail, hasPhone, hasWhatsApp, mailHref, site, telHref, whatsappHref } from '../../config/site'
import { services } from '../../content/services'
import { Logo } from './Logo'

export function Footer() {
  const c = site.contact
  const anyContact = hasPhone() || hasEmail() || hasWhatsApp() || c.addressLines.length > 0
  return (
    <footer className="relative border-t border-tech/10 bg-graphite pb-24 pt-16 lg:pb-12 lg:pt-20">
      <div className="container-x grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted">
            Fire extinguisher supply and servicing, fire alarm and sprinkler systems, audits and training.
          </p>
          <p className="mt-6 max-w-xs border-l-2 border-signal pl-3 text-sm text-tech/80">
            In an emergency, call the fire service on <a className="font-semibold text-tech underline-offset-4 hover:underline" href="tel:101">101</a> or{' '}
            <a className="font-semibold text-tech underline-offset-4 hover:underline" href="tel:112">112</a>.
          </p>
        </div>

        <nav aria-label="Services">
          <p className="eyebrow mb-5">Services</p>
          <ul className="space-y-3 text-sm">
            {services.map((s) => (
              <li key={s.slug}>
                <Link to={`/services/${s.slug}`} className="text-tech/80 hover:text-tech">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Company">
          <p className="eyebrow mb-5">Company</p>
          <ul className="space-y-3 text-sm">
            <li><Link to="/about" className="text-tech/80 hover:text-tech">About</Link></li>
            <li><Link to="/services" className="text-tech/80 hover:text-tech">All services</Link></li>
            <li><Link to="/contact?intent=booking" className="text-tech/80 hover:text-tech">Book a service</Link></li>
            <li><Link to="/contact?intent=quote" className="text-tech/80 hover:text-tech">Request a quote</Link></li>
            <li><Link to="/privacy" className="text-tech/80 hover:text-tech">Privacy</Link></li>
          </ul>
        </nav>

        <div>
          <p className="eyebrow mb-5">Contact</p>
          {anyContact ? (
            <ul className="space-y-3 text-sm">
              {hasPhone() && (
                <li>
                  <a href={telHref()} className="flex items-center gap-3 text-tech/80 hover:text-tech">
                    <Phone size={16} className="text-signal" aria-hidden="true" /> {c.phoneDisplay || c.phone}
                  </a>
                </li>
              )}
              {hasWhatsApp() && (
                <li>
                  <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-tech/80 hover:text-tech">
                    <MessageCircle size={16} className="text-signal" aria-hidden="true" /> WhatsApp
                  </a>
                </li>
              )}
              {hasEmail() && (
                <li>
                  <a href={mailHref()} className="flex items-center gap-3 text-tech/80 hover:text-tech">
                    <Mail size={16} className="text-signal" aria-hidden="true" /> {c.email}
                  </a>
                </li>
              )}
              {c.addressLines.length > 0 && (
                <li className="flex gap-3 text-tech/80">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-signal" aria-hidden="true" />
                  <address className="not-italic">
                    {c.addressLines.map((l) => (
                      <span key={l} className="block">{l}</span>
                    ))}
                    {c.mapUrl && (
                      <a href={c.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-tech underline-offset-4 hover:underline">
                        View on map
                      </a>
                    )}
                  </address>
                </li>
              )}
              {c.hours && <li className="text-muted">{c.hours}</li>}
            </ul>
          ) : (
            <p className="text-sm text-muted">
              Send us your requirements through the <Link to="/contact" className="text-tech underline underline-offset-4">enquiry form</Link>.
            </p>
          )}
        </div>
      </div>
      <div className="container-x mt-16 flex flex-col gap-3 border-t border-tech/10 pt-6 text-xs text-muted sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} {site.legalName || site.name}. All rights reserved.</p>
        <p>3D visuals are illustrative and do not depict a specific product or its condition.</p>
      </div>
    </footer>
  )
}
