import type { APIRoute } from 'astro';
import { getSiteInfo } from '../../lib/api';
import { handleApi, jsonResponse, shouldBypassCache } from '../../lib/apiResponse';
import { getRuntimeEnv } from '../../lib/envAstro';

export const GET: APIRoute = ({ request, locals }) =>
  handleApi(async () => {
    const env = getRuntimeEnv(locals);
    const site = await getSiteInfo(env, { bypassCache: shouldBypassCache(request) });
    return jsonResponse(site);
  });
