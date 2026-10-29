import { Images } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Gallery } from '@/components/media/Gallery';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHero } from '@/components/ui/PageHero';
import { getMediaItems } from '@/content';
import { mediaCategories } from '@/content/ids';
import { buildPageMetadata } from '@/lib/metadata';
import { resolveLocale, type LocaleParams } from '@/lib/page';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  return buildPageMetadata(await resolveLocale(params), 'media');
}

export default async function MediaPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'media' });
  const items = getMediaItems();
  const placeholders = items.some((item) => item.placeholder);

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} title={t('title')} lead={t('lead')} />
      <section aria-label={t('title')} className="surface-ivory section">
        <div className="container-x">
          {items.length > 0 ? (
            <>
              {placeholders && (
                <p role="note" className="mb-8 rounded-xl border border-dashed border-gold-ink/50 bg-white px-5 py-4 text-sm text-ink">
                  {t('placeholderBanner')}
                </p>
              )}
              <Gallery items={items} />
            </>
          ) : (
            <EmptyState
              icon={Images}
              title={t('emptyTitle')}
              body={t('emptyBody')}
              listTitle={t('willInclude')}
              items={mediaCategories.map((category) => t(`categories.${category}`))}
            />
          )}
        </div>
      </section>
    </>
  );
}
