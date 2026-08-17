import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import { buildServer } from '../dist/app.js';
import { loadConfig } from '../dist/config.js';
import { ApiContext } from '../dist/context.js';

/**
 * Transport-level tests.
 *
 * These exist to pin the guarantees that are easy to break from the HTTP layer:
 * who may call what, what a cross-tenant read looks like, and whether a blocked
 * workflow explains itself. They use fastify's inject(), so no port is bound.
 */

const KEY = { 'x-bid-api-key': 'bid_demo_key' };
const ABC = 'BID-BUS-00104';
const XYZ = 'BID-BUS-00231';

let app;
let context;

before(async () => {
  // Explicitly in-memory. Importing @prisma/client loads the repository's .env
  // into process.env as a side effect, so a DATABASE_URL nobody passed would
  // otherwise silently point these tests at the developer's real database.
  context = await ApiContext.create(
    loadConfig({ ...process.env, BID_PERSISTENCE: 'memory', REQUEST_LOGGING: 'false' }),
  );
  app = await buildServer(context);
  await app.ready();
});

after(async () => {
  await app.close();
});

const asOrg = (bidId) => ({ ...KEY, 'x-bid-act-as': bidId });
const json = (response) => JSON.parse(response.body);

async function policyIdByName(name) {
  const response = await app.inject({ method: 'GET', url: '/v1/policies', headers: KEY });
  return json(response).data.find((policy) => policy.name === name).id;
}

test('the API refuses unauthenticated and unknown-key requests', async () => {
  const anonymous = await app.inject({ method: 'GET', url: '/v1/relationships' });
  assert.equal(anonymous.statusCode, 401);
  assert.equal(json(anonymous).error.code, 'UNAUTHORIZED');

  const badKey = await app.inject({ method: 'GET', url: '/v1/relationships', headers: { 'x-bid-api-key': 'nope' } });
  assert.equal(badKey.statusCode, 401);
});

test('public routes need no key and never carry restricted material', async () => {
  const profile = await app.inject({ method: 'GET', url: `/v1/public/profiles/${XYZ}` });
  assert.equal(profile.statusCode, 200);
  const body = profile.body;
  assert.ok(body.includes('verifiedAttributes'));
  assert.ok(!body.includes('RESTRICTED'), 'no restricted classification leaks');
  assert.ok(!body.includes('payloadHash'), 'no evidence internals leak');
  assert.ok(json(profile).data.disclaimer.includes('not a government authority'));

  const card = await app.inject({ method: 'GET', url: `/v1/public/cards/${XYZ}` });
  assert.equal(card.statusCode, 200);
  assert.equal(json(card).data.status, 'BID VERIFIED');
});

test('another tenant’s records are reported as absent, not forbidden', async () => {
  const abcRequests = await app.inject({ method: 'GET', url: '/v1/verification-requests', headers: asOrg(ABC) });
  const someId = json(abcRequests).data[0].id;

  const asOther = await app.inject({ method: 'GET', url: `/v1/verification-requests/${someId}`, headers: asOrg('BID-BUS-00312') });
  assert.equal(asOther.statusCode, 404, 'existence itself is not disclosed across tenants');

  const relationships = await app.inject({ method: 'GET', url: '/v1/relationships', headers: asOrg(XYZ) });
  assert.equal(json(relationships).count, 0, 'a member sees only its own workspace');
});

test('a member workspace cannot initiate verification, and is told why', async () => {
  const policyId = await policyIdByName('Standard Supplier Policy');
  const response = await app.inject({
    method: 'POST',
    url: '/v1/verification-requests',
    headers: asOrg(XYZ),
    payload: { subjectName: 'Some Vendor Ltd', relationshipType: 'SUPPLIER', policyId },
  });
  assert.equal(response.statusCode, 403);
  assert.equal(json(response).error.reason, 'ENTITLEMENT');
  assert.match(json(response).error.message, /plan/i);
});

test('a customer workspace can run the full onboarding flow', async () => {
  const policyId = await policyIdByName('Standard Supplier Policy');

  const invitation = await app.inject({
    method: 'POST',
    url: '/v1/invitations',
    headers: asOrg(ABC),
    payload: {
      organizationName: 'Test Fasteners Ltd',
      email: 'contracts@test-fasteners.example',
      relationshipType: 'SUPPLIER',
      policyId,
    },
  });
  assert.equal(invitation.statusCode, 201);
  const { invitationId, verificationId, counterparty } = json(invitation).data;

  const accepted = await app.inject({
    method: 'POST',
    url: `/v1/invitations/${invitationId}/accept`,
    headers: asOrg(counterparty.bidId),
  });
  assert.equal(accepted.statusCode, 200);
  assert.equal(json(accepted).data.commercialState, 'MEMBER', 'accepting makes a member, never a customer');

  const run = await app.inject({
    method: 'POST',
    url: `/v1/verification-requests/${verificationId}/run`,
    headers: asOrg(ABC),
    payload: { mode: 'ALL' },
  });
  assert.equal(run.statusCode, 200);
  const result = json(run).data;
  assert.ok(['COMPLETED', 'CREDENTIAL_ISSUED', 'REVIEW', 'REQUIRES_REVIEW'].includes(result.status));
  assert.ok(result.assessment, 'an assessment is produced');
  assert.ok(result.assessment.explanation.length > 40, 'the assessment explains itself');

  const evidence = await app.inject({
    method: 'GET',
    url: `/v1/verification-requests/${verificationId}/evidence`,
    headers: asOrg(ABC),
  });
  const evidenceBody = json(evidence);
  assert.equal(evidenceBody.redacted, false);
  assert.ok(evidenceBody.count > 0);
  for (const item of evidenceBody.data) {
    assert.ok(item.source && item.provider && item.checkedAt && item.reference, 'evidence carries its provenance');
  }

  // The subject sees the same verification, filtered to its clearance.
  const asSubject = await app.inject({
    method: 'GET',
    url: `/v1/verification-requests/${verificationId}/evidence`,
    headers: asOrg(counterparty.bidId),
  });
  assert.equal(asSubject.statusCode, 200);
  assert.equal(json(asSubject).redacted, true);
});

