import { createClient, type SanityClient } from '@sanity/client';
import type { Env } from './env';

/**
 * Minimal Sanity client factory — mirrors src/lib/airtable.ts's role for the
 * Airtable path. Only ever imported from server-side code.
 */

export class SanityConfigError extends Error {}

export function getSanityClient(env: Env): SanityClient {
  const projectId = env.SANITY_PROJECT_ID;
  const dataset = env.SANITY_DATASET || 'production';
  if (!projectId) {
    throw new SanityConfigError('Sanity is not configured (missing SANITY_PROJECT_ID)');
  }
  return createClient({
    projectId,
    dataset,
    apiVersion: env.SANITY_API_VERSION || '2024-01-01',
    token: env.SANITY_TOKEN,
    // No SANITY_TOKEN means an unauthenticated read — fine for a public
    // dataset with published documents only (no drafts).
    useCdn: !env.SANITY_TOKEN,
  });
}
