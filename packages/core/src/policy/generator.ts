import type { Industry, RelationshipType, RiskLevel, SubjectType, VerificationTarget } from '../domain/enums.js';
import { requireCheckDefinition } from '../domain/check-catalog.js';
import type { PolicyCheckRequirement, PolicyDocumentRequirement } from '../domain/types.js';
import type { PolicyTemplate } from './policy-templates.js';

/**
 * Domain demo mode (Section 43).
 *
 * "What do you want to verify?" + "In which industry?" + "At what risk level?"
 * → a generated policy draft. This is the clearest demonstration that BID is
 * domain-agnostic: the engine never changes, only the policy does.
 */

const TARGET_DEFAULTS: Record<
  VerificationTarget,
  { subjectType: SubjectType; relationshipType: RelationshipType; base: string[] }
> = {
  VENDOR: { subjectType: 'ORGANIZATION', relationshipType: 'VENDOR', base: ['ORG_GST', 'ORG_PAN', 'ORG_MCA'] },
  SUPPLIER: { subjectType: 'ORGANIZATION', relationshipType: 'SUPPLIER', base: ['ORG_GST', 'ORG_PAN', 'ORG_MCA'] },
  EMPLOYEE: { subjectType: 'PERSON', relationshipType: 'EMPLOYER', base: ['PER_IDENTITY', 'PER_EMPLOYMENT', 'PER_EDUCATION'] },
  CANDIDATE: { subjectType: 'PERSON', relationshipType: 'CANDIDATE', base: ['PER_IDENTITY', 'PER_EDUCATION', 'PER_EMPLOYMENT'] },
  CONTRACTOR: {
    subjectType: 'ORGANIZATION',
    relationshipType: 'CONTRACTOR',
    base: ['ORG_GST', 'ORG_PAN', 'ORG_EPF', 'ORG_INSURANCE'],
  },
  PARTNER: { subjectType: 'ORGANIZATION', relationshipType: 'PARTNER', base: ['ORG_GST', 'ORG_PAN', 'ORG_MCA'] },
  CONSULTANT: {
    subjectType: 'ORGANIZATION',
    relationshipType: 'CONSULTANT',
    base: ['ORG_GST', 'ORG_PAN', 'ORG_ADDRESS'],
  },
  DISTRIBUTOR: {
    subjectType: 'ORGANIZATION',
    relationshipType: 'DISTRIBUTOR',
    base: ['ORG_GST', 'ORG_PAN', 'ORG_BANK'],
  },
  BUSINESS: { subjectType: 'ORGANIZATION', relationshipType: 'VENDOR', base: ['ORG_GST', 'ORG_PAN', 'ORG_MCA'] },
  PERSON: { subjectType: 'PERSON', relationshipType: 'CANDIDATE', base: ['PER_IDENTITY', 'PER_ADDRESS'] },
};

