'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import type { SceneKind } from './engine';

const INTERACTIONS = ['pointermove', 'pointerdown', 'touchstart', 'scroll', 'keydown', 'wheel'] as const;

declare global {
  interface Window {
    /** Test hook: allow software WebGL renderers (automated browsers have no GPU). */
    __allowSoftware3D?: boolean;
  }
}

/**
 * Decorative WebGL scene. three.js is downloaded and started only after the
 * visitor's first interaction, so it never competes with page load. Nothing
 * visible changes (the CSS backdrop remains) if WebGL is unavailable or only
 * a software renderer exists; a single still frame is drawn when the visitor
 * prefers reduced motion.
 */
export function Scene3D({ kind, anchorId, className }: { kind: SceneKind; anchorId?: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cleanup: (() => void) | null = null;
    let cancelled = false;

    const load = async () => {
      const { mountScene } = await import('./engine');
      if (cancelled) return;
      cleanup = mountScene(canvas, {
        kind,
        anchor: anchorId ? document.getElementById(anchorId) : null,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        allowSoftwareRenderer: window.__allowSoftware3D === true,
        onFirstFrame: () => !cancelled && setReady(true),
      });
    };

    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 120));
    let started = false;
    const onFirstInteraction = () => {
      if (started) return;
      started = true;
      for (const type of INTERACTIONS) window.removeEventListener(type, onFirstInteraction);
      idle(() => void load(), { timeout: 600 });
    };
    for (const type of INTERACTIONS) window.addEventListener(type, onFirstInteraction, { passive: true });

    return () => {
      cancelled = true;
      for (const type of INTERACTIONS) window.removeEventListener(type, onFirstInteraction);
      cleanup?.();
    };
  }, [kind, anchorId]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn('pointer-events-none block h-full w-full transition-opacity duration-[1400ms]', ready ? 'opacity-100' : 'opacity-0', className)}
    />
  );
}
