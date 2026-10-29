import { ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Link to an external site. Announces that it opens in a new tab. */
export function ExternalLink({
  href,
  children,
  className,
  icon = true,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  icon?: boolean;
}) {
  const t = useTranslations('common');
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn('group/ext inline-flex items-center gap-1.5', className)}>
      <span>{children}</span>
      {icon && (
        <ArrowUpRight
          aria-hidden
          className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover/ext:translate-x-0.5 group-hover/ext:-translate-y-0.5"
        />
      )}
      <span className="sr-only">({t('opensNewTab')})</span>
    </a>
  );
}
