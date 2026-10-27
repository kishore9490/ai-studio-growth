import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignUpForm } from "@/components/auth/auth-forms";
import { AuthFormSkeleton } from "@/components/auth/auth-skeleton";
import { normaliseReferralCode } from "@/lib/domain/referrals";
import { getCurrentUser } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Create your free account" };

async function SignUp({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  if (await getCurrentUser()) redirect("/app");
  const fromQuery = typeof sp.ref === "string" ? normaliseReferralCode(sp.ref) : null;
  const fromCookie = normaliseReferralCode((await cookies()).get("lifeos_ref")?.value);
  return <SignUpForm referralCode={fromQuery ?? fromCookie ?? undefined} />;
}

export default function SignUpPage(props: PageProps<"/sign-up">) {
  return (
    <Suspense fallback={<AuthFormSkeleton fields={4} />}>
      <SignUp searchParams={props.searchParams} />
    </Suspense>
  );
}
