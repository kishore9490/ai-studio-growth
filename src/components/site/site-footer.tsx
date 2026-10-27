import Link from "next/link";
import { Logo } from "@/components/ui/logo";

// Read once at module load; a render-time Date is not allowed in prerendered output.
const YEAR = new Date().getFullYear();

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/tools", label: "Digital Tools" },
      { href: "/marketplace", label: "Marketplace" },
      { href: "/membership", label: "Membership" },
      { href: "/explore", label: "Resource library" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/how-it-works", label: "How It Works" },
      { href: "/affiliate-programme", label: "Affiliate Programme" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/help", label: "Help Centre" },
      { href: "/legal/refund-policy", label: "Refund Policy" },
      { href: "/legal/affiliate-disclosure", label: "Affiliate Disclosure" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/terms", label: "Terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-canvas">
      <div className="mx-auto max-w-[1240px] px-4 pb-10 pt-16 sm:px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-ink-2">
              Practical tools, resources and digital products for everyday work and life.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-[13px] font-medium text-ink">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-ink-2 transition-colors hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-6 text-[13px] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p>© {YEAR} LifeOS Digital. Draft legal pages are pending review before launch.</p>
          <p>Prices in INR. Earnings from the affiliate programme are not guaranteed.</p>
        </div>
      </div>
    </footer>
  );
}
