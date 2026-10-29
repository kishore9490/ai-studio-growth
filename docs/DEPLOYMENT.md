# Deployment

The site is fully static at runtime apart from the locale-redirect proxy, so it suits any host
that runs Next.js 16. Vercel is the simplest; instructions for another Node host follow.

**The site has not been deployed.** Nothing here should be read as saying it is live.

## 1. Before the first deployment

1. Complete the checklist in `docs/CONTENT_REVIEW.md` (the production deployment, not previews).
2. Choose and register a domain. None has been purchased. Keep it independent of RGUHS web
   properties (do not use an `rguhs.ac.in` subdomain or university branding).

## 2. Environment variables

| Variable | Preview / staging | Production |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | the preview URL | `https://<your-domain>` (no trailing slash) |
| `SITE_NOINDEX` | `true` | `false` — only after content approval |
| `SHOW_DEV_PLACEHOLDERS` | `true` or `false` | unset / `false` |

They are read at **build time**; changing one requires a rebuild. No secrets are needed.

## 3. Vercel

1. Import the Git repository in Vercel. The framework preset is detected as Next.js; the
   defaults are correct (build `npm run build`, install `npm ci`, Node 22).
2. Add the environment variables per environment (Production / Preview).
3. Deploy. Every pull request gets a preview deployment, which stays `noindex`.

### Domain, DNS and HTTPS

1. Project → Settings → Domains → add `example.com` and `www.example.com`.
2. At your DNS provider, create the records Vercel shows (typically an `A` record for the apex
   and a `CNAME` for `www`). Propagation can take up to 48 hours.
3. Vercel issues and renews TLS certificates automatically once DNS resolves. HTTPS is enforced;
   the CSP also sends `upgrade-insecure-requests`.
4. Choose one canonical host (apex **or** `www`) and set the other to redirect to it in the
   Domains panel. `NEXT_PUBLIC_SITE_URL` must match the canonical host.

## 4. Other Node hosts

```bash
npm ci
```

```bash
NEXT_PUBLIC_SITE_URL=https://example.com SITE_NOINDEX=false npm run build
```

```bash
npm start -- -p 3000
```

Run it behind a reverse proxy (nginx, Caddy) that terminates TLS (e.g. Let's Encrypt), enables
gzip/brotli, and forwards to port 3000. Serve `/_next/static/*` with long-lived immutable
caching (Next sets these headers already).

## 5. URL, redirect and canonical strategy

- Every page lives under a locale prefix: `/en/...` (default) and `/kn/...`.
- `/` and un-prefixed paths (e.g. `/about`) redirect (307) to the visitor's preferred locale,
  falling back to English (`src/proxy.ts`).
- Every page declares a canonical URL for its own locale and `hreflang` alternates for `en`,
  `kn` and `x-default` (→ English).
- Unknown paths return a localised 404.

## 6. Sitemap and robots

- `/sitemap.xml` lists all 16 URLs with language alternates.
- `/robots.txt` disallows everything while `SITE_NOINDEX=true`; otherwise it allows all and
  points to the sitemap.
- After launch, submit the sitemap in Google Search Console and Bing Webmaster Tools. No ranking
  outcome is implied or guaranteed.

## 7. Images and fonts

- Inter, Manrope and DM Serif Display are downloaded by `next/font` **at build time** and
  self-hosted; the build machine needs network access to Google Fonts. Visitors make no
  third-party font requests.
- Noto Sans Kannada is committed in `public/fonts/` (SIL OFL 1.1, licence alongside) and
  preloaded on Kannada pages only.
- Put approved images in `public/media/` at no more than ~2400px on the long edge; `next/image`
  generates AVIF/WebP and responsive sizes. Only the portrait (the hero LCP image) uses
  `priority`; gallery images lazy-load.
- Do not add autoplaying background video.

## 8. Security headers

Set in `next.config.ts` for every response: Content-Security-Policy (self-only; no third-party
scripts), `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`,
`Permissions-Policy`, `Cross-Origin-Opener-Policy`; `X-Powered-By` is removed. Because pages
are statically generated, `script-src` includes `'unsafe-inline'` for Next.js's inline bootstrap
scripts; moving to nonces would require dynamic rendering. Vercel adds HSTS on custom domains;
on other hosts, add `Strict-Transport-Security` at the proxy once HTTPS works.

## 9. Releasing updates and rolling back

- Content changes are pull requests against `src/content/` or `messages/`. CI should run
  `npm run check` and `npm run test:e2e`; review the preview deployment before merging.
- Factual changes must also update `docs/SOURCE_REGISTER.md` and pass `npm run content:gate`.
- **Rollback on Vercel:** Deployments → choose the last good deployment → *Promote to
  Production* (instant; no rebuild).
- **Rollback elsewhere:** redeploy the previous Git tag/commit. Tag each production release
  (e.g. `release-YYYY-MM-DD`).

## 10. Production smoke test

Run on the live domain after every production deployment:

- [ ] `https://<domain>/` redirects to `/en`; `http://` redirects to `https://`
- [ ] All 8 pages load in both `/en` and `/kn` (16 URLs)
- [ ] Language switcher keeps the current page
- [ ] Mobile menu opens, navigates, closes with Escape (test on a real phone)
- [ ] `view-source:` shows the correct canonical, `hreflang` alternates, and **no** `noindex`
- [ ] `/robots.txt` allows crawling and lists the sitemap; `/sitemap.xml` lists 16 URLs on the production domain
- [ ] Share a page URL in a messaging app: Open Graph title, description and image appear
- [ ] Response headers include the CSP and security headers (browser dev tools → Network)
- [ ] Browser console shows no errors
- [ ] Lighthouse (mobile) on `/en` and `/kn`; record the scores in TEST_REPORT.md
- [ ] Validate structured data with the Schema.org validator or Google Rich Results Test
