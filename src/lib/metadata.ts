import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { locales, type Locale } from '@/i18n/routing';
import { pagePaths, type PageKey } from './routes';
import { siteConfig } from './site';

export function localizedPath(locale: Locale, page: PageKey) {
  const path = pagePaths[page];
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}

export function absoluteUrl(path: string) {
  return `${siteConfig.url}${path}`;
}

/** Canonical URL plus hreflang alternates (including x-default → English). */
export function alternatesFor(locale: Locale, page: PageKey): Metadata['alternates'] {
  const languages: Record<string, string> = Object.fromEntries(
    locales.map((l) => [l, absoluteUrl(localizedPath(l, page))]),
  );
  languages['x-default'] = absoluteUrl(localizedPath('en', page));
  return { canonical: absoluteUrl(localizedPath(locale, page)), languages };
}

/** Shared metadata builder used by every page's generateMetadata. */
export async function buildPageMetadata(locale: Locale, page: PageKey): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'meta' });
  const title = t(`pages.${page}.title`);
  const description = t(`pages.${page}.description`);
  const siteName = t('siteName');
  const url = absoluteUrl(localizedPath(locale, page));

  return {
    title: page === 'home' ? { absolute: title } : title,
    description,
    alternates: alternatesFor(locale, page),
    openGraph: {
      type: page === 'home' || page === 'about' ? 'profile' : 'website',
      url,
      title: page === 'home' ? title : `${title} · ${siteName}`,
      description,
      siteName,
      locale: locale === 'kn' ? 'kn_IN' : 'en_IN',
      alternateLocale: locale === 'kn' ? ['en_IN'] : ['kn_IN'],
    },
    twitter: {
      card: 'summary_large_image',
      title: page === 'home' ? title : `${title} · ${siteName}`,
      description,
    },
  };
}
