/**
 * Environment bindings, read explicitly and passed in rather than pulled from
 * `process.env` — Astro pages get them from `Astro.locals.runtime.env`
 * (Cloudflare adapter) and Pages Functions get them from `context.env`.
 */
export interface Env {
  USE_MOCK_DATA?: string;
  // Sanity — the live data source (src/lib/sanityTransform.ts).
  SANITY_PROJECT_ID?: string;
  SANITY_DATASET?: string;
  SANITY_API_VERSION?: string;
  SANITY_TOKEN?: string;
  // Airtable — superseded by Sanity. src/lib/airtable.ts and
  // airtableTransform.ts are kept but unused; nothing in api.ts calls them.
  AIRTABLE_TOKEN?: string;
  AIRTABLE_BASE_ID?: string;
  AIRTABLE_API_URL?: string;
}

/** Mock mode is opt-in only: anything other than the exact string "true" means use Sanity. */
export function isMockMode(env: Env): boolean {
  return env.USE_MOCK_DATA === 'true';
}
