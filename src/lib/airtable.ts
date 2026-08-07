import type { Env } from './env';

/**
 * Minimal fetch-based Airtable REST client — intentionally no SDK dependency.
 * Only ever imported from server-side code (src/lib/api.ts, functions/api/*.ts).
 */

export class AirtableError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'AirtableError';
  }
}

export interface AirtableRecord<F = Record<string, unknown>> {
  id: string;
  createdTime: string;
  fields: F;
}

interface AirtableListResponse<F> {
  records: AirtableRecord<F>[];
  offset?: string;
}

function requireConfig(env: Env): { token: string; baseId: string; apiUrl: string } {
  const token = env.AIRTABLE_TOKEN;
  const baseId = env.AIRTABLE_BASE_ID;
  const apiUrl = env.AIRTABLE_API_URL || 'https://api.airtable.com/v0';
  if (!token || !baseId) {
    throw new AirtableError('Airtable is not configured (missing AIRTABLE_TOKEN or AIRTABLE_BASE_ID)', 500);
  }
  return { token, baseId, apiUrl };
}

/** Fetches every record from an Airtable table, following pagination automatically. */
export async function listAllRecords<F = Record<string, unknown>>(
  env: Env,
  tableName: string
): Promise<AirtableRecord<F>[]> {
  const { token, baseId, apiUrl } = requireConfig(env);
  const records: AirtableRecord<F>[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`${apiUrl}/${baseId}/${encodeURIComponent(tableName)}`);
    url.searchParams.set('pageSize', '100');
    if (offset) url.searchParams.set('offset', offset);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new AirtableError(
        `Airtable request to "${tableName}" failed with status ${response.status}`,
        response.status
      );
    }

    const body = (await response.json()) as AirtableListResponse<F>;
    records.push(...body.records);
    offset = body.offset;
  } while (offset);

  return records;
}

export const AIRTABLE_TABLES = {
  seasons: 'Seasons',
  managers: 'Managers',
  teams: 'Teams',
  seasonEntries: 'Season Entries',
  games: 'Games',
  playerStats: 'Player Stats',
  news: 'News',
} as const;
