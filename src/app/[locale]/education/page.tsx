import { GraduationCap } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Reveal } from '@/components/motion/Reveal';
import { PageHero } from '@/components/ui/PageHero';
import { SourceNote } from '@/components/ui/SourceNote';
import { getQualifications } from '@/content';
import { buildPageMetadata } from '@/lib/metadata';
import { resolveLocale, type LocaleParams } from '@/lib/page';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  return buildPageMetadata(await resolveLocale(params), 'education');
}

export default async function EducationPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'education' });
  const qualifications = getQualifications(locale);

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} title={t('title')} lead={t('lead')} />
      <section aria-labelledby="qualifications-title" className="surface-ivory section">
        <h2 id="qualifications-title" className="sr-only">
          {t('title')}
        </h2>
        <div className="container-x">
          {/* Stacked on small screens, horizontal rail on large screens. */}
          <ol className="relative grid gap-6 lg:grid-cols-5 lg:gap-5">
            <span aria-hidden className="absolute top-[1.375rem] right-0 left-0 hidden h-px bg-line-dark lg:block" />
            {qualifications.map((q, index) => (
              <Reveal as="li" key={q.id} delay={index * 80} className="relative flex flex-col">
                <div className="hidden items-center gap-3 lg:flex">
                  <span className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-line-dark bg-white text-gold-ink">
                    <GraduationCap aria-hidden className="h-5 w-5" />
                  </span>
                </div>
                <article className="card card-interactive mt-0 flex flex-1 flex-col p-7 lg:mt-6">
                  <p className="font-serif text-4xl leading-none text-ink">
                    {q.startYear ? (
                      <>
                        <span className="sr-only">{t('period')}: </span>
                        {q.startYear}
                        <span className="text-ink-muted">–</span>
                        {q.endYear}
                      </>
                    ) : (
                      <>
                        <span className="sr-only">{t('awarded')}: </span>
                        {q.endYear}
                      </>
                    )}
                  </p>
                  <div aria-hidden className="mt-5 h-px w-10 bg-gold-ink" />
                  <h3 className="mt-5 font-display text-xl font-bold tracking-tight" lang="en">
                    {q.credential}
                  </h3>
                  {q.title !== q.credential && <p className="mt-1 text-sm text-ink-muted">{q.title}</p>}
                  <p className="mt-3 text-ink-muted">{q.detail}</p>
                  <p className="mt-auto pt-5 text-sm font-medium text-ink">
                    {q.institution ?? <span className="font-normal text-ink-muted italic">{t('institutionNotStated')}</span>}
                  </p>
                </article>
              </Reveal>
            ))}
          </ol>
          <div className="mt-16">
            <SourceNote />
          </div>
        </div>
      </section>
    </>
  );
}
