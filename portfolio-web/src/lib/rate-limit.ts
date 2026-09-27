type Bucket = { count: number; resetAt: number };

export type RateLimitRule = { limit: number; windowMs: number };
export type RateLimitResult = { ok: boolean; retryAfterSec: number };

const MAX_BUCKETS = 10_000;
const buckets = new Map<string, Bucket>();

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size > MAX_BUCKETS) buckets.clear();
}

/** Fixed-window limiter (in-memory, per process). Counts every call. */
export function rateLimit(key: string, rule: RateLimitRule, now = Date.now()): RateLimitResult {
  if (buckets.size > MAX_BUCKETS) prune(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  existing.count += 1;
  if (existing.count > rule.limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  return { ok: true, retryAfterSec: 0 };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}

/** Behind nginx the last X-Forwarded-For hop is the one nginx appended (not client-spoofable). */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export const LOGIN_IP_RULE: RateLimitRule = { limit: 30, windowMs: 15 * 60_000 };
export const LOGIN_ACCOUNT_RULE: RateLimitRule = { limit: 8, windowMs: 15 * 60_000 };
