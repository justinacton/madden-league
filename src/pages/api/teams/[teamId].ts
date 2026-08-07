import type { APIRoute } from 'astro';
import { getSiteInfo, getTeamDetail } from '../../../lib/api';
import { errorResponse, handleApi, jsonResponse, notFoundResponse, shouldBypassCache } from '../../../lib/apiResponse';
import { getRuntimeEnv } from '../../../lib/envAstro';

// :teamId matches the Team's Slug (e.g. "chiefs"), consistent with /teams/[team-slug] on the site.
export const GET: APIRoute = ({ request, locals, params, url }) =>
  handleApi(async () => {
    const env = getRuntimeEnv(locals);
    const bypassCache = shouldBypassCache(request);
    const teamId = params.teamId!;
    const seasonId = url.searchParams.get('season') ?? (await getSiteInfo(env, { bypassCache })).activeSeasonId;
    if (!seasonId) return errorResponse('No seasons are available.', 400);

    const detail = await getTeamDetail(env, teamId, seasonId, { bypassCache });
    if (!detail) return notFoundResponse(`Team "${teamId}" was not found.`);
    return jsonResponse(detail);
  });
