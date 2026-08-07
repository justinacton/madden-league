import type { APIRoute } from 'astro';
import { getGameDetail } from '../../../lib/api';
import { handleApi, jsonResponse, notFoundResponse, shouldBypassCache } from '../../../lib/apiResponse';
import { getRuntimeEnv } from '../../../lib/envAstro';

export const GET: APIRoute = ({ request, locals, params }) =>
  handleApi(async () => {
    const env = getRuntimeEnv(locals);
    const gameId = params.gameId!;
    const detail = await getGameDetail(env, gameId, { bypassCache: shouldBypassCache(request) });
    if (!detail) return notFoundResponse(`Game "${gameId}" was not found.`);
    return jsonResponse(detail);
  });
