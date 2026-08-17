import { requireCheckDefinition } from '../domain/check-catalog.js';
import type { CheckDefinition, PolicyVersion } from '../domain/types.js';

/**
 * A verification plan is the compiled, provider-agnostic execution plan for a
 * policy version. It is produced once per verification request and never
 * recomputed, so a policy edit can never retroactively change what was run.
 */
export interface PlannedCheck {
  checkCode: string;
  definition: CheckDefinition;
  required: boolean;
  blocking: boolean;
  validityDays: number;
  notes?: string;
}

export interface VerificationPlan {
  policyId: string;
  policyVersion: number;
  checks: PlannedCheck[];
  requiresConsent: boolean;
  consentScope: string[];
  requiredDocuments: { code: string; label: string }[];
  estimatedCostPaise: number;
  estimatedSlaHours: number;
}

export function compilePlan(version: PolicyVersion): VerificationPlan {
  const all = [...version.requiredChecks, ...version.optionalChecks];
  const checks: PlannedCheck[] = all.map((requirement) => {
    const definition = requireCheckDefinition(requirement.checkCode);
    return {
      checkCode: requirement.checkCode,
      definition,
      required: requirement.required,
      blocking: requirement.blocking,
      validityDays: requirement.validityDays ?? definition.defaultValidityDays,
      notes: requirement.notes,
    };
  });

  const consentChecks = checks.filter((c) => c.definition.requiresConsent);
  const estimatedCostPaise = checks.reduce((sum, c) => sum + c.definition.unitCostPaise, 0);
  const estimatedSlaHours = checks.reduce((max, c) => Math.max(max, c.definition.slaHours), 0);

  return {
    policyId: version.policyId,
    policyVersion: version.version,
    checks,
    requiresConsent: version.requiresConsent || consentChecks.length > 0,
    consentScope: consentChecks.map((c) => c.definition.label),
    requiredDocuments: version.documents.filter((d) => d.required).map((d) => ({ code: d.code, label: d.label })),
    estimatedCostPaise,
    estimatedSlaHours,
  };
}
