import { cn } from '@/lib/cn';

/**
 * Proposed "BC" monogram — a design element for this personal website only.
 * It is not an official logo or seal and is unrelated to RGUHS branding.
 */
export function Monogram({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn('h-10 w-10', className)}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <circle cx="24" cy="24" r="22.5" fill="none" stroke="currentColor" strokeOpacity="0.35" />
      <circle cx="24" cy="24" r="19" fill="none" stroke="var(--color-gold)" strokeOpacity="0.8" strokeWidth="0.75" />
      <text
        x="24"
        y="30.5"
        textAnchor="middle"
        fontFamily="var(--font-serif), Georgia, serif"
        fontSize="18"
        fill="currentColor"
        letterSpacing="-0.5"
      >
        BC
      </text>
    </svg>
  );
}
