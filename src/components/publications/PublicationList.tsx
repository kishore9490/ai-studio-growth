'use client';

import { ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useMemo, useState } from 'react';
import { publicationTypes, type PublicationType } from '@/content/ids';
import type { Publication } from '@/content/schema';

/** Filters appear only once there are enough verified records to warrant them. */
export const FILTER_THRESHOLD = 6;

export function PublicationList({ items }: { items: Publication[] }) {
  const t = useTranslations('publications');
  const common = useTranslations('common');
  const typeId = useId();
  const yearId = useId();
  const [type, setType] = useState<PublicationType | 'all'>('all');
  const [year, setYear] = useState<number | 'all'>('all');

  const presentTypes = publicationTypes.filter((pt) => items.some((item) => item.type === pt));
  const years = useMemo(() => [...new Set(items.map((item) => item.year))].sort((a, b) => b - a), [items]);
  const filtered = items.filter((item) => (type === 'all' || item.type === type) && (year === 'all' || item.year === year));
  const showFilters = items.length >= FILTER_THRESHOLD;

  return (
    <div>
      {showFilters && (
        <div className="mb-10 flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor={typeId} className="block text-sm font-semibold">
              {t('filterType')}
            </label>
            <select
              id={typeId}
              value={type}
              onChange={(event) => setType(event.target.value as PublicationType | 'all')}
              className="mt-2 min-h-11 rounded-lg border border-line-dark bg-white px-3"
            >
              <option value="all">{t('all')}</option>
              {presentTypes.map((pt) => (
                <option key={pt} value={pt}>
                  {t(`types.${pt}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={yearId} className="block text-sm font-semibold">
              {t('filterYear')}
            </label>
            <select
              id={yearId}
              value={year}
              onChange={(event) => setYear(event.target.value === 'all' ? 'all' : Number(event.target.value))}
              className="mt-2 min-h-11 rounded-lg border border-line-dark bg-white px-3"
            >
              <option value="all">{t('all')}</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <p role="status" className="pb-2.5 text-sm text-ink-muted">
            {t('results', { count: filtered.length })}
          </p>
        </div>
      )}

      <ol className="divide-y divide-line-dark border-y border-line-dark">
        {filtered.map((item) => {
          const href = item.doi ? `https://doi.org/${item.doi}` : item.url;
          return (
            <li key={item.id} className="grid gap-3 py-8 md:grid-cols-[6rem_1fr]">
              <p className="font-serif text-2xl text-ink">{item.year}</p>
              <article>
                <p className="text-xs font-semibold tracking-[0.12em] text-gold-ink uppercase">{t(`types.${item.type}`)}</p>
                <h3 className="mt-2 font-display text-xl font-semibold" lang="en">
                  {item.title}
                </h3>
                <p className="mt-1 text-ink-muted" lang="en">
                  {item.authors.join(', ')} · <span className="italic">{item.venue}</span>
                </p>
                {item.description && <p className="mt-3 max-w-2xl">{item.description}</p>}
                <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  {item.doi && (
                    <span>
                      {t('doi')}: <span lang="en">{item.doi}</span>
                    </span>
                  )}
                  {item.isbn && (
                    <span>
                      {t('isbn')}: <span lang="en">{item.isbn}</span>
                    </span>
                  )}
                  {href && (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="link-inline inline-flex items-center gap-1">
                      {t('sourceLink')}
                      <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                      <span className="sr-only">({common('opensNewTab')})</span>
                    </a>
                  )}
                </p>
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
