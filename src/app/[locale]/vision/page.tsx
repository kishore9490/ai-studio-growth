import { ArrowUpRight, Info } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Reveal } from '@/components/motion/Reveal';
import { PageHero } from '@/components/ui/PageHero';
import { SourceNote } from '@/components/ui/SourceNote';
import { VisionDiagram } from '@/components/vision/VisionDiagram';
import { VisionIllustration } from '@/components/vision/VisionIllustration';
import { getVisionPriorities } from '@/content';
import { officialLinks } from '@/content/sources';
import { cn } from '@/lib/cn';
import { buildPageMetadata } from '@/lib/metadata';
import { resolveLocale, type LocaleParams } from '@/lib/page';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  return buildPageMetadata(await resolveLocale(params), 'vision');
}

export default async function VisionPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'vision' });
  const common = await getTranslations({ locale, namespace: 'common' });
  const priorities = getVisionPriorities(locale);

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} title={t('title')} lead={t('lead')}>
        <div className="mt-16 lg:mt-8">
          <VisionDiagram center={t('diagramCenter')} label={t('diagramLabel')} priorities={priorities} />
        </div>
      </PageHero>

      {/* Prominent statement that these are priorities, not achievements. */}
      <section aria-labelledby="notice-title" className="surface-white border-b border-line-dark">
        <div className="container-x py-10">
          <div className="flex gap-4 rounded-2xl border border-gold-ink/30 bg-ivory p-6 sm:p-8">
            <Info aria-hidden className="mt-1 h-5 w-5 shrink-0 text-gold-ink" />
            <div>
              <h2 id="notice-title" className="font-display text-lg font-semibold">
                {t('noticeTitle')}
              </h2>
              <p className="mt-2 max-w-3xl text-ink-muted">{t('notice')}</p>
            </div>
          </div>
        </div>
      </section>

      {priorities.map((p, index) => (
        <section
          key={p.id}
          id={p.id}
          aria-labelledby={`${p.id}-title`}
          className={cn('section', index % 2 === 0 ? 'surface-white' : 'surface-ivory')}
        >
          <div className="container-x grid items-center gap-12 md:grid-cols-12">
            <Reveal className={cn('md:col-span-7', index % 2 === 1 && 'md:order-2 md:col-start-6')}>
              <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="font-serif text-5xl leading-none text-gold-ink">{String(p.number).padStart(2, '0')}</span>
                <span className="rounded-full border border-line-dark px-3 py-1 text-xs font-semibold tracking-[0.12em] text-ink-muted uppercase">
                  {common('statedPriority')}
                </span>
              </p>
              <h2 id={`${p.id}-title`} className="display-md mt-6">
                {p.title}
              </h2>
              <p className="lead mt-5 text-ink">{p.summary}</p>
              <div className="mt-8 border-l-2 border-gold-ink/40 pl-5">
                <h3 className="text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">{t('context')}</h3>
                <p className="mt-2 max-w-xl text-ink-muted">{p.context}</p>
              </div>
            </Reveal>
            <Reveal
              delay={120}
              className={cn(
                'mx-auto w-full max-w-xs md:col-span-5 md:max-w-sm',
                index % 2 === 1 && 'md:order-1 md:col-span-4 md:col-start-1',
              )}
            >
              <div className="surface-mesh relative aspect-square overflow-hidden rounded-[var(--radius-xl)] p-8 text-royal-soft shadow-lift">
                <div aria-hidden className="bg-grid absolute inset-0" />
                <VisionIllustration id={p.id} className="relative h-full w-full" />
              </div>
            </Reveal>
          </div>
        </section>
      ))}

      <section aria-labelledby="official-title" className="surface-dark section">
        <div className="container-x grid gap-10 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="eyebrow">{t('officialTitle')}</p>
            <h2 id="official-title" className="display-md mt-5">
              {common('vcMessage')}
            </h2>
            <p className="lead mt-5 text-mist">{t('officialBody')}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <a href={officialLinks.vcDesk} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              {common('vcMessage')}
              <ArrowUpRight aria-hidden className="h-4 w-4" />
              <span className="sr-only">({common('opensNewTab')})</span>
            </a>
            <a href={officialLinks.university} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              RGUHS
              <ArrowUpRight aria-hidden className="h-4 w-4" />
              <span className="sr-only">
                {common('university')} ({common('opensNewTab')})
              </span>
            </a>
          </div>
        </div>
      </section>

      <div className="surface-ivory">
        <div className="container-x py-10">
          <SourceNote />
        </div>
      </div>
    </>
  );
}
