import type { ProviderCapability } from '../domain/enums.js';
import type { CheckDefinition, ProviderRecord } from '../domain/types.js';
import { seededUnit, stableHash } from '../util/id.js';
import type { ProviderCheckRequest, ProviderCheckResponse, VerificationProvider } from './provider.js';

/**
 * Mock provider adapters.
 *
 * These make NO external network calls. Outcomes are deterministic functions of
 * (subject, check, provider) so the demo tells the same story on every run, and
 * so screenshots and tests stay stable. A real adapter replaces `execute()`
 * with an HTTP call and a response mapper — nothing else changes.
 */

/** Scripted outcomes let the seed tell a realistic story (one supplier with a gap). */
export type ScriptedOutcomes = Record<string, ProviderCheckResponse['outcome']>;

export function scriptKey(subjectRef: string, checkCode: string): string {
  return `${subjectRef}::${checkCode}`;
}

export interface MockProviderOptions {
  id: string;
  name: string;
  description: string;
  capabilities: ProviderCapability[];
  countries: string[];
  /** Multiplier applied to the catalog unit cost. */
  costMultiplier: number;
  slaHours: number;
  qualityScore: number;
  /** Probability the provider returns UNAVAILABLE, exercising router fallback. */
  unavailabilityRate: number;
  latencyBaseMs: number;
  scripted?: ScriptedOutcomes;
}

export class MockVerificationProvider implements VerificationProvider {
  readonly id: string;
  readonly name: string;
  readonly capabilities: ProviderCapability[];
  readonly countries: string[];
  readonly options: MockProviderOptions;

  constructor(options: MockProviderOptions) {
    this.options = options;
    this.id = options.id;
    this.name = options.name;
    this.capabilities = options.capabilities;
    this.countries = options.countries;
  }

  supports(definition: CheckDefinition, country: string): boolean {
    return this.capabilities.includes(definition.capability) && this.countries.includes(country);
  }

  async execute(request: ProviderCheckRequest): Promise<ProviderCheckResponse> {
    const seed = `${this.id}|${request.subjectRef}|${request.checkCode}`;
    const roll = seededUnit(seed);
    const latencyMs = this.options.latencyBaseMs + Math.round(seededUnit(`${seed}|lat`) * 400);

    const scripted = this.options.scripted?.[scriptKey(request.subjectRef, request.checkCode)];
    const outcome: ProviderCheckResponse['outcome'] =
      scripted ?? (roll < this.options.unavailabilityRate ? 'UNAVAILABLE' : deriveOutcome(roll));

    const reference = `${this.id.toUpperCase()}-${stableHash(seed).toString(16).slice(0, 8).toUpperCase()}`;

    return {
      outcome,
      confidence: outcome === 'PASS' ? 0.9 + roll * 0.09 : outcome === 'ATTENTION' ? 0.55 + roll * 0.2 : 0.4 + roll * 0.2,
      summary: summarize(request.definition, outcome, request.subjectName),
      normalized: normalizedPayload(request, outcome, roll),
      reference,
      latencyMs,
      sourceLabel: request.definition.sourceLabel,
    };
  }
}

function deriveOutcome(roll: number): ProviderCheckResponse['outcome'] {
  if (roll > 0.94) return 'FAIL';
  if (roll > 0.82) return 'ATTENTION';
  return 'PASS';
}

function summarize(definition: CheckDefinition, outcome: ProviderCheckResponse['outcome'], subjectName: string): string {
  switch (outcome) {
    case 'PASS':
      return `${definition.label} confirmed for ${subjectName} against ${definition.sourceLabel}.`;
    case 'ATTENTION':
      return `${definition.label} returned a partial or ambiguous match for ${subjectName}. Manual review recommended.`;
    case 'FAIL':
      return `${definition.label} could not be confirmed for ${subjectName}; the source did not corroborate the submitted details.`;
    case 'UNAVAILABLE':
    default:
      return `${definition.label} is temporarily unavailable at this provider. The router will attempt a fallback provider.`;
  }
}

