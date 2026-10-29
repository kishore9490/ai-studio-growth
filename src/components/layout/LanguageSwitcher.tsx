'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { locales, type Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';

/**
 * Switches language while preserving the current page. Each option is a real
 * link, so it works without JavaScript and can be opened in a new tab.
 */
export function LanguageSwitcher({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const t = useTranslations('language');
  const current = useLocale() as Locale;
  const pathname = usePathname();

  return (
    <div role="group" aria-label={t('label')} className={cn('glass flex items-center rounded-full p-1 text-sm', className)}>
      {locales.map((locale) =>
        locale === current ? (
          <span
            key={locale}
            lang={locale}
            aria-current="true"
            className="rounded-full bg-white px-3.5 py-1.5 font-display font-semibold text-midnight"
          >
            {t(locale)}
          </span>
        ) : (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            lang={locale}
            hrefLang={locale}
            onClick={onNavigate}
            className="rounded-full px-3.5 py-1.5 font-display font-medium text-white/80 transition-colors duration-300 hover:bg-white/10 hover:text-white"
          >
            {t(locale)}
          </Link>
        ),
      )}
    </div>
  );
}
