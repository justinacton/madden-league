import { LeagueDataUnavailableError } from './api';

/**
 * Shared helpers for the JSON API routes under src/pages/api/*.ts.
 *
 * These are plain Astro server endpoints, not a separate Cloudflare Pages
 * Functions tree: @astrojs/cloudflare bundles the whole app into a single
 * `_worker.js`, and Cloudflare Pages ignores a project's `functions/`
 * directory whenever `_worker.js` is present. Implementing the read-only
 * API as Astro endpoints keeps it inside that same worker (still server-side
 * only, still never touching the browser) instead of silently not running.
 */

export function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
}

export function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function notFoundResponse(message = 'Not found.'): Response {
  return errorResponse(message, 404);
}

/** Wraps a route handler with consistent, credential-free error responses. */
export async function handleApi(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof LeagueDataUnavailableError) {
      return errorResponse('League data is temporarily unavailable.', 503);
    }
    return errorResponse('An unexpected error occurred.', 500);
  }
}

export function shouldBypassCache(request: Request): boolean {
  return new URL(request.url).searchParams.get('bypassCache') === '1';
}
