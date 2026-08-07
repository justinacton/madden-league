/**
 * Thin wrapper around the Cloudflare `caches.default` edge cache. Falls back
 * to calling `fetcher` directly (no caching) when the Cache API isn't
 * available, e.g. plain `astro dev` without the Cloudflare runtime.
 */

export interface CacheOptions {
  /** How long a fresh copy is served without re-fetching. */
  ttlSeconds: number;
  /** How long a stale copy is kept around to serve if the live fetch fails. */
  staleTtlSeconds: number;
  /** Skips the cache read (still writes a fresh copy) — used by ?bypassCache=1 in development. */
  bypass?: boolean;
}

export interface CacheResult<T> {
  data: T;
  stale: boolean;
  fromCache: boolean;
}

function getEdgeCache(): Cache | undefined {
  // Cast rather than rely on the ambient `CacheStorage` type: it differs
  // between lib.dom.d.ts and @cloudflare/workers-types, and only the
  // Cloudflare Workers runtime actually exposes a `.default` cache.
  const globalCaches = (globalThis as unknown as { caches?: { default: Cache } }).caches;
  return globalCaches?.default;
}

export async function getOrFetchWithCache<T>(
  cacheKey: string,
  options: CacheOptions,
  fetcher: () => Promise<T>
): Promise<CacheResult<T>> {
  const cache = getEdgeCache();
  const freshRequest = new Request(`https://madden-league.internal/cache/${cacheKey}`);
  const staleRequest = new Request(`https://madden-league.internal/cache/${cacheKey}-stale`);

  if (cache && !options.bypass) {
    const cached = await cache.match(freshRequest);
    if (cached) {
      const data = (await cached.json()) as T;
      return { data, stale: false, fromCache: true };
    }
  }

  try {
    const data = await fetcher();
    if (cache) {
      const payload = JSON.stringify(data);
      const freshResponse = new Response(payload, {
        headers: { 'Cache-Control': `public, max-age=${options.ttlSeconds}`, 'Content-Type': 'application/json' },
      });
      const staleResponse = new Response(payload, {
        headers: { 'Cache-Control': `public, max-age=${options.staleTtlSeconds}`, 'Content-Type': 'application/json' },
      });
      await Promise.all([cache.put(freshRequest, freshResponse), cache.put(staleRequest, staleResponse)]);
    }
    return { data, stale: false, fromCache: false };
  } catch (error) {
    if (cache) {
      const staleCached = await cache.match(staleRequest);
      if (staleCached) {
        const data = (await staleCached.json()) as T;
        return { data, stale: true, fromCache: true };
      }
    }
    throw error;
  }
}
