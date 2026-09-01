import type { Env } from './env';

interface LocalsWithRuntime {
  runtime?: { env?: Env };
}

/**
 * Resolves environment bindings for an Astro page/endpoint. Prefers the
 * Cloudflare adapter's `Astro.locals.runtime.env` (available in `astro dev`
 * via the platform proxy, and in production); falls back to Vite's
 * `import.meta.env` so plain `astro dev` without wrangler still works.
 */
export function getRuntimeEnv(locals: unknown): Env {
  const runtimeEnv = (locals as LocalsWithRuntime | undefined)?.runtime?.env;
  if (runtimeEnv) return runtimeEnv;

  const meta = import.meta.env as unknown as Env;
  return {
    USE_MOCK_DATA: meta.USE_MOCK_DATA,
    AIRTABLE_TOKEN: meta.AIRTABLE_TOKEN,
    AIRTABLE_BASE_ID: meta.AIRTABLE_BASE_ID,
    AIRTABLE_API_URL: meta.AIRTABLE_API_URL,
    SANITY_PROJECT_ID: meta.SANITY_PROJECT_ID,
    SANITY_DATASET: meta.SANITY_DATASET,
    SANITY_API_VERSION: meta.SANITY_API_VERSION,
    SANITY_TOKEN: meta.SANITY_TOKEN,
  };
}
