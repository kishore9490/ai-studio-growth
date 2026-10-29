import { describe, expect, it } from 'vitest';
import en from '@messages/en.json';
import kn from '@messages/kn.json';
import { findCareerOverlaps, getCareer, getMediaItems, getMilestones, getPublications, getQualifications } from '@/content';
import { en as enCopy } from '@/content/copy/en';
import { kn as knCopy } from '@/content/copy/kn';
import { careerEntries, mediaItems, publications, qualifications } from '@/content/records';
import { sources } from '@/content/sources';

/** Facts exactly as listed in the commissioning brief (quoting the official RGUHS profile). */
const BRIEF_QUALIFICATIONS = [
  ['mbbs', 'MBBS', 1982, 1987],
  ['ms-general-surgery', 'M.S. (General Surgery)', 1991, 1993],
  ['fmas', 'FMAS', null, 2016],
  ['frcs-edinburgh', 'FRCS (Edinburgh)', null, 2022],
  ['frcs-glasgow', 'FRCS (Glasgow)', null, 2024],
] as const;

describe('qualifications', () => {
  it('match the source exactly — no additions, no changes', () => {
    expect(qualifications.map((q) => [q.id, q.credential, q.startYear, q.endYear])).toEqual(BRIEF_QUALIFICATIONS);
  });

  it('keep institutions as published in English', () => {
    const byId = Object.fromEntries(getQualifications('en').map((q) => [q.id, q.institution]));
    expect(byId.mbbs).toBe('Government Medical College, Mysore');
    expect(byId['ms-general-surgery']).toBe('J.N. Medical College, Belgaum');
    expect(byId.fmas).toBeNull();
  });

  it('never translate credential abbreviations', () => {
    for (const q of getQualifications('kn')) expect(q.credential).toMatch(/^(MBBS|M\.S\.|FMAS|FRCS)/);
  });
});

describe('career', () => {
  it('reproduces the published periods', () => {
    const periods = Object.fromEntries(careerEntries.map((c) => [c.id, [c.startYear, c.end]]));
    expect(periods['principal-kims']).toEqual([2023, { kind: 'open', presentConfirmed: false }]);
    expect(periods['vice-principal-kims']).toEqual([2017, { kind: 'year', year: 2023 }]);
    expect(periods['hod-surgery-kims']).toEqual([2022, { kind: 'year', year: 2023 }]);
    expect(periods['faculty-kims']).toEqual([2003, { kind: 'open', presentConfirmed: false }]);
  });

  it('flags every overlapping period for review rather than merging it', () => {
    const overlaps = findCareerOverlaps();
    expect(overlaps.length).toBeGreaterThan(0);
    const involved = new Set(overlaps.flat());
    for (const id of involved) {
      const entry = careerEntries.find((c) => c.id === id)!;
      // Overlaps are expected in the source; each entry stays published as listed.
      expect(entry.published).toBe(true);
    }
    expect(overlaps).toContainEqual(['principal-kims', 'hod-surgery-kims']);
    expect(overlaps).toContainEqual(['hod-surgery-kims', 'vice-principal-kims']);
  });

  it('documents a review note for every unconfirmed open-ended appointment', () => {
    for (const c of careerEntries.filter((e) => e.end.kind === 'open' && !e.end.presentConfirmed)) {
      expect(c.reviewNotes.length).toBeGreaterThan(0);
    }
  });

  it('orders milestones chronologically with the undated current role last', () => {
    const years = getMilestones('en').map((m) => m.year);
    expect(years.at(-1)).toBeNull();
    const dated = years.filter((y): y is number => y !== null);
    expect(dated).toEqual([...dated].sort((a, b) => a - b));
  });

  it('localises every role in Kannada', () => {
    for (const c of getCareer('kn')) expect(c.role).toMatch(/[ಀ-೿]/);
  });
});

describe('integrity rules', () => {
  it('every record cites a registered source', () => {
    for (const record of [...qualifications, ...careerEntries, ...publications, ...mediaItems]) {
      for (const id of record.sourceIds) expect(sources[id]).toBeDefined();
    }
  });

  it('every published publication has a DOI, ISBN or official URL', () => {
    for (const p of getPublications()) expect(p.doi ?? p.isbn ?? p.url).toBeTruthy();
  });

  it('never shows development placeholders unless explicitly enabled', () => {
    expect(getMediaItems().some((item) => item.placeholder)).toBe(false);
  });

  it('copy contains no first-person quotations attributed to the subject', () => {
    const text = JSON.stringify([enCopy, en.home, en.about]);
    expect(text).not.toMatch(/[“"]\s*I\s/);
  });

  it('every vision priority is presented as a stated priority, not an achievement', () => {
    const banned = /\b(launched|implemented|achieved|completed|established|signed|deployed)\b/i;
    for (const v of Object.values(enCopy.vision)) expect(`${v.summary} ${v.context}`).not.toMatch(banned);
  });
});

describe('translations', () => {
  const keys = (o: object, prefix = ''): string[] =>
    Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));

  it('English and Kannada message files have identical keys', () => {
    expect(keys(kn).sort()).toEqual(keys(en).sort());
  });

  it('no Kannada message is empty or left in English by accident', () => {
    const allowedLatin = new Set(['language.en', 'publications.doi', 'publications.isbn', 'experience.range', 'notFound.eyebrow']);
    const flat = (o: object, p = ''): [string, string][] =>
      Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? flat(v, `${p}${k}.`) : [[`${p}${k}`, String(v)]]));
    for (const [key, value] of flat(kn)) {
      expect(value.trim(), key).not.toBe('');
      if (!allowedLatin.has(key)) expect(value, key).toMatch(/[ಀ-೿]/);
    }
  });

  it('Kannada copy has the same structure as English copy', () => {
    expect(keys(knCopy).sort()).toEqual(keys(enCopy).sort());
  });
});
