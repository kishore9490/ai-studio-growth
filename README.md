# Dr. Bhagavan B.C. — personal website

A bilingual (English / Kannada) personal website for Dr. Bhagavan B.C., Vice Chancellor of
Rajiv Gandhi University of Health Sciences (RGUHS), Karnataka.

> **Status: built and tested; approved by the client representative; not yet deployed.**
> The official portrait has been supplied and approved. Biographical facts are still marked
> *pending verification* against the live RGUHS profile, the Kannada text needs review by a
> qualified Kannada reviewer, and no gallery photographs, publications or contact details have
> been supplied. See [`docs/CONTENT_REVIEW.md`](docs/CONTENT_REVIEW.md) before going live.

This is an independent personal website. It is not an official RGUHS property, uses no university
logos or seals, and does not imply endorsement.

## Documentation

| Document | Purpose |
| --- | --- |
| [`docs/SOURCE_REGISTER.md`](docs/SOURCE_REGISTER.md) | Every source, every fact it supports, and the audit log |
| [`docs/CONTENT_REVIEW.md`](docs/CONTENT_REVIEW.md) | Pre-publication checklist, flagged discrepancies, content and assets awaiting approval |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Hosting, domain, DNS, HTTPS, environment, rollback and smoke tests |
| [`docs/TEST_REPORT.md`](docs/TEST_REPORT.md) | Implementation summary and actual test and Lighthouse results |

## Stack

- **Next.js 16** (App Router, Turbopack) with **React 19**, **TypeScript** in strict mode
- **next-intl 4** for locale routing (`/en`, `/kn`), messages and metadata
- **Tailwind CSS 4** with CSS-first design tokens in `src/app/globals.css`
- **three.js** for the WebGL 3D scenes (hand-written shaders, no extra 3D framework), loaded
  on demand after the visitor's first interaction
- **Motion** (`motion/react`) for the mobile menu, lightbox and parallax; CSS for entrance
  animations and 3D scroll reveals; a small IntersectionObserver component for reveals. GSAP
  is not used: nothing on the site needs scroll-scrubbed timelines.
- **Zod 4** validates every content record and the environment at build time
- **lucide-react** icons
- **Vitest** + React Testing Library (unit and component), **Playwright** + axe-core (end-to-end,
  responsive and accessibility)

There is no database, CMS, authentication, analytics or contact backend. Every page is
statically generated.

## Getting started

Requires Node.js 20.9 or later (developed on Node 22).

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

Open http://localhost:3000 — it redirects to `/en`.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve the build |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm test` | Unit, component and content-integrity tests |
| `npm run test:e2e` | Builds, starts and runs Playwright against the production build |
| `npm run content:check` | Content-integrity tests only |
| `npm run content:gate` | **Pre-publication gate.** Fails until every published fact is verified and production config is set |
| `npm run check` | Typecheck, lint, unit tests and build |

The end-to-end suite uses Chromium. If browsers are not installed on your machine, run
`npx playwright install chromium` once.

### Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Absolute origin for canonical URLs, hreflang, sitemap, Open Graph and JSON-LD |
| `SITE_NOINDEX` | `true` | When `true`, robots.txt disallows everything and pages carry `noindex`. Set `false` only for the approved production build |
| `SHOW_DEV_PLACEHOLDERS` | `false` | Shows labelled placeholders (portrait note, abstract gallery tiles) for review builds. Never enable in production |

All three are read at build time and validated by `src/lib/site.ts`. There are no secrets.

## Project structure

```
messages/                 UI strings per locale (en.json, kn.json) — identical key sets, enforced by tests
public/fonts/             Self-hosted Noto Sans Kannada (SIL OFL 1.1) — preloaded on /kn only
public/placeholders/      Abstract development placeholders (never shown in production)
src/
  app/
    [locale]/             All pages: home, about, education, experience, vision,
                          publications, media, contact; plus not-found, error, OG image
    sitemap.ts robots.ts manifest.ts icon.svg apple-icon.tsx
    globals.css           Design tokens and component styles
    fonts.ts              next/font (Inter, Manrope, DM Serif Display)
  components/
    layout/               Header, desktop nav + dropdowns, mobile menu, language switcher, footer, monogram
    home/                 Hero, portrait composition, home sections
    timeline/             Milestone timeline, appointment-period chart
    vision/               Concept diagram, line illustrations
    media/                Gallery + accessible lightbox
    publications/         Publication list with filters
    motion/               Reveal (IntersectionObserver), Parallax (Motion)
    ui/                   PageHero, SectionHeading, ExternalLink, SourceNote, EmptyState
  content/
    ids.ts                Stable ids for every record (copy files are typed against these)
    schema.ts             Zod schemas: SourceRecord, Qualification, CareerEntry, Publication, MediaItem…
    sources.ts            Source register (code)
    records.ts            Language-neutral facts with source ids and verification status
    copy/en.ts, copy/kn.ts  Localised long-form copy keyed by record id
    index.ts              Accessors used by pages (filters unpublished/disputed records)
  i18n/                   next-intl routing, navigation and request config
  lib/                    Metadata/hreflang builder, JSON-LD, period formatting, site config
  proxy.ts                Locale detection and redirects (Next 16 "proxy", formerly middleware)
tests/
  unit/                   Content integrity, lib, gallery, publications, mobile menu, language switcher
  content/                Pre-publication gate (opt-in)
  e2e/                    Pages, interactions, responsive widths, mobile, axe accessibility
docs/                     Source register, content review, deployment, test report
```

