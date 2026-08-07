import type { APIRoute } from 'astro';
import { getLeagueDataset } from '../lib/api';
import { getRuntimeEnv } from '../lib/envAstro';

export const GET: APIRoute = async ({ locals, site, url }) => {
  const env = getRuntimeEnv(locals);
  const origin = site?.toString().replace(/\/$/, '') ?? url.origin;

  const staticPaths = ['/', '/managers', '/news', '/rules'];
  let urls = [...staticPaths];

  try {
    const { data } = await getLeagueDataset(env);
    const publicSeasons = data.seasons.filter((s) => s.public);
    for (const season of publicSeasons) {
      urls.push(`/seasons/${season.id}/standings`);
      urls.push(`/seasons/${season.id}/schedule`);
      urls.push(`/seasons/${season.id}/teams`);
      urls.push(`/seasons/${season.id}/stats`);
    }
    for (const team of data.teams) {
      urls.push(`/teams/${team.slug}`);
    }
    for (const manager of data.managers) {
      urls.push(`/managers/${manager.slug}`);
    }
    for (const article of data.news.filter((n) => n.status === 'Published')) {
      urls.push(`/news/${article.slug}`);
    }
  } catch {
    // League data unavailable — still return the static shell of the sitemap.
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((path) => `  <url><loc>${origin}${path}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
