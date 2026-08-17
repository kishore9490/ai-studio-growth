import { requireCheckDefinition } from '../domain/check-catalog.js';
import type { AssessmentBand, CheckCategory, Freshness } from '../domain/enums.js';
import type { Assessment, AssessmentCategoryResult, PolicyVersion, VerificationCheck } from '../domain/types.js';
import { daysBetween } from '../util/clock.js';

/**
 * Assessment (Section 14).
 *
 * The score is never the product. The product is: per-category verdicts +
 * evidence + what is missing + what policy was applied + when it expires.
 * Every number below is reconstructible from the checks that produced it.
 */

const CATEGORY_WEIGHTS: Record<CheckCategory, number> = {
  IDENTITY: 30,
  COMPLIANCE: 20,
  FINANCIAL: 15,
  RISK: 25,
  CREDENTIAL: 7,
  PEOPLE: 3,
};

export const ASSESSMENT_DISCLAIMER =
  'Assessment based on the evidence and policy available for this verification. BID Trust is an independent private verification platform; it is not a government authority and does not certify or guarantee any organization or person.';

export function freshnessFor(checkedAt: string, validityDays: number, now: string): Freshness {
  const age = daysBetween(checkedAt, now);
  if (age >= validityDays) return 'EXPIRED';
  if (age >= validityDays * 0.85) return 'STALE';
  if (age >= validityDays * 0.6) return 'AGING';
  return 'CURRENT';
}

export function bandFor(score: number, blockingFailures: number, thresholds: PolicyVersion['thresholds']): AssessmentBand {
  if (blockingFailures > thresholds.maxBlockingFailures) return 'HIGH_RISK';
  if (score >= thresholds.autoApproveScore) return 'LOW_RISK';
  if (score >= thresholds.reviewScore) return 'MODERATE_RISK';
  if (score > 0) return 'ELEVATED_RISK';
  return 'INSUFFICIENT_EVIDENCE';
}

export const ASSESSMENT_BAND_LABEL: Record<AssessmentBand, string> = {
  LOW_RISK: 'Low risk',
  MODERATE_RISK: 'Moderate risk',
  ELEVATED_RISK: 'Elevated risk',
  HIGH_RISK: 'High risk',
  INSUFFICIENT_EVIDENCE: 'Insufficient evidence',
};

export interface AssessmentInput {
  id: string;
  verificationRequestId: string;
  policyId: string;
  policyVersion: PolicyVersion;
  checks: VerificationCheck[];
  now: string;
  expiresAt: string;
}

