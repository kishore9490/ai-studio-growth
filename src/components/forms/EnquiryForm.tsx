import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { AlertTriangle, ArrowRight, CheckCircle2, Info, Loader2, Mail, MessageCircle, Phone } from 'lucide-react'
import { env, hasEmail, hasPhone, hasWhatsApp, mailHref, site, telHref, whatsappHref } from '../../config/site'
import { services } from '../../content/services'

export type Intent = 'booking' | 'quote' | 'amc' | 'inspection' | 'general'

type Values = {
  name: string
  company: string
  phone: string
  email: string
  service: string
  city: string
  date: string
  window: string
  quantity: string
  notes: string
  consent: boolean
  website: string // honeypot
}

type Errors = Partial<Record<keyof Values, string>>

const QTY_SERVICES = new Set(['fire-extinguisher-sales', 'refilling-and-maintenance', 'annual-maintenance-contracts'])

const INTENT_LABEL: Record<Intent, string> = {
  booking: 'Service booking',
  quote: 'Quote request',
  amc: 'AMC survey request',
  inspection: 'Inspection request',
  general: 'General enquiry',
}

/** Indian mobile (optionally +91 / 0 prefix) or landline with STD code; spaces and dashes ignored. */
export function validPhone(v: string) {
  const d = v.replace(/[\s\-()]/g, '')
  return /^(\+?91|0)?[6-9]\d{9}$/.test(d) || /^(\+?91|0)?\d{10,11}$/.test(d)
}
export const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)

export function validate(v: Values): Errors {
  const e: Errors = {}
  if (v.name.trim().length < 2) e.name = 'Please enter your name.'
  if (!v.phone.trim()) e.phone = 'Please enter a phone number so we can reach you.'
  else if (!validPhone(v.phone)) e.phone = 'Please enter a valid phone number, e.g. 98XXXXXXXX or +91 98XXXXXXXX.'
  if (v.email.trim() && !validEmail(v.email.trim())) e.email = 'Please check the email address.'
  if (!v.service) e.service = 'Please choose the service you need.'
  if (v.city.trim().length < 2) e.city = 'Please tell us the city or location of the premises.'
  if (v.quantity && (!/^\d+$/.test(v.quantity) || Number(v.quantity) < 1 || Number(v.quantity) > 100000)) e.quantity = 'Please enter a whole number.'
  if (v.date) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (new Date(v.date) < today) e.date = 'Please choose today or a future date.'
  }
  if (!v.consent) e.consent = 'Please confirm we may use these details to respond.'
  return e
}

function summary(v: Values, intent: Intent) {
  const svc = services.find((s) => s.slug === v.service)?.name || v.service
  return [
    `${INTENT_LABEL[intent]} — ${site.name} website`,
    `Name: ${v.name}`,
    v.company && `Company: ${v.company}`,
    `Phone: ${v.phone}`,
    v.email && `Email: ${v.email}`,
    `Service: ${svc}`,
    `Location: ${v.city}`,
    (v.date || v.window) && `Preferred: ${[v.date, v.window].filter(Boolean).join(', ')}`,
    v.quantity && `Equipment quantity: ${v.quantity}`,
    v.notes && `Notes: ${v.notes}`,
  ]
    .filter(Boolean)
    .join('\n')
}

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent'; reference?: string } | { kind: 'error'; message: string } | { kind: 'offline' }

