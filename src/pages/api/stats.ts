import type { APIRoute } from 'astro';
import type { DefenseCategory } from '../../lib/calculations';
import {
  getDefenseStats,
  getManagerLeaderboard,
  getManagerSeasonStats,
  getPassingStats,
  getReceivingStats,
  getRushingStats,
  getSiteInfo,
  getTeamStats,
} from '../../lib/api';
import { errorResponse, handleApi, jsonResponse, shouldBypassCache } from '../../lib/apiResponse';
import { getRuntimeEnv } from '../../lib/envAstro';

const VALID_CATEGORIES = ['passing', 'rushing', 'receiving', 'defense', 'team', 'manager'] as const;

export const GET: APIRoute = ({ request, locals, url }) =>
  handleApi(async () => {
    const env = getRuntimeEnv(locals);
    const bypassCache = shouldBypassCache(request);
    const category = (url.searchParams.get('category') ?? 'passing') as (typeof VALID_CATEGORIES)[number];
    if (!VALID_CATEGORIES.includes(category)) {
      return errorResponse(`Invalid category. Expected one of: ${VALID_CATEGORIES.join(', ')}.`, 400);
    }

    const seasonId = url.searchParams.get('season') ?? (await getSiteInfo(env, { bypassCache })).activeSeasonId;
    if (!seasonId) return errorResponse('No seasons are available.', 400);

    const opts = { bypassCache };
    switch (category) {
      case 'passing':
        return jsonResponse({ seasonId, category, leaders: await getPassingStats(env, seasonId, opts) });
      case 'rushing':
        return jsonResponse({ seasonId, category, leaders: await getRushingStats(env, seasonId, opts) });
      case 'receiving':
        return jsonResponse({ seasonId, category, leaders: await getReceivingStats(env, seasonId, opts) });
      case 'defense': {
        const sub = (url.searchParams.get('sub') ?? 'sacks') as DefenseCategory;
        return jsonResponse({ seasonId, category, subCategory: sub, leaders: await getDefenseStats(env, seasonId, sub, opts) });
      }
      case 'team':
        return jsonResponse({ seasonId, category, leaders: await getTeamStats(env, seasonId, opts) });
      case 'manager': {
        const mode = url.searchParams.get('mode') === 'career' ? 'career' : 'season';
        const leaders = mode === 'career' ? await getManagerLeaderboard(env, opts) : await getManagerSeasonStats(env, seasonId, opts);
        return jsonResponse({ seasonId, category, mode, leaders });
      }
    }
  });
