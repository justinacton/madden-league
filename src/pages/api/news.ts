import type { APIRoute } from 'astro';
import { getNewsList } from '../../lib/api';
import { handleApi, jsonResponse, shouldBypassCache } from '../../lib/apiResponse';
import { getRuntimeEnv } from '../../lib/envAstro';

export const GET: APIRoute = ({ request, locals, url }) =>
  handleApi(async () => {
    const env = getRuntimeEnv(locals);
    const seasonId = url.searchParams.get('season') ?? undefined;
    const articles = await getNewsList(env, { seasonId }, { bypassCache: shouldBypassCache(request) });
    return jsonResponse({ articles });
  });
