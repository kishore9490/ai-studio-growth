import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { AuthFormSkeleton } from "@/components/auth/auth-skeleton";

export const metadata: Metadata = { title: "Choose a new password" };

async function Reset({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { token } = await searchParams;
  if (typeof token !== "string" || token.length < 20) {
    return (
      <div>
        <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Link not valid</h1>
        <p className="mt-2 text-[15px] text-ink-2">This password reset link is incomplete or has expired.</p>
        <Link href="/forgot-password" className="mt-6 inline-block font-medium underline underline-offset-4">
          Request a new link
        </Link>
      </div>
    );
  }
  return <ResetPasswordForm token={token} />;
}

export default function ResetPasswordPage(props: PageProps<"/reset-password">) {
  return (
    <Suspense fallback={<AuthFormSkeleton fields={1} />}>
      <Reset searchParams={props.searchParams} />
    </Suspense>
  );
}
