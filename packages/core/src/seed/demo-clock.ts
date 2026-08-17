import type { Clock } from '../util/clock.js';

/**
 * Clock used by the demo environment.
 *
 * Seed data is written at back-dated instants so the demo shows a network with
 * history rather than one where everything happened in the same millisecond.
 * Each read advances by a small step so ordering stays stable and unique.
 */
export class DemoClock implements Clock {
  private current: number;

  constructor(start: string, private readonly stepMs = 1000) {
    this.current = new Date(start).getTime();
  }

  now(): Date {
    const value = new Date(this.current);
    this.current += this.stepMs;
    return value;
  }

  isoNow(): string {
    return this.now().toISOString();
  }

  set(instant: string | Date): void {
    this.current = (typeof instant === 'string' ? new Date(instant) : instant).getTime();
  }

  peek(): string {
    return new Date(this.current).toISOString();
  }
}
