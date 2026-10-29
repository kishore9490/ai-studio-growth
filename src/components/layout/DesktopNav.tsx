'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { desktopNav, isActivePath } from '@/lib/routes';
import { NavDropdown } from './NavDropdown';

export function DesktopNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <nav aria-label={t('primary')} className="hidden lg:block">
      <ul className="flex items-center gap-6 xl:gap-8">
        {desktopNav.map((entry) => {
          if ('group' in entry) return <NavDropdown key={entry.group} entry={entry} />;
          const current = isActivePath(pathname, entry.href);
          return (
            <li key={entry.key}>
              <Link
                href={entry.href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'link-underline py-2 font-display text-[0.9375rem] font-medium transition-colors duration-300',
                  current ? 'text-white' : 'text-white/75 hover:text-white',
                )}
              >
                {t(entry.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
