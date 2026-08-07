import type { APIRoute } from 'astro';
import { getSeasons } from '../../lib/api';
import { handleApi, jsonResponse, shouldBypassCache } from '../../lib/apiResponse';
import { getRuntimeEnv } from '../../lib/envAstro';

export const GET: APIRoute = ({ request, locals }) =>
  handleApi(async () => {
    const env = getRuntimeEnv(locals);
    const seasons = await getSeasons(env, { bypassCache: shouldBypassCache(request) });
    return jsonResponse({ seasons });
  });
