"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Check, LogOut, Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Textarea } from "@/components/ui/form";
import { Switch } from "@/components/ui/menu";
import { Avatar, Badge } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { DASHBOARD_WIDGETS, INTERESTS } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { changePassword, signOutOtherSessions, updatePreferences, updateProfile, type SettingsState } from "./actions";

const HUES = [258, 290, 330, 10, 28, 45, 95, 150, 168, 185, 205, 230];

function useToastOnResult(state: SettingsState) {
  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
  }, [state]);
}

function aria(state: SettingsState, key: string) {
  const e = state.fieldErrors?.[key];
  return { "aria-invalid": e ? true : undefined, "aria-describedby": e ? `${key}-error` : undefined } as const;
}

export function ProfileForm({ initial }: { initial: { name: string; email: string; headline: string; bio: string; avatarHue: number } }) {
  const [state, action] = useActionState(updateProfile, {});
  const [name, setName] = useState(initial.name);
  const [hue, setHue] = useState(initial.avatarHue);
  useToastOnResult(state);
  const e = (k: string) => state.fieldErrors?.[k];

  return (
    <form action={action} noValidate className="space-y-5">
      <FormMessage>{state.error ?? (e("avatarHue") ? "Choose an avatar colour." : undefined)}</FormMessage>
      <input type="hidden" name="avatarHue" value={hue} />
      <div className="flex items-center gap-4">
        <Avatar name={name || "?"} hue={hue} size={56} />
        <fieldset>
          <legend className="text-[13px] font-medium">Avatar colour</legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {HUES.map((h) => (
              <label key={h} className="relative cursor-pointer">
                <input type="radio" name="avatarHuePicker" value={h} checked={hue === h} onChange={() => setHue(h)} className="peer sr-only" />
                <span
                  className="block size-6 rounded-full ring-offset-2 ring-offset-surface transition-shadow peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:ring-2 peer-focus-visible:ring-accent"
                  style={{ background: `linear-gradient(140deg, hsl(${h} 70% 66%), hsl(${(h + 28) % 360} 62% 48%))` }}
                />
                <span className="sr-only">Hue {h}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="name" error={e("name")}>
          <Input id="name" name="name" value={name} onChange={(ev) => setName(ev.target.value)} autoComplete="name" {...aria(state, "name")} />
        </Field>
        <Field label="Email" htmlFor="email" hint="Contact support to change your sign-in email.">
          <Input id="email" value={initial.email} disabled readOnly />
        </Field>
      </div>
      <Field label="Headline" htmlFor="headline" optional error={e("headline")}>
        <Input id="headline" name="headline" defaultValue={initial.headline} placeholder="e.g. Freelance designer in Pune" {...aria(state, "headline")} />
      </Field>
      <Field label="Bio" htmlFor="bio" optional error={e("bio")}>
        <Textarea id="bio" name="bio" rows={3} defaultValue={initial.bio} {...aria(state, "bio")} />
      </Field>
      <div className="flex justify-end">
        <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
      </div>
    </form>
  );
}

export function PreferencesForm({ initial }: { initial: { interests: string[]; widgets: string[]; productUpdates: boolean } }) {
  const [interests, setInterests] = useState(initial.interests);
  const [widgets, setWidgets] = useState(initial.widgets);
  const [productUpdates, setProductUpdates] = useState(initial.productUpdates);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toggle = (list: string[], set: (v: string[]) => void, key: string) => set(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);

  return (
    <form
      className="space-y-8"
      onSubmit={(ev) => {
        ev.preventDefault();
        setError(null);
        start(async () => {
          const res = await updatePreferences({ interests, widgets, productUpdates });
          if (res.error) setError(res.error);
          else toast.success(res.message ?? "Saved");
        });
      }}
    >
      <FormMessage>{error}</FormMessage>
      <fieldset>
        <legend className="text-[13px] font-medium">Interests</legend>
        <p className="mt-0.5 text-[13px] text-ink-3">Used for dashboard recommendations.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {INTERESTS.map((i) => {
            const on = interests.includes(i.key);
            return (
              <button
                key={i.key}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(interests, setInterests, i.key)}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] transition-colors",
                  on ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink",
                )}
              >
                {on && <Check className="size-3.5" />}
                {i.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[13px] font-medium">Dashboard sections</legend>
        <ul className="mt-3 divide-y divide-line rounded-[14px] border border-line">
          {DASHBOARD_WIDGETS.map((w) => (
            <li key={w.key}>
              <label className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3">
                <span>
                  <span className="block text-[14px] font-medium">{w.label}</span>
                  <span className="block text-[12.5px] text-ink-3">{w.description}</span>
                </span>
                <input
                  type="checkbox"
                  checked={widgets.includes(w.key)}
                  onChange={() => toggle(widgets, setWidgets, w.key)}
                  className="size-[18px] shrink-0 accent-[var(--color-ink)]"
                />
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <div className="flex items-center justify-between gap-4 rounded-[14px] border border-line px-4 py-3.5">
        <div>
          <p id="product-updates-label" className="text-[14px] font-medium">
            Product update emails
          </p>
          <p className="text-[12.5px] text-ink-3">Occasional news about new tools and resources. Service emails are always sent.</p>
        </div>
        <Switch checked={productUpdates} onCheckedChange={setProductUpdates} aria-labelledby="product-updates-label" />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending || widgets.length === 0}>
          {pending ? "Saving…" : "Save preferences"}
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, {});
  const formRef = useRef<HTMLFormElement>(null);
  const e = (k: string) => state.fieldErrors?.[k];
  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Password updated.");
      formRef.current?.reset();
    }
  }, [state]);
  return (
    <form ref={formRef} action={action} noValidate className="space-y-5">
      <FormMessage>{state.error}</FormMessage>
      <Field label="Current password" htmlFor="currentPassword" error={e("currentPassword")}>
        <PasswordInput id="currentPassword" name="currentPassword" autoComplete="current-password" {...aria(state, "currentPassword")} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="New password" htmlFor="newPassword" error={e("newPassword")} hint="8+ characters, a letter and a number.">
          <PasswordInput id="newPassword" name="newPassword" autoComplete="new-password" {...aria(state, "newPassword")} />
        </Field>
        <Field label="Confirm new password" htmlFor="confirmPassword" error={e("confirmPassword")}>
          <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" {...aria(state, "confirmPassword")} />
        </Field>
      </div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-[12.5px] text-ink-3">Changing your password signs out your other sessions.</p>
        <SubmitButton pendingLabel="Updating…">Update password</SubmitButton>
      </div>
    </form>
  );
}

function describeAgent(ua: string | null) {
  if (!ua) return { label: "Unknown device", mobile: false };
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return { label: os ? `${browser} on ${os}` : browser, mobile: /Mobile|Android|iPhone/.test(ua) };
}

export function SessionsList({ sessions }: { sessions: { id: string; userAgent: string | null; signedInLabel: string; current: boolean }[] }) {
  const [pending, start] = useTransition();
  const others = sessions.filter((s) => !s.current).length;
  return (
    <div>
      <ul className="divide-y divide-line rounded-[14px] border border-line">
        {sessions.map((s) => {
          const d = describeAgent(s.userAgent);
          const Icon = d.mobile ? Smartphone : Monitor;
          return (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-sunken text-ink-2">
                <Icon className="size-4" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-[14px] font-medium">
                  {d.label}
                  {s.current && <Badge tone="success">This device</Badge>}
                </span>
                <span className="block text-[12.5px] text-ink-3">Signed in {s.signedInLabel}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex justify-end">
        <Button
          variant="secondary"
          disabled={pending || others === 0}
          onClick={() =>
            start(async () => {
              const res = await signOutOtherSessions();
              toast.success(res.message ?? "Done");
            })
          }
        >
          <LogOut /> {pending ? "Signing out…" : "Sign out other sessions"}
        </Button>
      </div>
    </div>
  );
}
