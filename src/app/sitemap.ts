import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/routing';
import { absoluteUrl, localizedPath } from '@/lib/metadata';
import { pages } from '@/lib/routes';

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.flatMap((page) =>
    locales.map((locale) => ({
      url: absoluteUrl(localizedPath(locale, page)),
      changeFrequency: 'monthly' as const,
      priority: page === 'home' ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, absoluteUrl(localizedPath(l, page))])),
      },
    })),
  );
}
