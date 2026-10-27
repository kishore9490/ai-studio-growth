"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { updateAffiliateSettings } from "@/actions/admin/operations";
import type { FormResult } from "@/actions/admin/utils";
import { Field, FormMessage, Input } from "@/components/ui/form";
import { Switch } from "@/components/ui/menu";
import { Panel } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatINR } from "@/lib/domain/money";
import { cn } from "@/lib/utils";

type Level = { level: number; rate: string; enabled: boolean };

const EXAMPLE_PRICE = 100000; // ₹1,000 item, for the worked example

function rateToBps(rate: string) {
  const s = rate.trim();
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(s)) return null;
  const [w, f = ""] = s.split(".");
  return Number(w) * 100 + Number(f.padEnd(2, "0"));
}

export function AffiliateForm({
  initial,
}: {
  initial: { programEnabled: boolean; commissionMode: "DISABLED" | "TEST"; attributionWindowDays: number; holdPeriodDays: number; minPayout: string; levels: Level[] };
}) {
  const [state, action] = useActionState<FormResult, FormData>(updateAffiliateSettings, {});
  const [programEnabled, setProgramEnabled] = useState(initial.programEnabled);
  const [mode, setMode] = useState(initial.commissionMode);
  const [levels, setLevels] = useState(initial.levels);
  const fe = state.fieldErrors ?? {};
  useEffect(() => {
    if (state.ok) toast.success(state.message);
  }, [state]);

  const setLevel = (i: number, patch: Partial<Level>) => setLevels((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const totalBps = levels.reduce((s, l) => s + (l.enabled ? (rateToBps(l.rate) ?? 0) : 0), 0);

  return (
    <form action={action} className="space-y-6" noValidate>
      <FormMessage>{state.error}</FormMessage>

      <Panel className="p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-[15px] font-semibold">Affiliate programme</h2>
            <p className="mt-1 max-w-xl text-[13.5px] text-ink-2">
              When disabled, referral links stop attributing new sign-ups and no commissions accrue. Members can always use the platform without joining.
            </p>
          </div>
          <Switch checked={programEnabled} onCheckedChange={setProgramEnabled} aria-label="Programme enabled" />
          {programEnabled && <input type="hidden" name="programEnabled" value="on" />}
        </div>
      </Panel>

      <Panel className="p-6">
        <h2 className="text-[15px] font-semibold">Commission mode</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Commission mode">
          {(
            [
              { v: "DISABLED", t: "Disabled", d: "No commission records are created for any order." },
              { v: "TEST", t: "Test mode", d: "Records are created and labelled as test data. No payouts are possible." },
            ] as const
          ).map((o) => (
            <label key={o.v} className={cn("flex cursor-pointer items-start gap-3 rounded-[12px] border p-4", mode === o.v ? "border-ink shadow-lift" : "border-line")}>
              <input type="radio" name="commissionMode" value={o.v} checked={mode === o.v} onChange={() => setMode(o.v)} className="mt-0.5 accent-[var(--color-ink)]" />
              <span>
                <span className="block text-[13.5px] font-medium">{o.t}</span>
                <span className="block text-[12.5px] text-ink-3">{o.d}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="mt-4 rounded-[10px] bg-sunken px-3.5 py-2.5 text-[12.5px] text-ink-2">
          There is deliberately no <strong>Live</strong> mode. Real commission accrual and payouts require legal and financial approval of the compensation plan,
          and then a code change and deployment — they can&apos;t be switched on from this screen.
        </p>
      </Panel>

      <Panel className="p-6">
        <h2 className="text-[15px] font-semibold">Commission levels</h2>
        <p className="mt-1 text-[13.5px] text-ink-2">
          Percentages of the pre-tax price of eligible product sales. Memberships and sign-ups never earn commission. Combined enabled rates are capped at 50%.
        </p>
        <div className="mt-5 divide-y divide-line rounded-[12px] border border-line">
          {levels.map((l, i) => {
            const bps = rateToBps(l.rate);
            return (
              <div key={l.level} className="flex flex-wrap items-center gap-4 p-4">
                <div className="w-28">
                  <p className="text-[13.5px] font-medium">Level {l.level}</p>
                  <p className="text-[12px] text-ink-3">{["Direct referral", "Their referrals", "One step further"][i]}</p>
                </div>
                <div className="w-32">
                  <label className="sr-only" htmlFor={`rate${l.level}`}>
                    Level {l.level} rate (%)
                  </label>
                  <div className="relative">
                    <Input
                      id={`rate${l.level}`}
                      name={`rate${l.level}`}
                      value={l.rate}
                      inputMode="decimal"
                      onChange={(e) => setLevel(i, { rate: e.target.value })}
                      className="pr-8 tabular-nums"
                      aria-invalid={fe[`rate${l.level}`] ? true : undefined}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-ink-3">%</span>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-[13px]">
                  <Switch checked={l.enabled} onCheckedChange={(v) => setLevel(i, { enabled: v })} aria-label={`Level ${l.level} enabled`} />
                  {l.enabled ? "Enabled" : "Disabled"}
                </label>
                {l.enabled && <input type="hidden" name={`enabled${l.level}`} value="on" />}
                <p className="ml-auto text-[12.5px] text-ink-3">
                  {fe[`rate${l.level}`] ? (
                    <span className="text-danger">{fe[`rate${l.level}`]}</span>
                  ) : bps !== null && l.enabled ? (
                    `${formatINR(Math.floor((EXAMPLE_PRICE * bps) / 10000), { exact: true })} on a ₹1,000 sale`
                  ) : (
                    "—"
                  )}
                </p>
              </div>
            );
          })}
        </div>
        <p className={cn("mt-3 text-[12.5px]", totalBps > 5000 ? "text-danger" : "text-ink-3")}>Combined enabled rate: {(totalBps / 100).toFixed(2)}%</p>
      </Panel>

      <Panel className="grid gap-5 p-6 sm:grid-cols-3">
        <Field label="Attribution window (days)" htmlFor="attributionWindowDays" error={fe.attributionWindowDays} hint="How long a referral link is remembered before sign-up.">
          <Input id="attributionWindowDays" name="attributionWindowDays" type="number" min={1} max={365} defaultValue={initial.attributionWindowDays} />
        </Field>
        <Field label="Refund hold period (days)" htmlFor="holdPeriodDays" error={fe.holdPeriodDays} hint="Commissions stay pending at least this long.">
          <Input id="holdPeriodDays" name="holdPeriodDays" type="number" min={0} max={120} defaultValue={initial.holdPeriodDays} />
        </Field>
        <Field label="Minimum payout request (₹)" htmlFor="minPayout" error={fe.minPayout} hint="Approved balance needed to request a (test) payout.">
          <Input id="minPayout" name="minPayout" inputMode="decimal" defaultValue={initial.minPayout} />
        </Field>
      </Panel>

      <div className="flex justify-end">
        <SubmitButton pendingLabel="Saving…">Save programme settings</SubmitButton>
      </div>
    </form>
  );
}
