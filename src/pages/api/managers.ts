import type { APIRoute } from 'astro';
import { getManagerLeaderboard } from '../../lib/api';
import { handleApi, jsonResponse, shouldBypassCache } from '../../lib/apiResponse';
import { getRuntimeEnv } from '../../lib/envAstro';

export const GET: APIRoute = ({ request, locals }) =>
  handleApi(async () => {
    const env = getRuntimeEnv(locals);
    const managers = await getManagerLeaderboard(env, { bypassCache: shouldBypassCache(request) });
    return jsonResponse({ managers });
  });
