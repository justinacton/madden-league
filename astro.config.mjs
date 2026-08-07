import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    // The site only ever renders plain <img> tags (team logos, headshots) —
    // Astro's built-in image optimization (which needs Sharp, unavailable
    // in the Workers runtime) is never used, so skip it entirely.
    imageService: 'passthrough',
    platformProxy: {
      enabled: true,
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
