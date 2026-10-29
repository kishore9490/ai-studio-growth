import { ArrowUpRight, Globe, Landmark, ShieldCheck, UserRound, type LucideIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Reveal } from '@/components/motion/Reveal';
import { PageHero } from '@/components/ui/PageHero';
import { officialLinks } from '@/content/sources';
import { buildPageMetadata } from '@/lib/metadata';
import { resolveLocale, type LocaleParams } from '@/lib/page';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  return buildPageMetadata(await resolveLocale(params), 'contact');
}

/**
 * No contact details have been approved for this personal website and no
 * submission backend exists, so there is deliberately no form. Visitors are
 * directed to official university channels instead.
 */
export default async function ContactPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'contact' });
  const common = await getTranslations({ locale, namespace: 'common' });

  const channels: { icon: LucideIcon; title: string; body: string; href: string }[] = [
    { icon: Globe, title: t('universityTitle'), body: t('universityBody'), href: officialLinks.university },
    { icon: Landmark, title: t('vcDeskTitle'), body: t('vcDeskBody'), href: officialLinks.vcDesk },
    { icon: UserRound, title: t('vcProfileTitle'), body: t('vcProfileBody'), href: officialLinks.vcProfile },
  ];

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} title={t('title')} lead={t('lead')} />
      <section aria-labelledby="channels-title" className="surface-ivory section">
        <div className="container-x">
          <h2 id="channels-title" className="eyebrow">
            {t('officialTitle')}
          </h2>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {channels.map(({ icon: Icon, title, body, href }, index) => (
              <Reveal as="li" key={href} delay={index * 80}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card card-interactive group flex h-full flex-col p-7 sm:p-8"
                >
                  <Icon aria-hidden className="h-7 w-7 text-gold-ink" strokeWidth={1.5} />
                  <span className="mt-6 font-display text-xl font-semibold">{title}</span>
                  <span className="mt-3 text-ink-muted">{body}</span>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-6 font-display text-sm font-semibold text-royal">
                    {t('visit')}
                    <ArrowUpRight aria-hidden className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    <span className="sr-only">({common('opensNewTab')})</span>
                  </span>
                </a>
              </Reveal>
            ))}
          </ul>

          <div className="mt-14 flex max-w-3xl gap-4 border-t border-line-dark pt-10">
            <ShieldCheck aria-hidden className="mt-1 h-5 w-5 shrink-0 text-gold-ink" />
            <div>
              <h2 className="font-display text-lg font-semibold">{t('privacyTitle')}</h2>
              <p className="mt-2 text-ink-muted">{t('privacyBody')}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
