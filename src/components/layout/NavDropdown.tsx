'use client';

import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { isActivePath, type NavGroup } from '@/lib/routes';

/**
 * Disclosure-pattern dropdown: a button toggles a list of links.
 * Escape closes and returns focus; moving focus or clicking outside closes.
 */
export function NavDropdown({ entry }: { entry: NavGroup }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const active = entry.items.some((item) => isActivePath(pathname, item.href));

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <li
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'link-underline inline-flex items-center gap-1 py-2 font-display text-[0.9375rem] font-medium transition-colors duration-300',
          active ? 'text-white' : 'text-white/75 hover:text-white',
          active && 'bg-[length:100%_1px]',
        )}
      >
        {t(entry.group)}
        <ChevronDown
          aria-hidden
          className={cn('h-4 w-4 transition-transform duration-300', open && 'rotate-180')}
        />
      </button>
      <ul
        id={panelId}
        hidden={!open}
        className="surface-midnight absolute top-full left-1/2 mt-3 min-w-56 -translate-x-1/2 rounded-xl border border-line p-2 shadow-lift"
      >
        {entry.items.map((item) => {
          const current = isActivePath(pathname, item.href);
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={current ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  'block rounded-lg px-4 py-3 font-display text-[0.9375rem] transition-colors duration-200',
                  current ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/5 hover:text-white',
                )}
              >
                {t(item.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </li>
  );
}
