import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7", className)}>
      <defs>
        <linearGradient id="lifeos-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8f78ff" />
          <stop offset="1" stopColor="#5f42e6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="#191919" />
      <circle cx="16" cy="16" r="7.25" fill="none" stroke="url(#lifeos-mark)" strokeWidth="3" />
      <circle cx="21.2" cy="10.8" r="2.6" fill="#f8f7f4" />
    </svg>
  );
}

export function Logo({ href = "/", className, label = true }: { href?: string; className?: string; label?: boolean }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="LifeOS Digital home">
      <LogoMark className="transition-transform duration-300 group-hover:rotate-[-8deg]" />
      {label && (
        <span className="text-[15px] font-semibold tracking-[-0.02em]">
          LifeOS <span className="font-normal text-ink-3">Digital</span>
        </span>
      )}
    </Link>
  );
}
