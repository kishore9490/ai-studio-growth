import { BidPlatform } from '../platform.js';
import { POLICY_TEMPLATES, getPolicyTemplate } from '../policy/policy-templates.js';
import { scriptKey, type ScriptedOutcomes } from '../providers/mock-providers.js';
import { hashPassword } from '../security/passwords.js';
import { addDays } from '../util/clock.js';
import { DemoClock } from './demo-clock.js';

/**
 * Demo environment (Sections 55-57).
 *
 * Every organization and person here is fictional. Provider outcomes are
 * deterministic, so the same story renders on every load: one clean supplier,
 * one in-flight verification, one exception that needs human review, one
 * counterparty that has not accepted yet.
 */

/**
 * Password shared by every seeded account.
 *
 * Deliberately obvious and deliberately exported: this network is fictional,
 * and a demo nobody can sign into is not a demo. Nothing outside the seed sets
 * it, so a real deployment never has an account with this password.
 */
export const DEMO_PASSWORD = 'bid-demo-password';

export const DEMO_BID_IDS = {
  ABC: 'BID-BUS-00104',
  XYZ: 'BID-BUS-00231',
  LMN: 'BID-BUS-00312',
  OPQ: 'BID-BUS-00340',
  RST: 'BID-BUS-00366',
  GHI: 'BID-BUS-00389',
  JKL: 'BID-BUS-00402',
  TUV: 'BID-BUS-00418',
  RAVI: 'BID-PER-00031',
} as const;

/** A supplier with a real-world-shaped gap: statutory + insurance issues. */
const SCRIPTED_OUTCOMES: ScriptedOutcomes = {
  [scriptKey(DEMO_BID_IDS.RST, 'ORG_EPF')]: 'FAIL',
  [scriptKey(DEMO_BID_IDS.RST, 'ORG_INSURANCE')]: 'ATTENTION',
  [scriptKey(DEMO_BID_IDS.RST, 'ORG_LICENCE')]: 'ATTENTION',
  [scriptKey(DEMO_BID_IDS.XYZ, 'ORG_GST')]: 'PASS',
  [scriptKey(DEMO_BID_IDS.XYZ, 'ORG_PAN')]: 'PASS',
  [scriptKey(DEMO_BID_IDS.XYZ, 'ORG_MCA')]: 'PASS',
  [scriptKey(DEMO_BID_IDS.XYZ, 'ORG_SANCTIONS')]: 'PASS',
  [scriptKey(DEMO_BID_IDS.XYZ, 'ORG_ADDRESS')]: 'PASS',
  [scriptKey(DEMO_BID_IDS.XYZ, 'ORG_EPF')]: 'PASS',
  [scriptKey(DEMO_BID_IDS.XYZ, 'ORG_BANK')]: 'PASS',
  [scriptKey(DEMO_BID_IDS.LMN, 'ORG_GST')]: 'PASS',
  [scriptKey(DEMO_BID_IDS.LMN, 'ORG_PAN')]: 'PASS',
  [scriptKey(DEMO_BID_IDS.LMN, 'ORG_MCA')]: 'PASS',
};

export interface DemoHandles {
  platform: BidPlatform;
  clock: DemoClock;
  organizations: {
    abc: string;
    xyz: string;
    lmn: string;
    opq: string;
    rst: string;
  };
  policies: Record<string, string>;
}

const NOW = '2026-08-17T09:30:00.000Z';

export async function createDemoPlatform(now: string = NOW): Promise<BidPlatform> {
  const handles = await seedDemo(now);
  return handles.platform;
}