export function buildAssessment(input: AssessmentInput): Assessment {
  const { checks, policyVersion, now } = input;

  const categories: AssessmentCategoryResult[] = [];
  const missingChecks: string[] = [];
  const failedChecks: string[] = [];
  const attentionChecks: string[] = [];

  const present = new Set<CheckCategory>();
  for (const check of checks) present.add(check.category);

  let weightedScore = 0;
  let totalWeight = 0;

  for (const category of Object.keys(CATEGORY_WEIGHTS) as CheckCategory[]) {
    const categoryChecks = checks.filter((c) => c.category === category);
    if (categoryChecks.length === 0) {
      categories.push({
        category,
        verdict: 'NOT_APPLICABLE',
        passed: 0,
        total: 0,
        weight: 0,
        contribution: 0,
        notes: 'Not required by the applied policy.',
      });
      continue;
    }

    const passed = categoryChecks.filter((c) => c.status === 'PASSED').length;
    const attention = categoryChecks.filter((c) => c.status === 'ATTENTION').length;
    const failed = categoryChecks.filter((c) => c.status === 'FAILED').length;
    const unavailable = categoryChecks.filter((c) => c.status === 'UNAVAILABLE' || c.status === 'SKIPPED').length;
    const blocked = categoryChecks.filter(
      (c) => c.status === 'BLOCKED_ON_CONSENT' || c.status === 'BLOCKED_ON_DOCUMENT' || c.status === 'PLANNED',
    ).length;

    const weight = CATEGORY_WEIGHTS[category];
    // Attention results earn partial credit; unavailable/blocked earn none.
    const rawRatio = (passed + attention * 0.5) / categoryChecks.length;
    const contribution = Math.round(rawRatio * weight * 10) / 10;

    weightedScore += contribution;
    totalWeight += weight;

    const verdict: AssessmentCategoryResult['verdict'] = (() => {
      if (failed > 0) return 'NOT_VERIFIED';
      if (attention > 0) return 'ATTENTION';
      if (blocked > 0 || unavailable > 0) return 'PARTIAL';
      return category === 'RISK' ? 'CLEAR' : 'VERIFIED';
    })();

    const noteParts: string[] = [`${passed}/${categoryChecks.length} checks passed`];
    if (attention) noteParts.push(`${attention} needs attention`);
    if (failed) noteParts.push(`${failed} failed`);
    if (unavailable) noteParts.push(`${unavailable} unavailable`);
    if (blocked) noteParts.push(`${blocked} not executed`);

    categories.push({
      category,
      verdict,
      passed,
      total: categoryChecks.length,
      weight,
      contribution,
      notes: noteParts.join(' · '),
    });

    for (const check of categoryChecks) {
      const label = requireCheckDefinition(check.checkCode).label;
      if (check.status === 'FAILED') failedChecks.push(label);
      else if (check.status === 'ATTENTION') attentionChecks.push(label);
      else if (check.status !== 'PASSED') missingChecks.push(label);
    }
  }

  const score = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
  const blockingFailures = checks.filter((c) => c.blocking && (c.status === 'FAILED' || c.status === 'UNAVAILABLE')).length;
  const band = bandFor(score, blockingFailures, policyVersion.thresholds);

  const completedTimestamps = checks.map((c) => c.completedAt).filter((t): t is string => Boolean(t));
  const oldest = completedTimestamps.sort()[0] ?? now;
  const freshness = freshnessFor(oldest, policyVersion.validityDays, now);

  const explanation = buildExplanation({
    score,
    band,
    categories,
    failedChecks,
    attentionChecks,
    missingChecks,
    blockingFailures,
    thresholds: policyVersion.thresholds,
  });

  return {
    id: input.id,
    verificationRequestId: input.verificationRequestId,
    band,
    score,
    categories,
    missingChecks,
    failedChecks,
    attentionChecks,
    freshness,
    policyId: input.policyId,
    policyVersion: policyVersion.version,
    explanation,
    disclaimer: ASSESSMENT_DISCLAIMER,
    createdAt: now,
    expiresAt: input.expiresAt,
  };
}

function buildExplanation(args: {
  score: number;
  band: AssessmentBand;
  categories: AssessmentCategoryResult[];
  failedChecks: string[];
  attentionChecks: string[];
  missingChecks: string[];
  blockingFailures: number;
  thresholds: PolicyVersion['thresholds'];
}): string {
  const applicable = args.categories.filter((c) => c.total > 0);
  const strongest = [...applicable].sort((a, b) => b.contribution / (b.weight || 1) - a.contribution / (a.weight || 1))[0];
  const weakest = [...applicable].sort((a, b) => a.contribution / (a.weight || 1) - b.contribution / (b.weight || 1))[0];

  const parts: string[] = [
    `Score ${args.score}/100 is the weighted result of ${applicable.length} evidence categories applied by this policy version.`,
  ];
  if (strongest) parts.push(`${titleCase(strongest.category)} contributed ${strongest.contribution} of ${strongest.weight} available points (${strongest.notes}).`);
  if (weakest && weakest.category !== strongest?.category) {
    parts.push(`${titleCase(weakest.category)} was the weakest area: ${weakest.notes}.`);
  }
  if (args.blockingFailures > 0) {
    parts.push(
      `${args.blockingFailures} blocking check(s) did not pass; the policy tolerates ${args.thresholds.maxBlockingFailures}.`,
    );
  }
  if (args.failedChecks.length) parts.push(`Failed: ${args.failedChecks.join(', ')}.`);
  if (args.attentionChecks.length) parts.push(`Needs attention: ${args.attentionChecks.join(', ')}.`);
  if (args.missingChecks.length) parts.push(`Not evidenced: ${args.missingChecks.join(', ')}.`);
  parts.push(
    `Auto-approval threshold for this policy is ${args.thresholds.autoApproveScore}; review threshold is ${args.thresholds.reviewScore}.`,
  );
  return parts.join(' ');
}

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}
