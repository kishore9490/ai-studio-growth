import type { Industry, RelationshipType, RiskLevel, VerificationTarget } from '../domain/enums.js';

/**
 * Prebuilt scenarios (Section 44). Every one runs on the same engine; only the
 * policy differs. That is the entire domain-agnosticism argument, made concrete.
 */
export interface Scenario {
  id: string;
  title: string;
  requester: string;
  requesterIndustry: Industry;
  subject: string;
  subjectKind: VerificationTarget;
  relationshipType: RelationshipType;
  riskLevel: RiskLevel;
  policyTemplateKey: string;
  question: string;
  whyItMatters: string;
  outcome: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'it-hr-consultancy',
    title: 'IT company → HR consultancy',
    requester: 'ABC Technologies',
    requesterIndustry: 'IT',
    subject: 'XYZ HR Consultants',
    subjectKind: 'VENDOR',
    relationshipType: 'SERVICE_PROVIDER',
    riskLevel: 'HIGH',
    policyTemplateKey: 'HR_CONSULTANCY_DD',
    question: 'Can this staffing partner legitimately handle our candidate data and place people into our teams?',
    whyItMatters:
      'A staffing partner touches personal data and supplies people who enter your systems and premises. Identity, statutory workforce compliance and screening all matter.',
    outcome: 'Verified BID Member with an evidence-backed credential the consultancy can reuse with its next client.',
  },
  {
    id: 'manufacturing-supplier',
    title: 'Manufacturing company → Critical supplier',
    requester: 'LMN Components',
    requesterIndustry: 'MANUFACTURING',
    subject: 'Tier-1 component supplier',
    subjectKind: 'SUPPLIER',
    relationshipType: 'SUPPLIER',
    riskLevel: 'CRITICAL',
    policyTemplateKey: 'CRITICAL_SUPPLIER',
    question: 'If this supplier fails, does the line stop — and can we see that risk before it happens?',
    whyItMatters:
      'Production continuity depends on financial stability and quality certification, not only on identity. Monitoring is quarterly because status changes between orders.',
    outcome: 'Deep due diligence with financial and quality evidence, dual-control approval and quarterly monitoring.',
  },
  {
    id: 'hospital-medical-supplier',
    title: 'Hospital → Medical supplier',
    requester: 'Healthcare provider',
    requesterIndustry: 'HEALTHCARE',
    subject: 'Medical consumables supplier',
    subjectKind: 'VENDOR',
    relationshipType: 'VENDOR',
    riskLevel: 'HIGH',
    policyTemplateKey: 'HEALTHCARE_VENDOR',
    question: 'Is this vendor licensed for what it is supplying into a clinical environment?',
    whyItMatters: 'Sector licences are blocking here in a way they are not for an office-supplies vendor. Same engine, different policy.',
    outcome: 'Licence and certification evidence with manual approval before any clinical supply begins.',
  },
  {
    id: 'construction-contractor',
    title: 'Construction company → Site contractor',
    requester: 'Infrastructure developer',
    requesterIndustry: 'CONSTRUCTION',
    subject: 'RST Security Services',
    subjectKind: 'CONTRACTOR',
    relationshipType: 'CONTRACTOR',
    riskLevel: 'CRITICAL',
    policyTemplateKey: 'CRITICAL_CONTRACTOR',
    question: 'Does this contractor meet its statutory workforce obligations before its people step on our site?',
    whyItMatters:
      'Contractor workforce obligations and insurance cover transfer real liability to the principal employer. In the demo this scenario deliberately fails a statutory check.',
    outcome: 'Verification completes with an exception, is routed to human review, and monitoring raises a follow-up signal.',
  },
  {
    id: 'candidate-bgv',
    title: 'IT company → Candidate BGV',
    requester: 'ABC Technologies',
    requesterIndustry: 'IT',
    subject: 'Ravi Kumar',
    subjectKind: 'CANDIDATE',
    relationshipType: 'CANDIDATE',
    riskLevel: 'STANDARD',
    policyTemplateKey: 'CANDIDATE_BGV',
    question: 'Are this candidate’s identity, education and employment history what they say they are?',
    whyItMatters:
      'People verification only proceeds on a recorded, in-scope consent. Results are restricted to the requesting workspace and never appear on any public profile.',
    outcome: 'A consent-gated BGV report visible only to the requester — no public candidate database, ever.',
  },
  {
    id: 'retail-distributor',
    title: 'Retail company → Distributor',
    requester: 'Consumer brand',
    requesterIndustry: 'RETAIL',
    subject: 'Regional distributor',
    subjectKind: 'DISTRIBUTOR',
    relationshipType: 'DISTRIBUTOR',
    riskLevel: 'STANDARD',
    policyTemplateKey: 'DISTRIBUTOR',
    question: 'Is the settlement bank account genuinely this distributor’s, and is the entity real?',
    whyItMatters: 'Channel fraud usually starts with payment details, so banking verification is required rather than optional.',
    outcome: 'Automatic approval where identity and banking evidence are clean, with quarterly monitoring.',
  },
  {
    id: 'logistics-fleet',
    title: 'Logistics company → Fleet contractor',
    requester: 'OPQ Logistics',
    requesterIndustry: 'LOGISTICS',
    subject: 'Fleet contractor',
    subjectKind: 'CONTRACTOR',
    relationshipType: 'CONTRACTOR',
    riskLevel: 'HIGH',
    policyTemplateKey: 'FLEET_CONTRACTOR',
    question: 'Are the permits and insurance current for the vehicles moving our goods?',
    whyItMatters: 'Insurance and permit expiry are time-bound facts — this is where monthly monitoring earns its place.',
    outcome: 'Permit and insurance evidence with expiry tracked as a monitored signal.',
  },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
