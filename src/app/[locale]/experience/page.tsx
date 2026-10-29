import { Building2, Landmark } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Reveal } from '@/components/motion/Reveal';
import { AppointmentChart } from '@/components/timeline/AppointmentChart';
import { PageHero } from '@/components/ui/PageHero';
import { SourceNote } from '@/components/ui/SourceNote';
import { getCareer } from '@/content';
import { cn } from '@/lib/cn';
import { buildPageMetadata } from '@/lib/metadata';
import { resolveLocale, type LocaleParams } from '@/lib/page';
import { formatPeriod } from '@/lib/period';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  return buildPageMetadata(await resolveLocale(params), 'experience');
}

export default async function ExperiencePage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'experience' });
  const common = await getTranslations({ locale, namespace: 'common' });
  const entries = getCareer(locale);
  const buildYear = new Date().getFullYear();

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} title={t('title')} lead={t('lead')} />

      <section aria-labelledby="chart-title" className="surface-white section hidden md:block">
        <div className="container-x">
          <figure>
            <h2 id="chart-title" className="eyebrow">
              {t('chartTitle')}
            </h2>
            <div className="mt-10">
              <AppointmentChart entries={entries} toYear={buildYear} />
            </div>
            <figcaption className="mt-8 text-sm text-ink-muted">{t('chartCaption')}</figcaption>
          </figure>
        </div>
      </section>

      <section aria-labelledby="appointments-title" className="surface-ivory section">
        <div className="container-x">
          <h2 id="appointments-title" className="display-md">
            {t('listTitle')}
          </h2>
          <ol className="relative mt-12">
            <span aria-hidden className="absolute top-3 bottom-3 left-[1.125rem] w-px bg-line-dark md:left-[11.125rem]" />
            {entries.map((entry, index) => {
              const current = entry.isCurrentPrincipalRole;
              const Icon = entry.institution === 'rguhs' ? Landmark : Building2;
              return (
                <Reveal
                  as="li"
                  key={entry.id}
                  delay={index * 60}
                  className="relative grid grid-cols-[2.25rem_1fr] gap-x-5 pb-12 last:pb-0 md:grid-cols-[9rem_2.25rem_1fr] md:gap-x-8"
                >
                  <p className="col-start-2 font-serif text-2xl leading-tight text-ink md:col-start-1 md:row-start-1 md:pt-1 md:text-right">
                    {formatPeriod(entry, t)}
                  </p>
                  <span
                    className={cn(
                      'relative z-10 col-start-1 row-span-2 row-start-1 flex h-9 w-9 items-center justify-center rounded-full border md:col-start-2',
                      current ? 'border-gold bg-midnight text-gold' : 'border-line-dark bg-white text-gold-ink',
                    )}
                  >
                    <Icon aria-hidden className="h-4 w-4" />
                  </span>
                  <article className={cn('col-start-2 mt-3 md:col-start-3 md:row-start-1 md:mt-0', current && 'card-soft p-6')}>
                    {current && (
                      <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-gold-ink uppercase">{t('currentRole')}</p>
                    )}
                    <h3 className="font-display text-xl font-semibold">{entry.role}</h3>
                    <p className="mt-1 font-medium text-ink">{entry.institution}</p>
                    <p className="mt-3 max-w-2xl text-ink-muted">{entry.description}</p>
                  </article>
                </Reveal>
              );
            })}
          </ol>
          <div className="mt-16">
            <SourceNote extra={common('periodsNote')} />
          </div>
        </div>
      </section>
    </>
  );
}
