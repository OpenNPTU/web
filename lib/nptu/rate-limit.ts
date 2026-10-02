// Token-bucket limiter for the pre-auth upstream endpoints (login attempt
// creation, login submit, captcha relay). Each of those turns one cheap
// local request into several requests against the school server, so
// unauthenticated abuse would otherwise make NPTUweb an amplifier.
//
// Personal-scale: in-memory buckets on globalThis (shared across the
// server-action and route-handler bundles), keyed per IP. A burst allowance
// keeps normal humans — and React StrictMode's double-mounted login panel —
// unaffected; the refill pace (one token per interval) is what throttles
// scripts.

const REFILL_MS = 3_000;

type Bucket = { tokens: number; last: number };

const globalScope = globalThis as typeof globalThis & {
  __nptuRateBuckets?: Map<string, Bucket>;
};

function buckets(): Map<string, Bucket> {
  globalScope.__nptuRateBuckets ??= new Map<string, Bucket>();
  return globalScope.__nptuRateBuckets;
}

/** True when the request may proceed; consumes one token otherwise not. */
export function allow(bucket: string, ip: string, burst = 3): boolean {
  const map = buckets();
  if (map.size > 4096) map.clear(); // entries are tiny; crude bound is fine

  const key = `${bucket}|${ip}`;
  const now = Date.now();
  const entry = map.get(key) ?? { tokens: burst, last: now };
  const tokens = Math.min(
    burst,
    entry.tokens + Math.floor((now - entry.last) / REFILL_MS),
  );

  if (tokens < 1) {
    // Keep `last` so accrued refill time is preserved for the next try.
    map.set(key, { tokens, last: entry.last });
    return false;
  }
  map.set(key, { tokens: tokens - 1, last: now });
  return true;
}

/** Best-effort client identity: first XFF hop, else a shared local key. */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
  );
}
