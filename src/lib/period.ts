import type { CareerEntry } from '@/content/schema';

type Translate = (key: 'from' | 'range' | 'toPresent' | 'current', values?: Record<string, string | number>) => string;

/**
 * Formats a published period. Open-ended appointments read "present" only
 * when an editor has confirmed they are current; otherwise "From <year>".
 */
export function formatPeriod(entry: Pick<CareerEntry, 'startYear' | 'end'>, t: Translate) {
  if (entry.startYear === null) return t('current');
  if (entry.end.kind === 'year') {
    return entry.end.year === entry.startYear
      ? String(entry.startYear)
      : t('range', { start: entry.startYear, end: entry.end.year });
  }
  return entry.end.presentConfirmed ? t('toPresent', { year: entry.startYear }) : t('from', { year: entry.startYear });
}
