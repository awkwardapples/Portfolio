/**
 * Per-client rate limit (spec Q.2; ported from the plugin's RateLimiter):
 * a fixed window, 5 per hour by default. `check` never counts; `record` is
 * called only for submissions that pass every bot check, and keeps the
 * window's original expiry while the count advances. An expired window
 * counts as no window.
 *
 * The key is an HMAC-SHA-256 of CF-Connecting-IP with a secret salt, so the
 * raw address is never stored (spec Q.2).
 */
export interface RateLimitEntry {
  count: number;
  /** Unix seconds. */
  expiresAt: number;
}

export interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | null>;
  put(key: string, entry: RateLimitEntry): Promise<void>;
}

export type RateLimitCheck =
  | { allowed: true; remaining: number }
  | { allowed: false; remaining: 0; retryAfterSeconds: number };

export const HOUR_SECONDS = 3600;

export class RateLimiter {
  constructor(
    private readonly store: RateLimitStore,
    private readonly limit: number,
    private readonly windowSeconds = HOUR_SECONDS,
    private readonly now: () => number = () => Math.floor(Date.now() / 1000),
  ) {}

  private async read(key: string): Promise<RateLimitEntry | null> {
    const entry = await this.store.get(key);
    if (entry === null || entry.expiresAt <= this.now()) return null;
    return entry;
  }

  async check(key: string): Promise<RateLimitCheck> {
    const entry = await this.read(key);
    if (entry === null) return { allowed: true, remaining: this.limit };
    if (entry.count < this.limit) return { allowed: true, remaining: this.limit - entry.count };
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(0, entry.expiresAt - this.now()),
    };
  }

  async record(key: string): Promise<void> {
    const entry = await this.read(key);
    if (entry === null) {
      await this.store.put(key, { count: 1, expiresAt: this.now() + this.windowSeconds });
      return;
    }
    await this.store.put(key, { count: entry.count + 1, expiresAt: entry.expiresAt });
  }
}

/** The rate-limit key for a client address: hex HMAC-SHA-256 with the salt. */
export async function clientKey(ip: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(salt),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(ip));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
