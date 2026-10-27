// Fixed-window rate limiter. In-memory, so it protects a single instance only;
// a multi-instance deployment should swap the store for Redis/Upstash
// (see README → Production requirements).

type Bucket = { count: number; resetAt: number };

export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  check(key: string, now = Date.now()): { allowed: boolean; remaining: number; retryAfterMs: number } {
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      this.sweep(now);
      return { allowed: true, remaining: this.limit - 1, retryAfterMs: 0 };
    }
    if (bucket.count >= this.limit) {
      return { allowed: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
    }
    bucket.count += 1;
    return { allowed: true, remaining: this.limit - bucket.count, retryAfterMs: 0 };
  }

  private sweep(now: number) {
    if (this.buckets.size < 5000) return;
    for (const [key, bucket] of this.buckets) if (bucket.resetAt <= now) this.buckets.delete(key);
  }
}
