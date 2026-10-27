"use client";

import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { Callout, Panel } from "@/components/ui/misc";
import { formatINR, rupeesToPaise } from "@/lib/domain/money";
import { cn } from "@/lib/utils";
import { SavedLabel } from "./editor-bits";
import { uid, usePersistentState } from "./use-persistent-state";

const CATEGORIES = [
  { key: "housing", label: "Housing", hue: 258 },
  { key: "food", label: "Food & groceries", hue: 28 },
  { key: "transport", label: "Transport", hue: 205 },
  { key: "utilities", label: "Utilities & bills", hue: 168 },
  { key: "health", label: "Health & insurance", hue: 150 },
  { key: "debt", label: "Loans & EMIs", hue: 10 },
  { key: "fun", label: "Entertainment", hue: 320 },
  { key: "shopping", label: "Shopping", hue: 290 },
  { key: "other", label: "Other", hue: 40 },
] as const;
type CategoryKey = (typeof CATEGORIES)[number]["key"];

type Income = { id: string; label: string; amount: string };
type Expense = { id: string; label: string; category: CategoryKey; amount: string };
type Budget = { income: Income[]; expenses: Expense[]; savingsGoal: string };

const SAMPLE: Budget = {
  income: [
    { id: "i1", label: "Salary (after tax)", amount: "62000" },
    { id: "i2", label: "Freelance", amount: "8000" },
  ],
  expenses: [
    { id: "e1", label: "Rent", category: "housing", amount: "18000" },
    { id: "e2", label: "Groceries", category: "food", amount: "7000" },
    { id: "e3", label: "Metro & cabs", category: "transport", amount: "3000" },
    { id: "e4", label: "Electricity, internet, phone", category: "utilities", amount: "2800" },
    { id: "e5", label: "Health insurance", category: "health", amount: "1500" },
    { id: "e6", label: "Eating out & movies", category: "fun", amount: "4000" },
  ],
  savingsGoal: "15000",
};

const EMPTY: Budget = { income: [{ id: "i1", label: "", amount: "" }], expenses: [], savingsGoal: "" };

/** Parse an amount field; empty counts as zero, invalid returns null. */
function amount(v: string) {
  return v.trim() ? rupeesToPaise(v) : 0;
}

