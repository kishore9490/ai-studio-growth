import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div className="hero-glow pointer-events-none absolute inset-0" />
      <div className="hairline-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_50%_at_50%_40%,black,transparent)]" />
      <header className="relative px-4 py-6 sm:px-10">
        <Logo />
      </header>
      <main id="main" className="relative flex flex-1 items-center justify-center px-4 pb-24">
        <div className="max-w-lg text-center">
          <p className="font-mono text-[13px] text-ink-3">404</p>
          <h1 className="text-headline mt-4">
            This page <span className="serif-accent text-accent-ink">wandered off.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-[16px] leading-relaxed text-ink-2">
            The link may be broken, or the page may have moved. Let&apos;s get you somewhere useful.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-2.5 sm:flex-row">
            <ButtonLink href="/" size="lg">
              <ArrowLeft /> Back to home
            </ButtonLink>
            <ButtonLink href="/explore" size="lg" variant="secondary">
              <Compass /> Explore the platform
            </ButtonLink>
          </div>
          <p className="mt-8 text-[13.5px] text-ink-3">
            Need help? <Link href="/help" className="text-ink-2 underline underline-offset-[3px] hover:text-ink">Visit the Help Centre</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
