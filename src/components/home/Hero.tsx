import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { CSSProperties } from 'react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getCopy, getQualifications } from '@/content';
import { PortraitComposition } from './PortraitComposition';

const delay = (s: number) => ({ '--enter-delay': `${s}s` }) as CSSProperties;

export async function Hero({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home.hero' });
  const profile = getCopy(locale).profile;
  const qualifications = getQualifications(locale);

  return (
    <section aria-labelledby="hero-title" className="surface-mesh relative isolate overflow-hidden pt-[calc(var(--header-height)+1.5rem)]">
      <div aria-hidden className="bg-grid enter-bg absolute inset-0 -z-10" />

      <div className="container-x grid items-center gap-10 pb-10 lg:min-h-[calc(100svh-var(--header-height)-7rem)] lg:grid-cols-12 lg:gap-8 lg:pb-14">
        <div className="lg:col-span-7">
          <p className="pill enter-up" style={delay(0.1)}>
            {t('badge')}
          </p>
          <h1 id="hero-title" className="mt-7">
            <span className="enter-up block font-serif text-[1.625rem] text-ivory sm:text-3xl" style={delay(0.2)}>
              {profile.name}
            </span>
            <span className="display-xl enter-up mt-5 block text-white" style={delay(0.3)}>
              {t('headlineA')} <span className="text-gradient-gold font-serif font-normal tracking-normal">{t('headlineB')}</span>
            </span>
          </h1>

          <p className="enter-up mt-6 font-display text-base font-medium text-white/90 sm:text-lg" style={delay(0.42)}>
            {profile.role}, {profile.institution}, {profile.region}
          </p>

          <p className="lead enter-up mt-5 max-w-xl text-mist" style={delay(0.52)}>
            {t('supporting')}
          </p>

          <div className="enter-up mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap" style={delay(0.64)}>
            <Link href="/experience" className="btn btn-primary">
              {t('ctaJourney')}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
            <Link href="/vision" className="btn btn-ghost">
              {t('ctaVision')}
            </Link>
          </div>
        </div>

        <div className="order-first lg:order-none lg:col-span-5">
          <PortraitComposition locale={locale} />
        </div>
      </div>

      {/* Credentials bar */}
      <div className="container-x relative pb-12 lg:pb-16">
        <h2 className="sr-only">{t('qualifications')}</h2>
        <ul
          className="enter-up grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/12 bg-white/12 sm:grid-cols-5"
          style={delay(0.8)}
        >
          {qualifications.map((q) => (
            <li key={q.id} className="bg-[#0b1d38]/95 px-5 py-5 last:col-span-2 sm:px-6 sm:last:col-span-1">
              <p className="font-display text-lg font-bold text-white" lang="en">
                {q.credential}
              </p>
              <p className="mt-1 text-sm text-mist">
                <span className="text-gold tabular-nums">{q.endYear}</span>
                {q.institution ? ` · ${q.institution.split(',')[0]}` : ''}
              </p>
            </li>
          ))}
        </ul>
      </div>

    </section>
  );
}
