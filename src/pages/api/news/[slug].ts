import type { APIRoute } from 'astro';
import { getNewsArticle } from '../../../lib/api';
import { handleApi, jsonResponse, notFoundResponse, shouldBypassCache } from '../../../lib/apiResponse';
import { getRuntimeEnv } from '../../../lib/envAstro';

export const GET: APIRoute = ({ request, locals, params }) =>
  handleApi(async () => {
    const env = getRuntimeEnv(locals);
    const slug = params.slug!;
    const article = await getNewsArticle(env, slug, { bypassCache: shouldBypassCache(request) });
    if (!article) return notFoundResponse(`Article "${slug}" was not found.`);
    return jsonResponse(article);
  });
