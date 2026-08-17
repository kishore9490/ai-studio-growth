import type { AssessmentBand, CheckStatus, Freshness, VerificationLifecycle } from '@bid/core';

export function formatInr(paise: number, options?: { compact?: boolean }): string {
  const rupees = paise / 100;
  if (options?.compact) {
    if (rupees >= 10000000) return `₹${(rupees / 10000000).toFixed(2)} Cr`;
    if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(2)} L`;
    if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}K`;
  }
  return `₹${rupees.toLocaleString('en-IN', { maximumFractionDigits: rupees % 1 === 0 ? 0 : 2 })}`;
}

export function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function relativeTime(iso?: string, reference: string = new Date().toISOString()): string {
  if (!iso) return '—';
  const deltaMs = new Date(reference).getTime() - new Date(iso).getTime();
  const minutes = Math.round(deltaMs / 60000);
  if (Math.abs(minutes) < 60) return minutes <= 0 ? 'just now' : `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 31) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[\s_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function humanize(value?: string): string {
  if (!value) return '—';
  return titleCase(value.replace(/_/g, ' '));
}

export const STATUS_TONE: Record<string, 'verified' | 'attention' | 'exception' | 'pending' | 'info'> = {
  PASSED: 'verified',
  ATTENTION: 'attention',
  FAILED: 'exception',
  UNAVAILABLE: 'attention',
  SKIPPED: 'pending',
  PLANNED: 'pending',
  RUNNING: 'info',
  BLOCKED_ON_CONSENT: 'pending',
  BLOCKED_ON_DOCUMENT: 'pending',
};

export function checkStatusTone(status: CheckStatus) {
  return STATUS_TONE[status] ?? 'pending';
}

export function verificationTone(status: VerificationLifecycle): 'verified' | 'attention' | 'exception' | 'pending' | 'info' {
  switch (status) {
    case 'COMPLETED':
    case 'CREDENTIAL_ISSUED':
    case 'MONITORING':
      return 'verified';
    case 'REQUIRES_REVIEW':
    case 'PARTIAL':
    case 'REVIEW':
      return 'attention';
    case 'FAILED':
    case 'EXPIRED':
    case 'REVOKED':
      return 'exception';
    case 'IN_PROGRESS':
    case 'CHECKS_RUNNING':
    case 'ASSESSMENT':
    case 'EVIDENCE_COLLECTED':
      return 'info';
    default:
      return 'pending';
  }
}

export function bandTone(band: AssessmentBand): 'verified' | 'attention' | 'exception' | 'pending' {
  switch (band) {
    case 'LOW_RISK':
      return 'verified';
    case 'MODERATE_RISK':
      return 'attention';
    case 'ELEVATED_RISK':
    case 'HIGH_RISK':
      return 'exception';
    default:
      return 'pending';
  }
}

export function freshnessTone(freshness: Freshness): 'verified' | 'attention' | 'exception' | 'pending' {
  switch (freshness) {
    case 'CURRENT':
      return 'verified';
    case 'AGING':
      return 'attention';
    case 'STALE':
      return 'attention';
    case 'EXPIRED':
      return 'exception';
    default:
      return 'pending';
  }
}

export function percent(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}
