import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth/auth-forms";
import { AuthFormSkeleton } from "@/components/auth/auth-skeleton";
import { getCurrentUser } from "@/lib/server/auth";
import { safeNext } from "@/lib/utils";

export const metadata: Metadata = { title: "Sign in" };

const DEMO_ACCOUNTS = [
  { label: "Premium member", email: "demo@lifeos.demo", password: "demo1234" },
  { label: "Free member", email: "free@lifeos.demo", password: "demo1234" },
  { label: "Admin", email: "admin@lifeos.demo", password: "admin1234" },
];

async function SignIn({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? safeNext(sp.next) : undefined;
  if (await getCurrentUser()) redirect(next ?? "/app");
  return (
    <SignInForm
      next={next}
      notice={sp.reset ? "Your password was updated. Sign in with your new password." : undefined}
      demoAccounts={process.env.DEMO_MODE === "true" ? DEMO_ACCOUNTS : undefined}
    />
  );
}

export default function SignInPage(props: PageProps<"/sign-in">) {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <SignIn searchParams={props.searchParams} />
    </Suspense>
  );
}
