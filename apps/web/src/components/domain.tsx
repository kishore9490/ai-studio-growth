import { useMemo, type ReactNode } from 'react';
import {
  ATTRIBUTION_LABEL,
  ASSESSMENT_BAND_LABEL,
  getCheckDefinition,
  type Assessment,
  type Attribution,
  type CheckStatus,
  type CommercialState,
  type Credential,
  type DigitalCard as DigitalCardModel,
  type Evidence,
  type Freshness,
  type VerificationCheck,
  type VerificationLifecycle,
  type VerificationResult,
} from '@bid/core';
import { QrCode, ShieldCheck } from 'lucide-react';
import { Badge, Callout, DataList, ProgressBar, Tooltip, cx, type Tone } from './ui';
import { bandTone, checkStatusTone, formatDate, formatDateTime, freshnessTone, humanize, verificationTone } from '../lib/format';

/* ------------------------------------------------------------------ */
/* identity                                                            */
/* ------------------------------------------------------------------ */

export function BidLogo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-2', className)}>
      <span className="flex h-7 w-7 items-center justify-center rounded bg-brand-600 text-sm font-black text-white">
        B
      </span>
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="text-sm font-bold tracking-tight">BID TRUST</span>
          <span className="text-2xs tracking-wide text-slate-400">Trust, backed by verification.</span>
        </span>
      )}
    </span>
  );
}

export function OrgAvatar({
  name,
  color,
  text,
  size = 'md',
}: {
  name: string;
  color?: string;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = { sm: 'h-6 w-6 text-2xs', md: 'h-9 w-9 text-xs', lg: 'h-14 w-14 text-base' };
  const label = text ?? name.slice(0, 2).toUpperCase();
  return (
    <span
      className={cx('flex shrink-0 items-center justify-center rounded font-bold text-white', sizes[size])}
      style={{ backgroundColor: color ?? '#1e3a8a' }}
      title={name}
    >
      {label}
    </span>
  );
}

export function BidIdChip({ bidId, className }: { bidId: string; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-2xs text-slate-600',
        className,
      )}
    >
      {bidId}
    </span>
  );
}

/**
 * The four provenance classes must always be distinguishable in the UI
 * (Section 12). This chip is the single place that decides how they look.
 */
export function AttributionChip({ attribution }: { attribution: Attribution }) {
  const tone: Record<Attribution, Tone> = {
    COMPANY_PROVIDED: 'pending',
    BID_VERIFIED: 'brand',
    PROVIDER_VERIFIED: 'info',
    OFFICIAL_SOURCE_DERIVED: 'verified',
  };
  const explanation: Record<Attribution, string> = {
    COMPANY_PROVIDED: 'Stated by the organization itself. Not independently verified.',
    BID_VERIFIED: 'Derived by BID from evidence collected under a policy.',
    PROVIDER_VERIFIED: 'Confirmed by a named verification provider.',
    OFFICIAL_SOURCE_DERIVED:
      'Derived from an authorized data source through a provider. BID is not a government authority and this is not a government endorsement.',
  };
  return (
    <Tooltip label={explanation[attribution]}>
      <Badge tone={tone[attribution]}>{ATTRIBUTION_LABEL[attribution]}</Badge>
    </Tooltip>
  );
}

/* ------------------------------------------------------------------ */
/* status                                                              */
/* ------------------------------------------------------------------ */

export function VerificationStatusBadge({ status }: { status: VerificationLifecycle | 'NONE' }) {
  if (status === 'NONE') return <Badge tone="pending">Not started</Badge>;
  return (
    <Badge tone={verificationTone(status)} dot>
      {humanize(status)}
    </Badge>
  );
}

export function CheckStatusBadge({ status }: { status: CheckStatus }) {
  return <Badge tone={checkStatusTone(status) as Tone}>{humanize(status)}</Badge>;
}

export function FreshnessBadge({ freshness }: { freshness: Freshness }) {
  return <Badge tone={freshnessTone(freshness) as Tone}>{humanize(freshness)}</Badge>;
}

export function CommercialStateBadge({ state }: { state: CommercialState }) {
  const tone: Record<CommercialState, Tone> = {
    NON_MEMBER: 'pending',
    MEMBER: 'info',
    VERIFIED_MEMBER: 'verified',
    REQUESTER: 'brand',
    CUSTOMER: 'brand',
    ENTERPRISE: 'brand',
  };
  return <Badge tone={tone[state]}>{humanize(state)}</Badge>;
}

/* ------------------------------------------------------------------ */
/* verification detail                                                 */
/* ------------------------------------------------------------------ */