export function BudgetPlanner() {
  const [b, setB, loaded] = usePersistentState<Budget>("lifeos.tool.budget", SAMPLE);
  const set = <K extends keyof Budget>(k: K, v: Budget[K]) => setB((s) => ({ ...s, [k]: v }));

  const income = b.income.map((i) => ({ ...i, paise: amount(i.amount) }));
  const expenses = b.expenses.map((e) => ({ ...e, paise: amount(e.amount) }));
  const goal = amount(b.savingsGoal);

  const totalIncome = income.reduce((s, i) => s + (i.paise ?? 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.paise ?? 0), 0);
  const surplus = totalIncome - totalExpenses;
  const byCategory = CATEGORIES.map((c) => ({
    ...c,
    paise: expenses.filter((e) => e.category === c.key).reduce((s, e) => s + (e.paise ?? 0), 0),
  }))
    .filter((c) => c.paise > 0)
    .sort((a, b2) => b2.paise - a.paise);
  const goalProgress = goal && goal > 0 ? Math.max(0, Math.min(100, Math.round((Math.max(surplus, 0) * 100) / goal))) : null;
  const savingsRate = totalIncome > 0 ? Math.round((surplus * 100) / totalIncome) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SavedLabel loaded={loaded} />
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="sm">
              <RotateCcw /> Start over
            </Button>
          }
          title="Clear your budget?"
          description="All income and expense rows will be removed from this browser."
          confirmLabel="Clear budget"
          onConfirm={() => setB(EMPTY)}
        />
      </div>

      {/* Summary */}
      <Panel className="grid divide-y divide-line sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        {[
          { label: "Monthly income", value: formatINR(totalIncome) },
          { label: "Monthly spending", value: formatINR(totalExpenses) },
          {
            label: surplus >= 0 ? "Left over" : "Shortfall",
            value: formatINR(Math.abs(surplus)),
            tone: surplus >= 0 ? "text-success" : "text-danger",
          },
          { label: "Savings rate", value: savingsRate === null ? "—" : `${savingsRate}%` },
        ].map((s) => (
          <div key={s.label} className="p-5">
            <p className="text-[13px] text-ink-2">{s.label}</p>
            <p className={cn("mt-1 text-[24px] font-semibold tabular-nums tracking-[-0.03em]", s.tone)} aria-live="polite">
              {s.value}
            </p>
          </div>
        ))}
      </Panel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Panel className="p-5">
            <h2 className="text-[15px] font-semibold tracking-[-0.015em]">Income</h2>
            <div className="mt-4 space-y-2">
              {income.map((i, idx) => (
                <div key={i.id} className="grid grid-cols-[1fr_140px_auto] items-start gap-2">
                  <label htmlFor={`${i.id}-l`} className="sr-only">
                    Income source {idx + 1}
                  </label>
                  <Input id={`${i.id}-l`} value={i.label} placeholder="Source" onChange={(e) => set("income", b.income.map((x) => (x.id === i.id ? { ...x, label: e.target.value } : x)))} />
                  <div>
                    <label htmlFor={`${i.id}-a`} className="sr-only">
                      Amount for income source {idx + 1}
                    </label>
                    <Input
                      id={`${i.id}-a`}
                      inputMode="decimal"
                      value={i.amount}
                      placeholder="₹ / month"
                      aria-invalid={i.paise === null ? true : undefined}
                      onChange={(e) => set("income", b.income.map((x) => (x.id === i.id ? { ...x, amount: e.target.value } : x)))}
                    />
                    {i.paise === null && <p className="mt-1 text-[12px] text-danger">Numbers only</p>}
                  </div>
                  <Button variant="ghost" size="icon" aria-label={`Remove income source ${idx + 1}`} className="hover:text-danger" onClick={() => set("income", b.income.filter((x) => x.id !== i.id))}>
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => set("income", [...b.income, { id: uid(), label: "", amount: "" }])}>
              <Plus /> Add income
            </Button>
          </Panel>

          <Panel className="p-5">
            <h2 className="text-[15px] font-semibold tracking-[-0.015em]">Expenses</h2>
            {expenses.length === 0 && <p className="mt-3 text-[13px] text-ink-3">Add fixed costs first (rent, EMIs, insurance), then flexible spending.</p>}
            <div className="mt-4 space-y-2">
              {expenses.map((e, idx) => (
                <div key={e.id} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_170px_130px_auto]">
                  <label htmlFor={`${e.id}-l`} className="sr-only">
                    Expense {idx + 1}
                  </label>
                  <Input id={`${e.id}-l`} value={e.label} placeholder="Expense" onChange={(ev) => set("expenses", b.expenses.map((x) => (x.id === e.id ? { ...x, label: ev.target.value } : x)))} className="max-sm:col-span-2" />
                  <div>
                    <label htmlFor={`${e.id}-c`} className="sr-only">
                      Category for expense {idx + 1}
                    </label>
                    <Select id={`${e.id}-c`} value={e.category} onChange={(ev) => set("expenses", b.expenses.map((x) => (x.id === e.id ? { ...x, category: ev.target.value as CategoryKey } : x)))}>
                      {CATEGORIES.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label htmlFor={`${e.id}-a`} className="sr-only">
                      Amount for expense {idx + 1}
                    </label>
                    <Input
                      id={`${e.id}-a`}
                      inputMode="decimal"
                      value={e.amount}
                      placeholder="₹ / month"
                      aria-invalid={e.paise === null ? true : undefined}
                      onChange={(ev) => set("expenses", b.expenses.map((x) => (x.id === e.id ? { ...x, amount: ev.target.value } : x)))}
                    />
                    {e.paise === null && <p className="mt-1 text-[12px] text-danger">Numbers only</p>}
                  </div>
                  <Button variant="ghost" size="icon" aria-label={`Remove expense ${idx + 1}`} className="hover:text-danger" onClick={() => set("expenses", b.expenses.filter((x) => x.id !== e.id))}>
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => set("expenses", [...b.expenses, { id: uid(), label: "", category: "other", amount: "" }])}>
              <Plus /> Add expense
            </Button>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel className="p-5">
            <h2 className="text-[15px] font-semibold tracking-[-0.015em]">Where it goes</h2>
            {byCategory.length === 0 ? (
              <p className="mt-3 text-[13px] text-ink-3">Your spending breakdown appears here once you add expenses.</p>
            ) : (
              <ul className="mt-4 space-y-3.5">
                {byCategory.map((c) => {
                  const pct = totalExpenses ? Math.round((c.paise * 100) / totalExpenses) : 0;
                  return (
                    <li key={c.key}>
                      <div className="flex items-baseline justify-between text-[13px]">
                        <span>{c.label}</span>
                        <span className="tabular-nums text-ink-2">
                          {formatINR(c.paise)} <span className="text-ink-3">· {pct}%</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sunken" role="img" aria-label={`${c.label}: ${pct}% of spending`}>
                        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: `hsl(${c.hue} 60% 62%)` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel className="p-5">
            <h2 className="text-[15px] font-semibold tracking-[-0.015em]">Savings goal</h2>
            <Field label="Monthly goal (₹)" htmlFor="goal" className="mt-4" error={goal === null ? "Numbers only" : null}>
              <Input id="goal" inputMode="decimal" value={b.savingsGoal} aria-invalid={goal === null ? true : undefined} onChange={(e) => set("savingsGoal", e.target.value)} />
            </Field>
            {goalProgress !== null && (
              <div className="mt-4">
                <div className="h-2.5 overflow-hidden rounded-full bg-sunken" role="progressbar" aria-valuenow={goalProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Savings goal progress">
                  <div className={cn("h-full rounded-full transition-[width] duration-500", goalProgress >= 100 ? "bg-success" : "bg-accent")} style={{ width: `${goalProgress}%` }} />
                </div>
                <p className="mt-2 text-[13px] text-ink-2">
                  {goalProgress >= 100
                    ? `On track — ${formatINR(Math.max(surplus, 0) - (goal ?? 0))} above your goal.`
                    : surplus > 0
                      ? `${goalProgress}% of your goal. Find ${formatINR((goal ?? 0) - surplus)} more to reach it.`
                      : "Spending currently exceeds income, so there's nothing left to save yet."}
                </p>
              </div>
            )}
          </Panel>

          <Callout>This planner is for education and personal organisation only. It isn&apos;t financial advice.</Callout>
        </div>
      </div>
    </div>
  );
}
