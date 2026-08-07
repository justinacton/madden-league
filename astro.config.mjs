import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    // The site only ever renders plain <img> tags (team logos, headshots) —
    // Astro's built-in image optimization (which needs Sharp, unavailable
    // in the Workers runtime) is never used, so skip it entirely.
    imageService: 'passthrough',
    // Disabled on purpose: with this on, `astro dev` sources env vars from
    // wrangler.toml/.dev.vars instead of .env, which silently overrides
    // local config. `npm run dev` reads .env (via import.meta.env) instead;
    // `npm run preview` (wrangler pages dev) and production still get real
    // Cloudflare environment bindings regardless of this setting.
    platformProxy: {
      enabled: false,
    },
  }),
  site: 'https://example-madden-league.pages.dev',
  vite: {
    ssr: {
      // Cloudflare Workers runtime provides its own fetch/caches globals
      external: [],
    },
  },
});
