"use client";

import { Plus, Printer, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/form";
import { formatINR, rupeesToPaise } from "@/lib/domain/money";
import { computeOrderTotals } from "@/lib/domain/pricing";
import { EditorSection, ItemControls, SavedLabel, move } from "./editor-bits";
import { uid, usePersistentState } from "./use-persistent-state";

type LineItem = { id: string; description: string; qty: string; rate: string };
type Milestone = { id: string; title: string; duration: string };
type Proposal = {
  businessName: string;
  yourName: string;
  yourEmail: string;
  clientName: string;
  clientCompany: string;
  projectTitle: string;
  date: string;
  validDays: string;
  description: string;
  deliverables: { id: string; text: string }[];
  items: LineItem[];
  taxEnabled: boolean;
  taxRate: string;
  milestones: Milestone[];
  terms: string;
};

const SAMPLE: Proposal = {
  businessName: "Studio Meridian",
  yourName: "Meera Iyer",
  yourEmail: "hello@studiomeridian.example",
  clientName: "Rohan Desai",
  clientCompany: "Nimbus Coffee Co.",
  projectTitle: "Website redesign & online ordering",
  date: "",
  validDays: "14",
  description:
    "Nimbus Coffee wants customers to order ahead from their phones and to present the brand consistently across its three cafés. This proposal covers discovery, design and build of a fast, mobile-first website with an online ordering flow.",
  deliverables: [
    { id: "d1", text: "Discovery workshop and sitemap" },
    { id: "d2", text: "Design for up to 6 page templates" },
    { id: "d3", text: "Responsive build with online ordering integration" },
    { id: "d4", text: "Launch support and a 30-day care period" },
  ],
  items: [
    { id: "i1", description: "Discovery & strategy", qty: "1", rate: "25000" },
    { id: "i2", description: "UI design (per template)", qty: "6", rate: "9000" },
    { id: "i3", description: "Development & integration", qty: "1", rate: "90000" },
  ],
  taxEnabled: true,
  taxRate: "18",
  milestones: [
    { id: "m1", title: "Discovery & sitemap sign-off", duration: "Week 1" },
    { id: "m2", title: "Design review", duration: "Weeks 2–3" },
    { id: "m3", title: "Build & testing", duration: "Weeks 4–5" },
    { id: "m4", title: "Launch", duration: "Week 6" },
  ],
  terms: "50% advance on acceptance, 50% on launch. Invoices payable within 7 days. Two rounds of revisions are included per phase.",
};

const EMPTY: Proposal = {
  businessName: "",
  yourName: "",
  yourEmail: "",
  clientName: "",
  clientCompany: "",
  projectTitle: "",
  date: "",
  validDays: "14",
  description: "",
  deliverables: [],
  items: [{ id: "i1", description: "", qty: "1", rate: "" }],
  taxEnabled: false,
  taxRate: "18",
  milestones: [],
  terms: "",
};

function parseQty(v: string) {
  return /^\d{1,4}$/.test(v.trim()) && Number(v) >= 1 ? Number(v) : null;
}

/** Tax rate as basis points, e.g. "18" → 1800. Accepts up to two decimals. */
function parseRateBps(v: string) {
  const paise = rupeesToPaise(v);
  return paise !== null && paise <= 10000 ? paise : null;
}

const longDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" });

export function ProposalBuilder() {
  const [p, setP, loaded] = usePersistentState<Proposal>("lifeos.tool.proposal", SAMPLE);
  const set = <K extends keyof Proposal>(k: K, v: Proposal[K]) => setP((s) => ({ ...s, [k]: v }));
  const setItem = (id: string, patch: Partial<LineItem>) => set("items", p.items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const setMilestone = (id: string, patch: Partial<Milestone>) =>
    set("milestones", p.milestones.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  // Validate every line; only valid lines are priced.
  const lines = p.items.map((i) => {
    const qty = parseQty(i.qty);
    const rate = i.rate.trim() ? rupeesToPaise(i.rate) : 0;
    return {
      ...i,
      qtyN: qty,
      ratePaise: rate,
      qtyError: qty === null ? "Whole number, 1 or more" : null,
      rateError: rate === null ? "Enter an amount like 2500 or 2500.50" : null,
    };
  });
  const valid = lines.filter((l) => l.qtyN !== null && l.ratePaise !== null);
  const taxBps = p.taxEnabled ? parseRateBps(p.taxRate) : 0;
  const taxError = p.taxEnabled && taxBps === null ? "Enter a rate between 0 and 100" : null;
  const totals = computeOrderTotals(
    valid.map((l) => ({ unitPriceInPaise: l.ratePaise!, quantity: l.qtyN! })),
    taxBps ?? 0,
  );
  const hasErrors = lines.some((l) => l.qtyError || l.rateError) || !!taxError;

  // Rendered on the client only after mount, so a missing date falls back to "today" safely.
  const issued = p.date ? new Date(`${p.date}T00:00:00`) : loaded ? new Date() : null;
  const validDays = Number(p.validDays) || 0;
  const validUntil = issued && validDays > 0 ? new Date(issued.getTime() + validDays * 86400000) : null;

  return (
    <div className="grid grid-cols-1 gap-6 print:block xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
      <div className="print-hidden space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SavedLabel loaded={loaded} />
          <div className="flex gap-2">
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="sm">
                  <RotateCcw /> Start over
                </Button>
              }
              title="Clear this proposal?"
              description="All fields, line items and milestones will be removed from this browser."
              confirmLabel="Clear proposal"
              onConfirm={() => setP(EMPTY)}
            />
            <Button size="sm" onClick={() => window.print()} disabled={hasErrors} title={hasErrors ? "Fix the highlighted fields first" : undefined}>
              <Printer /> Print / Save PDF
            </Button>
          </div>
        </div>

        <EditorSection title="Parties">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Your business" htmlFor="p-biz">
              <Input id="p-biz" value={p.businessName} onChange={(e) => set("businessName", e.target.value)} />
            </Field>
            <Field label="Your name" htmlFor="p-you">
              <Input id="p-you" value={p.yourName} onChange={(e) => set("yourName", e.target.value)} />
            </Field>
            <Field label="Your email" htmlFor="p-email" className="sm:col-span-2">
              <Input id="p-email" type="email" value={p.yourEmail} onChange={(e) => set("yourEmail", e.target.value)} />
            </Field>
            <Field label="Client name" htmlFor="p-client">
              <Input id="p-client" value={p.clientName} onChange={(e) => set("clientName", e.target.value)} />
            </Field>
            <Field label="Client company" htmlFor="p-company" optional>
              <Input id="p-company" value={p.clientCompany} onChange={(e) => set("clientCompany", e.target.value)} />
            </Field>
          </div>
        </EditorSection>

        <EditorSection title="Project">
          <Field label="Project title" htmlFor="p-title">
            <Input id="p-title" value={p.projectTitle} onChange={(e) => set("projectTitle", e.target.value)} />
          </Field>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Proposal date" htmlFor="p-date" hint="Defaults to today">
              <Input id="p-date" type="date" value={p.date} onChange={(e) => set("date", e.target.value)} />
            </Field>
            <Field label="Valid for (days)" htmlFor="p-valid">
              <Input id="p-valid" inputMode="numeric" value={p.validDays} onChange={(e) => set("validDays", e.target.value.replace(/\D/g, "").slice(0, 3))} />
            </Field>
          </div>
          <Field label="Project description" htmlFor="p-desc" className="mt-3" hint="The client's goal, in their words.">
            <Textarea id="p-desc" rows={5} value={p.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </EditorSection>

        <EditorSection title="Deliverables">
          <ul className="space-y-2">
            {p.deliverables.map((d, i) => (
              <li key={d.id} className="flex items-center gap-2">
                <label htmlFor={`del-${d.id}`} className="sr-only">
                  Deliverable {i + 1}
                </label>
                <Input id={`del-${d.id}`} value={d.text} onChange={(e) => set("deliverables", p.deliverables.map((x) => (x.id === d.id ? { ...x, text: e.target.value } : x)))} />
                <ItemControls
                  index={i}
                  count={p.deliverables.length}
                  label={`deliverable ${i + 1}`}
                  onMove={(a, b) => set("deliverables", move(p.deliverables, a, b))}
                  onRemove={() => set("deliverables", p.deliverables.filter((x) => x.id !== d.id))}
                />
              </li>
            ))}
          </ul>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => set("deliverables", [...p.deliverables, { id: uid(), text: "" }])}>
            <Plus /> Add deliverable
          </Button>
        </EditorSection>

        <EditorSection title="Pricing" description="Amounts in INR, exclusive of tax.">
          <div className="space-y-3">
            {lines.map((l, i) => (
              <div key={l.id} className="rounded-[12px] border border-line p-3">
                <div className="flex items-start gap-2">
                  <Field label={`Item ${i + 1}`} htmlFor={`${l.id}-desc`} className="flex-1">
                    <Input id={`${l.id}-desc`} value={l.description} placeholder="Description" onChange={(e) => setItem(l.id, { description: e.target.value })} />
                  </Field>
                  <Button variant="ghost" size="icon-sm" className="mt-6 hover:text-danger" aria-label={`Remove item ${i + 1}`} onClick={() => set("items", p.items.filter((x) => x.id !== l.id))}>
                    <Trash2 />
                  </Button>
                </div>
                <div className="mt-2 grid grid-cols-[88px_1fr_auto] items-start gap-2">
                  <Field label="Qty" htmlFor={`${l.id}-qty`} error={l.qtyError}>
                    <Input id={`${l.id}-qty`} inputMode="numeric" value={l.qty} aria-invalid={l.qtyError ? true : undefined} onChange={(e) => setItem(l.id, { qty: e.target.value })} />
                  </Field>
                  <Field label="Rate (₹)" htmlFor={`${l.id}-rate`} error={l.rateError}>
                    <Input id={`${l.id}-rate`} inputMode="decimal" value={l.rate} aria-invalid={l.rateError ? true : undefined} onChange={(e) => setItem(l.id, { rate: e.target.value })} />
                  </Field>
                  <div className="pt-7 text-right text-[13px] tabular-nums text-ink-2">
                    {l.qtyN !== null && l.ratePaise !== null ? formatINR(l.qtyN * l.ratePaise, { exact: true }) : "—"}
                  </div>
                </div>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => set("items", [...p.items, { id: uid(), description: "", qty: "1", rate: "" }])}>
              <Plus /> Add line item
            </Button>
            <div className="flex flex-wrap items-start gap-4 rounded-[12px] bg-sunken p-3">
              <label className="flex items-center gap-2 pt-2 text-[13.5px]">
                <input type="checkbox" checked={p.taxEnabled} onChange={(e) => set("taxEnabled", e.target.checked)} className="size-4 accent-[var(--color-ink)]" />
                Add tax (e.g. GST)
              </label>
              {p.taxEnabled && (
                <Field label="Rate (%)" htmlFor="p-tax" error={taxError} className="w-28">
                  <Input id="p-tax" inputMode="decimal" value={p.taxRate} aria-invalid={taxError ? true : undefined} onChange={(e) => set("taxRate", e.target.value)} />
                </Field>
              )}
            </div>
          </div>
        </EditorSection>

        <EditorSection title="Timeline">
          <div className="space-y-2">
            {p.milestones.map((m, i) => (
              <div key={m.id} className="flex items-center gap-2">
                <label htmlFor={`${m.id}-t`} className="sr-only">
                  Milestone {i + 1}
                </label>
                <Input id={`${m.id}-t`} value={m.title} placeholder="Milestone" onChange={(e) => setMilestone(m.id, { title: e.target.value })} />
                <label htmlFor={`${m.id}-d`} className="sr-only">
                  When
                </label>
                <Input id={`${m.id}-d`} value={m.duration} placeholder="Week 1" className="w-32" onChange={(e) => setMilestone(m.id, { duration: e.target.value })} />
                <ItemControls
                  index={i}
                  count={p.milestones.length}
                  label={`milestone ${i + 1}`}
                  onMove={(a, b) => set("milestones", move(p.milestones, a, b))}
                  onRemove={() => set("milestones", p.milestones.filter((x) => x.id !== m.id))}
                />
              </div>
            ))}
          </div>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => set("milestones", [...p.milestones, { id: uid(), title: "", duration: "" }])}>
            <Plus /> Add milestone
          </Button>
        </EditorSection>

        <EditorSection title="Terms">
          <Field label="Payment & terms" htmlFor="p-terms">
            <Textarea id="p-terms" rows={3} value={p.terms} onChange={(e) => set("terms", e.target.value)} />
          </Field>
        </EditorSection>
      </div>

      {/* Preview */}
      <div className="print-area xl:sticky xl:top-20 xl:self-start">
        <p className="print-hidden mb-2 text-[12.5px] text-ink-3">Live preview</p>
        <article
          aria-label="Proposal preview"
          className="print-document mx-auto w-full max-w-[760px] rounded-[6px] border border-line bg-white text-[#1f1f1f] shadow-lift"
        >
          <div className="h-1.5 rounded-t-[6px] bg-[linear-gradient(90deg,#191919,#5f42e6)] print:hidden" />
          <div className="px-[7%] py-[6%] text-[13px] leading-relaxed">
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[15px] font-semibold tracking-[-0.02em]">{p.businessName || "Your business"}</p>
                <p className="text-[12px] text-[#8f8a82]">
                  {[p.yourName, p.yourEmail].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="text-right text-[12px] text-[#5f5b55]">
                <p>{issued ? longDate.format(issued) : " "}</p>
                {validUntil && <p className="text-[#8f8a82]">Valid until {longDate.format(validUntil)}</p>}
              </div>
            </header>

            <div className="mt-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5f42e6]">Proposal</p>
              <h2 className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.03em]">{p.projectTitle || "Project title"}</h2>
              <p className="mt-2 text-[#5f5b55]">
                Prepared for {p.clientName || "Client name"}
                {p.clientCompany && `, ${p.clientCompany}`}
              </p>
            </div>

            {p.description && (
              <section className="mt-8">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f8a82]">Overview</h3>
                <p className="mt-2 whitespace-pre-line text-[#3a3834]">{p.description}</p>
              </section>
            )}

            {p.deliverables.some((d) => d.text.trim()) && (
              <section className="mt-8 break-inside-avoid">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f8a82]">What we&apos;ll deliver</h3>
                <ul className="mt-2 space-y-1.5">
                  {p.deliverables
                    .filter((d) => d.text.trim())
                    .map((d) => (
                      <li key={d.id} className="flex gap-2.5 text-[#3a3834]">
                        <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[#5f42e6]" aria-hidden />
                        {d.text}
                      </li>
                    ))}
                </ul>
              </section>
            )}

            <section className="mt-8 break-inside-avoid">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f8a82]">Investment</h3>
              <table className="mt-3 w-full border-collapse text-[12.5px]">
                <thead>
                  <tr className="border-b border-[#e6e2da] text-left text-[11px] text-[#8f8a82]">
                    <th className="py-2 font-medium">Item</th>
                    <th className="py-2 text-right font-medium">Qty</th>
                    <th className="py-2 text-right font-medium">Rate</th>
                    <th className="py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {valid.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-3 text-[#8f8a82]">
                        Add line items to build your pricing table.
                      </td>
                    </tr>
                  )}
                  {valid.map((l) => (
                    <tr key={l.id} className="border-b border-[#f0ede7]">
                      <td className="py-2 pr-3">{l.description || "Item"}</td>
                      <td className="py-2 text-right tabular-nums">{l.qtyN}</td>
                      <td className="py-2 text-right tabular-nums">{formatINR(l.ratePaise!, { exact: true })}</td>
                      <td className="py-2 text-right tabular-nums">{formatINR(l.qtyN! * l.ratePaise!, { exact: true })}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="tabular-nums">
                  <tr>
                    <td colSpan={3} className="pt-3 text-right text-[#5f5b55]">
                      Subtotal
                    </td>
                    <td className="pt-3 text-right">{formatINR(totals.subtotalInPaise, { exact: true })}</td>
                  </tr>
                  {p.taxEnabled && taxBps !== null && (
                    <tr>
                      <td colSpan={3} className="pt-1 text-right text-[#5f5b55]">
                        Tax ({taxBps / 100}%)
                      </td>
                      <td className="pt-1 text-right">{formatINR(totals.taxInPaise, { exact: true })}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className="pt-2 text-right font-semibold">
                      Total
                    </td>
                    <td className="pt-2 text-right text-[15px] font-semibold">{formatINR(totals.totalInPaise, { exact: true })}</td>
                  </tr>
                </tfoot>
              </table>
            </section>

            {p.milestones.some((m) => m.title.trim()) && (
              <section className="mt-8 break-inside-avoid">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f8a82]">Timeline</h3>
                <ol className="mt-3 border-l border-[#e6e2da] pl-4">
                  {p.milestones
                    .filter((m) => m.title.trim())
                    .map((m) => (
                      <li key={m.id} className="relative pb-3 last:pb-0">
                        <span className="absolute -left-[21px] top-[7px] size-2 rounded-full border-2 border-white bg-[#5f42e6]" aria-hidden />
                        <span className="font-medium">{m.title}</span>
                        {m.duration && <span className="text-[#8f8a82]"> · {m.duration}</span>}
                      </li>
                    ))}
                </ol>
              </section>
            )}

            {p.terms && (
              <section className="mt-8 break-inside-avoid">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f8a82]">Terms</h3>
                <p className="mt-2 whitespace-pre-line text-[#3a3834]">{p.terms}</p>
              </section>
            )}

            <footer className="mt-12 grid grid-cols-2 gap-8 break-inside-avoid text-[12px] text-[#8f8a82]">
              <div>
                <div className="h-10 border-b border-[#d8d3c9]" />
                <p className="mt-1.5">{p.yourName || "Your name"}, {p.businessName || "Your business"}</p>
              </div>
              <div>
                <div className="h-10 border-b border-[#d8d3c9]" />
                <p className="mt-1.5">Accepted by {p.clientName || "Client"}</p>
              </div>
            </footer>
          </div>
        </article>
      </div>
    </div>
  );
}
