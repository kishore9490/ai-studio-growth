import type { ProviderCapability, SubjectType } from '../domain/enums.js';
import type { CheckDefinition } from '../domain/types.js';

/**
 * Provider abstraction (ADR-005).
 *
 * BID does not replace existing verification providers — it orchestrates them.
 * Core business logic depends only on these interfaces, never on a concrete
 * provider. Swapping in a real KYB or BGV vendor means writing one adapter.
 */

export interface ProviderCheckRequest {
  verificationRequestId: string;
  checkId: string;
  checkCode: string;
  definition: CheckDefinition;
  subjectType: SubjectType;
  /** Stable reference for the subject (BID ID). */
  subjectRef: string;
  subjectName: string;
  /** Attributes supplied by the subject or requester, already minimized. */
  attributes: Record<string, string>;
  country: string;
  correlationId: string;
}

export interface ProviderCheckResponse {
  outcome: 'PASS' | 'ATTENTION' | 'FAIL' | 'UNAVAILABLE';
  confidence: number;
  summary: string;
  normalized: Record<string, string | number | boolean>;
  /** Provider-side transaction reference, retained for audit. */
  reference: string;
  latencyMs: number;
  /** Overrides the catalog source label when the provider names its source. */
  sourceLabel?: string;
}

export interface VerificationProvider {
  readonly id: string;
  readonly name: string;
  readonly capabilities: ProviderCapability[];
  readonly countries: string[];
  supports(definition: CheckDefinition, country: string): boolean;
  execute(request: ProviderCheckRequest): Promise<ProviderCheckResponse>;
}

/* Capability-scoped marker interfaces. A concrete adapter may implement several. */
export type IIdentityProvider = VerificationProvider;
export type IKYBProvider = VerificationProvider;
export type IBGVProvider = VerificationProvider;
export type IBankVerificationProvider = VerificationProvider;
export type IEducationProvider = VerificationProvider;
export type IEmploymentProvider = VerificationProvider;
export type IDocumentProvider = VerificationProvider;
export type IRiskProvider = VerificationProvider;

export class ProviderRegistry {
  private readonly providers = new Map<string, VerificationProvider>();

  register(provider: VerificationProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: string): VerificationProvider | undefined {
    return this.providers.get(id);
  }

  all(): VerificationProvider[] {
    return [...this.providers.values()];
  }

  byCapability(capability: ProviderCapability): VerificationProvider[] {
    return this.all().filter((p) => p.capabilities.includes(capability));
  }
}
