# Implementation and test report

**Date:** 2026-10-29 · **Environment:** Linux container, Node 22.22.0, Chromium 1243
(Playwright 1.63.0) · **Build:** Next.js 16.4.3 production build (`next build` + `next start`)

All results below were actually run on this date. Nothing is reported as passing that was not run.

## Summary

| Check | Command | Result |
| --- | --- | --- |
| TypeScript (strict) | `npm run typecheck` | ✅ 0 errors |
| ESLint (Next core-web-vitals + TS) | `npm run lint` | ✅ 0 errors, 0 warnings |
| Unit, component and content tests | `npm test` | ✅ 32 passed, 5 skipped (the opt-in publication gate) |
| Production build | `npm run build` | ✅ 16 pages + OG images statically generated |
| End-to-end (Playwright, Chromium) | `npm run test:e2e` | ✅ 61 passed (58 desktop project, 3 mobile project) |
| Automated accessibility (axe, WCAG 2.0/2.1/2.2 A+AA tags) | part of e2e | ✅ 0 violations on all 16 pages |
| Publication gate | `npm run content:gate` | ❌ **Fails by design**: facts unverified, sources unchecked, production config not set |
| Lighthouse | see below | Measured on all 16 pages |

## What the automated tests cover

**Content integrity** (`tests/unit/content.test.ts`)
- Qualifications match the source list exactly (credential, start and end years); English
  institution names preserved; credential abbreviations never translated.
- Career periods reproduce the source; overlapping appointments are detected and flagged rather
  than merged; every unconfirmed "present" carries a review note.
- Every record cites a registered source; every published publication needs a DOI, ISBN or URL;
  placeholders never render unless explicitly enabled.
- No first-person quotations; vision copy contains no implementation verbs.
- `en.json` and `kn.json` have identical keys; every Kannada message is non-empty and in Kannada
  script (except intentional Latin such as "English", "DOI"); Kannada long-form copy has the
  same structure as English.

**Library** (`tests/unit/lib.test.ts`): period formatting ("From 2023" until confirmed),
active-path matching, locale paths, canonical + hreflang (`en`, `kn`, `x-default`), JSON-LD
fields and `<` escaping.

**Components**: gallery lightbox (opens a labelled modal dialog, arrow keys, Escape, focus
returns to the trigger, Tab stays inside, Kannada alt text); publication filters and live result
count; mobile menu (aria-expanded, focus moved in and trapped, current page marked, Escape
closes and restores focus); language switcher links to the same page in the other language.

**End-to-end** (`tests/e2e/`)
- All 16 URLs return 200 with the right `lang`, exactly one visible `h1`, canonical, `hreflang`
  alternates, meta description and Open Graph tags, and **no browser-console errors**.
- Unique titles per locale; `/` and `/about` redirect to `/en…`; unknown paths 404.
- Every internal link on every page resolves; every in-page anchor has a target; external links
  use `target="_blank"` with `rel="noopener"`.
- Sitemap lists all 16 URLs with `hreflang`; robots.txt served; JSON-LD valid with no contact
  fields; security headers present and `X-Powered-By` absent.
- Language switcher preserves the page (both directions); hero CTAs reach `/experience` and
  `/vision`; desktop dropdown opens with Enter, moves focus with Tab, closes with Escape and
  returns focus; skip link focuses `<main>`; vision diagram links scroll to each section.
- Publications/media show honest empty states; contact page has no form, `mailto:` or `tel:`.
- Reduced motion leaves no hidden content; pages are readable with JavaScript disabled
  (English and Kannada); header turns solid on scroll.
- No horizontal overflow on any of the 16 pages at 320, 375, 430, 768, 1024, 1440 and 1920px;
  navigation switches between desktop links and the mobile menu at 1024px.
- Mobile (Pixel 7 emulation): menu opens, navigates, closes with Escape and restores focus;
  switches language; touch targets ≥ 44px.

## Lighthouse (mobile preset, simulated throttling)

