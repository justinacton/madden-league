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
    // Always read Sanity's live API, not the CDN mirror (apicdn.sanity.io) —
    // the CDN is eventually-consistent and can lag edits by up to a couple
    // minutes, which stacks with our own edge cache below. This is a small,
    // low-traffic site, so the extra latency/cost of skipping the CDN is
    // negligible next to always showing current data.
    useCdn: false,
  });
}
