import type { Locale } from '@/i18n/routing';
import { siteConfig } from '@/lib/site';
import { en } from './copy/en';
import { kn } from './copy/kn';
import type { LocaleCopy } from './copy/types';
import { careerIds, focusAreaIds, qualificationIds, visionIds, type CareerId, type QualificationId } from './ids';
import { devPlaceholderMedia } from './placeholders';
import { careerEntries, mediaItems, portrait, publications, qualifications } from './records';
import type { CareerEntry, MediaItem, Qualification } from './schema';

const copies: Record<Locale, LocaleCopy> = { en, kn };

export function getCopy(locale: Locale): LocaleCopy {
  return copies[locale];
}

/** Records that may be shown to visitors. Disputed records are never shown. */
function isShowable(record: { published: boolean; verificationStatus: string }) {
  return record.published && record.verificationStatus !== 'disputed';
}

export function getQualifications(locale: Locale) {
  const copy = copies[locale].qualifications;
  return qualificationIds
    .map((id) => qualifications.find((q) => q.id === id))
    .filter((q): q is Qualification & { id: QualificationId } => !!q && isShowable(q))
    .map((q) => ({ ...q, ...copy[q.id] }));
}

export type CareerItem = ReturnType<typeof getCareer>[number];

export function getCareer(locale: Locale) {
  const copy = copies[locale].career;
  return careerIds
    .map((id) => careerEntries.find((c) => c.id === id))
    .filter((c): c is CareerEntry & { id: CareerId } => !!c && isShowable(c))
    .map((c) => ({ ...c, ...copy[c.id] }));
}

export function getFocusAreas(locale: Locale) {
  return focusAreaIds.map((id) => ({ id, ...copies[locale].focusAreas[id] }));
}

export function getVisionPriorities(locale: Locale) {
  return visionIds.map((id, index) => ({ id, number: index + 1, ...copies[locale].vision[id] }));
}

export function getPublications() {
  return publications.filter(isShowable).sort((a, b) => b.year - a.year);
}

export function getMediaItems(): MediaItem[] {
  const approved = mediaItems.filter((item) => isShowable(item) && !item.placeholder);
  if (approved.length === 0 && siteConfig.showDevPlaceholders) return devPlaceholderMedia;
  return approved;
}

export function getPortrait() {
  return portrait;
}

/**
 * Pairs of career entries whose published periods overlap. Overlaps are
 * reproduced as published and listed for editorial review — never merged
 * or reinterpreted automatically.
 */
export function findCareerOverlaps(entries: Pick<CareerEntry, 'id' | 'startYear' | 'end'>[] = careerEntries) {
  const span = (e: Pick<CareerEntry, 'startYear' | 'end'>) =>
    e.startYear === null ? null : ([e.startYear, e.end.kind === 'year' ? e.end.year : Infinity] as const);
  const overlaps: [string, string][] = [];
  entries.forEach((a, i) => {
    entries.slice(i + 1).forEach((b) => {
      const sa = span(a);
      const sb = span(b);
      if (sa && sb && sa[0] <= sb[1] && sb[0] <= sa[1]) overlaps.push([a.id, b.id]);
    });
  });
  return overlaps;
}

export interface Milestone {
  id: string;
  year: number | null;
  kind: 'education' | 'career';
  title: string;
  subtitle: string | null;
}

/** A single chronological list of verified education and career milestones. */
export function getMilestones(locale: Locale): Milestone[] {
  const education: Milestone[] = getQualifications(locale).map((q) => ({
    id: q.id,
    year: q.endYear,
    kind: 'education',
    title: q.title,
    subtitle: q.institution ?? q.detail,
  }));
  const career: Milestone[] = getCareer(locale).map((c) => ({
    id: c.id,
    year: c.startYear,
    kind: 'career',
    title: c.role,
    subtitle: c.institution,
  }));
  // Undated current role goes last; otherwise sort by year.
  return [...education, ...career].sort((a, b) => (a.year ?? Infinity) - (b.year ?? Infinity));
}
