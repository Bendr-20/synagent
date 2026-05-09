type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: string;
};

const DEFAULT_LIMIT = 5;
const DEFAULT_WINDOW_MS = 10 * 60 * 1000;
const buckets = new Map<string, RateLimitBucket>();

export function checkRateLimit(
  key: string,
  options: { limit?: number; windowMs?: number; now?: number } = {},
): RateLimitResult {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const now = options.now ?? Date.now();
  const normalizedKey = key || "unknown";
  const existing = buckets.get(normalizedKey);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(normalizedKey, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      resetAt: new Date(resetAt).toISOString(),
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(existing.resetAt).toISOString(),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    resetAt: new Date(existing.resetAt).toISOString(),
  };
}
