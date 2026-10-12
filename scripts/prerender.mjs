// Renders every route to static HTML (dist/<route>/index.html), plus 404.html, sitemap.xml and robots.txt.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const template = readFileSync(join(dist, 'index.html'), 'utf8')
const { render, routes, siteUrl } = await import(pathToFileURL(join(root, 'dist-ssr', 'entry-server.js')).href)

const page = (url) => {
  const { html, head } = render(url)
  return template.replace('<!--head-->', head).replace('<!--app-->', html)
}

for (const url of routes) {
  const file = url === '/' ? join(dist, 'index.html') : join(dist, url, 'index.html')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, page(url))
  console.log('prerendered', url)
}
writeFileSync(join(dist, '404.html'), page('/404'))

const today = new Date().toISOString().slice(0, 10)
if (siteUrl) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes
    .map((r) => `  <url><loc>${siteUrl}${r}</loc><lastmod>${today}</lastmod></url>`)
    .join('\n')}\n</urlset>\n`
  writeFileSync(join(dist, 'sitemap.xml'), xml)
  console.log('sitemap.xml written')
} else {
  console.warn('VITE_SITE_URL not set: sitemap.xml skipped and canonical URLs omitted. Set it before deploying.')
}
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n${siteUrl ? `\nSitemap: ${siteUrl}/sitemap.xml\n` : ''}`)
rmSync(join(root, 'dist-ssr'), { recursive: true, force: true })
