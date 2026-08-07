import type { APIRoute } from 'astro';
import { getSchedule, getSeason, getSiteInfo, type ScheduleFilters } from '../../lib/api';
import { errorResponse, handleApi, jsonResponse, notFoundResponse, shouldBypassCache } from '../../lib/apiResponse';
import { getRuntimeEnv } from '../../lib/envAstro';
import type { GameStatus, GameType } from '../../lib/types';

export const GET: APIRoute = ({ request, locals, url }) =>
  handleApi(async () => {
    const env = getRuntimeEnv(locals);
    const bypassCache = shouldBypassCache(request);
    const requestedSeasonId = url.searchParams.get('season');

    const seasonId = requestedSeasonId ?? (await getSiteInfo(env, { bypassCache })).activeSeasonId;
    if (!seasonId) return errorResponse('No seasons are available.', 400);

    const season = await getSeason(env, seasonId, { bypassCache });
    if (!season) return notFoundResponse(`Season "${seasonId}" was not found.`);

    const weekParam = url.searchParams.get('week');
    const filters: ScheduleFilters = {
      week: weekParam ? Number(weekParam) : undefined,
      teamId: url.searchParams.get('team') ?? undefined,
      managerId: url.searchParams.get('manager') ?? undefined,
      status: (url.searchParams.get('status') as GameStatus) ?? undefined,
      gameType: (url.searchParams.get('type') as GameType) ?? undefined,
    };

    const games = await getSchedule(env, season.id, filters, { bypassCache });
    return jsonResponse({ season: { id: season.id, name: season.name }, games, updatedAt: new Date().toISOString() });
  });
