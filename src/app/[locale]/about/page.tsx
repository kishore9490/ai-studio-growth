import { ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Reveal } from '@/components/motion/Reveal';
import { PageHero } from '@/components/ui/PageHero';
import { SourceNote } from '@/components/ui/SourceNote';
import { getCopy, getMilestones } from '@/content';
import { aboutSectionIds } from '@/content/ids';
import { officialLinks } from '@/content/sources';
import { personJsonLd, profilePageJsonLd, serializeJsonLd } from '@/lib/jsonld';
import { buildPageMetadata } from '@/lib/metadata';
import { resolveLocale, type LocaleParams } from '@/lib/page';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  return buildPageMetadata(await resolveLocale(params), 'about');
}

export default async function AboutPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'about' });
  const common = await getTranslations({ locale, namespace: 'common' });
  const journey = await getTranslations({ locale, namespace: 'home.journey' });
  const sections = getCopy(locale).about;
  const milestones = getMilestones(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd([personJsonLd(locale), profilePageJsonLd(locale)]) }}
      />
      <PageHero eyebrow={t('eyebrow')} title={t('title')} lead={t('lead')} />

      <div className="surface-ivory section">
        <div className="container-x grid gap-12 lg:grid-cols-[15rem_1fr] lg:gap-20">
          <nav aria-labelledby="toc-title" className="hidden lg:block">
            <div className="sticky top-32">
              <h2 id="toc-title" className="eyebrow">
                {t('contents')}
              </h2>
              <ol className="mt-6 space-y-1 border-l border-line-dark">
                {aboutSectionIds.map((id) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-[0.9375rem] text-ink-muted transition-colors hover:border-gold-ink hover:text-ink"
                    >
                      {sections[id].heading}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <article className="min-w-0">
            {aboutSectionIds.map((id, index) => {
              const section = sections[id];
              return (
                <Reveal as="section" key={id} id={id} className="border-t border-line-dark py-12 first:border-t-0 first:pt-0">
                  <div className="grid gap-4 md:grid-cols-[4rem_1fr]">
                    <span aria-hidden className="font-serif text-2xl text-gold-ink">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h2 className="display-md">{section.heading}</h2>
                      <div className="prose-editorial mt-6">
                        {section.paragraphs.map((paragraph, i) => (
                          <p key={i} className={id === 'introduction' && i === 0 ? 'lead' : undefined}>
                            {paragraph}
                          </p>
                        ))}
                      </div>

                      {id === 'milestones' && (
                        <ol className="mt-2 max-w-[var(--measure)] divide-y divide-line-dark border-y border-line-dark">
                          {milestones.map((m) => (
                            <li key={m.id} className="grid grid-cols-[5.5rem_1fr] gap-4 py-4">
                              <span className="font-serif text-xl text-ink">{m.year ?? journey('current')}</span>
                              <span>
                                <span className="block font-display font-semibold">{m.title}</span>
                                {m.subtitle && <span className="block text-ink-muted">{m.subtitle}</span>}
                              </span>
                            </li>
                          ))}
                        </ol>
                      )}

                      {id === 'official-profile' && (
                        <a
                          href={officialLinks.vcProfile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-dark mt-8"
                        >
                          {t('officialProfileCta')}
                          <ArrowUpRight aria-hidden className="h-4 w-4" />
                          <span className="sr-only">({common('opensNewTab')})</span>
                        </a>
                      )}
                    </div>
                  </div>
                </Reveal>
              );
            })}
            <div className="mt-8">
              <SourceNote />
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
