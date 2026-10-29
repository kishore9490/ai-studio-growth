import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Scene3D } from '@/components/three/Scene3D';

const delay = (s: number) => ({ '--enter-delay': `${s}s` }) as CSSProperties;

/** Editorial header used at the top of every inner page. */
export function PageHero({
  eyebrow,
  title,
  lead,
  children,
  aside,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="surface-mesh relative isolate overflow-hidden pt-[calc(var(--header-height)+clamp(3rem,8vw,6rem))] pb-[clamp(3.5rem,8vw,6.5rem)]">
      <div aria-hidden className="bg-grid enter-bg absolute inset-0 -z-10" />
      <div aria-hidden className="absolute inset-0 -z-10 opacity-45 lg:opacity-100">
        <Scene3D kind="network" anchorId={aside ? 'page-hero-aside' : 'page-hero-anchor'} />
      </div>
      {!aside && <div id="page-hero-anchor" aria-hidden className="pointer-events-none absolute top-[calc(var(--header-height)+1rem)] right-0 h-[24rem] w-full lg:right-[3%] lg:h-[30rem] lg:w-[36%]" />}
      <div className={cn('container-x', aside && 'grid items-center gap-12 lg:grid-cols-12')}>
        <div className={cn(aside && 'lg:col-span-7')}>
          <p className="pill enter-up">{eyebrow}</p>
          <h1 className="display-lg enter-up mt-7 max-w-4xl" style={delay(0.08)}>
            {title}
          </h1>
          <div aria-hidden className="enter-up mt-8 h-px w-24 bg-[linear-gradient(90deg,var(--color-gold),transparent)]" style={delay(0.12)} />
          <p className="lead enter-up mt-8 max-w-2xl text-mist" style={delay(0.16)}>
            {lead}
          </p>
        </div>
        {aside && (
          <div id="page-hero-aside" className="lg:col-span-5">
            {aside}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
