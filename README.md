# FireTech — Fire Protection Services Website

Marketing website for a fire protection services company: a cinematic, scroll-directed 3D hero, an interactive extinguisher showcase, six service pages and a working enquiry/booking form. Scope is deliberately a **marketing site** — no admin panel, CRM, portal or AMC backend.

**Stack:** React 19 · Vite · TypeScript · Three.js via React Three Fiber + Drei · GSAP + ScrollTrigger · Tailwind CSS v4 · React Router · Lucide icons. Pages are prerendered to static HTML at build time.

---

## Quick start

```bash
npm install
cp .env.example .env        # then fill in values (see below)
npm run dev                 # http://localhost:5173
npm run build               # typecheck + client build + SSR prerender → dist/
npm run preview             # see "Hosting" — use a clean-URL static server for realistic testing
```

Node 20+ recommended (developed on Node 22).

## Before going live — client inputs required

The site **never invents business facts**. Everything below is empty by default and hidden until filled in.

| What | Where | Effect when empty |
|---|---|---|
| Company name, tagline, legal name | `src/config/site.ts` | Uses placeholder brand "FireTech" |
| Phone, WhatsApp, email, address, map link, hours | `src/config/site.ts` → `contact` | Call / WhatsApp / email buttons are hidden |
| Service areas (cities) | `src/config/site.ts` → `serviceAreas` | About page asks visitors for their location instead |
| Verified credentials (licences, registrations) | `src/config/site.ts` → `credentials` | Home shows a neutral "questions to ask any provider" checklist instead |
| Site URL | `.env` → `VITE_SITE_URL` | No canonical URLs, no `sitemap.xml` |
| Form delivery endpoint | `.env` → `VITE_FORM_ENDPOINT` | Form says plainly that online submission is not active (see below) |
| Logo | `src/components/layout/Logo.tsx`, `public/favicon.svg` | Generic extinguisher mark |

Copy lives in `src/content/` (`home.ts`, `services.ts`). The "Where we work" sector list is generic and should be reviewed by the client.

### Enquiry form delivery

`VITE_FORM_ENDPOINT` must accept a JSON `POST` and return 2xx. Tested against a mock endpoint; compatible with Formspree (`https://formspree.io/f/<id>`), Web3Forms (also set `VITE_FORM_ACCESS_KEY`), Getform, or your own serverless function. If the response JSON contains `reference`, `id` or `submission_id`, it is shown to the visitor as a reference.

Behaviour:
- Required-field validation with accessible inline errors; focus moves to the first invalid field.
- Spam protection: hidden honeypot field + minimum completion time.
- Consent checkbox linked to `/privacy`.
- **Not configured:** the form states upfront that online submission is not active and, on submit, offers WhatsApp/email links with the enquiry pre-filled (when those contacts are configured). It never claims a request was delivered.
- **Server/network error:** honest error message plus direct contact options.

> ⚠️ Do a live test submission after configuring the real provider — delivery to the client's inbox has **not** been verified (no provider was configured in this environment).

## Hosting

`npm run build` writes one HTML file per route (`dist/services/<slug>/index.html`, etc.), plus `404.html`, `robots.txt` and `sitemap.xml`. Deploy `dist/` to any static host (Netlify, Vercel, Cloudflare Pages, S3/CloudFront, nginx).

- The host must resolve clean URLs: `/contact` → `/contact/index.html` (default on Netlify/Cloudflare Pages; Vercel: `"cleanUrls": true`; nginx: `try_files $uri $uri/index.html =404`).
- `vite preview` does **not** do this — it falls back to the home page HTML. The app detects that and client-renders the correct page (no errors), but measure performance with a real static server, e.g. `npx serve dist`.
- Long-cache `/assets/*` (hashed filenames).

## Deploying to Hostinger (Web / Premium / Business hosting)

