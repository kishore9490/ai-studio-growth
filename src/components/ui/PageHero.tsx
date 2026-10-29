import type { CSSProperties, ReactNode } from 'react';
import { Parallax } from '@/components/motion/Parallax';

/** Dark editorial header used at the top of every inner page. */
export function PageHero({ eyebrow, title, lead, children }: { eyebrow: string; title: string; lead: string; children?: ReactNode }) {
  return (
    <section className="surface-midnight relative isolate overflow-hidden pt-[calc(var(--header-height)+clamp(3.5rem,9vw,7rem))] pb-[clamp(3.5rem,8vw,6.5rem)]">
      <div aria-hidden className="enter-bg absolute inset-0 -z-10" style={{ background: 'var(--gradient-hero)' }} />
      <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
      <Parallax offset={50} className="pointer-events-none absolute -top-24 right-[-10%] -z-10 hidden md:block">
        <svg aria-hidden viewBox="0 0 600 600" className="h-[34rem] w-[34rem] text-white/10">
          <circle cx="300" cy="300" r="299" fill="none" stroke="currentColor" />
          <circle cx="300" cy="300" r="220" fill="none" stroke="currentColor" strokeDasharray="2 8" />
          <circle cx="300" cy="300" r="140" fill="none" stroke="var(--color-gold)" strokeOpacity="0.25" />
        </svg>
      </Parallax>
      <div className="container-x">
        <p className="eyebrow enter-up">{eyebrow}</p>
        <h1 className="display-lg enter-up mt-6 max-w-4xl" style={{ '--enter-delay': '0.08s' } as CSSProperties}>
          {title}
        </h1>
        <p className="lead enter-up mt-6 max-w-2xl text-mist" style={{ '--enter-delay': '0.16s' } as CSSProperties}>
          {lead}
        </p>
        {children}
      </div>
    </section>
  );
}
