'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Horizontally scrolling, scroll-snapped list. Scrollable by touch, trackpad,
 * keyboard (the region is focusable) and the previous/next buttons.
 */
export function Rail({
  label,
  previousLabel,
  nextLabel,
  children,
  className,
}: {
  label: string;
  previousLabel: string;
  nextLabel: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLOListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const frame = requestAnimationFrame(update);
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [update]);

  const scrollBy = (direction: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });
  };

  const button =
    'inline-flex h-12 w-12 items-center justify-center rounded-full border border-line-dark bg-white text-ink transition-[background-color,color,opacity] duration-300 hover:bg-navy hover:text-white disabled:opacity-35 disabled:hover:bg-white disabled:hover:text-ink';

  return (
    <div className={className}>
      <ol ref={ref} className="rail" tabIndex={0} aria-label={label}>
        {children}
      </ol>
      <div className="container-x mt-6 flex justify-end gap-3">
        <button type="button" className={button} onClick={() => scrollBy(-1)} disabled={edges.start} aria-label={previousLabel}>
          <ArrowLeft aria-hidden className="h-5 w-5" />
        </button>
        <button type="button" className={cn(button)} onClick={() => scrollBy(1)} disabled={edges.end} aria-label={nextLabel}>
          <ArrowRight aria-hidden className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
