import { site } from '../../config/site'

export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="3" fill="#F04438" />
      <path d="M16 7h7v3.5h-7z" fill="#0B0E12" />
      <path d="M23 8.5h6l2 2.5h-8z" fill="#0B0E12" />
      <rect x="13" y="12" width="13" height="22" rx="6" fill="#0B0E12" />
      <rect x="13" y="20" width="13" height="6" fill="#F5F6F7" />
    </svg>
  )
}

export function Logo() {
  return (
    <span className="flex items-center gap-3">
      <LogoMark />
      <span className="leading-none">
        <span className="block font-display text-[1.05rem] font-extrabold uppercase tracking-[0.04em] [font-variation-settings:'wdth'_120]">
          {site.name}
        </span>
        <span className="meta mt-1 block text-[0.56rem] text-muted">{site.tagline}</span>
      </span>
    </span>
  )
}
