import assert from 'node:assert/strict';
import test from 'node:test';
import { seedDemo, BidPlatform, DemoClock, getPolicyTemplate } from '../dist/index.js';

/** Builds a small platform with one requester and one policy. */
async function makePlatform() {
  const platform = new BidPlatform({ clock: new DemoClock('2026-08-17T09:00:00.000Z') });
  const requester = platform.organizations.create({ legalName: 'Requester Ltd', industry: 'IT' });
  const workspace = platform.organizations.claim({ organizationId: requester.id, requesterEnabled: true });
  platform.billing.subscribe({
    workspaceId: workspace.id,
    organizationId: requester.id,
    planId: platform.billing.planByTier('GROWTH').id,
  });
  const policy = platform.policies.createFromTemplate(getPolicyTemplate('STANDARD_SUPPLIER'), {
    workspaceId: workspace.id,
    createdBy: 'test',
  });
  return { platform, requester, workspace, policy };
}

test('an invited counterparty becomes a member, never automatically a customer', async () => {
  const { platform, requester, policy } = await makePlatform();

  const { counterparty, invitation } = platform.inviteCounterparty({
    requesterOrganizationId: requester.id,
    counterpartyName: 'Invitee Industries',
    counterpartyEmail: 'hello@invitee.example',
    relationshipType: 'SUPPLIER',
    policyId: policy.id,
  });
  assert.equal(counterparty.commercialState, 'NON_MEMBER');

  const accepted = platform.acceptInvitation(invitation.id);
  assert.equal(accepted.organization.commercialState, 'MEMBER');
  assert.equal(platform.billing.subscriptionFor(accepted.workspace.id), undefined);
  assert.equal(platform.billing.entitlementsFor(accepted.workspace.id).canInitiateVerification, false);
});

test('running a verification produces evidence, an explainable assessment and a credential', async () => {
  const { platform, requester, policy } = await makePlatform();
  const { invitation, verification } = platform.inviteCounterparty({
    requesterOrganizationId: requester.id,
    counterpartyName: 'Evidence Corp',
    counterpartyEmail: 'ops@evidence.example',
    relationshipType: 'SUPPLIER',
    policyId: policy.id,
  });
  platform.acceptInvitation(invitation.id);

  await platform.runVerification(verification.id);
  const detail = platform.verifications.detail(verification.id);

  assert.ok(detail.checks.length > 0, 'checks were planned');
  assert.equal(detail.checks.filter((check) => check.status === 'PLANNED').length, 0, 'all checks executed');
  assert.equal(detail.evidence.length, detail.checks.length, 'every check produced evidence');
  assert.ok(detail.assessment, 'an assessment exists');
  assert.ok(detail.assessment.explanation.length > 40, 'the assessment explains itself');
  assert.ok(detail.assessment.disclaimer.includes('not a government authority'));

  for (const evidence of detail.evidence) {
    assert.ok(evidence.source, 'evidence names its source');
    assert.ok(evidence.providerName, 'evidence names the provider');
    assert.ok(evidence.checkedAt, 'evidence is timestamped');
    assert.ok(evidence.reference, 'evidence carries a provider reference');
  }

  if (detail.request.decision === 'PENDING') {
    platform.verifications.decide(verification.id, 'APPROVED', 'test approval');
  }
  const after = platform.verifications.get(verification.id);
  assert.ok(after.credentialId, 'approval issues a credential');

  const subject = platform.organizations.require(after.subjectOrganizationId);
  assert.equal(subject.commercialState, 'VERIFIED_MEMBER', 'the subject becomes a verified member, not a customer');
});

test('person checks are blocked until consent is recorded', async () => {
  const { platform, requester, workspace } = await makePlatform();
  const bgvPolicy = platform.policies.createFromTemplate(getPolicyTemplate('CANDIDATE_BGV'), {
    workspaceId: workspace.id,
    createdBy: 'test',
  });
  const person = platform.organizations.createPerson({ fullName: 'Test Candidate', email: 'c@example.com', phone: '9999999999' });
  const request = platform.verifications.create({
    workspaceId: workspace.id,
    requesterOrganizationId: requester.id,
    subjectType: 'PERSON',
    subjectPersonId: person.id,
    subjectName: person.fullName,
    relationshipType: 'CANDIDATE',
    policyId: bgvPolicy.id,
  });

  assert.throws(() => platform.verifications.start(request.id), /consent/i);

  const consent = platform.verifications.requestConsent({ verificationRequestId: request.id });
  assert.deepEqual(consent.status, 'REQUESTED');
  platform.verifications.grantConsent(consent.id);

  const unblocked = platform.verifications.checks(request.id).every((check) => check.status !== 'BLOCKED_ON_CONSENT');
  assert.ok(unblocked, 'granting consent unblocks the planned checks');
});

test('a policy version is sealed once it justifies a completed decision', async () => {
  const { platform, requester, policy } = await makePlatform();
  assert.equal(platform.policies.isSealed(policy.id, 1), false);

  const { invitation, verification } = platform.inviteCounterparty({
    requesterOrganizationId: requester.id,
    counterpartyName: 'Seal Test Ltd',
    counterpartyEmail: 'x@seal.example',
    relationshipType: 'SUPPLIER',
    policyId: policy.id,
  });
  platform.acceptInvitation(invitation.id);
  await platform.runVerification(verification.id);

  assert.equal(platform.policies.isSealed(policy.id, 1), true);

  const next = platform.policies.createVersion(policy.id, { validityDays: 180 });
  assert.equal(next.version, 2);
  assert.equal(platform.policies.version(policy.id, 1).validityDays, 365, 'version 1 is untouched');
});

test('the seeded demo network tells the intended story', async () => {
  const { platform } = await seedDemo();
  const xyz = platform.organizations.byBidId('BID-BUS-00231');
  assert.equal(xyz.commercialState, 'VERIFIED_MEMBER');
  assert.equal(platform.billing.subscriptionFor(platform.organizations.workspaceFor(xyz.id).id), undefined);

  const abc = platform.organizations.byBidId('BID-BUS-00104');
  assert.equal(abc.commercialState, 'CUSTOMER');

  const rstRequest = platform.store.verificationRequests.first((request) => request.subjectName.startsWith('RST'));
  assert.equal(rstRequest.status, 'REQUIRES_REVIEW', 'the exception path is represented in the demo data');
});
