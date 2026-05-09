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
const MAX_BUCKETS = 500;
const UNKNOWN_CLIENT_KEY = "unknown";
const buckets = new Map<string, RateLimitBucket>();

function isValidIpv4(value: string) {
  const parts = value.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const octet = Number(part);
    return octet >= 0 && octet <= 255 && String(octet) === part.replace(/^0+(?=\d)/, "");
  });
}

function isLikelyIpv6(value: string) {
  if (!value.includes(":")) return false;
  if (value.length > 45) return false;
  if (!/^[0-9a-f:.]+$/i.test(value)) return false;
  const groups = value.split(":");
  return groups.length >= 3 && groups.length <= 9 && groups.some(Boolean);
}

export function normalizeRateLimitKey(key: string | null | undefined) {
  const firstToken = (key || "").split(",")[0]?.trim().toLowerCase() || "";
  const stripped = firstToken.replace(/^['"]|['"]$/g, "").replace(/^\[(.*)\]$/, "$1").split("%")[0];

  if (!stripped) return UNKNOWN_CLIENT_KEY;
  if (isValidIpv4(stripped) || isLikelyIpv6(stripped)) return stripped;
  return UNKNOWN_CLIENT_KEY;
}

function pruneBuckets(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function capBuckets() {
  while (buckets.size >= MAX_BUCKETS) {
    let oldestKey: string | null = null;
    let oldestResetAt = Number.POSITIVE_INFINITY;

    for (const [key, bucket] of buckets) {
      if (bucket.resetAt < oldestResetAt) {
        oldestKey = key;
        oldestResetAt = bucket.resetAt;
      }
    }

    if (!oldestKey) break;
    buckets.delete(oldestKey);
  }
}

export function checkRateLimit(
  key: string,
  options: { limit?: number; windowMs?: number; now?: number } = {},
): RateLimitResult {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const now = options.now ?? Date.now();
  const normalizedKey = normalizeRateLimitKey(key);

  pruneBuckets(now);

  const existing = buckets.get(normalizedKey);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    if (!existing) capBuckets();
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
