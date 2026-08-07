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

export function isMockMode(env: Env): boolean {
  if (env.USE_MOCK_DATA === 'true') return true;
  if (env.USE_MOCK_DATA === 'false') return Boolean(env.AIRTABLE_TOKEN && env.AIRTABLE_BASE_ID) ? false : true;
  // No explicit flag: fall back to mock data unless real Airtable credentials are present.
  return !env.AIRTABLE_TOKEN || !env.AIRTABLE_BASE_ID;
}