/** Industry-specific *additions* — expressed as configuration, not as code paths. */
const INDUSTRY_ADDITIONS: Record<Industry, { org: string[]; person: string[]; note: string }> = {
  MANUFACTURING: { org: ['ORG_CERTIFICATION', 'ORG_TURNOVER'], person: [], note: 'Quality certification and capacity matter for production continuity.' },
  HEALTHCARE: { org: ['ORG_LICENCE', 'ORG_CERTIFICATION'], person: ['PER_PROF_CREDENTIAL'], note: 'Sector licences and professional credentials are material in clinical settings.' },
  IT: { org: ['ORG_CERTIFICATION'], person: ['PER_DATABASE_CHECK'], note: 'Security certification and system-access risk drive the additions.' },
  CONSTRUCTION: { org: ['ORG_EPF', 'ORG_INSURANCE', 'ORG_LICENCE'], person: [], note: 'On-site workforce obligations and insurance cover are added.' },
  LOGISTICS: { org: ['ORG_INSURANCE', 'ORG_LICENCE'], person: [], note: 'Fleet permits and insurance are added.' },
  EDUCATION: { org: ['ORG_EPF'], person: ['PER_DATABASE_CHECK'], note: 'Campus access drives additional permitted screening.' },
  RETAIL: { org: ['ORG_BANK'], person: [], note: 'Settlement banking verification is added for channel partners.' },
  HOSPITALITY: { org: ['ORG_LICENCE', 'ORG_INSURANCE'], person: [], note: 'Food and premises licences are added.' },
  PHARMA: { org: ['ORG_LICENCE', 'ORG_CERTIFICATION', 'ORG_UBO'], person: [], note: 'Regulated supply chain: licence, quality and ownership transparency.' },
  RECRUITMENT: { org: ['ORG_EPF', 'ORG_ADDRESS'], person: ['PER_REFERENCE'], note: 'Staffing partners handle candidate data and statutory obligations.' },
  BPO_KPO: { org: ['ORG_CERTIFICATION', 'ORG_EPF'], person: ['PER_DATABASE_CHECK'], note: 'Data processing on behalf of the requester drives the additions.' },
  GENERIC: { org: [], person: [], note: 'No industry-specific additions applied.' },
};

/** Risk level *escalates* an existing policy; it never changes the engine. */
const RISK_ADDITIONS: Record<RiskLevel, { org: string[]; person: string[] }> = {
  LOW: { org: ['ORG_SANCTIONS'], person: [] },
  STANDARD: { org: ['ORG_SANCTIONS'], person: [] },
  HIGH: { org: ['ORG_SANCTIONS', 'ORG_AML', 'ORG_ADDRESS'], person: ['PER_DATABASE_CHECK'] },
  CRITICAL: {
    org: ['ORG_SANCTIONS', 'ORG_AML', 'ORG_LITIGATION', 'ORG_UBO', 'ORG_FINANCIAL_HEALTH', 'ORG_BANK'],
    person: ['PER_DATABASE_CHECK', 'PER_REFERENCE'],
  },
};

const RISK_CONFIG: Record<
  RiskLevel,
  { autoApproveScore: number; reviewScore: number; validityDays: number; monitoring: PolicyTemplate['monitoringFrequency']; approval: PolicyTemplate['approvalRule'] }
> = {
  LOW: { autoApproveScore: 65, reviewScore: 45, validityDays: 730, monitoring: 'ANNUAL', approval: 'AUTO' },
  STANDARD: { autoApproveScore: 75, reviewScore: 55, validityDays: 365, monitoring: 'QUARTERLY', approval: 'AUTO' },
  HIGH: { autoApproveScore: 82, reviewScore: 65, validityDays: 365, monitoring: 'MONTHLY', approval: 'MANUAL' },
  CRITICAL: { autoApproveScore: 88, reviewScore: 72, validityDays: 270, monitoring: 'MONTHLY', approval: 'DUAL_CONTROL' },
};

const BLOCKING_BY_DEFAULT = new Set(['ORG_GST', 'ORG_PAN', 'ORG_SANCTIONS', 'PER_IDENTITY']);

export interface GeneratedPolicy extends PolicyTemplate {
  rationale: string[];
  estimatedCostPaise: number;
  estimatedSlaHours: number;
}

