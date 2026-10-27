"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, LayoutDashboard, Library, ShoppingBag, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/misc";
import { DASHBOARD_WIDGETS, INTERESTS } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { completeOnboarding } from "./actions";

const STEPS = ["Welcome", "Interests", "Dashboard", "Ready"];

export function OnboardingFlow({
  firstName,
  note,
  initialInterests,
  initialWidgets,
}: {
  firstName: string;
  note?: string;
  initialInterests: string[];
  initialWidgets: string[];
}) {
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>(initialInterests);
  const [widgets, setWidgets] = useState<string[]>(initialWidgets);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const toggle = (list: string[], set: (v: string[]) => void, key: string) =>
    set(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);

  const finish = () =>
    start(async () => {
      setError(null);
      const res = await completeOnboarding({ interests, widgets });
      if (res?.error) setError(res.error);
    });

  return (
    <div>
      <div className="flex items-center gap-2" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={cn("h-1 rounded-full transition-colors duration-300", i <= step ? "bg-ink" : "bg-line")} />
            <p className={cn("mt-2 text-xs", i === step ? "text-ink" : "text-ink-3")}>{s}</p>
          </div>
        ))}
      </div>

      <div key={step} className="mt-12 animate-fade-up">
        {step === 0 && (
          <section aria-labelledby="ob-title">
            <p className="eyebrow">Step 1 of 4</p>
            <h1 id="ob-title" className="text-headline mt-3">
              Welcome to LifeOS, <span className="serif-accent text-accent-ink">{firstName}.</span>
            </h1>
            <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-ink-2">
              Your free account includes interactive tools, a growing resource library and the marketplace. Let&apos;s set up your
              dashboard — it takes about thirty seconds.
            </p>
            {note && (
              <Callout tone="warning" className="mt-6">
                {note}
              </Callout>
            )}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Wrench, t: "Digital tools", d: "Write, plan and budget in the browser." },
                { icon: Library, t: "Resource library", d: "Guides, checklists and playbooks." },
                { icon: ShoppingBag, t: "Marketplace", d: "Templates and toolkits to keep." },
              ].map((x) => (
                <div key={x.t} className="rounded-[14px] border border-line bg-surface p-4">
                  <x.icon className="size-[18px]" strokeWidth={1.75} />
                  <p className="mt-3 text-sm font-medium">{x.t}</p>
                  <p className="mt-1 text-[13px] text-ink-2">{x.d}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section aria-labelledby="ob-title">
            <p className="eyebrow">Step 2 of 4</p>
            <h1 id="ob-title" className="text-headline mt-3">What are you interested in?</h1>
            <p className="mt-3 text-[16px] text-ink-2">We&apos;ll use this to recommend tools and resources. Choose any.</p>
            <div className="mt-8 grid gap-2.5 sm:grid-cols-2" role="group" aria-label="Interests">
              {INTERESTS.map((i) => {
                const on = interests.includes(i.key);
                return (
                  <button
                    key={i.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(interests, setInterests, i.key)}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-[14px] border p-4 text-left transition-[border-color,background-color,box-shadow]",
                      on ? "border-ink bg-surface shadow-lift" : "border-line bg-surface hover:border-line-strong",
                    )}
                  >
                    <span>
                      <span className="block text-[14.5px] font-medium">{i.label}</span>
                      <span className="block text-[13px] text-ink-2">{i.description}</span>
                    </span>
                    <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border transition-colors", on ? "border-ink bg-ink text-white" : "border-line-strong")}>
                      {on && <Check className="size-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === 2 && (
          <section aria-labelledby="ob-title">
            <p className="eyebrow">Step 3 of 4</p>
            <h1 id="ob-title" className="text-headline mt-3">Personalise your dashboard</h1>
            <p className="mt-3 text-[16px] text-ink-2">Pick the sections you want to see. You can change this later in Settings.</p>
            <ul className="mt-8 divide-y divide-line rounded-[16px] border border-line bg-surface">
              {DASHBOARD_WIDGETS.map((w) => {
                const on = widgets.includes(w.key);
                return (
                  <li key={w.key}>
                    <label className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3.5">
                      <span>
                        <span className="block text-[14.5px] font-medium">{w.label}</span>
                        <span className="block text-[13px] text-ink-2">{w.description}</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(widgets, setWidgets, w.key)}
                        className="size-[18px] shrink-0 accent-[var(--color-ink)]"
                      />
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {step === 3 && (
          <section aria-labelledby="ob-title" className="text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-ink text-white">
              <LayoutDashboard className="size-6" strokeWidth={1.75} />
            </div>
            <h1 id="ob-title" className="text-headline mt-6">You&apos;re all set.</h1>
            <p className="mx-auto mt-3 max-w-md text-[16px] text-ink-2">
              Your dashboard is ready with {widgets.length} section{widgets.length === 1 ? "" : "s"}
              {interests.length ? ` and recommendations for ${interests.length} interest${interests.length === 1 ? "" : "s"}` : ""}.
            </p>
          </section>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-6 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-12 flex items-center justify-between border-t border-line pt-6">
        <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || pending} className={cn(step === 0 && "invisible")}>
          <ArrowLeft /> Back
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={step === 2 && widgets.length === 0}>
            {step === 1 && interests.length === 0 ? "Skip" : "Continue"} <ArrowRight />
          </Button>
        ) : (
          <Button onClick={finish} disabled={pending} variant="accent" size="lg">
            {pending ? "Opening…" : "Enter LifeOS"} <ArrowRight />
          </Button>
        )}
      </div>
    </div>
  );
}
