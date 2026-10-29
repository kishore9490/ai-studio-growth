import { Library } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PublicationList } from '@/components/publications/PublicationList';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHero } from '@/components/ui/PageHero';
import { getPublications } from '@/content';
import { publicationTypes } from '@/content/ids';
import { buildPageMetadata } from '@/lib/metadata';
import { resolveLocale, type LocaleParams } from '@/lib/page';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  return buildPageMetadata(await resolveLocale(params), 'publications');
}

export default async function PublicationsPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'publications' });
  const items = getPublications();

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} title={t('title')} lead={t('lead')} />
      <section aria-label={t('title')} className="surface-ivory section">
        <div className="container-x">
          {items.length > 0 ? (
            <PublicationList items={items} />
          ) : (
            <EmptyState
              icon={Library}
              title={t('emptyTitle')}
              body={t('emptyBody')}
              listTitle={t('willInclude')}
              items={publicationTypes.map((type) => t(`types.${type}`))}
            />
          )}
        </div>
      </section>
    </>
  );
}
