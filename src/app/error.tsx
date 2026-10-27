"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";

export default function GlobalRouteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-4 py-24">
      <div role="alert" className="max-w-md text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-line bg-surface text-danger shadow-soft">
          <TriangleAlert className="size-5" />
        </span>
        <h1 className="mt-6 text-[28px] font-semibold tracking-[-0.03em]">Something went wrong</h1>
        <p className="mt-2 text-[15.5px] leading-relaxed text-ink-2">
          An unexpected error stopped this page from loading. Your data is safe — try again, or head back home.
        </p>
        {error.digest && <p className="mt-3 font-mono text-[12px] text-ink-3">Reference: {error.digest}</p>}
        <div className="mt-8 flex flex-col justify-center gap-2.5 sm:flex-row">
          <Button size="lg" onClick={() => retry()}>
            <RotateCcw /> Try again
          </Button>
          <Link href="/" className={buttonClasses("secondary", "lg")}>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