export function ChecksTable({
  checks,
  results,
  onSelect,
}: {
  checks: VerificationCheck[];
  results: VerificationResult[];
  onSelect?: (check: VerificationCheck) => void;
}) {
  const resultByCheck = useMemo(() => new Map(results.map((r) => [r.checkId, r])), [results]);

  return (
    <div className="overflow-x-auto">
      <table className="bid-table">
        <thead>
          <tr>
            <th>Check</th>
            <th>Category</th>
            <th>Requirement</th>
            <th>Status</th>
            <th>Result</th>
            <th className="text-right">Provider</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((check) => {
            const definition = getCheckDefinition(check.checkCode);
            const result = resultByCheck.get(check.id);
            return (
              <tr
                key={check.id}
                className={onSelect ? 'cursor-pointer' : undefined}
                onClick={onSelect ? () => onSelect(check) : undefined}
              >
                <td className="font-medium text-navy-900">{definition?.label ?? check.checkCode}</td>
                <td>{humanize(check.category)}</td>
                <td>
                  {check.blocking ? (
                    <Badge tone="exception">Blocking</Badge>
                  ) : check.required ? (
                    <Badge tone="info">Required</Badge>
                  ) : (
                    <Badge tone="pending">Optional</Badge>
                  )}
                </td>
                <td>
                  <CheckStatusBadge status={check.status} />
                </td>
                <td className="max-w-md text-xs text-slate-600">{result?.summary ?? '—'}</td>
                <td className="text-right text-xs text-slate-500">{check.providerId ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Evidence is the answer to "don't trust the badge, verify the verification".
 * Every column here exists because the product promises it: what, source,
 * method, when, result, scope, freshness, provider, reference.
 */
export function EvidenceTable({ evidence }: { evidence: Evidence[] }) {
  if (evidence.length === 0) {
    return (
      <Callout tone="pending" title="No evidence visible at your access level">
        Evidence is classified per check. Sensitive and restricted records are only visible to the workspace that ran the
        verification, and to the subject organization itself.
      </Callout>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="bid-table">
        <thead>
          <tr>
            <th>What was checked</th>
            <th>Source</th>
            <th>Method</th>
            <th>Checked</th>
            <th>Result</th>
            <th>Confidence</th>
            <th>Freshness</th>
            <th>Reference</th>
            <th>Visibility</th>
          </tr>
        </thead>
        <tbody>
          {evidence.map((item) => (
            <tr key={item.id}>
              <td className="font-medium text-navy-900">
                <div>{item.what}</div>
                <div className="mt-0.5">
                  <AttributionChip attribution={item.attribution} />
                </div>
              </td>
              <td className="max-w-[16rem] text-xs">{item.source}</td>
              <td className="text-xs">{humanize(item.method)}</td>
              <td className="whitespace-nowrap text-xs">{formatDateTime(item.checkedAt)}</td>
              <td>
                <Badge tone={item.result === 'PASS' ? 'verified' : item.result === 'ATTENTION' ? 'attention' : 'exception'}>
                  {item.result}
                </Badge>
              </td>
              <td className="text-xs">{Math.round(item.confidence * 100)}%</td>
              <td>
                <FreshnessBadge freshness={item.freshness} />
              </td>
              <td className="font-mono text-2xs text-slate-500">{item.reference}</td>
              <td className="text-2xs text-slate-500">{humanize(item.visibility)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AssessmentPanel({ assessment, policyName }: { assessment: Assessment; policyName: string }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight text-navy-900">{assessment.score}</span>
          <span className="text-sm text-slate-500">/ 100</span>
        </div>
        <Badge tone={bandTone(assessment.band)} dot>
          {ASSESSMENT_BAND_LABEL[assessment.band]}
        </Badge>
        <FreshnessBadge freshness={assessment.freshness} />
        <span className="text-xs text-slate-500">
          {policyName} · v{assessment.policyVersion} · expires {formatDate(assessment.expiresAt)}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {assessment.categories
          .filter((category) => category.total > 0)
          .map((category) => (
            <div key={category.category} className="rounded border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <span className="bid-label">{humanize(category.category)}</span>
                <Badge
                  tone={
                    category.verdict === 'VERIFIED' || category.verdict === 'CLEAR'
                      ? 'verified'
                      : category.verdict === 'ATTENTION' || category.verdict === 'PARTIAL'
                        ? 'attention'
                        : 'exception'
                  }
                >
                  {humanize(category.verdict)}
                </Badge>
              </div>
              <div className="mt-2">
                <ProgressBar
                  value={(category.contribution / (category.weight || 1)) * 100}
                  tone={category.verdict === 'NOT_VERIFIED' ? 'exception' : 'verified'}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {category.notes} · contributed {category.contribution} of {category.weight} points
              </p>
            </div>
          ))}
      </div>

      <div className="rounded border border-slate-200 bg-slate-50 p-3">
        <p className="bid-label">Why this assessment</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">{assessment.explanation}</p>
        {(assessment.missingChecks.length > 0 || assessment.failedChecks.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {assessment.failedChecks.map((label) => (
              <Badge key={label} tone="exception">
                Failed: {label}
              </Badge>
            ))}
            {assessment.missingChecks.map((label) => (
              <Badge key={label} tone="pending">
                Not evidenced: {label}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Callout tone="neutral" title="Scope of this statement">
        {assessment.disclaimer}
      </Callout>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* credentials                                                         */
/* ------------------------------------------------------------------ */

/**
 * The BID Digital Card. Carries status and attribute summaries only — never
 * identifiers, documents or evidence (Section 16).
 */
export function BidDigitalCard({ card, compact }: { card: DigitalCardModel; compact?: boolean }) {
  const verified = card.status === 'BID VERIFIED';
  return (
    <div
      className={cx(
        'relative overflow-hidden rounded-lg border border-navy-800 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white shadow-panel',
        compact ? 'p-4' : 'p-5',
      )}
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-600/20 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <OrgAvatar name={card.displayName} color={card.logoColor} text={card.logoText} size={compact ? 'md' : 'lg'} />
          <div className="min-w-0">
            <p className={cx('truncate font-semibold tracking-tight', compact ? 'text-sm' : 'text-lg')}>{card.displayName}</p>
            <p className="truncate font-mono text-xs text-navy-200">{card.bidId}</p>
          </div>
        </div>
        <span
          className={cx(
            'flex shrink-0 items-center gap-1 whitespace-nowrap rounded px-2 py-1 text-2xs font-bold uppercase tracking-wider',
            verified ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/10 text-navy-100',
          )}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          {card.status}
        </span>
      </div>

      <ul className={cx('relative grid gap-1.5', compact ? 'mt-3 grid-cols-2' : 'mt-5 grid-cols-2')}>
        {card.attributes.map((attribute) => (
          <li key={attribute.label} className="flex min-w-0 items-center gap-1.5 text-xs text-navy-100">
            <span
              className={cx(
                'flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold',
                attribute.state === 'VERIFIED'
                  ? 'bg-emerald-500 text-white'
                  : attribute.state === 'ATTENTION'
                    ? 'bg-amber-500 text-white'
                    : 'bg-white/20 text-white/70',
              )}
            >
              {attribute.state === 'VERIFIED' ? '✓' : attribute.state === 'ATTENTION' ? '!' : '–'}
            </span>
            <span className="truncate">{attribute.label}</span>
          </li>
        ))}
      </ul>

      <div className="relative mt-5 flex items-end justify-between gap-3">
        <div className="min-w-0 text-2xs text-navy-300">
          {card.issuedAt && <p>Issued {formatDate(card.issuedAt)}</p>}
          {card.expiresAt && <p>Valid to {formatDate(card.expiresAt)}</p>}
          <p className="mt-1 max-w-[15rem] leading-snug">{card.footnote}</p>
        </div>
        <QrPlaceholder payload={card.qrPayload} />
      </div>
    </div>
  );
}

/** Deterministic QR-like block. A real build renders an encoded QR code. */
export function QrPlaceholder({ payload, size = 64 }: { payload: string; size?: number }) {
  const cells = useMemo(() => {
    const grid: boolean[] = [];
    let hash = 2166136261;
    for (let i = 0; i < payload.length; i += 1) {
      hash ^= payload.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    for (let i = 0; i < 49; i += 1) {
      hash = Math.imul(hash ^ (i + 1), 16777619);
      grid.push((hash >>> 7) % 3 !== 0);
    }
    return grid;
  }, [payload]);

  return (
    <Tooltip label={payload}>
      <span
        className="grid shrink-0 grid-cols-7 gap-px rounded bg-white p-1"
        style={{ width: size, height: size }}
        aria-label="QR code placeholder"
      >
        {cells.map((filled, index) => (
          <span key={index} className={filled ? 'bg-navy-900' : 'bg-white'} />
        ))}
        <QrCode className="hidden" />
      </span>
    </Tooltip>
  );
}

export function CredentialCard({ credential, policyName }: { credential: Credential; policyName: string }) {
  return (
    <div className="bid-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-navy-900">{credential.title}</p>
          <BidIdChip bidId={credential.bidId} className="mt-1" />
        </div>
        <Badge tone={credential.status === 'ACTIVE' ? 'verified' : credential.status === 'EXPIRING' ? 'attention' : 'exception'}>
          {humanize(credential.status)}
        </Badge>
      </div>
      <DataList
        items={[
          { label: 'Policy', value: `${policyName} · v${credential.policyVersion}` },
          { label: 'Issued', value: formatDate(credential.issuedAt) },
          { label: 'Valid to', value: formatDate(credential.expiresAt) },
        ]}
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {credential.publicAttributes.map((attribute) => (
          <Badge
            key={attribute.label}
            tone={attribute.state === 'VERIFIED' ? 'verified' : attribute.state === 'ATTENTION' ? 'attention' : 'pending'}
          >
            {attribute.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function KeyValueGrid({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.label}>
          <p className="bid-label">{item.label}</p>
          <p className="mt-0.5 text-sm text-navy-900">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
