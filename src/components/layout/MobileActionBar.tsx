import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { MessageCircle, Phone } from 'lucide-react'
import { hasPhone, hasWhatsApp, telHref, whatsappHref } from '../../config/site'

/** Persistent booking / call / WhatsApp actions on small screens, shown once the visitor scrolls. */
export function MobileActionBar() {
  const [show, setShow] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.7)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  if (pathname.startsWith('/contact')) return null
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-tech/10 bg-graphite/90 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md transition-transform duration-500 lg:hidden ${
        show ? 'translate-y-0' : 'translate-y-full'
      }`}
      aria-hidden={!show}
      inert={!show}
    >
      <div className="flex gap-2">
        <Link to="/contact?intent=booking" className="btn btn-primary flex-1">
          Book a Service
        </Link>
        {hasPhone() ? (
          <a href={telHref()} className="btn btn-ghost !px-4" aria-label="Call us">
            <Phone size={18} aria-hidden="true" />
          </a>
        ) : (
          <Link to="/contact?intent=quote" className="btn btn-ghost !px-4">
            Quote
          </Link>
        )}
        {hasWhatsApp() && (
          <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !px-4" aria-label="Message us on WhatsApp">
            <MessageCircle size={18} aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  )
}
