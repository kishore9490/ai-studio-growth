"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowRight, KeyRound, ShieldAlert } from "lucide-react";
import { requestPasswordReset, resetPassword, signIn, signUp, type FormState } from "@/app/(auth)/actions";
import { Field, FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { PasswordInput } from "./password-input";

const initial: FormState = {};

function err(state: FormState, key: string) {
  return state.fieldErrors?.[key];
}

function aria(state: FormState, key: string) {
  const e = err(state, key);
  return { "aria-invalid": e ? true : undefined, "aria-describedby": e ? `${key}-error` : undefined } as const;
}

export function SignInForm({
  next,
  notice,
  demoAccounts,
}: {
  next?: string;
  notice?: string;
  demoAccounts?: { label: string; email: string; password: string }[];
}) {
  const [state, action] = useActionState(signIn, initial);
  const [email, setEmail] = useState(state.values?.email ?? "");
  const [password, setPassword] = useState("");

  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Welcome back</h1>
      <p className="mt-1.5 text-[15px] text-ink-2">Sign in to your LifeOS account.</p>

      <form action={action} className="mt-8 space-y-4" noValidate>
        {notice && <FormMessage tone="success">{notice}</FormMessage>}
        <FormMessage>{state.error}</FormMessage>
        <input type="hidden" name="next" value={next ?? ""} />
        <Field label="Email" htmlFor="email" error={err(state, "email")}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            {...aria(state, "email")}
          />
        </Field>
        <Field label="Password" htmlFor="password" error={err(state, "password")}>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            {...aria(state, "password")}
          />
        </Field>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-[13px] text-ink-2 underline-offset-4 hover:text-ink hover:underline">
            Forgot password?
          </Link>
        </div>
        <SubmitButton className="w-full" size="lg" pendingLabel="Signing in…">
          Sign in <ArrowRight />
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-ink-2">
        New to LifeOS?{" "}
        <Link href="/sign-up" className="font-medium text-ink underline-offset-4 hover:underline">
          Create a free account
        </Link>
      </p>

      {demoAccounts && demoAccounts.length > 0 && (
        <div className="mt-10 rounded-[14px] border border-dashed border-warning/40 bg-warning-soft/50 p-4">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-[#7a5410]">
            <KeyRound className="size-3.5" /> Demo accounts
          </p>
          <p className="mt-1 text-[12.5px] text-[#7a5410]/80">Shown because DEMO_MODE is on. Disable it before launch.</p>
          <div className="mt-3 space-y-1.5">
            {demoAccounts.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => {
                  setEmail(a.email);
                  setPassword(a.password);
                }}
                className="flex w-full items-center justify-between rounded-[10px] border border-line bg-surface px-3 py-2 text-left text-[13px] transition-colors hover:border-line-strong"
              >
                <span>
                  <span className="font-medium">{a.label}</span>
                  <span className="ml-2 text-ink-3">{a.email}</span>
                </span>
                <span className="text-ink-3">Use</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SignUpForm({ referralCode }: { referralCode?: string }) {
  const [state, action] = useActionState(signUp, initial);
  const v = state.values ?? {};
  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Create your free account</h1>
      <p className="mt-1.5 text-[15px] text-ink-2">No payment details needed. Upgrade only if you want to.</p>

      <form action={action} className="mt-8 space-y-4" noValidate>
        <FormMessage>{state.error}</FormMessage>
        <Field label="Full name" htmlFor="name" error={err(state, "name")}>
          <Input id="name" name="name" autoComplete="name" required defaultValue={v.name} {...aria(state, "name")} />
        </Field>
        <Field label="Email" htmlFor="email" error={err(state, "email")}>
          <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={v.email} {...aria(state, "email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={err(state, "password")} hint="At least 8 characters, with a letter and a number.">
          <PasswordInput id="password" name="password" autoComplete="new-password" required {...aria(state, "password")} />
        </Field>
        <Field
          label="Referral code"
          htmlFor="referralCode"
          optional
          error={err(state, "referralCode")}
          hint={referralCode ? "Applied from your referral link." : "If someone shared LifeOS with you."}
        >
          <Input
            id="referralCode"
            name="referralCode"
            autoComplete="off"
            className="uppercase placeholder:normal-case"
            placeholder="e.g. MEERA7Q2"
            defaultValue={v.referralCode || referralCode}
            {...aria(state, "referralCode")}
          />
        </Field>
        <div>
          <label className="flex items-start gap-2.5 text-[13.5px] text-ink-2">
            <input
              type="checkbox"
              name="terms"
              className="mt-0.5 size-4 rounded border-line-strong accent-[var(--color-accent)]"
              aria-invalid={err(state, "terms") ? true : undefined}
              aria-describedby={err(state, "terms") ? "terms-error" : undefined}
            />
            <span>
              I agree to the{" "}
              <Link href="/legal/terms" className="text-ink underline underline-offset-2" target="_blank">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/legal/privacy" className="text-ink underline underline-offset-2" target="_blank">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {err(state, "terms") && (
            <p id="terms-error" role="alert" className="mt-1.5 text-[13px] text-danger">
              {err(state, "terms")}
            </p>
          )}
        </div>
        <SubmitButton className="w-full" size="lg" pendingLabel="Creating account…">
          Create account <ArrowRight />
        </SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-ink-2">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-ink underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, initial);
  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Reset your password</h1>
      <p className="mt-1.5 text-[15px] text-ink-2">Enter your account email and we&apos;ll send a reset link.</p>
      <form action={action} className="mt-8 space-y-4" noValidate>
        <FormMessage>{state.error}</FormMessage>
        <FormMessage tone="success">{state.success}</FormMessage>
        {state.devLink && (
          <div className="rounded-[12px] border border-dashed border-warning/40 bg-warning-soft/60 p-3.5 text-[13px] text-[#7a5410]">
            <p className="flex items-center gap-1.5 font-medium">
              <ShieldAlert className="size-3.5" /> Development placeholder
            </p>
            <p className="mt-1">Email delivery isn&apos;t configured, so the link is shown here instead (never in production).</p>
            <Link href={state.devLink.replace(/^https?:\/\/[^/]+/, "")} className="mt-2 inline-block font-medium text-ink underline underline-offset-2">
              Open reset link
            </Link>
          </div>
        )}
        <Field label="Email" htmlFor="email" error={err(state, "email")}>
          <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} {...aria(state, "email")} />
        </Field>
        <SubmitButton className="w-full" size="lg" pendingLabel="Sending…">
          Send reset link
        </SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-ink-2">
        <Link href="/sign-in" className="font-medium text-ink underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, initial);
  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Choose a new password</h1>
      <p className="mt-1.5 text-[15px] text-ink-2">You&apos;ll be signed out of other devices.</p>
      <form action={action} className="mt-8 space-y-4" noValidate>
        <FormMessage>{state.error ?? (err(state, "token") ? "This reset link is invalid." : undefined)}</FormMessage>
        <input type="hidden" name="token" value={token} />
        <Field label="New password" htmlFor="password" error={err(state, "password")} hint="At least 8 characters, with a letter and a number.">
          <PasswordInput id="password" name="password" autoComplete="new-password" required {...aria(state, "password")} />
        </Field>
        <SubmitButton className="w-full" size="lg" pendingLabel="Saving…">
          Update password
        </SubmitButton>
      </form>
      {state.error && (
        <p className="mt-6 text-center text-sm">
          <Link href="/forgot-password" className="font-medium underline underline-offset-4">
            Request a new link
          </Link>
        </p>
      )}
    </div>
  );
}
