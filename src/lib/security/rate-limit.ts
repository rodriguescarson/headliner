/**
 * Fixed-window rate limiter keyed by client address. In-memory, so it is per server instance; on a
 * multi-instance deployment it bounds abuse per instance rather than globally, which is stated in the README.
 * Protects the Qloo quota and the model budget (OWASP A04, API4 unrestricted resource consumption).
 */
import { createHash } from "node:crypto";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): RateLimitResult {
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) prune(now);
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }
  b.count += 1;
  return {
    allowed: b.count <= limit,
    remaining: Math.max(0, limit - b.count),
    resetInSeconds: Math.ceil((b.resetAt - now) / 1000),
  };
}

function prune(now: number) {
  for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
}

/** Client address from the platform's forwarding headers, hashed so logs never hold a raw IP. */
export function clientKey(request: Request, scope: string): string {
  const fwd = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = fwd || request.headers.get("x-real-ip") || "unknown";
  return `${scope}:${createHash("sha256").update(ip).digest("hex").slice(0, 16)}`;
}

/** For tests. */
export function resetRateLimits() {
  buckets.clear();
}