Measured against a local production server built with `SITE_NOINDEX=false` so that the SEO
category is meaningful. Local measurements exclude real network latency and CDN behaviour; they
are indicative, not field data. Core Web Vitals must be confirmed with field data after launch.

| Page | Perf | A11y | Best practices | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| /en | 95 | 100 | 100 | 100 | 1.1 s | 0 | 260 ms |
| /en/about | 99 | 100 | 100 | 100 | 0.9 s | 0 | 110 ms |
| /en/education | 99 | 100 | 100 | 100 | 0.9 s | 0.001 | 90 ms |
| /en/experience | 93 | 100 | 100 | 100 | 0.9 s | 0 | 310 ms |
| /en/vision | 94 | 100 | 100 | 100 | 1.1 s | 0 | 280 ms |
| /en/publications | 94 | 100 | 100 | 100 | 0.9 s | 0 | 300 ms |
| /en/media | 99 | 100 | 100 | 100 | 0.9 s | 0 | 100 ms |
| /en/contact | 99 | 100 | 100 | 100 | 0.9 s | 0 | 130 ms |
| /kn | 92 | 100 | 100 | 100 | 1.1 s | 0 | 340 ms |
| /kn/about | 95 | 100 | 100 | 100 | 1.1 s | 0 | 260 ms |
| /kn/education | 94 | 100 | 100 | 100 | 0.9 s | 0.001 | 280 ms |
| /kn/experience | 96 | 100 | 100 | 100 | 0.9 s | 0 | 210 ms |
| /kn/vision | 92 | 100 | 100 | 100 | 1.2 s | 0 | 330 ms |
| /kn/publications | 99 | 100 | 100 | 100 | 0.9 s | 0 | 120 ms |
| /kn/media | 99 | 100 | 100 | 100 | 0.9 s | 0 | 150 ms |
| /kn/contact | 98 | 100 | 100 | 100 | 0.9 s | 0 | 170 ms |

Total Blocking Time varied by ±100–200 ms between repeated runs of the same page in this
container. With the default `SITE_NOINDEX=true`, SEO scores 58 — expected, because the page is
deliberately marked `noindex`.

### Issues found and fixed during testing

| Issue | Fix |
| --- | --- |
| Footer's localised `Link` rendered outside the intl provider → 500 on every page | Moved the footer inside `NextIntlClientProvider` |
| OG image renderer rejected a multi-child `<div>` → build failure | Single template-string child |
| axe `label-content-name-mismatch` on the header home link (WCAG 2.5.3) | Replaced `aria-label` with visible name + screen-reader suffix |
| Kannada LCP 4.2 s: the Kannada font was not preloaded | Self-hosted Noto Sans Kannada and preloaded it on `/kn` only → 1.1–1.2 s |
| ~1.1 s of style/layout on Kannada home: scroll reveals forced a layout each (layout thrashing) | Reveal now uses the observer's first callback; blurred orb replaced by a gradient → ~0.3 s |
| Latin text in Kannada pages fell back to a generic font | Removed the generic family from the Kannada stack so Latin falls through to Inter |
| `@axe-core/playwright` pulled a mismatched `playwright-core` | Pinned via npm `overrides` |

## Not tested / known limitations

- **Official sources could not be opened** from the build environment (network policy blocked
  `rguhs.ac.in`). Facts come from the brief; see SOURCE_REGISTER.md.
- **Kannada translations are unreviewed** by a qualified human reviewer.
- Browsers: automated tests ran in Chromium only. Firefox and Safari (incl. iOS Safari) were not
  tested; `backdrop-filter` and `100svh` are supported in current versions of both, but a manual
  pass is recommended.
- No screen-reader testing (NVDA, VoiceOver) was performed; automated axe checks and keyboard
  tests do not replace it.
- The gallery lightbox is covered by component tests with placeholder data; it has no e2e test
  because production builds show the empty state until approved media exists.
- No deployment was performed; production smoke tests are listed in DEPLOYMENT.md.