The build includes everything Hostinger's Apache + PHP hosting needs: `.htaccess` (clean URLs, 404, HTTPS, gzip, caching) and `api/enquiry.php`, a PHP mail handler for the enquiry form, so no third-party form service is needed.

1. Set your domain in `.env.hostinger` (`VITE_SITE_URL=https://www.yourdomain.in`).
2. Build the upload package (Windows PowerShell):
   ```powershell
   npm.cmd install; npm.cmd run build:hostinger
   ```
   This creates `firetech-hostinger.zip`.
3. hPanel → **Websites → File Manager** → open `public_html` → delete the default `default.php`/`index.php` → **Upload** the zip → right-click → **Extract** into `public_html` (files must sit directly in `public_html`, not in a subfolder).
4. hPanel → **Emails**: create a mailbox on your domain (e.g. `noreply@yourdomain.in`).
5. In File Manager, create `public_html/api/enquiry-config.php`:
   ```php
   <?php return [
     'to'   => 'you@yourdomain.in',      // where enquiries should arrive
     'from' => 'noreply@yourdomain.in',  // mailbox from step 4
     'site' => 'FireTech',
   ];
   ```
   This file is not part of the build, so re-uploading the site never overwrites it. Direct web access to it is blocked.
6. hPanel → **Security → SSL**: make sure SSL is active (`.htaccess` redirects all traffic to HTTPS).
7. Submit a test enquiry on the live site and confirm it arrives (check spam the first time).

**To update the site later:** rebuild, upload the new zip, and extract it over the old files.

Tested in this environment: the `.htaccess` rules on Apache 2.4 (clean URLs, trailing-slash 301, 404, HTTPS redirect, asset caching, gzip, config file blocked), and `enquiry.php` on PHP 8.3 (valid submission → formatted email with reference and Reply-To; rejects invalid input, GET, foreign origins, more than 5 posts per IP per 10 minutes, and the unconfigured state). **Not tested:** real delivery through Hostinger's mail server — that needs step 7.

## The 3D hero

| File | Role |
|---|---|
| `src/components/hero/Hero.tsx` | HTML layer (real headline/CTAs), poster/fallback, GSAP intro + scroll timeline |
| `src/three/heroRig.ts` | Camera storyboard (Shots A–D for wide/narrow layouts), annotation config |
| `src/three/HeroScene.tsx` | Canvas, lighting rig, reflection environment, camera rig, annotation projection |
| `src/three/Extinguisher.tsx` | Procedurally modelled extinguisher (no external model files) |
| `src/three/Facility.tsx` | Industrial bay environment |
| `src/three/textures.ts` | Runtime-generated textures (paint roughness, label, gauge, concrete) |

**Storyboard:** A (wide establishing) → B (three-quarter hero, on load) → C (valve-head detail with anchored annotations, scroll) → D (pull-back reveal, scroll) → release into the next section. The intro and scroll timelines write to separate values and are composed additively, so they can't conflict, and reverse scrolling is exact. The hero is pinned for 230% (desktop) / 170% (mobile) of the viewport height.

**Model:** a generic ABC dry powder stored-pressure unit with lathe-turned shell, weld seam, foot ring, wrap label, brass collar, valve body, outlet ferrule, gauge with glass, carrying handle, operating lever, pin, pull ring, tamper seal, hose, nozzle and clip. The gauge dial is deliberately neutral — it shows no "OK" zone.

**Fallbacks**
- *No WebGL, Save-Data, or 2G/3G:* static pre-rendered still (`hero-b-*.webp`), no pin, no scroll storyboard.
- *3D chunk fails to load:* an error boundary switches to the same still.
- *Reduced motion:* no pin, no camera travel, no rotation or ambient motion; product shown statically at Shot B.
- *Before the 3D loads:* the opening-frame still (`hero-a-*.webp`) is shown, then the canvas fades in on the same framing.
- *No JavaScript:* prerendered headline, CTAs and still.

