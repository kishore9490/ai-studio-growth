import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { App } from './App'
import { headHtml, MetaContext, type PageMeta } from './seo'
import { services } from './content/services'
import { env } from './config/site'

export const routes = ['/', '/about', '/services', ...services.map((s) => `/services/${s.slug}`), '/contact', '/privacy']
export const siteUrl = env.siteUrl

export function render(url: string) {
  const meta: { current: PageMeta | null } = { current: null }
  const html = renderToString(
    <StrictMode>
      <MetaContext.Provider value={meta}>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </MetaContext.Provider>
    </StrictMode>,
  )
  let head = meta.current ? headHtml(meta.current) : ''
  if (url === '/') {
    // Opening-frame still is the LCP candidate on the home page — fetch it early.
    head +=
      '\n    <link rel="preload" as="image" type="image/webp" href="/images/hero-a-wide.webp" media="(min-width: 1024px)" fetchpriority="high" />' +
      '\n    <link rel="preload" as="image" type="image/webp" href="/images/hero-a-narrow.webp" media="(max-width: 1023px)" fetchpriority="high" />'
  }
  return { html, head }
}