test('documents gate the run, and only the right party may act on them', async () => {
  const policyId = await policyIdByName('Critical Contractor Policy');

  const invitation = await app.inject({
    method: 'POST',
    url: '/v1/invitations',
    headers: asOrg(ABC),
    payload: {
      organizationName: 'Test Site Services',
      email: 'ops@test-site.example',
      relationshipType: 'CONTRACTOR',
      policyId,
    },
  });
  const { invitationId, verificationId, counterparty } = json(invitation).data;
  await app.inject({ method: 'POST', url: `/v1/invitations/${invitationId}/accept`, headers: asOrg(counterparty.bidId) });

  const documents = await app.inject({
    method: 'GET',
    url: `/v1/verification-requests/${verificationId}/documents`,
    headers: asOrg(ABC),
  });
  const documentBody = json(documents);
  assert.ok(documentBody.outstanding > 0, 'the policy turns into obligations on the subject');

  const blocked = await app.inject({
    method: 'POST',
    url: `/v1/verification-requests/${verificationId}/run`,
    headers: asOrg(ABC),
    payload: { mode: 'ALL' },
  });
  assert.equal(blocked.statusCode, 409);
  assert.equal(json(blocked).error.code, 'VERIFICATION_BLOCKED');
  assert.equal(json(blocked).error.blockedBy, 'DOCUMENTS');
  assert.ok(json(blocked).error.outstanding.length > 0, 'the caller is told exactly what is missing');

  const required = documentBody.data.filter((document) => document.required);

  const requesterAttempt = await app.inject({
    method: 'POST',
    url: `/v1/verification-requests/${verificationId}/documents/${required[0].id}`,
    headers: asOrg(ABC),
    payload: { fileName: 'not-mine.pdf' },
  });
  assert.equal(requesterAttempt.statusCode, 403, 'only the subject may provide its own documents');

  for (const document of required) {
    const provided = await app.inject({
      method: 'POST',
      url: `/v1/verification-requests/${verificationId}/documents/${document.id}`,
      headers: asOrg(counterparty.bidId),
      payload: { fileName: `${document.code}.pdf`, sizeBytes: 210_000 },
    });
    assert.equal(provided.statusCode, 200);
  }

  const subjectReviewAttempt = await app.inject({
    method: 'POST',
    url: `/v1/verification-requests/${verificationId}/documents/${required[0].id}/review`,
    headers: asOrg(counterparty.bidId),
    payload: { accept: true, note: 'reviewing my own paperwork' },
  });
  assert.equal(subjectReviewAttempt.statusCode, 403, 'only the requester may review');

  const unblocked = await app.inject({
    method: 'POST',
    url: `/v1/verification-requests/${verificationId}/run`,
    headers: asOrg(ABC),
    payload: { mode: 'ALL' },
  });
  assert.equal(unblocked.statusCode, 200);
  assert.equal(json(unblocked).data.outstandingDocuments, 0);
});

test('BGV requires the entitlement and will not execute without consent', async () => {
  const policyId = await policyIdByName('Candidate BGV Policy');

  const denied = await app.inject({
    method: 'POST',
    url: '/v1/bgv/requests',
    headers: asOrg(XYZ),
    payload: { fullName: 'Test Candidate', email: 'candidate@example.com', phone: '9999999999', policyId },
  });
  assert.equal(denied.statusCode, 403, 'a member cannot run background verification');

  const created = await app.inject({
    method: 'POST',
    url: '/v1/bgv/requests',
    headers: asOrg(ABC),
    payload: { fullName: 'Test Candidate', email: 'candidate@example.com', phone: '9999999999', policyId },
  });
  assert.equal(created.statusCode, 201);
  const { verificationId, consent } = json(created).data;
  assert.equal(consent.status, 'REQUESTED');
  assert.ok(consent.scope.length > 0, 'the consent names the checks it covers');

  const blocked = await app.inject({
    method: 'POST',
    url: `/v1/verification-requests/${verificationId}/run`,
    headers: asOrg(ABC),
    payload: { mode: 'ALL' },
  });
  assert.equal(blocked.statusCode, 409);
  assert.ok(['CONSENT', 'DOCUMENTS'].includes(json(blocked).error.blockedBy));
});

test('the resource index and health endpoint describe the running service', async () => {
  const index = await app.inject({ method: 'GET', url: '/v1' });
  assert.equal(index.statusCode, 200);
  assert.ok(json(index).resources.length > 30);

  const health = await app.inject({ method: 'GET', url: '/health' });
  assert.equal(json(health).status, 'ok');
  assert.ok(json(health).organizations > 0);
});

test('unknown routes return a structured 404', async () => {
  const response = await app.inject({ method: 'GET', url: '/v1/nope', headers: KEY });
  assert.equal(response.statusCode, 404);
  assert.equal(json(response).error.code, 'NOT_FOUND');
});
