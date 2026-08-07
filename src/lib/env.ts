/**
 * Environment bindings, read explicitly and passed in rather than pulled from
 * `process.env` — Astro pages get them from `Astro.locals.runtime.env`
 * (Cloudflare adapter) and Pages Functions get them from `context.env`.
 */
export interface Env {
  USE_MOCK_DATA?: string;
  AIRTABLE_TOKEN?: string;
  AIRTABLE_BASE_ID?: string;
  AIRTABLE_API_URL?: string;
}

/** Mock mode is opt-in only: anything other than the exact string "true" means use Airtable. */
export function isMockMode(env: Env): boolean {
  return env.USE_MOCK_DATA === 'true';
}
