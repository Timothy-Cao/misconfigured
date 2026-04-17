export const PUBLIC_READ_CACHE_TTL_SECONDS = 60;
export const PUBLIC_READ_CACHE_TTL_MS = PUBLIC_READ_CACHE_TTL_SECONDS * 1000;

export function getPublicReadCacheHeaders(ttlSeconds = PUBLIC_READ_CACHE_TTL_SECONDS): HeadersInit {
  return {
    'Cache-Control': `public, s-maxage=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 5}`,
  };
}
