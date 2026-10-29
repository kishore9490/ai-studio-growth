'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Locale } from '@/i18n/routing';
import type { MediaItem } from '@/content/schema';

/**
 * Responsive image grid with an accessible lightbox dialog:
 * focus moves into the dialog and is contained while it is open, arrow keys
 * navigate, Escape closes, and focus returns to the thumbnail that opened it.
 */
export function Gallery({ items }: { items: MediaItem[] }) {
  const t = useTranslations('media');
  const locale = useLocale() as Locale;
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState<number | null>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastIndex = useRef(0);

  const close = useCallback(() => {
    setIndex(null);
    triggerRefs.current[lastIndex.current]?.focus();
  }, []);

  const step = useCallback(
    (delta: number) => setIndex((current) => (current === null ? null : (current + delta + items.length) % items.length)),
    [items.length],
  );

  useEffect(() => {
    if (index === null) return;
    lastIndex.current = index;
  }, [index]);

  const open = index !== null;

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'ArrowRight') {
        step(1);
      } else if (event.key === 'ArrowLeft') {
        step(-1);
      } else if (event.key === 'Tab' && dialog) {
        const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button'));
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
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close, step]);

  const active = index !== null ? items[index] : undefined;

  return (
    <>
      <ul className="columns-1 gap-5 sm:columns-2 lg:columns-3">
        {items.map((item, i) => (
          <li key={item.id} className="mb-5 break-inside-avoid">
            <figure>
              <button
                type="button"
                ref={(el) => {
                  triggerRefs.current[i] = el;
                }}
                onClick={() => {
                  lastIndex.current = i;
                  setIndex(i);
                }}
                aria-label={t('open', { alt: item.alt[locale] })}
                aria-haspopup="dialog"
                className="group block w-full overflow-hidden rounded-[var(--radius-lg)] border border-line-dark bg-navy"
              >
                <Image
                  src={item.src}
                  alt=""
                  width={item.width}
                  height={item.height}
                  loading="lazy"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  unoptimized={item.src.endsWith('.svg')}
                  className="h-auto w-full transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.03]"
                />
              </button>
              {(item.caption || item.date) && (
                <figcaption className="mt-3 text-sm text-ink-muted">
                  {item.caption?.[locale]}
                  {item.date && <span className="block text-xs">{item.date}</span>}
                </figcaption>
              )}
            </figure>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {active && index !== null && (
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('dialogLabel')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25 }}
            className="fixed inset-0 z-[70] flex flex-col bg-midnight/95 text-white backdrop-blur-sm"
            onClick={(event) => event.target === event.currentTarget && close()}
          >
            <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
              <p className="text-sm text-mist" aria-live="polite">
                {t('counter', { current: index + 1, total: items.length })}
              </p>
              <button
                type="button"
                data-autofocus
                onClick={close}
                aria-label={t('close')}
                className="glass inline-flex h-11 w-11 items-center justify-center rounded-full hover:border-gold"
              >
                <X aria-hidden className="h-5 w-5" />
              </button>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20">
              <motion.figure
                key={active.id}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex max-h-full flex-col items-center"
              >
                <Image
                  src={active.src}
                  alt={active.alt[locale]}
                  width={active.width}
                  height={active.height}
                  sizes="90vw"
                  unoptimized={active.src.endsWith('.svg')}
                  className="max-h-[72vh] w-auto rounded-lg object-contain"
                />
                <figcaption className="mt-4 max-w-2xl text-center text-sm text-mist">
                  {active.caption?.[locale]}
                  <span className="mt-1 block text-xs">
                    {t('credit')}: {active.credit}
                  </span>
                </figcaption>
              </motion.figure>
              {items.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label={t('previous')}
                    className="glass absolute top-1/2 left-2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full hover:border-gold sm:left-6"
                  >
                    <ChevronLeft aria-hidden className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label={t('next')}
                    className="glass absolute top-1/2 right-2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full hover:border-gold sm:right-6"
                  >
                    <ChevronRight aria-hidden className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
