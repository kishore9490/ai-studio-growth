import { FlaskConical } from "lucide-react";
import Link from "next/link";

/** Shown on every page while DEMO_MODE=true. */
export function DemoBanner() {
  if (process.env.DEMO_MODE !== "true") return null;
  return (
    <div className="print-hidden border-b border-warning/15 bg-warning-soft/70 text-[12.5px] text-[#7a5410]">
      <div className="mx-auto flex max-w-[1240px] items-center justify-center gap-2 px-4 py-1.5 text-center">
        <FlaskConical className="size-3.5 shrink-0" aria-hidden />
        <span>
          <strong className="font-medium">Demo environment.</strong> Sample data, mock payments and test-mode commissions — no
          real money moves.{" "}
          <Link href="/help#demo" className="underline underline-offset-2 hover:text-ink">
            Learn more
          </Link>
        </span>
      </div>
    </div>
  );
}
