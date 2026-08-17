import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import { buildServer } from '../dist/app.js';
import { loadConfig } from '../dist/config.js';
import { ApiContext } from '../dist/context.js';

/**
 * Durability tests.
 *
 * These are the only tests that touch a real database. They run against
 * BID_TEST_DATABASE_URL and are skipped when it is not set, so `npm test` stays
 * runnable without PostgreSQL. Nothing here truncates anything: each assertion
 * is about rows this file created, so pointing it at a populated development
 * database is safe.
 *
 *   BID_TEST_DATABASE_URL=postgresql://bid:bid@127.0.0.1:5432/bidtrust npm test
 */
const DATABASE_URL = process.env.BID_TEST_DATABASE_URL;
const skip = DATABASE_URL ? false : 'set BID_TEST_DATABASE_URL to run durability tests';

const KEY = { 'x-bid-api-key': 'bid_demo_key' };
const json = (response) => JSON.parse(response.body);

const config = () =>
  loadConfig({ BID_PERSISTENCE: 'postgres', DATABASE_URL, REQUEST_LOGGING: 'false' });

/** A process lifetime: boot, do something, shut down cleanly. */
async function withApi(body) {
  const context = await ApiContext.create(config());
  const app = await buildServer(context);
  await app.ready();
  try {
    return await body(app, context);
  } finally {
    await app.close();
    await context.close();
  }
}

let unique;

before(() => {
  unique = `Durability ${process.pid}-${process.hrtime.bigint()}`;
});

after(async () => {
  // Nothing to tear down: the records stay, which is the point of the feature.
});

test('a record created over HTTP survives a restart', { skip }, async () => {
  const created = await withApi(async (app) => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/organizations',
      headers: { ...KEY, 'content-type': 'application/json' },
      payload: { legalName: `${unique} Supplies Private Limited`, industry: 'MANUFACTURING', country: 'IN' },
    });
    assert.equal(response.statusCode, 201);
    return json(response).data;
  });

  await withApi(async (app) => {
    const response = await app.inject({ method: 'GET', url: `/v1/organizations/${created.bidId}`, headers: KEY });
    assert.equal(response.statusCode, 200, 'the organization is readable in a new process');
    assert.equal(json(response).data.legalName, created.legalName);
  });
});

test('a fresh process does not reissue identifiers', { skip }, async () => {
  const first = await withApi(async (app) =>
    json(
      await app.inject({
        method: 'POST',
        url: '/v1/organizations',
        headers: { ...KEY, 'content-type': 'application/json' },
        payload: { legalName: `${unique} Trading Private Limited`, industry: 'GENERIC', country: 'IN' },
      }),
    ).data,
  );

  const second = await withApi(async (app) =>
    json(
      await app.inject({
        method: 'POST',
        url: '/v1/organizations',
        headers: { ...KEY, 'content-type': 'application/json' },
        payload: { legalName: `${unique} Freight Private Limited`, industry: 'LOGISTICS', country: 'IN' },
      }),
    ).data,
  );

  assert.notEqual(second.id, first.id, 'surrogate keys continue across restarts');
  assert.notEqual(second.bidId, first.bidId, 'BID IDs continue across restarts');
});

test('a completed verification is stored with its evidence and assessment', { skip }, async () => {
  const subject = await withApi(async (app) =>
    json(
      await app.inject({
        method: 'POST',
        url: '/v1/organizations',
        headers: { ...KEY, 'content-type': 'application/json' },
        payload: { legalName: `${unique} Components Private Limited`, industry: 'MANUFACTURING', country: 'IN' },
      }),
    ).data,
  );

  const verificationId = await withApi(async (app) => {
    const policyId = json(await app.inject({ method: 'GET', url: '/v1/policies', headers: KEY })).data[0].id;
    const created = json(
      await app.inject({
        method: 'POST',
        url: '/v1/verification-requests',
        headers: { ...KEY, 'content-type': 'application/json' },
        payload: {
          subjectBidId: subject.bidId,
          subjectName: subject.displayName,
          relationshipType: 'SUPPLIER',
          policyId,
        },
      }),
    ).data;

    const documents = json(
      await app.inject({ method: 'GET', url: `/v1/verification-requests/${created.id}/documents`, headers: KEY }),
    ).data;

    for (const document of documents) {
      await app.inject({
        method: 'POST',
        url: `/v1/verification-requests/${created.id}/documents/${document.id}`,
        headers: { ...KEY, 'content-type': 'application/json', 'x-bid-act-as': subject.bidId },
        payload: { fileName: `${document.code.toLowerCase()}.pdf`, sizeBytes: 1024 },
      });
      await app.inject({
        method: 'POST',
        url: `/v1/verification-requests/${created.id}/documents/${document.id}/review`,
        headers: { ...KEY, 'content-type': 'application/json' },
        payload: { accept: true, note: 'accepted by the durability test' },
      });
    }

    const run = await app.inject({
      method: 'POST',
      url: `/v1/verification-requests/${created.id}/run`,
      headers: { ...KEY, 'content-type': 'application/json' },
      payload: { mode: 'ALL' },
    });
    assert.equal(run.statusCode, 200);
    assert.ok(json(run).data.assessment, 'the run produced an assessment');
    return created.id;
  });

  await withApi(async (app, context) => {
    const response = await app.inject({ method: 'GET', url: `/v1/verification-requests/${verificationId}`, headers: KEY });
    assert.equal(response.statusCode, 200);
    const reloaded = json(response).data;
    assert.ok(reloaded.checks.length > 0, 'checks were reloaded');
    assert.ok(reloaded.assessment, 'the assessment was reloaded');

    const evidence = context.platform.store.evidence.find((item) => item.verificationRequestId === verificationId);
    assert.ok(evidence.length > 0, 'evidence rows were reloaded with their provenance');
    assert.ok(evidence.every((item) => item.payloadHash && item.attribution), 'provenance fields round-trip intact');
  });
});
