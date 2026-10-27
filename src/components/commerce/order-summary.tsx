import { formatBps, formatINR } from "@/lib/domain/money";

export function PriceBreakdown({
  subtotalInPaise,
  taxInPaise,
  totalInPaise,
  taxRateBps,
  taxLabel,
}: {
  subtotalInPaise: number;
  taxInPaise: number;
  totalInPaise: number;
  taxRateBps: number;
  taxLabel: string;
}) {
  return (
    <dl className="space-y-2 text-[14px]">
      <div className="flex justify-between text-ink-2">
        <dt>Subtotal</dt>
        <dd className="tabular-nums">{formatINR(subtotalInPaise, { exact: true })}</dd>
      </div>
      <div className="flex justify-between text-ink-2">
        <dt>
          {taxLabel} <span className="text-ink-3">· {formatBps(taxRateBps)}</span>
        </dt>
        <dd className="tabular-nums">{formatINR(taxInPaise, { exact: true })}</dd>
      </div>
      <div className="flex justify-between border-t border-line pt-3 text-[16px] font-semibold">
        <dt>Total</dt>
        <dd className="tabular-nums">{formatINR(totalInPaise, { exact: true })}</dd>
      </div>
    </dl>
  );
}
