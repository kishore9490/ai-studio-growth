import Link from "next/link";
import { FileWarning } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Long-form reading layout for help, legal and editorial pages. */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "max-w-[680px] text-[15.5px] leading-[1.75] text-ink-2",
        "[&_h2]:mt-12 [&_h2]:scroll-mt-24 [&_h2]:text-[22px] [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:tracking-[-0.025em] [&_h2]:text-ink",
        "[&_h3]:mt-8 [&_h3]:text-[16px] [&_h3]:font-semibold [&_h3]:text-ink",
        "[&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5",
        "[&_li]:pl-1 [&_li::marker]:text-ink-3 [&_strong]:font-medium [&_strong]:text-ink",
        "[&_a]:text-ink [&_a]:underline [&_a]:decoration-line-strong [&_a]:underline-offset-[3px] hover:[&_a]:decoration-ink",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageIntro({ eyebrow, title, description }: { eyebrow?: string; title: ReactNode; description?: ReactNode }) {
  return (
    <div className="max-w-3xl">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="text-headline mt-3">{title}</h1>
      {description && <p className="mt-5 max-w-2xl text-[18px] leading-relaxed text-ink-2">{description}</p>}
    </div>
  );
}

export type LegalSection = { id: string; title: string; body: ReactNode };

/** Shared layout for draft legal documents, with a table of contents. */
export function LegalDocument({
  title,
  summary,
  lastUpdated,
  sections,
}: {
  title: string;
  summary: string;
  lastUpdated: string;
  sections: LegalSection[];
}) {
  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-24 pt-16 sm:px-6 sm:pt-20">
      <div className="max-w-3xl">
        <p className="eyebrow">Legal</p>
        <h1 className="text-headline mt-3">{title}</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-2">{summary}</p>
        <p className="mt-3 text-[13px] text-ink-3">Last updated {lastUpdated}</p>
      </div>

      <div
        role="note"
        className="mt-10 flex max-w-3xl gap-3 rounded-[14px] border border-warning/25 bg-warning-soft px-4 py-3.5 text-[14px] text-[#7a5410]"
      >
        <FileWarning className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          <strong className="font-medium text-ink">Draft — pending legal review before launch.</strong> This document is a
          working draft prepared for the LifeOS Digital MVP. It is not legal advice and must be reviewed by a qualified
          professional before the platform accepts real customers or payments.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-[220px_1fr]">
        <nav aria-label="On this page" className="hidden lg:block">
          <div className="sticky top-24">
            <p className="text-[12px] font-medium text-ink-3">On this page</p>
            <ol className="mt-3 space-y-2 border-l border-line">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="-ml-px block border-l border-transparent pl-3 text-[13px] text-ink-2 hover:border-ink hover:text-ink">
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>
        <Prose>
          {sections.map((s, i) => (
            <section key={s.id} aria-labelledby={s.id}>
              <h2 id={s.id} className={i === 0 ? "!mt-0" : undefined}>
                {i + 1}. {s.title}
              </h2>
              {s.body}
            </section>
          ))}
          <p className="!mt-14 border-t border-line pt-6 text-[14px]">
            Questions about this document? <Link href="/contact">Contact us</Link>.
          </p>
        </Prose>
      </div>
    </div>
  );
}

export function FaqList({ items, className }: { items: { q: string; a: ReactNode }[]; className?: string }) {
  return (
    <div className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((item) => (
        <details key={item.q} className="group py-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-lg py-4 text-[15.5px] font-medium tracking-[-0.01em] text-ink [&::-webkit-details-marker]:hidden">
            {item.q}
            <span
              aria-hidden
              className="grid size-6 shrink-0 place-items-center rounded-full border border-line text-ink-3 transition-transform duration-200 group-open:rotate-45"
            >
              <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 1v10M1 6h10" strokeLinecap="round" />
              </svg>
            </span>
          </summary>
          <div className="pb-5 pr-10 text-[15px] leading-relaxed text-ink-2 [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-[3px] [&_p+p]:mt-3">
            {item.a}
          </div>
        </details>
      ))}
    </div>
  );
}