**Regenerating the stills** (after changing the scene): run `npm run dev`, then `node scripts/capture-renders.mjs`. Stills are rendered from the live scene, so they always match the art direction.

**Performance strategy:** the 3D chunk (≈273 KB gzip) is lazy-loaded on idle, after the HTML hero has painted, and is never in the main bundle. The device tier (`renderQuality()`) selects a reflective floor, volumetric cone and moving highlight on capable desktops only. DPR is capped (1.75 / 1.5) and drops when performance degrades. Rendering stops entirely while the hero is off-screen. Textures are generated at runtime, so there are no model or texture downloads.

## Test & QA utilities (`scripts/`)

Playwright-based checks used during development (they use the globally installed Playwright/Chromium):

| Script | Checks |
|---|---|
| `scrolltest.mjs` | Drives the hero storyboard forward/backward; logs stage opacities, screenshots each stage |
| `fallbacktest.mjs` | No-WebGL (desktop + mobile) and reduced-motion behaviour |
| `formtest.mjs` | Validation, success-with-reference, server error, unconfigured fallback |
| `showcasetest.mjs` | Showcase markers, selection rotation/highlight, marker clicks |
| `perf.mjs` | Lab LCP / CLS / interaction latency with optional mobile throttling |
| `shoot.mjs`, `fullpage.mjs` | Screenshots, console-error and horizontal-overflow checks |

## Test report (honest status)

Environment: headless Chromium (Playwright 1.56) in a cloud container. **WebGL ran on SwiftShader (CPU software rendering)**, so frame rates and 3D-related timings here are far worse than on any real GPU and are not representative.

**Verified**
- Hero renders the full storyboard on desktop (1280–1920) and mobile (320, 390), and at tablet (820×1180): camera movement, product rotation, lighting changes, annotation projection, stage text transitions, and reverse scrolling back to Shot C and Shot B.
- No-WebGL fallback (desktop + mobile) and reduced motion: headline and all CTAs visible, correct stills, no pin.
- All 11 routes plus 404: no console errors, no horizontal overflow, per-page title/description/canonical/OG, breadcrumb JSON-LD, sitemap and robots.
- Enquiry form: all paths listed above, against a local mock endpoint (payload verified).
- Showcase: markers hide when facing away; list and marker selection rotate/zoom/highlight; info panel announced via `aria-live`.
- axe-core (WCAG 2 A/AA + best practice): 0 violations on home (desktop + mobile), service, contact, about and privacy. Keyboard tab order: skip link → logo → nav → CTA → hero CTAs.

**Lab performance** (production build, `serve dist`, cache disabled):

| Profile | LCP | CLS | Max interaction |
|---|---|---|---|
| Mobile — 4× CPU slowdown, ~1.6 Mbps / 150 ms RTT, no WebGL | 0.85–1.13 s (all pages) | ≤ 0.022 | 16–64 ms |
| Desktop, no WebGL | 0.12–0.16 s | 0.000 | 48–56 ms |
| Home with 3D scene (software WebGL) | 0.37 s desktop / 1.35 s mobile | ≤ 0.001 | **248–272 ms** |

**Not verified / known limitations**
- **3D frame rate and INP on real devices are unmeasured.** With software GL, interactions during 3D rendering took ~250 ms (above the 200 ms target). Measure on representative phones (mid-range Android especially) with real GPUs before launch; if needed, force `quality=low` more broadly or drop the reflective floor.
- Field Core Web Vitals (CrUX/RUM) can only be collected after launch.
- Real form delivery to the client's inbox (no provider configured).
- Safari/iOS and Firefox were not tested (Chromium only).
- Model assets: the extinguisher is procedural. Swapping in a licensed GLB (Draco/Meshopt-compressed, KTX2 textures) would add detail; the loader pipeline is not set up because no asset was supplied.
- No analytics is installed. If added, it must be consent-aware, and `/privacy` must be updated.
- Client facts (contact details, credentials, service areas, brand) are pending — see the table above.
