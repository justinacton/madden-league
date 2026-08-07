import type { APIRoute } from 'astro';
import { getManagerDetail } from '../../../lib/api';
import { handleApi, jsonResponse, notFoundResponse, shouldBypassCache } from '../../../lib/apiResponse';
import { getRuntimeEnv } from '../../../lib/envAstro';

// :managerId matches the Manager's Slug (e.g. "sam-chen"), consistent with /managers/[manager-slug] on the site.
export const GET: APIRoute = ({ request, locals, params }) =>
  handleApi(async () => {
    const env = getRuntimeEnv(locals);
    const managerId = params.managerId!;
    const detail = await getManagerDetail(env, managerId, { bypassCache: shouldBypassCache(request) });
    if (!detail) return notFoundResponse(`Manager "${managerId}" was not found.`);
    return jsonResponse(detail);
  });