## Editing content

Content is code, reviewed through pull requests — there is deliberately no public editing interface.

- **Facts** (years, credentials, appointments, publications, media) live in
  `src/content/records.ts`. Each record carries `sourceIds`, `verificationStatus`
  (`verified` | `pending` | `disputed`), `verifiedAt`, `published` and `reviewNotes`. This
  metadata is never rendered to visitors. Records marked `disputed` or `published: false` are
  never shown.
- **Wording** lives in `src/content/copy/en.ts` and `src/content/copy/kn.ts` (long-form copy)
  and `messages/*.json` (interface strings and short page copy). TypeScript fails the build if a
  Kannada entry is missing; tests fail if message keys differ between languages.
- **Sources** live in `src/content/sources.ts` and are mirrored in `docs/SOURCE_REGISTER.md`.

To add a publication, append a record to `publications` in `records.ts` with a DOI, ISBN or
official URL (the schema validates DOI/ISBN formats). Type and year filters appear automatically
once six or more records exist.

To add an approved photograph, place an optimised image in `public/media/`, add a `MediaItem`
with English and Kannada alt text, a `credit` naming the rights holder and permission, and
`placeholder: false`.

The official portrait is registered as `portraitRecord` in `records.ts` (original photograph
plus a background-removed cut-out in `public/images/portrait/`, with credit and permission
reference). To replace it, swap the files and update the dimensions. Setting the record to
`null` falls back to a typographic monogram composition. A generated likeness or a stock
photograph of another person must never be used.

## Design system

Tokens are defined once in `src/app/globals.css` (`@theme` and `:root`): colours (midnight
navy `#071426`, executive blue `#0B1F3A`, royal `#315FEA`, champagne gold `#C9AD78`, ivory
`#F5F3EE`, plus AA-safe text variants `gold-ink` and `royal-soft`), type families, radii,
shadows, gradients, spacing and motion durations/easings.

Signature components: a floating pill header; a mesh-gradient hero with the cut-out portrait
on a glowing ring and floating glass cards; a credentials bar; an "at a glance" bento grid whose
figures are all computed from the content records; a horizontal, scroll-snapped journey rail;
gradient-border cards with a cursor spotlight (`.card-glow`, `.card-soft`); pill eyebrows; and
gold gradient display text.

Type: Manrope (headings), DM Serif Display (editorial accents), Inter (body), Noto Sans
Kannada (Kannada, with taller line heights and no letter-spacing or uppercase transforms).

The "BC" monogram is a proposed design element for this personal site only. It is not an
official logo and is kept separate from any university branding.

### 3D

- **Home hero:** a rotating DNA double helix of glowing gold and blue particles, with an orbiting
  halo and a star field, placed behind the cut-out portrait (`src/components/three/engine.ts`).
- **Inner page headers:** a rotating "knowledge network" globe (nodes on a sphere joined to their
  nearest neighbours; seven gold nodes nod to the seven stated priorities) with an orbit ring.
- Both respond to the pointer and to scrolling. Cards tilt in 3D toward the cursor
  (`Spotlight`), headlines rise with a 3D rotation, and sections rotate into place on scroll.
- **Performance and accessibility safeguards:** three.js is downloaded only after the first
  scroll, touch, mouse move or key press, so it never competes with page load; rendering pauses
  when the scene is off-screen or the tab is hidden; phones render at ~30 fps with a lower pixel
  ratio and no antialiasing; software-only WebGL (no GPU) is skipped; reduced motion gets one
  still frame; without WebGL the CSS backdrop remains. The canvas is `aria-hidden`.
- Automated browsers have no GPU, so e2e tests opt in to the software renderer with
  `window.__allowSoftware3D = true`.

### Motion

- Hero: background fade → portrait mask reveal → staggered name, headline, role, copy and
  CTAs, all within ~1.5s, in CSS so content is visible immediately from server HTML.
- Scroll reveals on section headings, timeline entries, cards and vision sections only.
  Content is visible without JavaScript; only below-the-fold elements are hidden until they
  enter the viewport.
- Parallax on decorative layers only, disabled on touch/small screens.
- `prefers-reduced-motion: reduce` removes entrance animations, reveals and parallax; all
  controls keep working.

## Accessibility

Targets WCAG 2.2 AA: semantic landmarks, one `h1` per page, skip link, visible focus styles,
keyboard-operable disclosure dropdowns, a focus-trapped mobile menu and lightbox (Escape
closes and focus returns), `lang` on every page and on mixed-language fragments, accessible
names for icon-only buttons, and no information conveyed by colour alone. Automated axe checks
run on all 16 pages in the e2e suite.
