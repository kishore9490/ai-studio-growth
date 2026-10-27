import "server-only";
import { RateLimiter } from "@/lib/domain/rate-limit";

const g = globalThis as unknown as { __lifeosLimiters?: Record<string, RateLimiter> };
g.__lifeosLimiters ??= {
  signIn: new RateLimiter(8, 10 * 60 * 1000),
  signUp: new RateLimiter(5, 60 * 60 * 1000),
  passwordReset: new RateLimiter(5, 60 * 60 * 1000),
  checkout: new RateLimiter(20, 10 * 60 * 1000),
  writing: new RateLimiter(30, 10 * 60 * 1000),
  contact: new RateLimiter(5, 60 * 60 * 1000),
  payout: new RateLimiter(5, 60 * 60 * 1000),
  webhook: new RateLimiter(300, 60 * 1000),
};

export const limiters = g.__lifeosLimiters;

export function retryMessage(ms: number) {
  const minutes = Math.max(1, Math.ceil(ms / 60000));
  return `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
