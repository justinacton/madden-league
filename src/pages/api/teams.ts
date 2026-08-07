import type { APIRoute } from 'astro';
import { getSiteInfo, getTeamsForSeason } from '../../lib/api';
import { errorResponse, handleApi, jsonResponse, shouldBypassCache } from '../../lib/apiResponse';
import { getRuntimeEnv } from '../../lib/envAstro';

export const GET: APIRoute = ({ request, locals, url }) =>
  handleApi(async () => {
    const env = getRuntimeEnv(locals);
    const bypassCache = shouldBypassCache(request);
    const seasonId = url.searchParams.get('season') ?? (await getSiteInfo(env, { bypassCache })).activeSeasonId;
    if (!seasonId) return errorResponse('No seasons are available.', 400);

    const teams = await getTeamsForSeason(env, seasonId, { bypassCache });
    return jsonResponse({ seasonId, teams });
  });
