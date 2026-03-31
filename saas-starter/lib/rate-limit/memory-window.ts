/**
 * Best-effort in-process rate limit (single Node instance). For multi-instance
 * production, swap for Redis / Upstash (INTEGRATION_PLAN §3.8).
 */

type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

export function memoryWindowRateLimit(
  key: string,
  maxPerWindow: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  let b = store.get(key);
  if (!b || now > b.resetAt) {
    b = { count: 0, resetAt: now + windowMs };
    store.set(key, b);
  }
  if (b.count >= maxPerWindow) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000))
    };
  }
  b.count += 1;
  return { ok: true };
}

export function webhookRateLimitWindowMs(): number {
  return 60_000;
}

export function webhookRateLimitMax(): number {
  const raw = process.env.WEBHOOK_RATE_LIMIT_PER_MINUTE?.trim();
  const n = raw ? parseInt(raw, 10) : 120;
  return Number.isFinite(n) && n > 0 ? n : 120;
}
