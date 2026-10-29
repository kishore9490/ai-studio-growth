import { describe, expect, it } from 'vitest';
import { isActivePath } from '@/lib/routes';
import { formatPeriod } from '@/lib/period';
import { alternatesFor, localizedPath } from '@/lib/metadata';
import { personJsonLd, serializeJsonLd } from '@/lib/jsonld';

const t = (key: string, values?: Record<string, string | number>) =>
  ({ from: `From ${values?.year}`, range: `${values?.start}–${values?.end}`, toPresent: `${values?.year}–present`, current: 'Current' })[key]!;

describe('formatPeriod', () => {
  it('renders closed ranges as published', () => {
    expect(formatPeriod({ startYear: 2017, end: { kind: 'year', year: 2023 } }, t)).toBe('2017–2023');
  });
  it('uses "From" for open-ended appointments that are not confirmed current', () => {
    expect(formatPeriod({ startYear: 2023, end: { kind: 'open', presentConfirmed: false } }, t)).toBe('From 2023');
  });
  it('uses "present" only once confirmed', () => {
    expect(formatPeriod({ startYear: 2023, end: { kind: 'open', presentConfirmed: true } }, t)).toBe('2023–present');
  });
  it('labels undated current roles as current', () => {
    expect(formatPeriod({ startYear: null, end: { kind: 'open', presentConfirmed: true } }, t)).toBe('Current');
  });
});

describe('routing helpers', () => {
  it('matches active paths', () => {
    expect(isActivePath('/', '/')).toBe(true);
    expect(isActivePath('/about', '/')).toBe(false);
    expect(isActivePath('/about', '/about')).toBe(true);
    expect(isActivePath('/aboutness', '/about')).toBe(false);
  });

  it('builds locale-prefixed paths', () => {
    expect(localizedPath('en', 'home')).toBe('/en');
    expect(localizedPath('kn', 'vision')).toBe('/kn/vision');
  });
});

describe('SEO', () => {
  it('provides canonical and hreflang alternates for both languages', () => {
    const alt = alternatesFor('kn', 'about')!;
    expect(alt.canonical).toBe('http://localhost:3000/kn/about');
    expect(alt.languages).toEqual({
      en: 'http://localhost:3000/en/about',
      kn: 'http://localhost:3000/kn/about',
      'x-default': 'http://localhost:3000/en/about',
    });
  });

  it('asserts only verified-source fields in JSON-LD', () => {
    const graph = personJsonLd('en')['@graph'];
    const person = graph[0] as Record<string, unknown>;
    expect(person.name).toBe('Dr. Bhagavan B.C.');
    expect(person.jobTitle).toBe('Vice Chancellor');
    expect(person.image).toBe('http://localhost:3000/images/portrait/dr-bhagavan-bc.jpg');
    for (const key of ['email', 'telephone', 'award', 'sameAsSocial']) expect(person[key]).toBeUndefined();
  });

  it('escapes "<" when serialising JSON-LD', () => {
    expect(serializeJsonLd({ a: '</script><script>' })).not.toContain('<');
  });
});