export function generatePolicy(input: {
  target: VerificationTarget;
  industry: Industry;
  riskLevel: RiskLevel;
  nameOverride?: string;
}): GeneratedPolicy {
  const { target, industry, riskLevel } = input;
  const defaults = TARGET_DEFAULTS[target];
  const subjectType = defaults.subjectType;
  const industryAdditions = INDUSTRY_ADDITIONS[industry];
  const riskAdditions = RISK_ADDITIONS[riskLevel];
  const config = RISK_CONFIG[riskLevel];

  const pick = (set: { org: string[]; person: string[] }) => (subjectType === 'ORGANIZATION' ? set.org : set.person);

  const requiredCodes = dedupe([...defaults.base, ...pick(industryAdditions), ...pick(riskAdditions)]).filter((code) => {
    const def = requireCheckDefinition(code);
    return def.subjectType === subjectType;
  });

  const optionalPool =
    subjectType === 'ORGANIZATION'
      ? ['ORG_GST_FILING', 'ORG_UDYAM', 'ORG_TURNOVER', 'ORG_LITIGATION', 'ORG_INSURANCE', 'ORG_DIRECTORS']
      : ['PER_REFERENCE', 'PER_PROF_CREDENTIAL', 'PER_ADDRESS'];

  const optionalCodes = optionalPool.filter((code) => !requiredCodes.includes(code)).slice(0, 4);

  const requiredChecks: PolicyCheckRequirement[] = requiredCodes.map((code) => ({
    checkCode: code,
    required: true,
    blocking: BLOCKING_BY_DEFAULT.has(code) || (riskLevel === 'CRITICAL' && requireCheckDefinition(code).category === 'RISK'),
  }));

  const optionalChecks: PolicyCheckRequirement[] = optionalCodes.map((code) => ({
    checkCode: code,
    required: false,
    blocking: false,
  }));

  const documents: PolicyDocumentRequirement[] = dedupe(
    [...requiredCodes, ...optionalCodes]
      .map((code) => requireCheckDefinition(code))
      .filter((def) => def.requiresDocument)
      .map((def) => def.code),
  ).map((code) => {
    const def = requireCheckDefinition(code);
    return {
      code: `${code}_DOC`,
      label: `${def.label} supporting document`,
      required: requiredCodes.includes(code),
      visibility: def.evidenceVisibility,
    };
  });

  const allDefs = [...requiredCodes, ...optionalCodes].map((c) => requireCheckDefinition(c));
  const estimatedCostPaise = allDefs.reduce((sum, d) => sum + d.unitCostPaise, 0);
  const estimatedSlaHours = allDefs.reduce((max, d) => Math.max(max, d.slaHours), 0);
  const requiresConsent = allDefs.some((d) => d.requiresConsent);

  const targetLabel = target.charAt(0) + target.slice(1).toLowerCase();
  const name = input.nameOverride ?? `${industryTitle(industry)} ${targetLabel} — ${titleCase(riskLevel)} Risk`;

  return {
    key: `GENERATED_${target}_${industry}_${riskLevel}`,
    name,
    description: `Generated policy for verifying a ${targetLabel.toLowerCase()} in ${industryTitle(industry).toLowerCase()} at ${riskLevel.toLowerCase()} risk. Same engine, different configuration.`,
    subjectType,
    relationshipType: defaults.relationshipType,
    industry,
    riskLevel,
    requiredChecks,
    optionalChecks,
    documents,
    thresholds: {
      autoApproveScore: config.autoApproveScore,
      reviewScore: config.reviewScore,
      maxBlockingFailures: riskLevel === 'LOW' ? 1 : 0,
    },
    validityDays: config.validityDays,
    reverificationDays: Math.round(config.validityDays * 0.9),
    monitoringFrequency: config.monitoring,
    approvalRule: config.approval,
    requiresConsent,
    estimatedCostPaise,
    estimatedSlaHours,
    rationale: [
      `Base checks for a ${targetLabel.toLowerCase()} subject: ${defaults.base.join(', ')}.`,
      industryAdditions.note,
      `Risk level ${riskLevel} adds ${pick(riskAdditions).length} screening/depth check(s) and sets approval to ${config.approval}.`,
      requiresConsent
        ? 'Subject is a person: the plan will not execute until an in-scope consent is recorded.'
        : 'Subject is an organization: authorization from the requester governs execution; personal consent is not applicable.',
      `Monitoring frequency set to ${config.monitoring.toLowerCase()} and validity to ${config.validityDays} days.`,
    ],
  };
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function industryTitle(industry: Industry): string {
  return industry
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join('/');
}
