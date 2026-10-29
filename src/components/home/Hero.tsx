import { ArrowRight, ChevronDown } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { CSSProperties } from 'react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getCopy } from '@/content';
import { Parallax } from '@/components/motion/Parallax';
import { PortraitComposition } from './PortraitComposition';

const delay = (s: number) => ({ '--enter-delay': `${s}s` }) as CSSProperties;

export async function Hero({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home.hero' });
  const profile = getCopy(locale).profile;

  return (
    <section
      aria-labelledby="hero-title"
      className="surface-midnight relative isolate flex min-h-[100svh] items-center overflow-hidden pt-[calc(var(--header-height)+2.5rem)] pb-24 lg:pb-20"
    >
      {/* 1. Atmospheric background */}
      <div aria-hidden className="enter-bg absolute inset-0 -z-10" style={{ background: 'var(--gradient-hero)' }} />
      <div aria-hidden className="bg-grid enter-bg absolute inset-0 -z-10" />
      <Parallax offset={70} className="pointer-events-none absolute top-[6%] right-[2%] -z-10 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(closest-side,rgb(49_95_234/0.22),transparent)]" />

      <div className="container-x grid items-center gap-14 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <h1 id="hero-title">
            {/* 3. Name and role, staggered */}
            <span className="enter-up block font-serif text-2xl text-ivory sm:text-3xl" style={delay(0.25)}>
              {profile.name}
            </span>
            <span className="display-xl enter-up mt-6 block text-white" style={delay(0.35)}>
              {t('headlineA')}{' '}
              <span className="font-serif font-normal tracking-normal text-gold">{t('headlineB')}</span>
            </span>
          </h1>

          <p className="enter-up mt-7 font-display text-base font-medium text-white/90 sm:text-lg" style={delay(0.45)}>
            {profile.role}, {profile.institution}, {profile.region}
          </p>

          <p className="enter-up mt-4" style={delay(0.5)}>
            <span className="sr-only">{t('qualifications')}: </span>
            <span className="glass inline-block rounded-2xl px-4 py-2 text-[0.8125rem] leading-relaxed tracking-wide text-mist sm:rounded-full">
              {profile.qualificationsLine}
            </span>
          </p>

          {/* 4. Supporting copy */}
          <p className="lead enter-up mt-8 max-w-2xl text-mist" style={delay(0.6)}>
            {t('supporting')}
          </p>

          {/* 5. Calls to action */}
          <div className="enter-up mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap" style={delay(0.72)}>
            <Link href="/experience" className="btn btn-primary">
              {t('ctaJourney')}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
            <Link href="/vision" className="btn btn-ghost">
              {t('ctaVision')}
            </Link>
          </div>
        </div>

        {/* 2. Portrait reveal */}
        <div className="lg:col-span-5">
          <PortraitComposition locale={locale} />
        </div>
      </div>

      <a
        href="#introduction"
        className="scroll-cue absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-xs tracking-[0.2em] text-mist uppercase transition-colors hover:text-white md:flex"
      >
        <span className="sr-only">{t('scroll')}</span>
        <ChevronDown aria-hidden className="h-5 w-5" />
      </a>
    </section>
  );
}
