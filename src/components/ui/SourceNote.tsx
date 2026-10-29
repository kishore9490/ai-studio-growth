import { useTranslations } from 'next-intl';
import { officialLinks } from '@/content/sources';
import { ExternalLink } from './ExternalLink';

/** Visitor-facing attribution to the official profile. No internal metadata is shown. */
export function SourceNote({ extra }: { extra?: string }) {
  const t = useTranslations('common');
  return (
    <aside className="border-t border-line-dark pt-6 text-sm text-ink-muted">
      <p>{t('sourceNote')}</p>
      {extra && <p className="mt-2">{extra}</p>}
      <p className="mt-3">
        <span className="font-semibold text-ink">{t('source')}: </span>
        <ExternalLink href={officialLinks.vcProfile} className="link-inline">
          {t('officialProfile')}
        </ExternalLink>
      </p>
    </aside>
  );
}
