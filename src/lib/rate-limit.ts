interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export function rateLimit(key: string, opts: RateLimitOptions = { windowMs: 60_000, max: 60 }) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { success: true, remaining: opts.max - 1, resetAt: now + opts.windowMs };
  }

  if (entry.count >= opts.max) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { success: true, remaining: opts.max - entry.count, resetAt: entry.resetAt };
}

setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  },
  5 * 60 * 1000
).unref?.();
