import type { Locale } from '@/i18n/routing';
import { getCopy } from '@/content';
import { officialLinks } from '@/content/sources';
import { absoluteUrl, localizedPath } from './metadata';

/**
 * Structured data. Only verified-source fields are used: name, job title,
 * employer and the official profile link. No social accounts, contact
 * details, honours or images are asserted.
 */
export function personJsonLd(locale: Locale) {
  const copy = getCopy(locale).profile;
  const personId = `${absoluteUrl('/')}#person`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': personId,
        name: copy.name,
        alternateName: locale === 'kn' ? getCopy('en').profile.name : undefined,
        honorificPrefix: locale === 'kn' ? 'ಡಾ.' : 'Dr.',
        jobTitle: copy.role,
        worksFor: {
          '@type': 'CollegeOrUniversity',
          name: copy.institution,
          url: officialLinks.university,
        },
        sameAs: [officialLinks.vcProfile],
      },
      {
        '@type': 'WebSite',
        '@id': `${absoluteUrl('/')}#website`,
        url: absoluteUrl(localizedPath(locale, 'home')),
        name: copy.name,
        inLanguage: locale,
        about: { '@id': personId },
      },
    ],
  };
}

export function profilePageJsonLd(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: absoluteUrl(localizedPath(locale, 'about')),
    inLanguage: locale,
    mainEntity: { '@id': `${absoluteUrl('/')}#person` },
  };
}

/** Serialises JSON-LD safely for embedding in a <script> element. */
export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
