'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { flatNav, isActivePath } from '@/lib/routes';
import { LanguageSwitcher } from './LanguageSwitcher';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Full-screen mobile navigation dialog: focus is moved into the dialog,
 * trapped while open, returned to the toggle on close; Escape closes it.
 */
export function MobileMenu() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog?.querySelector<HTMLElement>('[data-autofocus]')?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  // Close if the viewport grows to the desktop layout while open.
  useEffect(() => {
    if (!open) return;
    const mql = window.matchMedia('(min-width: 1024px)');
    const onChange = () => mql.matches && setOpen(false);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [open]);

  const duration = reduceMotion ? 0 : 0.35;

  return (
    <div className="lg:hidden">
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={t('openMenu')}
        onClick={() => setOpen(true)}
        className="glass inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:border-gold"
      >
        <Menu aria-hidden className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={dialogRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={t('menuTitle')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration }}
            className="surface-midnight fixed inset-0 z-[60] flex flex-col overflow-y-auto"
          >
            <div aria-hidden className="bg-grid pointer-events-none absolute inset-0" />
            <div className="container-x relative flex h-[var(--header-height)] shrink-0 items-center justify-between">
              <span className="font-display text-sm font-semibold tracking-[0.16em] text-gold uppercase">{t('menuTitle')}</span>
              <button
                type="button"
                data-autofocus
                aria-label={t('closeMenu')}
                onClick={close}
                className="glass inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:border-gold"
              >
                <X aria-hidden className="h-5 w-5" />
              </button>
            </div>

            <nav aria-label={t('primary')} className="container-x relative flex-1 pt-6 pb-10">
              <ul className="space-y-1">
                {flatNav.map((item, index) => {
                  const current = isActivePath(pathname, item.href);
                  return (
                    <motion.li
                      key={item.key}
                      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: reduceMotion ? 0 : 0.04 * index, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <Link
                        href={item.href}
                        aria-current={current ? 'page' : undefined}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'flex items-baseline gap-4 border-b border-line py-4 font-display text-2xl font-semibold transition-colors',
                          current ? 'text-gold' : 'text-white hover:text-gold',
                        )}
                      >
                        <span aria-hidden className="w-7 font-sans text-xs font-normal text-mist tabular-nums">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        {t(item.key)}
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
              <LanguageSwitcher className="mt-10 w-fit" onNavigate={() => setOpen(false)} />
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
