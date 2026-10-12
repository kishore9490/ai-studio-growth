import { createContext, useContext, useEffect } from 'react'
import { env, site } from './config/site'

export type Crumb = { name: string; path: string }
export type PageMeta = {
  title: string
  description: string
  path: string
  noindex?: boolean
  image?: string
  breadcrumbs?: Crumb[]
}

/** During prerender the server passes an object here; the page's <Meta> writes into it. */
export const MetaContext = createContext<{ current: PageMeta | null } | null>(null)

export const fullTitle = (t: string) => (t ? `${t} | ${site.name}` : `${site.name} — ${site.tagline}`)
const abs = (p: string) => (env.siteUrl ? `${env.siteUrl}${p}` : p)
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** Structured data — only BreadcrumbList, which is always accurate. No LocalBusiness until the client supplies verified details. */
function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) })),
  }
}

export function headHtml(m: PageMeta) {
  const title = fullTitle(m.title)
  const image = abs(m.image || '/images/og-image.jpg')
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    m.noindex ? `<meta name="robots" content="noindex" />` : '',
    env.siteUrl && !m.noindex ? `<link rel="canonical" href="${abs(m.path)}" />` : '',
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(site.name)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    env.siteUrl ? `<meta property="og:url" content="${abs(m.path)}" />` : '',
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:locale" content="en_IN" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    m.breadcrumbs?.length
      ? `<script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd(m.breadcrumbs)).replace(/</g, '\\u003c')}</script>`
      : '',
  ]
  return tags.filter(Boolean).join('\n    ')
}

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

export function Meta(props: PageMeta) {
  const ctx = useContext(MetaContext)
  if (ctx) ctx.current = props

  useEffect(() => {
    const title = fullTitle(props.title)
    document.title = title
    setMeta('meta[name="description"]', 'name', 'description', props.description)
    setMeta('meta[property="og:title"]', 'property', 'og:title', title)
    setMeta('meta[property="og:description"]', 'property', 'og:description', props.description)
    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonical && env.siteUrl) canonical.href = abs(props.path)
    const robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (props.noindex && !robots) setMeta('meta[name="robots"]', 'name', 'robots', 'noindex')
    if (!props.noindex && robots) robots.remove()
  }, [props.title, props.description, props.path, props.noindex])

  return null
}
