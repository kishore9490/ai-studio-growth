'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react';

type RevealTag = 'div' | 'li' | 'section' | 'article' | 'header';

/**
 * Scroll reveal. Content is rendered visible on the server and stays visible
 * without JavaScript. On the client, only elements that start below the fold
 * are hidden and then revealed by an IntersectionObserver. Disabled entirely
 * when the user prefers reduced motion.
 */
export function Reveal({
  as = 'div',
  delay = 0,
  className,
  style,
  children,
  id,
}: {
  as?: RevealTag;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // The observer's first callback reports the initial position without
    // forcing a synchronous layout: elements already in view stay as they
    // are; elements below the fold are hidden until they scroll into view.
    let first = true;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (first) {
          first = false;
          if (visible) {
            observer.disconnect();
            return;
          }
          el.dataset.reveal = 'hidden';
          return;
        }
        if (visible) {
          el.dataset.reveal = 'shown';
          observer.disconnect();
        }
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (el.dataset.reveal === 'hidden') el.dataset.reveal = 'shown';
    };
  }, []);

  // All supported tags share HTMLElement semantics; typed as div for JSX.
  const Tag = as as 'div';
  return (
    <Tag
      ref={ref as RefObject<HTMLDivElement>}
      id={id}
      className={className}
      style={{ ...style, '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
