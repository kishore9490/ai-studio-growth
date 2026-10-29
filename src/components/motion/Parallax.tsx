'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef, type ReactNode } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

/**
 * Restrained parallax for decorative layers only. Disabled on touch devices,
 * small screens and when reduced motion is requested.
 */
export function Parallax({ children, offset = 40, className }: { children?: ReactNode; offset?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const finePointer = useMediaQuery('(pointer: fine) and (min-width: 768px)');
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);
  const enabled = finePointer && !reduceMotion;

  return (
    <motion.div ref={ref} aria-hidden className={className} style={enabled ? { y } : undefined}>
      {children}
    </motion.div>
  );
}
