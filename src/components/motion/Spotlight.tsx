'use client';

import type { CSSProperties, PointerEvent, ReactNode } from 'react';

type Tag = 'div' | 'li' | 'article';

/**
 * Sets --mx/--my to the pointer position so `.card-glow` can paint a soft
 * spotlight. Purely decorative; no effect on touch or keyboard use.
 */
export function Spotlight({
  as = 'div',
  className,
  style,
  children,
}: {
  as?: Tag;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const Component = as as 'div';
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`);
  };
  return (
    <Component className={className} style={style} onPointerMove={onPointerMove}>
      {children}
    </Component>
  );
}
