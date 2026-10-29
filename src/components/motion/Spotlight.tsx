'use client';

import type { CSSProperties, PointerEvent, ReactNode } from 'react';

type Tag = 'div' | 'li' | 'article';

const MAX_TILT = 7; // degrees

/**
 * 3D tilt card: rotates toward the pointer in perspective and sets --mx/--my
 * so `.card-glow` / `.card-soft` can paint a glare. Mouse only; disabled when
 * the visitor prefers reduced motion. Purely decorative.
 */
export function Spotlight({
  as = 'div',
  className,
  style,
  children,
  tilt = true,
}: {
  as?: Tag;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  tilt?: boolean;
}) {
  const Component = as as 'div';

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    el.style.setProperty('--mx', `${x * rect.width}px`);
    el.style.setProperty('--my', `${y * rect.height}px`);
    if (tilt && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.transform = `perspective(1000px) rotateX(${(0.5 - y) * MAX_TILT}deg) rotateY(${(x - 0.5) * MAX_TILT}deg) translate3d(0, -4px, 0)`;
    }
  };

  const onPointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.transform = '';
  };

  return (
    <Component
      className={className}
      style={{ ...style, transformStyle: 'preserve-3d', willChange: 'transform' }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </Component>
  );
}
