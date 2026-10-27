# LifeOS Digital

A digital products and productivity platform: interactive tools, a digital product marketplace, an optional Premium membership with a resource library, and an affiliate-style Referral Centre with a configurable three-level structure.

> **Status: MVP in demo mode.** Payments run against a mock provider, commissions are recorded in test mode only, and payouts are disabled in code. No real money can move. See [Production requirements](#production-requirements) before any launch.

---

## Contents

- [What's included](#whats-included)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Demo accounts](#demo-accounts)
- [Environment variables](#environment-variables)
- [Demo mode and safety guarantees](#demo-mode-and-safety-guarantees)
- [Architecture](#architecture)
- [Testing](#testing)
- [Deployment](#deployment)
- [Production requirements](#production-requirements)
- [Known limitations](#known-limitations)

---

## What's included

**Public website**: homepage with a product-preview hero, Explore, Digital Tools directory and tool pages, Marketplace and product pages, Membership comparison, How It Works, Affiliate Programme, About, Help Centre, Contact (stored, rate-limited), and draft legal pages (Privacy, Terms, Refund Policy, Affiliate Disclosure), all marked *pending legal review*.

**Authentication**: sign up (with optional referral code), sign in, sign out, password visibility toggle, validation, rate limiting, forgot/reset password (the reset link is shown on screen outside production because no email provider is configured), and a four-step onboarding (welcome → interests → dashboard sections → enter).

**App** (`/app`): collapsible sidebar, ⌘K search palette, notifications, avatar menu, mobile navigation, skeleton loading states, plus:

| Area | What works |
| --- | --- |
| Dashboard | Personalised sections chosen during onboarding: quick tools, recently viewed, recommendations, membership, recent purchases, referral overview |
| Digital Tools | Searchable/filterable directory; **6 interactive tools**: AI Writing Workspace, Resume Builder, Business Proposal Builder (Premium), Personal Budget Planner, Content Planner (Premium), Productivity Workspace; 2 preset AI workflows; 2 honestly labelled *planned* tools |
| Marketplace | 13 sample products (12 paid + 1 free), search, category filter, sort, grid/list, product pages with contents, file list, licence and a real file excerpt preview |
| Cart & checkout | Cart, server-priced orders with tax placeholder, mock payment simulator (success / failure / retry / cancel), success and failure screens |
| Library | Purchased products and Premium-included products, downloads via expiring signed links |
| Resources | Four collections of guides; Premium items gated on the server |
| Orders | Purchase history with payments and refunds |
| Membership | Current plan, benefits, billing status, renewal date, upgrade, cancel at period end, resume |
| Referral Centre | Opt-in, referral link (copy/share), direct and network counts, eligible sales, pending/approved/reversed commissions, activity, test payout requests and history |
| Settings | Profile, interests and dashboard sections, password change, active sessions |

**Admin** (`/admin`, admin role only): overview with safety status, products (create/edit/publish/archive), categories, membership plans, orders and refunds, members (suspend/reinstate, grant products), affiliate programme settings and commission levels, commission ledger (approve/reverse), payout review, reports, platform settings, and the audit log.

---

## Tech stack

- **Next.js 16** (App Router, Server Actions, Cache Components / Partial Prerendering), **React 19**, **TypeScript**
- **Tailwind CSS v4** with a custom token-based design system, **Radix UI** primitives (dialog, dropdown, switch), **Lucide** icons, **Sonner** toasts
- **PostgreSQL** + **Prisma 6**
- **Zod** validation, **Vitest** tests
- Fonts: Geist (bundled via `geist`) and Instrument Serif (bundled locally, OFL)
- Optional: **Anthropic API** (`@anthropic-ai/sdk`) for the AI Writing Workspace

---

## Getting started

**Prerequisites:** Node.js 20.9+ (22 recommended) and PostgreSQL 14+.

```bash
# 1. Start PostgreSQL. Either use your own instance or:
docker compose up -d          # creates the lifeos and lifeos_test databases

# 2. Install dependencies
npm install

# 3. Configure the environment
cp .env.example .env          # defaults match docker-compose

# 4. Create the schema and load sample data
npm run db:migrate            # prisma migrate dev
npm run db:seed               # WIPES the database and loads demo data

# 5. Run
npm run dev                   # http://localhost:3000
```

Useful scripts:

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Develop, build for production, serve the build |
| `npm run lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `npm test` | Unit tests (business rules, no database) |
| `npm run test:integration` | Database tests against `DATABASE_URL_TEST` |
| `npm run db:migrate` / `db:deploy` | Create/apply migrations (dev) / apply migrations (prod) |
| `npm run db:seed` | Reset the dev database and load sample data (refuses in production) |
| `npx tsx scripts/send-test-webhook.ts <orderId> [succeeded\|failed\|refunded]` | Deliver a correctly signed payment webhook for a mock order |

---

## Demo accounts

Created by `npm run db:seed`, and shown on the sign-in page while `DEMO_MODE=true`:

| Account | Email | Password | Notes |
| --- | --- | --- | --- |
| Premium member | `demo@lifeos.demo` | `demo1234` | Premium monthly, affiliate with a 3-level sample network, purchases, test commissions and a sample payout |
| Free member | `free@lifeos.demo` | `demo1234` | Free plan, one purchase, one unpaid order |
| Admin | `admin@lifeos.demo` | `admin1234` | Full admin area |

Every seeded row is flagged (`isSampleData`, `isTest`) and labelled *Sample*, *Demo data* or *Test* in the interface. There are no testimonials, ratings or sales counts anywhere.

---

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `DATABASE_URL_TEST` | tests | Separate database for `npm run test:integration` (must not be the dev database) |
| `APP_URL` | yes | Public base URL, used for referral links |
| `DEMO_MODE` | no | `"true"` shows the demo banner, demo account hints and labels |
| `DOWNLOAD_SIGNING_SECRET` | yes | HMAC secret for expiring download links. In production it must be at least 32 characters and not the placeholder, otherwise downloads fail closed |
| `PAYMENT_PROVIDER` | no | `"mock"` (the only provider implemented) |
| `ALLOW_MOCK_PAYMENTS_IN_PRODUCTION` | no | Leave `"false"`. Set `"true"` only for a staging demo |
| `PAYMENT_WEBHOOK_SECRET` | yes, for webhooks | HMAC secret for `POST /api/webhooks/payments`; the endpoint returns 503 when unset |
| `ANTHROPIC_API_KEY` | no | Enables AI drafting in the writing tool. Without it the tool runs a clearly labelled local fallback |
| `AI_MODEL` | no | Defaults to `claude-opus-5-5` |
| `PRIVATE_STORAGE_DIR` | no | Directory for paid files, outside `/public`. Default `./storage/private` |

Generate secrets with `openssl rand -base64 32`. Secrets are only read on the server (`src/lib/server/env.ts`) and never passed to client components.

---

## Demo mode and safety guarantees

These hold regardless of configuration, and most are enforced in code rather than settings:

1. **No accidental real payments.** The mock provider is the only one implemented. It is refused when `NODE_ENV=production` unless `ALLOW_MOCK_PAYMENTS_IN_PRODUCTION=true`; checkout then shows "Payments are not available" and grants nothing.
2. **No fake success.** Success screens render only when the server has marked the order `PAID`. Entitlements are created only inside the fulfilment transaction.
3. **No live commissions.** `CommissionMode` has two values, `DISABLED` and `TEST`. There is no live mode, so production accrual requires a schema and code change after legal and financial approval. Every commission row is `isTest = true`.
4. **No payouts.** `PAYOUTS_ENABLED = false` in `src/lib/core/affiliate.ts`. No code path transitions a commission to `PAID` or moves money. Payout requests are recorded and reviewed as tests only.
5. **Commissions only on verified product sales.** Never on sign-ups, recruitment, memberships or free products.

---

## Architecture

```
prisma/                 schema, migrations (with CHECK constraints), seed + sample catalogue
src/
  app/
    (marketing)/        public site
    (auth)/             sign-in, sign-up, password reset + auth server actions
    onboarding/
    app/                authenticated application
    admin/              admin area
    api/                search, writing tool, downloads, files, payment webhook
    r/[code]/           referral link handler
  actions/              server actions (commerce, affiliate, notifications, admin/*)
  components/           ui/ primitives and feature components
  lib/
    domain/             pure business rules (money, pricing, commissions, referrals, signing,
                        passwords, rate limiter); fully unit tested, no I/O
    core/               database services (orders/fulfilment, affiliate, membership, audit);
                        shared by the app, seed script and integration tests
    server/             server-only: auth/session DAL, env, cached catalogue reads, storage
  proxy.ts              optimistic redirect for /app and /admin (no authorisation decisions)
tests/unit, tests/integration
```

### Money
All amounts are integer **paise** (`…InPaise` columns). Rates are integer **basis points**. Tax is computed once on the subtotal. Commission amounts are floored. Order items snapshot names and prices.

### Authentication and authorisation
- Passwords are hashed with **scrypt** (Node built-in). Sessions are random 256-bit tokens stored as SHA-256 hashes, in an `httpOnly`, `SameSite=Lax` cookie (`Secure` in production), with a 30-day expiry.
- `src/lib/server/auth.ts` is the data access layer. `requireUser()`, `requireAdmin()` and `assertAdmin()` read the user and role **from the database on every request and action**. Suspended users are treated as signed out. The browser never supplies a role.
- Non-admins visiting `/admin` get a 404 and the admin area is never advertised to them. Every admin page calls `requireAdmin()` and every admin action calls `assertAdmin()`.
- Rate limits cover sign-in, sign-up, password reset, checkout, the writing API, contact, payout requests and webhooks. `safeNext()` prevents open redirects.

### Orders, payments and fulfilment
1. `createOrder()` prices everything on the server from the database, rejects unpublished or already-owned items, and creates a `PENDING` order with a `CREATED` payment.
2. Payment is confirmed by either the **dev simulator** (server action, mock orders only, refused where mock payments aren't allowed) or a **signed webhook**.
3. `fulfilOrder()` runs in a transaction holding a `SELECT … FOR UPDATE` lock on the order. It checks the amount, then marks the order paid, grants entitlements or a subscription, clears the cart and accrues commissions. A second call is a no-op. Integration tests cover three concurrent calls producing exactly one set of records.
4. `refundOrder()` revokes entitlements, ends memberships bought with the order, reverses unpaid commissions with negative ledger entries, and flags any already-paid commission for clawback in the audit log.

**Webhook contract** (`POST /api/webhooks/payments`): the JSON body is signed as `hex(HMAC-SHA256(PAYMENT_WEBHOOK_SECRET, rawBody))` in `x-lifeos-signature`. Event types are `payment.succeeded`, `payment.failed` and `refund.succeeded`. Each `(provider, eventId)` is processed once, and events are recorded only after successful processing so the provider can retry.

### Digital assets
Files live in `PRIVATE_STORAGE_DIR`, never in `/public`. A download is a two-step process:
- `/api/downloads/:assetId` checks the session and entitlement (purchase, or Premium for Premium-included products), then redirects to a 5-minute HMAC-signed link.
- `/api/files?token=` verifies the token, re-checks access (a refund revokes it immediately) and streams the file with `Cache-Control: no-store`.

Path traversal is rejected.

### Referral programme
- `/r/CODE` stores the code in an `httpOnly` cookie for the attribution window. Attribution happens server-side at sign-up and is rejected when:
  - the code is unknown;
  - the referrer is suspended;
  - the programme is off;
  - it's a self-referral, detected by comparing canonical mailboxes (Gmail dots and `+tags` are normalised).

  A database `CHECK` also forbids `referrerId = referredUserId`, and each user can be referred only once.
- On a verified sale, the buyer's upline is resolved up to 3 levels (cycle-safe). `computeCommissions()` then applies these rules:
  - the programme must be on and in test mode;
  - only `PRODUCT` items marked commission-eligible count;
  - the level must be enabled;
  - the beneficiary must be active, opted in, and not the buyer.
- `@@unique([orderItemId, level])` prevents duplicate commissions. `CommissionLedgerEntry` is append-only (`ACCRUED`, `APPROVED`, `REVERSED`). Approval respects the refund hold period, unless an admin explicitly overrides it, which is audited.
- Initial test rates are 15% / 5% / 2%. They are configurable per level in Admin → Programme settings, and validated (≤ 50% per level and combined).

### Caching
Cache Components is enabled. Public catalogue reads (`src/lib/server/catalog.ts`) use `'use cache'` with tags (`catalog`, `plans`, `resources`, `affiliate-settings`) that admin actions invalidate with `updateTag`. Everything session-dependent renders at request time inside Suspense boundaries, with a `loading.tsx` skeleton per route.

### AI Writing Workspace
`POST /api/tools/writing` requires a signed-in user and is rate limited. With `ANTHROPIC_API_KEY` set, it calls Claude through the official SDK (key stays server-side; refusal stop reasons are handled; server-side model fallback is enabled). Without a key, it uses `src/lib/tools/local-writer.ts`, a deterministic rule-based formatter. The UI clearly labels this as *Local demo mode — no AI service connected*.

---

## Testing

```bash
npm test                    # unit: commission rules, pricing, money, signatures, tokens,
                            #       referral rules, passwords, rate limiting, redirects, writer
npm run test:integration    # DB: fulfilment, idempotency under concurrency, amount checks,
                            #     3-level accrual, disabled mode, memberships excluded,
                            #     refunds/reversals, hold period, self-referral constraints,
                            #     payout requests never paid
```

Integration tests apply migrations to `DATABASE_URL_TEST` (`prisma migrate deploy`) and truncate its tables between tests. They refuse to run if `DATABASE_URL_TEST` equals `DATABASE_URL` or names the `lifeos` dev database.

---

## Deployment

Any Node.js host that runs `next start` works (Vercel, Render, Fly.io, a VM):

1. Provision PostgreSQL and set all [environment variables](#environment-variables). Set `DEMO_MODE` to anything but `"true"`, and use strong secrets.
2. `npm ci && npm run db:deploy && npm run build && npm start`. The build reads the catalogue to prerender public pages, so `DATABASE_URL` must be reachable at build time.
3. Provide persistent private storage for `PRIVATE_STORAGE_DIR`, or replace `src/lib/server/storage.ts` with an object store (recommended, see below).
4. **Do not run `npm run db:seed` against production.** It wipes data, and it refuses unless `ALLOW_SEED_IN_PRODUCTION=true`.

---

## Production requirements

Required before launch. These are not implemented, or are implemented only as development fallbacks:

- **Payment provider.** Implement a real adapter (e.g. Razorpay or Stripe): server-side order/intent creation, verification of the provider's own webhook signature, and mapping into the existing `fulfilOrder` / `failOrder` / `refundOrder` functions. The webhook route documents the contract. Admin refunds for live orders must call the provider's refund API.
- **Recurring billing.** Subscriptions currently run for one paid period and do not auto-renew. You'll need provider subscriptions, renewal webhooks, dunning and proration rules.
- **Email.** Password reset links, receipts and notifications need a transactional email provider. Remove the dev-only on-screen reset link path, which is already disabled in production.
- **Tax.** Replace the placeholder 18% GST with advice from a tax professional, and add GST-compliant invoices (GSTIN, HSN/SAC, place of supply).
- **Legal review.** Privacy, Terms, Refund Policy and Affiliate Disclosure are drafts. Have the compensation plan reviewed for compliance, including India's Direct Selling Rules and prize-chit/money-circulation laws, before enabling any live commissions or payouts.
- **Affiliate payouts.** After approval you'll need payee KYC, PAN/TDS handling, payout rails, a `LIVE` commission mode (schema + code change) and clawback handling.
- **Storage.** Move paid assets to private object storage with short-lived pre-signed URLs, and add admin asset upload (currently read-only).
- **Rate limiting.** It is in-memory per instance. Use Redis or a similar shared store when running multiple instances.
- **Hardening.** Add security headers/CSP, error monitoring, structured logging, backups, an account deletion workflow (currently routed to support), and a data-retention policy.

## Known limitations

- Pages under `/app/*` and `/admin/*` that call `notFound()` after streaming starts (unknown slugs, non-admins on `/admin`) render the 404 page with HTTP status 200. No protected content is sent.
- Tool documents (resumes, proposals, plans) are saved in the browser's `localStorage`, not on the server.
- Re-clicking *Buy now* within 24 hours reuses an identical unpaid order at its original price.
- Prisma 6 warns that `package.json#prisma` (seed config) is deprecated in favour of `prisma.config.ts` in Prisma 7.
