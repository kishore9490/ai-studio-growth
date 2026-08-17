/**
 * Clock abstraction. Every timestamp in the domain flows through a Clock so
 * that demo mode, tests and back-dated seed data are reproducible.
 */
export interface Clock {
  now(): Date;
  isoNow(): string;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
  isoNow(): string {
    return new Date().toISOString();
  }
}

/** Clock pinned to a fixed instant; advanceable. Used by seeds and tests. */
export class FixedClock implements Clock {
  private current: Date;

  constructor(instant: Date | string) {
    this.current = typeof instant === 'string' ? new Date(instant) : instant;
  }

  now(): Date {
    return new Date(this.current.getTime());
  }

  isoNow(): string {
    return this.current.toISOString();
  }

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

export const DAY_MS = 24 * 60 * 60 * 1000;

export function addDays(date: Date | string, days: number): string {
  const base = typeof date === 'string' ? new Date(date) : date;
  return new Date(base.getTime() + days * DAY_MS).toISOString();
}

export function daysBetween(from: Date | string, to: Date | string): number {
  const a = typeof from === 'string' ? new Date(from) : from;
  const b = typeof to === 'string' ? new Date(to) : to;
  return Math.floor((b.getTime() - a.getTime()) / DAY_MS);
}

export function isBefore(a: string, b: string): boolean {
  return new Date(a).getTime() < new Date(b).getTime();
}
