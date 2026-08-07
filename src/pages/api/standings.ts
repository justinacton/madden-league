import type { APIRoute } from 'astro';
import { getSeason, getSiteInfo, getStandings } from '../../lib/api';
import { errorResponse, handleApi, jsonResponse, notFoundResponse, shouldBypassCache } from '../../lib/apiResponse';
import { getRuntimeEnv } from '../../lib/envAstro';

export const GET: APIRoute = ({ request, locals, url }) =>
  handleApi(async () => {
    const env = getRuntimeEnv(locals);
    const bypassCache = shouldBypassCache(request);
    const requestedSeasonId = url.searchParams.get('season');

    const seasonId = requestedSeasonId ?? (await getSiteInfo(env, { bypassCache })).activeSeasonId;
    if (!seasonId) return errorResponse('No seasons are available.', 400);

    const season = await getSeason(env, seasonId, { bypassCache });
    if (!season) return notFoundResponse(`Season "${seasonId}" was not found.`);

    const standings = await getStandings(env, season.id, { bypassCache });
    return jsonResponse({
      season: { id: season.id, name: season.name, status: season.status, currentWeek: season.currentWeek },
      standings,
      updatedAt: new Date().toISOString(),
    });
  });
