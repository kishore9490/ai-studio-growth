import type { Metadata, Viewport } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { preload } from 'react-dom';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { SkipLink } from '@/components/layout/SkipLink';
import { getCopy } from '@/content';
import { routing, type Locale } from '@/i18n/routing';
import { siteConfig } from '@/lib/site';
import { fontVariables, KANNADA_FONT_URL } from '../fonts';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: '#071426',
  colorScheme: 'light',
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: t('siteName'), template: `%s · ${t('siteName')}` },
    description: t('defaultDescription'),
    applicationName: t('siteName'),
    robots: siteConfig.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

/** Only the namespaces used by Client Components are sent to the browser. */
const CLIENT_NAMESPACES = ['nav', 'language', 'media', 'publications', 'common', 'error'] as const;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  if (locale === 'kn') preload(KANNADA_FONT_URL, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });

  const messages = await getMessages();
  const clientMessages = Object.fromEntries(CLIENT_NAMESPACES.map((ns) => [ns, messages[ns]]));

  return (
    <html lang={locale} dir="ltr" className={fontVariables}>
      <body>
        <NextIntlClientProvider locale={locale} messages={clientMessages}>
          <SkipLink />
          <Header name={getCopy(locale as Locale).profile.name} />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Footer locale={locale as Locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
