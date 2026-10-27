import { Check } from "lucide-react";
import { DemoBanner } from "@/components/demo-banner";
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBanner />
      <div className="grid min-h-[calc(100dvh-30px)] lg:grid-cols-[1fr_minmax(0,560px)]">
        <main id="main" className="flex flex-col px-4 py-6 sm:px-10">
          <Logo />
          <div className="flex flex-1 items-center justify-center py-12">
            <div className="w-full max-w-[400px] animate-fade-up">{children}</div>
          </div>
        </main>
        <aside className="relative hidden overflow-hidden border-l border-line bg-surface lg:block">
          <div className="hero-glow absolute inset-0" />
          <div className="hairline-grid absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="relative flex h-full flex-col justify-end p-12">
            <p className="text-headline max-w-sm">
              A calmer way to <span className="serif-accent text-accent-ink">get things done.</span>
            </p>
            <ul className="mt-8 space-y-3 text-[15px] text-ink-2">
              {[
                "Free account — no payment details needed",
                "Interactive tools that run in your browser",
                "Products you buy once are yours to keep",
                "Premium membership is entirely optional",
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
