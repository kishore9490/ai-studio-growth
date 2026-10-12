/**
 * CLIENT-EDITABLE SITE CONFIGURATION
 * ----------------------------------
 * Every business fact shown on the website comes from this file.
 *
 * Rules:
 *  - Leave a value as an empty string / empty array until the client has supplied and verified it.
 *  - Empty values are hidden automatically. The site never shows a placeholder phone number,
 *    address, licence or statistic.
 *  - Phone / WhatsApp numbers: use full international format without spaces, e.g. "+919800000000".
 */

export interface Credential {
  /** e.g. "Fire NOC servicing licence" — exactly as written on the document */
  title: string
  /** Issuing authority, e.g. "Directorate of Fire Services, <State>" */
  issuer: string
  /** Optional reference / registration number as printed on the document */
  reference?: string
}

export const site = {
  /** Trading name shown in the header, footer and page titles. */
  name: 'FireTech',
  /** Short descriptor shown next to the logo mark. */
  tagline: 'Fire Protection Services',
  /** Legal entity name for the footer. Leave empty to fall back to `name`. */
  legalName: '',

  contact: {
    /** Primary phone for click-to-call, e.g. "+919800000000" */
    phone: '',
    /** Human-friendly display version of the phone number, e.g. "+91 98000 00000" */
    phoneDisplay: '',
    /** WhatsApp number in international format without "+" or spaces, e.g. "919800000000" */
    whatsapp: '',
    /** Enquiries inbox, e.g. "service@yourdomain.in" */
    email: '',
    /** Postal address lines as they should appear on the site. */
    addressLines: [] as string[],
    /** Google Maps (or other) link to the office location. */
    mapUrl: '',
    /** Business hours, e.g. "Mon–Sat, 9:30 am – 6:30 pm" */
    hours: '',
  },

  /** Cities / districts the client actually services. Shown only when filled in. */
  serviceAreas: [] as string[],

  /** Verified credentials only. Each entry must match a document the client has supplied. */
  credentials: [] as Credential[],

  /** Optional social profiles. */
  social: {
    linkedin: '',
    instagram: '',
    facebook: '',
  },
}

export const env = {
  siteUrl: (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') || '',
  formEndpoint: (import.meta.env.VITE_FORM_ENDPOINT as string | undefined) || '',
  formAccessKey: (import.meta.env.VITE_FORM_ACCESS_KEY as string | undefined) || '',
}

export const hasPhone = () => Boolean(site.contact.phone)
export const hasWhatsApp = () => Boolean(site.contact.whatsapp)
export const hasEmail = () => Boolean(site.contact.email)

export const telHref = () => `tel:${site.contact.phone}`
export const whatsappHref = (text = `Hello ${site.name}, I would like to enquire about your fire safety services.`) =>
  `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(text)}`
export const mailHref = (subject = `Service enquiry`, body = '') =>
  `mailto:${site.contact.email}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`