export async function seedDemo(now: string = NOW): Promise<DemoHandles> {
  const clock = new DemoClock(addDays(now, -180));
  const platform = new BidPlatform({ clock, scriptedProviderOutcomes: SCRIPTED_OUTCOMES });
  const { organizations, policies, verifications, relationships, billing, monitoring, lifecycle, campaigns, store } = platform;

  /* ---------------- users ---------------- */
  const priya = store.users.insert({
    id: 'usr_priya',
    name: 'Priya Nair',
    email: 'priya.nair@abc-technologies.example',
    platformRoles: [],
    mfaEnabled: true,
    createdAt: clock.isoNow(),
    lastLoginAt: addDays(now, -1),
  });
  store.users.insert({
    id: 'usr_anil',
    name: 'Anil Sharma',
    email: 'anil.sharma@xyz-hr.example',
    platformRoles: [],
    mfaEnabled: true,
    createdAt: clock.isoNow(),
    lastLoginAt: addDays(now, -3),
  });
  store.users.insert({
    id: 'usr_admin',
    name: 'BID Platform Admin',
    email: 'admin@bidtrust.in',
    platformRoles: ['BID_ADMIN'],
    mfaEnabled: true,
    createdAt: clock.isoNow(),
    lastLoginAt: addDays(now, -1),
  });

  /* ---------------- BID-published policy templates ---------------- */
  const policyIds: Record<string, string> = {};
  for (const template of POLICY_TEMPLATES) {
    const policy = policies.createFromTemplate(template, { system: true, createdBy: 'BID Trust' });
    policyIds[template.key] = policy.id;
  }

  /* ---------------- ABC Technologies: existing customer ---------------- */
  clock.set(addDays(now, -180));
  const abc = organizations.create({
    legalName: 'ABC Technologies Private Limited',
    displayName: 'ABC Technologies',
    bidId: DEMO_BID_IDS.ABC,
    industry: 'IT',
    city: 'Bengaluru',
    website: 'https://abc-technologies.example',
    description:
      'Enterprise software and managed IT services. Uses BID Trust to verify vendors, staffing partners and contractors before onboarding.',
    lifecycle: 'ACTIVE',
    commercialState: 'CUSTOMER',
    logoColor: '#1e3a8a',
    tags: ['demo', 'requester'],
  });
  organizations.addIdentifier({ organizationId: abc.id, kind: 'GSTIN', value: '29AABCA1234F1Z5', attribution: 'COMPANY_PROVIDED' });
  organizations.addIdentifier({ organizationId: abc.id, kind: 'CIN', value: 'U72200KA2011PTC056789', attribution: 'COMPANY_PROVIDED' });
  const abcWorkspace = organizations.claim({ organizationId: abc.id, workspaceName: 'ABC Technologies', requesterEnabled: true });
  organizations.update(abc.id, { lifecycle: 'ACTIVE' });
  store.memberships.insert({
    id: 'mem_priya',
    workspaceId: abcWorkspace.id,
    userId: priya.id,
    roles: ['OWNER'],
    createdAt: clock.isoNow(),
  });
  const businessPlan = billing.planByTier('BUSINESS');
  billing.subscribe({ workspaceId: abcWorkspace.id, organizationId: abc.id, planId: businessPlan!.id, seats: 12 });
  billing.addCredits(abcWorkspace.id, 1200, 'Included plan credits');
  organizations.setCommercialState(abc.id, 'CUSTOMER', 'seed');

  const abcCtx = platform.accessContextFor(abc.id, { userId: priya.id });

  /* ---------------- ABC → XYZ : the verified member story ---------------- */
  clock.set(addDays(now, -96));
  const xyzOrg = organizations.create({
    legalName: 'XYZ HR Consultants LLP',
    displayName: 'XYZ HR Consultants',
    bidId: DEMO_BID_IDS.XYZ,
    industry: 'RECRUITMENT',
    city: 'Pune',
    website: 'https://xyz-hr.example',
    description:
      'Staffing and HR consultancy placing technology and operations talent. Verified BID Member; evaluating BID Trust for verifying its own supplier network.',
    lifecycle: 'DISCOVERED',
    introducedByOrgId: abc.id,
    logoColor: '#0f766e',
    tags: ['demo', 'member'],
  });
  organizations.addIdentifier({ organizationId: xyzOrg.id, kind: 'GSTIN', value: '27AAFXY9876K1Z2', attribution: 'COMPANY_PROVIDED' });

  const xyzInvite = platform.inviteCounterparty({
    requesterOrganizationId: abc.id,
    counterpartyName: 'XYZ HR Consultants',
    counterpartyEmail: 'anil.sharma@xyz-hr.example',
    counterpartyOrganizationId: xyzOrg.id,
    relationshipType: 'SERVICE_PROVIDER',
    policyId: policyIds.HR_CONSULTANCY_DD,
    actor: abcCtx,
  });

  clock.set(addDays(now, -94));
  platform.acceptInvitation(xyzInvite.invitation.id);
  clock.set(addDays(now, -93));
  // The subject supplies what the policy asked for before any check runs.
  platform.provideAllDocuments(xyzInvite.verification.id);

  clock.set(addDays(now, -92));
  if (xyzInvite.verification) {
    await verifications.runAllChecks(xyzInvite.verification.id);
    const request = verifications.get(xyzInvite.verification.id)!;
    if (request.decision === 'PENDING') {
      verifications.decide(
        request.id,
        'APPROVED',
        'Identity, statutory and screening evidence reviewed and accepted by the compliance team.',
        abcCtx,
      );
    }
  }

  const xyzWorkspace = organizations.workspaceFor(xyzOrg.id)!;
  store.memberships.insert({
    id: 'mem_anil',
    workspaceId: xyzWorkspace.id,
    userId: 'usr_anil',
    roles: ['OWNER'],
    createdAt: clock.isoNow(),
  });

  // ABC monitors its staffing partner continuously.
  const xyzRelationship = store.relationships.first(
    (r) => r.workspaceId === abcWorkspace.id && r.targetOrganizationId === xyzOrg.id,
  );
  if (xyzRelationship) {
    monitoring.enable({
      workspaceId: abcWorkspace.id,
      subjectRef: xyzOrg.bidId,
      relationshipId: xyzRelationship.id,
      frequency: 'QUARTERLY',
      actor: abcCtx,
    });
  }

  /* ---------------- ABC → LMN : verification in flight ---------------- */
  clock.set(addDays(now, -42));
  const lmnOrg = organizations.create({
    legalName: 'LMN Components Private Limited',
    displayName: 'LMN Components',
    bidId: DEMO_BID_IDS.LMN,
    industry: 'MANUFACTURING',
    city: 'Coimbatore',
    website: 'https://lmn-components.example',
    description: 'Precision components manufacturer supplying electronics and industrial assemblies.',
    lifecycle: 'DISCOVERED',
    introducedByOrgId: abc.id,
    logoColor: '#7c2d12',
    tags: ['demo'],
  });
  const lmnInvite = platform.inviteCounterparty({
    requesterOrganizationId: abc.id,
    counterpartyName: 'LMN Components',
    counterpartyEmail: 'contracts@lmn-components.example',
    counterpartyOrganizationId: lmnOrg.id,
    relationshipType: 'SUPPLIER',
    policyId: policyIds.STANDARD_SUPPLIER,
    actor: abcCtx,
  });
  clock.set(addDays(now, -38));
  platform.acceptInvitation(lmnInvite.invitation.id);
  if (lmnInvite.verification) {
    platform.provideAllDocuments(lmnInvite.verification.id);
    verifications.start(lmnInvite.verification.id, abcCtx);
    await verifications.runNextCheck(lmnInvite.verification.id);
    await verifications.runNextCheck(lmnInvite.verification.id);
  }

  /* ---------------- ABC → RST : exception path ---------------- */
  clock.set(addDays(now, -22));
  const rstOrg = organizations.create({
    legalName: 'RST Security Services Private Limited',
    displayName: 'RST Security Services',
    bidId: DEMO_BID_IDS.RST,
    industry: 'CONSTRUCTION',
    city: 'Hyderabad',
    description: 'Manned guarding and facility security contractor deploying workforce on client premises.',
    lifecycle: 'DISCOVERED',
    introducedByOrgId: abc.id,
    logoColor: '#7f1d1d',
    tags: ['demo'],
  });
  const rstInvite = platform.inviteCounterparty({
    requesterOrganizationId: abc.id,
    counterpartyName: 'RST Security Services',
    counterpartyEmail: 'ops@rst-security.example',
    counterpartyOrganizationId: rstOrg.id,
    relationshipType: 'CONTRACTOR',
    policyId: policyIds.CRITICAL_CONTRACTOR,
    actor: abcCtx,
  });
  clock.set(addDays(now, -20));
  platform.acceptInvitation(rstInvite.invitation.id);
  clock.set(addDays(now, -19));
  platform.provideAllDocuments(rstInvite.verification.id);
  clock.set(addDays(now, -18));
  if (rstInvite.verification) {
    await verifications.runAllChecks(rstInvite.verification.id);
  }

  /* ---------------- ABC → OPQ : invited, not yet accepted ---------------- */
  clock.set(addDays(now, -6));
  const opqOrg = organizations.create({
    legalName: 'OPQ Logistics Private Limited',
    displayName: 'OPQ Logistics',
    bidId: DEMO_BID_IDS.OPQ,
    industry: 'LOGISTICS',
    city: 'Chennai',
    description: 'Third-party logistics and last-mile fleet operator.',
    lifecycle: 'DISCOVERED',
    introducedByOrgId: abc.id,
    logoColor: '#155e75',
    tags: ['demo'],
  });
  const opqInvite = platform.inviteCounterparty({
    requesterOrganizationId: abc.id,
    counterpartyName: 'OPQ Logistics',
    counterpartyEmail: 'partners@opq-logistics.example',
    counterpartyOrganizationId: opqOrg.id,
    relationshipType: 'VENDOR',
    policyId: policyIds.FLEET_CONTRACTOR,
    actor: abcCtx,
  });

  /* ---------------- ABC campaign ---------------- */
  clock.set(addDays(now, -44));
  const campaign = campaigns.create({
    workspaceId: abcWorkspace.id,
    requesterOrganizationId: abc.id,
    name: 'H2 supplier & contractor verification',
    policyId: policyIds.STANDARD_SUPPLIER,
    relationshipType: 'SUPPLIER',
    slaDays: 14,
    actor: abcCtx,
  });
  const campaignSeeds: { name: string; email: string; orgId: string; invitationId?: string; verificationId?: string }[] = [
    { name: 'LMN Components', email: 'contracts@lmn-components.example', orgId: lmnOrg.id, invitationId: lmnInvite.invitation.id, verificationId: lmnInvite.verification?.id },
    { name: 'RST Security Services', email: 'ops@rst-security.example', orgId: rstOrg.id, invitationId: rstInvite.invitation.id, verificationId: rstInvite.verification?.id },
    { name: 'OPQ Logistics', email: 'partners@opq-logistics.example', orgId: opqOrg.id, invitationId: opqInvite.invitation.id, verificationId: opqInvite.verification?.id },
  ];
  for (const entry of campaignSeeds) {
    const member = campaigns.addMember({
      campaignId: campaign.id,
      targetName: entry.name,
      targetEmail: entry.email,
      targetOrganizationId: entry.orgId,
    });
    store.campaignMembers.update(member.id, {
      invitationId: entry.invitationId,
      verificationRequestId: entry.verificationId,
      state: 'INVITED',
    });
  }
  campaigns.syncFromVerifications(campaign.id);

  /* ---------------- People verification: candidate BGV ---------------- */
  clock.set(addDays(now, -12));
  const ravi = organizations.createPerson({
    fullName: 'Ravi Kumar',
    email: 'ravi.kumar@example.com',
    phone: '9876543210',
    city: 'Bengaluru',
    bidId: DEMO_BID_IDS.RAVI,
  });
  const raviRelationship = relationships.create({
    workspaceId: abcWorkspace.id,
    sourceOrganizationId: abc.id,
    targetType: 'PERSON',
    targetPersonId: ravi.id,
    type: 'CANDIDATE',
    label: 'Candidate — Platform Engineer',
    riskLevel: 'STANDARD',
    policyId: policyIds.CANDIDATE_BGV,
    lifecycle: 'VERIFICATION',
    actor: abcCtx,
  });
  const bgv = verifications.create({
    workspaceId: abcWorkspace.id,
    requesterOrganizationId: abc.id,
    subjectType: 'PERSON',
    subjectPersonId: ravi.id,
    subjectName: ravi.fullName,
    relationshipId: raviRelationship.id,
    relationshipType: 'CANDIDATE',
    policyId: policyIds.CANDIDATE_BGV,
    actor: abcCtx,
  });
  const consent = verifications.requestConsent({ verificationRequestId: bgv.id });
  clock.set(addDays(now, -11));
  verifications.grantConsent(consent.id);
  platform.provideAllDocuments(bgv.id, ravi.id);
  await verifications.runAllChecks(bgv.id);

  /* ---------------- Wider network for analytics ---------------- */
  clock.set(addDays(now, -150));
  const ghi = organizations.create({
    legalName: 'GHI Textiles Private Limited',
    displayName: 'GHI Textiles',
    bidId: DEMO_BID_IDS.GHI,
    industry: 'MANUFACTURING',
    city: 'Surat',
    description: 'Textile manufacturer and exporter.',
    lifecycle: 'REGISTERED',
    commercialState: 'MEMBER',
    logoColor: '#4c1d95',
    tags: ['demo'],
  });
  organizations.claim({ organizationId: ghi.id });

  const jkl = organizations.create({
    legalName: 'JKL Pharma Private Limited',
    displayName: 'JKL Pharma',
    bidId: DEMO_BID_IDS.JKL,
    industry: 'PHARMA',
    city: 'Ahmedabad',
    description: 'Formulations manufacturer running supplier due diligence on BID Trust.',
    lifecycle: 'ACTIVE',
    commercialState: 'CUSTOMER',
    logoColor: '#155e75',
    tags: ['demo'],
  });
  const jklWorkspace = organizations.claim({ organizationId: jkl.id, requesterEnabled: true });
  organizations.update(jkl.id, { lifecycle: 'ACTIVE' });
  billing.subscribe({
    workspaceId: jklWorkspace.id,
    organizationId: jkl.id,
    planId: billing.planByTier('GROWTH')!.id,
    seats: 6,
  });

  // A second hub in the network: JKL verifies GHI as a supplier. This is the
  // flywheel in the data — the network is not a star around one customer.
  clock.set(addDays(now, -120));
  const jklCtx = platform.accessContextFor(jkl.id);
  const ghiInvite = platform.inviteCounterparty({
    requesterOrganizationId: jkl.id,
    counterpartyName: 'GHI Textiles',
    counterpartyEmail: 'supply@ghi-textiles.example',
    counterpartyOrganizationId: ghi.id,
    relationshipType: 'SUPPLIER',
    policyId: policyIds.STANDARD_SUPPLIER,
    actor: jklCtx,
  });
  clock.set(addDays(now, -118));
  platform.acceptInvitation(ghiInvite.invitation.id);
  if (ghiInvite.verification) {
    platform.provideAllDocuments(ghiInvite.verification.id);
    await verifications.runAllChecks(ghiInvite.verification.id);
    const ghiRequest = verifications.get(ghiInvite.verification.id)!;
    if (ghiRequest.decision === 'PENDING' && ghiRequest.status !== 'FAILED') {
      verifications.decide(ghiRequest.id, 'APPROVED', 'Supplier evidence accepted.', jklCtx);
    }
  }

  const tuv = organizations.create({
    legalName: 'TUV Facilities Private Limited',
    displayName: 'TUV Facilities',
    bidId: DEMO_BID_IDS.TUV,
    industry: 'HOSPITALITY',
    city: 'Delhi',
    description: 'Facility management services provider.',
    lifecycle: 'REGISTERED',
    commercialState: 'MEMBER',
    logoColor: '#374151',
    tags: ['demo'],
  });
  const tuvWorkspace = organizations.claim({ organizationId: tuv.id });
  const tuvSubscription = billing.subscribe({
    workspaceId: tuvWorkspace.id,
    organizationId: tuv.id,
    planId: billing.planByTier('STARTER')!.id,
  });
  billing.cancel(tuvWorkspace.id);
  store.subscriptions.update(tuvSubscription.id, { status: 'CANCELLED' });
  organizations.setCommercialState(tuv.id, 'MEMBER', 'subscription cancelled');

  /* ---------------- Monitoring alerts ---------------- */
  clock.set(addDays(now, -9));
  monitoring.raiseAlert({
    workspaceId: abcWorkspace.id,
    subjectRef: xyzOrg.bidId,
    subjectName: xyzOrg.displayName,
    signal: 'COMPLIANCE_FILING',
    severity: 'LOW',
    title: 'Filing regularity changed for XYZ HR Consultants',
    detail:
      'The compliance data provider reported a change in recent filing regularity. This is a demo signal produced by the mock monitoring feed.',
    relationshipId: xyzRelationship?.id,
    recommendedAction: 'Review at the next scheduled re-verification; no immediate action required.',
    detectedAt: addDays(now, -9),
  });
  clock.set(addDays(now, -4));
  monitoring.raiseAlert({
    workspaceId: abcWorkspace.id,
    subjectRef: rstOrg.bidId,
    subjectName: rstOrg.displayName,
    signal: 'RISK_SIGNAL',
    severity: 'HIGH',
    title: 'Statutory workforce compliance signal for RST Security Services',
    detail:
      'The mock screening feed reported an unresolved statutory compliance signal. The last verification already recorded a failed statutory check.',
    recommendedAction: 'Do not extend the contract scope until the statutory evidence is re-verified.',
    detectedAt: addDays(now, -4),
  });
  clock.set(addDays(now, -2));
  monitoring.raiseAlert({
    workspaceId: abcWorkspace.id,
    subjectRef: lmnOrg.bidId,
    subjectName: lmnOrg.displayName,
    signal: 'VERIFICATION_EXPIRY',
    severity: 'MEDIUM',
    title: 'LMN Components verification is incomplete past SLA',
    detail: 'The verification has outstanding checks beyond the campaign SLA window.',
    recommendedAction: 'Chase the outstanding documents or run the remaining checks.',
    detectedAt: addDays(now, -2),
  });

  /* ---------------- Billing history ---------------- */
  clock.set(addDays(now, -31));
  const invoice = billing.issueInvoice(abcWorkspace.id, abc.id, billing.period(addDays(now, -31)));
  billing.recordPayment(invoice.id, 'NEFT');

  /* ---------------- Customer lifecycle ---------------- */
  clock.set(now);
  lifecycle.transition(abc.id, 'EXPANDING', 'multiple campaigns and continuous monitoring in use');
  lifecycle.updateSignals(abc.id, {
    lastLoginAt: addDays(now, -1),
    verificationsLast30d: 6,
    apiCallsLast30d: 1840,
    monitoredEntities: 1,
    creditsUsedLast30d: 214,
    policiesCreated: 2,
    openSupportCases: 0,
    featureAdoption: ['campaigns', 'monitoring', 'api', 'bgv', 'policies'],
  });
  lifecycle.setOwner(abc.id, 'Customer success — Meera');

  lifecycle.transition(xyzOrg.id, 'DISCOVERY', 'verified member exploring requester capabilities');
  lifecycle.updateSignals(xyzOrg.id, {
    lastLoginAt: addDays(now, -2),
    verificationsLast30d: 0,
    apiCallsLast30d: 0,
    monitoredEntities: 0,
    creditsUsedLast30d: 0,
    policiesCreated: 0,
    openSupportCases: 0,
    featureAdoption: ['profile', 'credentials'],
  });
  lifecycle.setOwner(xyzOrg.id, 'Customer success — Meera');

  lifecycle.transition(lmnOrg.id, 'BID_MEMBER', 'registered, verification in progress');
  lifecycle.transition(rstOrg.id, 'VERIFIED_MEMBER', 'verification completed with exceptions');
  lifecycle.transition(opqOrg.id, 'INVITED', 'invitation pending acceptance');
  lifecycle.transition(ghi.id, 'DORMANT', 'no activity in 90 days');
  lifecycle.updateSignals(ghi.id, { lastLoginAt: addDays(now, -97), verificationsLast30d: 0, featureAdoption: ['profile'] });
  lifecycle.transition(jkl.id, 'AT_RISK', 'usage down 60% month over month');
  lifecycle.updateSignals(jkl.id, {
    lastLoginAt: addDays(now, -18),
    verificationsLast30d: 1,
    apiCallsLast30d: 20,
    monitoredEntities: 4,
    creditsUsedLast30d: 12,
    policiesCreated: 1,
    openSupportCases: 2,
    featureAdoption: ['campaigns'],
  });
  lifecycle.setOwner(jkl.id, 'Customer success — Arjun');
  lifecycle.transition(tuv.id, 'CHURNED', 'subscription cancelled after trial period');
  lifecycle.setOwner(tuv.id, 'Customer success — Arjun');

  store.supportCases.insert({
    id: 'sup_1001',
    organizationId: jkl.id,
    subject: 'Supplier campaign invitations not reaching two vendors',
    priority: 'HIGH',
    status: 'OPEN',
    createdAt: addDays(now, -6),
    updatedAt: addDays(now, -2),
  });
  store.supportCases.insert({
    id: 'sup_1002',
    organizationId: jkl.id,
    subject: 'Request: add licence check to pharma supplier policy',
    priority: 'NORMAL',
    status: 'PENDING',
    createdAt: addDays(now, -12),
    updatedAt: addDays(now, -5),
  });

  store.apiKeys.insert({
    id: 'key_abc_prod',
    workspaceId: abcWorkspace.id,
    name: 'Procurement integration (production)',
    prefix: 'bid_live_7Q2',
    hashedSecret: 'demo-hash',
    scopes: ['organizations:read', 'verification-requests:write', 'relationships:read'],
    createdAt: addDays(now, -120),
    lastUsedAt: addDays(now, -1),
  });
  store.webhooks.insert({
    id: 'whk_abc',
    workspaceId: abcWorkspace.id,
    url: 'https://abc-technologies.example/hooks/bid',
    events: ['VerificationCompleted', 'MonitoringAlertCreated', 'CredentialIssued'],
    active: true,
    createdAt: addDays(now, -120),
    secretMasked: 'whsec_••••••4f2a',
  });

  lifecycle.recomputeAll();
  verifications.refreshFreshness();

  // Demo credentials. Every seeded account shares one obvious password so the
  // running application can actually be signed into; it is only ever applied to
  // this fictional network, and DEMO_PASSWORD is exported so the sign-in screen
  // can show it rather than expecting anyone to guess.
  for (const user of store.users.all()) {
    store.users.update(user.id, {
      passwordHash: await hashPassword(DEMO_PASSWORD),
      passwordUpdatedAt: now,
      status: 'ACTIVE',
      failedLoginCount: 0,
    });
  }

  clock.set(now);

  return {
    platform,
    clock,
    organizations: { abc: abc.id, xyz: xyzOrg.id, lmn: lmnOrg.id, opq: opqOrg.id, rst: rstOrg.id },
    policies: policyIds,
  };
}

export { getPolicyTemplate };
