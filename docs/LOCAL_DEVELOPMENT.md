# Running BID Trust locally

Two ways to run it. Both give you the same API; they differ only in whether
anything is written down.

## 1. With PostgreSQL (persistent)

Requires PostgreSQL 16. With Docker:

```bash
docker compose up -d db
```

Without Docker, any local PostgreSQL will do — create a role and a database,
then point `DATABASE_URL` at it.

```bash
cp .env.example .env          # DATABASE_URL is already filled in for the compose db
npm install
npm run db:migrate            # applies prisma/migrations
npm run build
npm run dev:api               # http://localhost:4000
```

The first boot against an empty database writes the fictional demo network and
logs `"seeded":true`. Every boot after that logs `"seeded":false` with the
number of records it loaded:

```json
{"persistence":"postgres","hydratedRecords":530,"seeded":false,"organizations":9}
```

To start over: `npm run db:reset`.

## 2. Without a database (ephemeral)

```bash
BID_PERSISTENCE=memory npm run dev:api
```

The demo network is built in process and discarded on exit. This is what the
test suite and the browser demo use — no database is needed to run either.

## Web app

```bash
npm run dev                   # http://localhost:5173
```

## Checking it works

```bash
curl -s localhost:4000/health

# every request needs a key; the demo key acts as the demo customer
curl -s localhost:4000/v1/organizations -H 'x-bid-api-key: bid_demo_key'

# create something, restart the API, read it back — it is still there
curl -s -X POST localhost:4000/v1/organizations \
  -H 'x-bid-api-key: bid_demo_key' -H 'content-type: application/json' \
  -d '{"legalName":"Example Supplies Private Limited","industry":"MANUFACTURING"}'
```

## Tests

```bash
npm test                      # no database required
BID_TEST_DATABASE_URL=postgresql://bid:bid@127.0.0.1:5432/bidtrust npm test
```

The second form additionally runs `apps/api/test/persistence.test.mjs`, which
proves records survive a process restart. Those tests only assert on rows they
create themselves, so running them against a development database is safe.

## How persistence works

The domain layer is synchronous and has no idea a database exists — that is
what lets the same engine run in the browser. `BidStore` exposes a
`MutationSink`; `PrismaPersistence` implements it, buffers each change, and
flushes them in one transaction ordered by the schema's own foreign keys. The
HTTP layer awaits that flush before responding, so a `201` always means the row
is durable.

At boot the reverse happens: every table is loaded into the store, and the
platform re-derives its BID ID allocator and audit-chain head from the records
themselves. The one piece of state that cannot be re-derived — the surrogate
key counter, because seeded records carry readable keys — is checkpointed in
the `bid_ids` table inside the same transaction as the data it describes.

### A footgun worth knowing

Importing `@prisma/client` loads this repository's `.env` into `process.env` as
a side effect. Anything that must not touch a database has to say so explicitly
with `BID_PERSISTENCE=memory` rather than assume `DATABASE_URL` is unset.
