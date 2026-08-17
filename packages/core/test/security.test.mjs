import assert from 'node:assert/strict';
import test from 'node:test';
import {
  seedDemo,
  assertPermission,
  hasPermission,
  isVisible,
  maxVisibilityFor,
  generatePolicy,
  compilePlan,
} from '../dist/index.js';

test('a member cannot initiate verification; a customer can', async () => {
  const { platform } = await seedDemo();
  const xyz = platform.organizations.byBidId('BID-BUS-00231');
  const abc = platform.organizations.byBidId('BID-BUS-00104');

  const memberCtx = platform.accessContextFor(xyz.id);
  const customerCtx = platform.accessContextFor(abc.id);

  assert.equal(hasPermission(memberCtx, 'verification:initiate'), false);
  assert.equal(hasPermission(customerCtx, 'verification:initiate'), true);
  assert.throws(() => assertPermission(memberCtx, 'verification:initiate'), /plan/i);
});

test('public viewers only ever reach PUBLIC classification', async () => {
  const { platform } = await seedDemo();
  const xyz = platform.organizations.byBidId('BID-BUS-00231');

  assert.equal(maxVisibilityFor({}), 'PUBLIC');

  const strangerCtx = platform.accessContextFor(platform.organizations.byBidId('BID-BUS-00312').id);
  const asStranger = maxVisibilityFor({ ctx: strangerCtx, subjectOrganizationId: xyz.id });
  assert.equal(asStranger, 'PUBLIC');
  assert.equal(isVisible('RELATIONSHIP_ONLY', asStranger), false);

  const ownerCtx = platform.accessContextFor(xyz.id);
  assert.equal(maxVisibilityFor({ ctx: ownerCtx, subjectOrganizationId: xyz.id }), 'SENSITIVE');
});

test('the public profile never exposes restricted or sensitive evidence', async () => {
  const { platform } = await seedDemo();
  const profile = platform.organizations.publicProfile('BID-BUS-00231');
  const serialized = JSON.stringify(profile);

  assert.ok(profile.verifiedAttributes.length > 0);
  assert.ok(!serialized.includes('payloadHash'), 'no evidence internals leak');
  assert.ok(!serialized.includes('RESTRICTED'), 'no restricted classification appears');
  assert.ok(!serialized.includes('Bank account'), 'sensitive checks are not summarized publicly');
  assert.ok(profile.disclaimer.includes('not a government authority'));
});

test('the digital card carries status only', async () => {
  const { platform } = await seedDemo();
  const card = platform.organizations.digitalCard('BID-BUS-00231');
  assert.equal(card.status, 'BID VERIFIED');
  assert.equal(card.attributes.length, 4);
  const serialized = JSON.stringify(card);
  assert.ok(!serialized.includes('GSTIN'));
  assert.ok(!serialized.includes('reference'));
});

test('search results respect tenant boundaries', async () => {
  const { platform } = await seedDemo();
  const lmn = platform.organizations.byBidId('BID-BUS-00312');
  const ctx = platform.accessContextFor(lmn.id);

  const results = platform.search.search('XYZ', ctx);
  // LMN may see XYZ as a network identity, but not any of ABC's private records.
  for (const result of results) {
    assert.notEqual(result.access, 'PLATFORM_ADMIN');
    if (result.kind === 'VERIFICATION' || result.kind === 'RELATIONSHIP') {
      assert.equal(result.access, 'OWN_WORKSPACE');
    }
  }
});

test('generated policies escalate with risk and stay on the same engine', () => {
  const low = generatePolicy({ target: 'SUPPLIER', industry: 'GENERIC', riskLevel: 'LOW' });
  const critical = generatePolicy({ target: 'SUPPLIER', industry: 'PHARMA', riskLevel: 'CRITICAL' });

  assert.ok(critical.requiredChecks.length > low.requiredChecks.length);
  assert.equal(low.approvalRule, 'AUTO');
  assert.equal(critical.approvalRule, 'DUAL_CONTROL');
  assert.ok(critical.thresholds.autoApproveScore > low.thresholds.autoApproveScore);
  assert.ok(critical.rationale.length >= 4, 'the generator explains its choices');
});

test('a compiled plan is derived entirely from the policy version', async () => {
  const { platform } = await seedDemo();
  const policy = platform.policies.listAll().find((candidate) => candidate.name === 'Critical Supplier Policy');
  const version = platform.policies.currentVersion(policy.id);
  const plan = compilePlan(version);

  assert.equal(plan.checks.length, version.requiredChecks.length + version.optionalChecks.length);
  assert.equal(plan.policyVersion, version.version);
  assert.ok(plan.estimatedCostPaise > 0);
});

test('the audit log is hash-chained in append order', async () => {
  const { platform } = await seedDemo();
  // The chain follows append order, not wall-clock order: the demo clock
  // back-dates seed history, and a tamper-evidence chain must not depend on
  // timestamps it does not control.
  const entries = platform.store.auditLogs.all();
  assert.ok(entries.length > 50, 'the demo produces a substantial audit trail');
  assert.equal(entries[0].previousHash, 'GENESIS');
  for (let index = 1; index < entries.length; index += 1) {
    assert.equal(entries[index].previousHash, entries[index - 1].hash, 'each entry links to its predecessor');
  }
});