function normalizedPayload(
  request: ProviderCheckRequest,
  outcome: ProviderCheckResponse['outcome'],
  roll: number,
): Record<string, string | number | boolean> {
  const base: Record<string, string | number | boolean> = {
    subject: request.subjectName,
    check: request.checkCode,
    matched: outcome === 'PASS',
  };

  switch (request.checkCode) {
    case 'ORG_GST':
      return { ...base, registrationStatus: outcome === 'PASS' ? 'ACTIVE' : 'REQUIRES_REVIEW', nameMatch: outcome === 'PASS' ? 'EXACT' : 'PARTIAL' };
    case 'ORG_PAN':
      return { ...base, panStatus: outcome === 'PASS' ? 'VALID' : 'UNCONFIRMED', nameMatch: outcome === 'PASS' ? 'EXACT' : 'PARTIAL' };
    case 'ORG_MCA':
      return {
        ...base,
        companyStatus: outcome === 'PASS' ? 'ACTIVE' : 'UNDER_REVIEW',
        incorporationYear: 2005 + Math.floor(roll * 18),
      };
    case 'ORG_BANK':
      return { ...base, accountStatus: outcome === 'PASS' ? 'ACTIVE' : 'UNCONFIRMED', nameMatchScore: Math.round(60 + roll * 40) };
    case 'ORG_SANCTIONS':
      return { ...base, listsScreened: 14, matches: outcome === 'PASS' ? 0 : 1, matchStrength: outcome === 'PASS' ? 'NONE' : 'WEAK' };
    case 'ORG_AML':
      return { ...base, adverseMediaHits: outcome === 'PASS' ? 0 : Math.ceil(roll * 3), lookbackMonths: 36 };
    case 'ORG_LITIGATION':
      return { ...base, openMatters: outcome === 'PASS' ? 0 : Math.ceil(roll * 2), coverage: 'Provider dataset coverage only' };
    case 'ORG_TURNOVER':
      return { ...base, declaredBand: '₹10–50 Cr', corroborated: outcome === 'PASS' };
    case 'ORG_EPF':
      return { ...base, employerRegistration: outcome === 'PASS' ? 'ACTIVE' : 'NOT_CONFIRMED', contributionsObserved: outcome === 'PASS' };
    case 'PER_IDENTITY':
      return { ...base, documentType: 'GOVERNMENT_ID', nameMatch: outcome === 'PASS' ? 'EXACT' : 'PARTIAL', dobMatch: outcome === 'PASS' };
    case 'PER_EDUCATION':
      return { ...base, institutionResponded: outcome !== 'UNAVAILABLE', qualificationConfirmed: outcome === 'PASS' };
    case 'PER_EMPLOYMENT':
      return { ...base, employerResponded: outcome !== 'UNAVAILABLE', tenureConfirmed: outcome === 'PASS', designationMatch: outcome === 'PASS' };
    default:
      return base;
  }
}

const COUNTRIES = ['IN'];

export function createDefaultProviders(scripted?: ScriptedOutcomes): MockVerificationProvider[] {
  return [
    new MockVerificationProvider({
      id: 'mock-provider-a',
      name: 'Mock Provider A',
      description:
        'Broad KYB and business-identity coverage. Fast, lower cost, used as the default route for identity and compliance checks.',
      capabilities: ['KYB', 'IDENTITY', 'DOCUMENT'],
      countries: COUNTRIES,
      costMultiplier: 1,
      slaHours: 2,
      qualityScore: 92,
      unavailabilityRate: 0.03,
      latencyBaseMs: 240,
      scripted,
    }),
    new MockVerificationProvider({
      id: 'mock-provider-b',
      name: 'Mock Provider B',
      description:
        'Risk and screening specialist: sanctions, adverse media and litigation datasets. Higher cost, higher quality on RISK capability.',
      capabilities: ['RISK', 'KYB', 'BANK'],
      countries: COUNTRIES,
      costMultiplier: 1.3,
      slaHours: 6,
      qualityScore: 96,
      unavailabilityRate: 0.02,
      latencyBaseMs: 420,
      scripted,
    }),
    new MockVerificationProvider({
      id: 'mock-provider-c',
      name: 'Mock Provider C',
      description:
        'People verification specialist: identity, education, employment and permitted database screening. Longer SLA by nature of the work.',
      capabilities: ['BGV', 'EDUCATION', 'EMPLOYMENT', 'IDENTITY', 'DOCUMENT'],
      countries: COUNTRIES,
      costMultiplier: 1.1,
      slaHours: 72,
      qualityScore: 90,
      unavailabilityRate: 0.04,
      latencyBaseMs: 600,
      scripted,
    }),
  ];
}

export function providerRecords(providers: MockVerificationProvider[]): ProviderRecord[] {
  return providers.map((provider, index) => ({
    id: provider.id,
    name: provider.name,
    capabilities: provider.capabilities,
    countries: provider.countries,
    costMultiplier: provider.options.costMultiplier,
    slaHours: provider.options.slaHours,
    qualityScore: provider.options.qualityScore,
    priority: index + 1,
    enabled: true,
    description: provider.options.description,
  }));
}