export function EnquiryForm({ intent, defaultService }: { intent: Intent; defaultService?: string }) {
  const uid = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const startedAt = useRef(Date.now())
  const configured = Boolean(env.formEndpoint)
  const [v, setV] = useState<Values>({
    name: '',
    company: '',
    phone: '',
    email: '',
    service: defaultService && services.some((s) => s.slug === defaultService) ? defaultService : '',
    city: '',
    date: '',
    window: '',
    quantity: '',
    notes: '',
    consent: false,
    website: '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState(false)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const statusRef = useRef<HTMLDivElement>(null)
  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), [])

  useEffect(() => {
    if (defaultService && services.some((s) => s.slug === defaultService)) setV((x) => ({ ...x, service: defaultService }))
  }, [defaultService])

  useEffect(() => {
    if (status.kind !== 'idle' && status.kind !== 'sending') statusRef.current?.focus()
  }, [status])

  const set = <K extends keyof Values>(k: K, val: Values[K]) => {
    const next = { ...v, [k]: val }
    setV(next)
    if (touched) setErrors(validate(next))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    const errs = validate(v)
    setErrors(errs)
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0]
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    // Spam protection: hidden honeypot field and a minimum human completion time.
    if (v.website || Date.now() - startedAt.current < 2500) {
      setStatus({ kind: 'error', message: 'Your enquiry could not be sent. Please wait a moment and try again.' })
      return
    }
    if (!configured) {
      setStatus({ kind: 'offline' })
      return
    }
    setStatus({ kind: 'sending' })
    try {
      const svc = services.find((s) => s.slug === v.service)
      const payload: Record<string, string> = {
        subject: `${INTENT_LABEL[intent]}: ${svc?.name ?? v.service} — ${v.city}`,
        intent: INTENT_LABEL[intent],
        name: v.name.trim(),
        company: v.company.trim(),
        phone: v.phone.trim(),
        email: v.email.trim(),
        service: svc?.name ?? v.service,
        city: v.city.trim(),
        preferred_date: v.date,
        preferred_window: v.window,
        equipment_quantity: v.quantity,
        notes: v.notes.trim(),
        page: typeof location !== 'undefined' ? location.pathname + location.search : '',
        submitted_at: new Date().toISOString(),
      }
      if (env.formAccessKey) payload.access_key = env.formAccessKey
      if (v.email.trim()) payload._replyto = v.email.trim()
      const ctrl = new AbortController()
      const timer = window.setTimeout(() => ctrl.abort(), 15000)
      const res = await fetch(env.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      })
      window.clearTimeout(timer)
      let data: Record<string, unknown> = {}
      try {
        data = await res.json()
      } catch {
        /* some providers return no body */
      }
      if (!res.ok || data.success === false || data.ok === false) {
        throw new Error(typeof data.message === 'string' ? data.message : `The server responded with status ${res.status}.`)
      }
      const ref = (data.reference ?? data.id ?? data.submission_id) as string | undefined
      setStatus({ kind: 'sent', reference: ref ? String(ref) : undefined })
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError'
      setStatus({
        kind: 'error',
        message: aborted ? 'The request timed out. Please check your connection and try again.' : 'We could not send your enquiry just now. Please try again, or contact us directly.',
      })
    }
  }

  const text = summary(v, intent)
  const directLinks = (
    <div className="mt-5 flex flex-wrap gap-3">
      {hasWhatsApp() && (
        <a className="btn btn-primary" href={whatsappHref(text)} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={18} aria-hidden="true" /> Send via WhatsApp
        </a>
      )}
      {hasEmail() && (
        <a className="btn btn-ghost" href={mailHref(`${INTENT_LABEL[intent]} — ${v.city || 'website'}`, text)}>
          <Mail size={18} aria-hidden="true" /> Send by email
        </a>
      )}
      {hasPhone() && (
        <a className="btn btn-ghost" href={telHref()}>
          <Phone size={18} aria-hidden="true" /> Call {site.contact.phoneDisplay || site.contact.phone}
        </a>
      )}
    </div>
  )
  const anyDirect = hasWhatsApp() || hasEmail() || hasPhone()

  if (status.kind === 'sent') {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="border border-lime/40 bg-lime/5 p-8 outline-none">
        <CheckCircle2 className="text-lime" size={32} aria-hidden="true" />
        <h2 className="mt-5 font-display text-2xl font-semibold">Thank you — your request has been sent.</h2>
        {status.reference && (
          <p className="meta mt-3 text-tech/70">
            Reference: <span className="text-tech">{status.reference}</span>
          </p>
        )}
        <p className="mt-4 max-w-lg leading-relaxed text-tech/70">
          Our team will contact you on <strong className="text-tech">{v.phone}</strong> to confirm the details and next steps.
          {anyDirect && ' If it is urgent, please call or message us directly.'}
        </p>
        {anyDirect && directLinks}
        <Link to="/" className="link-arrow mt-8 text-tech/80 hover:text-tech">
          Back to home <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    )
  }

  const field = 'mt-2 block w-full border border-tech/15 bg-graphite px-4 py-3 text-base text-tech placeholder:text-tech/30 transition-colors focus:border-tech/50 focus:outline-none aria-[invalid=true]:border-signal'
  const errId = (k: keyof Values) => `${uid}-${k}-err`
  const Err = ({ k }: { k: keyof Values }) =>
    errors[k] ? (
      <p id={errId(k)} className="mt-2 flex items-center gap-2 text-sm text-[#ff7a70]">
        <AlertTriangle size={14} aria-hidden="true" /> {errors[k]}
      </p>
    ) : null
  const aria = (k: keyof Values) => ({ 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? errId(k) : undefined })
  const Label = ({ k, children, optional }: { k: keyof Values; children: ReactNode; optional?: boolean }) => (
    <label htmlFor={`${uid}-${k}`} className="text-sm font-medium text-tech/85">
      {children} {optional ? <span className="text-tech/60">(optional)</span> : <span className="text-signal" aria-hidden="true">*</span>}
    </label>
  )

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate aria-describedby={`${uid}-req`} className="relative">
      {!configured && (
        <div className="mb-8 flex gap-3 border border-tech/15 bg-graphite-2 p-5 text-sm leading-relaxed text-tech/75">
          <Info size={18} className="mt-0.5 shrink-0 text-lime" aria-hidden="true" />
          <p>
            Online submission is not switched on yet.{' '}
            {anyDirect
              ? 'You can still fill in this form — we will turn it into a WhatsApp message or email for you to send, so nothing has to be typed twice.'
              : 'Please check back shortly or reach us through the contact details on this page once they are published.'}
          </p>
        </div>
      )}
      <p id={`${uid}-req`} className="mb-6 text-sm text-tech/50">
        Fields marked <span className="text-signal">*</span> are required.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label k="name">Full name</Label>
          <input id={`${uid}-name`} name="name" autoComplete="name" className={field} value={v.name} onChange={(e) => set('name', e.target.value)} required {...aria('name')} />
          <Err k="name" />
        </div>
        <div>
          <Label k="company" optional>
            Company / society
          </Label>
          <input id={`${uid}-company`} name="company" autoComplete="organization" className={field} value={v.company} onChange={(e) => set('company', e.target.value)} />
        </div>
        <div>
          <Label k="phone">Phone</Label>
          <input id={`${uid}-phone`} name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91" className={field} value={v.phone} onChange={(e) => set('phone', e.target.value)} required {...aria('phone')} />
          <Err k="phone" />
        </div>
        <div>
          <Label k="email" optional>
            Email
          </Label>
          <input id={`${uid}-email`} name="email" type="email" inputMode="email" autoComplete="email" className={field} value={v.email} onChange={(e) => set('email', e.target.value)} {...aria('email')} />
          <Err k="email" />
        </div>
        <div>
          <Label k="service">Service required</Label>
          <select id={`${uid}-service`} name="service" className={field} value={v.service} onChange={(e) => set('service', e.target.value)} required {...aria('service')}>
            <option value="">Select a service…</option>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
            <option value="not-sure">Not sure — please advise</option>
          </select>
          <Err k="service" />
        </div>
        <div>
          <Label k="city">City / service location</Label>
          <input id={`${uid}-city`} name="city" autoComplete="address-level2" className={field} value={v.city} onChange={(e) => set('city', e.target.value)} required {...aria('city')} />
          <Err k="city" />
        </div>
        <div>
          <Label k="date" optional>
            Preferred date
          </Label>
          <input id={`${uid}-date`} name="date" type="date" min={minDate} className={`${field} [color-scheme:dark]`} value={v.date} onChange={(e) => set('date', e.target.value)} {...aria('date')} />
          <Err k="date" />
        </div>
        <div>
          <Label k="window" optional>
            Preferred time
          </Label>
          <select id={`${uid}-window`} name="window" className={field} value={v.window} onChange={(e) => set('window', e.target.value)}>
            <option value="">Any time</option>
            <option>Morning (9 am – 12 pm)</option>
            <option>Afternoon (12 pm – 3 pm)</option>
            <option>Late afternoon (3 pm – 6 pm)</option>
          </select>
        </div>
        {QTY_SERVICES.has(v.service) && (
          <div>
            <Label k="quantity" optional>
              Number of extinguishers
            </Label>
            <input id={`${uid}-quantity`} name="quantity" inputMode="numeric" pattern="[0-9]*" className={field} value={v.quantity} onChange={(e) => set('quantity', e.target.value.replace(/[^\d]/g, ''))} {...aria('quantity')} />
            <Err k="quantity" />
          </div>
        )}
        <div className="sm:col-span-2">
          <Label k="notes" optional>
            Notes
          </Label>
          <textarea
            id={`${uid}-notes`}
            name="notes"
            rows={4}
            maxLength={2000}
            placeholder="Type of premises, extinguisher types, access instructions…"
            className={field}
            value={v.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </div>
        {/* honeypot — hidden from people and assistive technology */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor={`${uid}-website`}>Website</label>
          <input id={`${uid}-website`} name="website" tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => set('website', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-tech/75">
            <input
              name="consent"
              type="checkbox"
              checked={v.consent}
              onChange={(e) => set('consent', e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-[#F04438]"
              {...aria('consent')}
            />
            <span>
              I agree that {site.name} may use these details to respond to this enquiry. See our{' '}
              <Link to="/privacy" className="text-tech underline underline-offset-4">
                privacy notice
              </Link>
              .
            </span>
          </label>
          <Err k="consent" />
        </div>
      </div>

      <div ref={statusRef} tabIndex={-1} className="outline-none" aria-live="polite">
        {status.kind === 'error' && (
          <div role="alert" className="mt-8 border border-signal/50 bg-signal/10 p-5 text-sm">
            <p className="flex items-center gap-2 font-semibold text-tech">
              <AlertTriangle size={16} aria-hidden="true" /> {status.message}
            </p>
            {anyDirect && directLinks}
          </div>
        )}
        {status.kind === 'offline' && (
          <div role="status" className="mt-8 border border-tech/20 bg-graphite-2 p-6">
            <p className="font-display text-lg font-semibold">Your enquiry has not been sent yet.</p>
            {anyDirect ? (
              <p className="mt-2 text-sm leading-relaxed text-tech/70">Online submission is not active. Use one of the options below — your details are already filled in.</p>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-tech/70">
                Online submission is not active and direct contact details have not been published yet. Please try again later.
              </p>
            )}
            {anyDirect && directLinks}
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-5">
        <button type="submit" className="btn btn-primary min-w-[14rem] disabled:opacity-60" disabled={status.kind === 'sending'}>
          {status.kind === 'sending' ? (
            <>
              <Loader2 size={18} className="animate-spin" aria-hidden="true" /> Sending…
            </>
          ) : (
            <>
              {intent === 'quote' ? 'Request Quote' : intent === 'booking' ? 'Send Booking Request' : 'Send Enquiry'} <ArrowRight size={18} aria-hidden="true" />
            </>
          )}
        </button>
        <p className="text-sm text-tech/50">A booking request is confirmed once our team contacts you.</p>
      </div>
    </form>
  )
}
