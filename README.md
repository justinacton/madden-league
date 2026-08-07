# PUNT Website

The website for **PUNT** (Professional Union of Nonexistent Talent), a public, read-only site for an
online Madden football league: standings, schedule, teams, manager career records, statistical
leaderboards, news, and rules. All league data is entered by the commissioner in Airtable; the
website only ever reads it. There are no accounts, logins, or public forms anywhere on the site.

The site's display name and logo (`src/lib/mock/index.ts`, `src/lib/airtableTransform.ts`,
`public/images/league/logo.svg`) are hardcoded in the app rather than pulled from Airtable — there's
no "League Settings" table — so rebranding again later just means editing those few files.

- **Front end:** [Astro](https://astro.build) (server output), plain CSS — no UI framework, minimal
  client-side JavaScript.
- **Data source:** [Airtable](https://airtable.com), read through a small typed transform layer.
- **Hosting:** [Cloudflare Pages](https://pages.cloudflare.com), including the JSON API routes, which
  run as Astro server endpoints inside the same Cloudflare Worker.
- **Mock data:** the entire site runs on realistic bundled mock data by default, so it works before
  any Airtable base exists.

## 1. Requirements

- Node.js **20 or later** (`node --version`)
- npm (ships with Node)
- A free [Cloudflare](https://dash.cloudflare.com/sign-up) account, for deployment only
- An [Airtable](https://airtable.com) account, once you're ready to replace mock data

## 2. Install and run locally

```bash
npm install
npm run dev
```

The site runs at `http://localhost:4321` with `USE_MOCK_DATA=true` by default (see `.env.example`),
so it works immediately with no Airtable credentials. Two full mock seasons are included — a
completed Season 1 with a champion and playoffs, and an in-progress Season 2 — with a manager who
switched teams between them, so every "career record" and "team history" code path has real data to
render.

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server (`astro dev`), using mock data or a real Airtable base per `.env` |
| `npm run build` | Production build (`astro build`) into `dist/` |
| `npm run preview` | Runs the production build under `wrangler pages dev ./dist` — the closest local approximation of the real Cloudflare Workers runtime (edge caching, `env` bindings) |
| `npm test` | Runs the Vitest suite (calculation logic + mock data integrity) |
| `npm run check` | Type-checks the Astro project |

## 3. Environment variables

Copy `.env.example` to `.env` and fill in as needed:

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `USE_MOCK_DATA` | `true` to run entirely on bundled mock data (default). Set to `false` once Airtable is configured. |
| `AIRTABLE_TOKEN` | A **read-only** Airtable Personal Access Token scoped to the league base only. Never commit a real value. |
| `AIRTABLE_BASE_ID` | The Airtable base ID, e.g. `appXXXXXXXXXXXXXX`. |
| `AIRTABLE_API_URL` | Airtable's REST API root. Only change this if Airtable's API host changes. |

The Airtable token is only ever read on the server (inside Astro server endpoints and page
frontmatter) and is never sent to the browser — there is no client-side JavaScript that touches it.

## 4. Setting up Airtable

### 4.1 Create the base and tables

Create one Airtable base with these tables (exact names matter — the code looks them up by name):

`Seasons`, `Managers`, `Teams`, `Season Entries`, `Games`, `Team Game Stats`, `Players`,
`Player Game Stats`, `News`, `Power Rankings`.

Field names must match what's read by `src/lib/airtableTransform.ts` exactly — the full field list for
every table, including types and which are required, is specified in the original product
requirements doc for this project. A few load-bearing conventions:

- Every table has a stable "X ID" field (e.g. `Season ID`, `Team ID`) — a short slug-style text value
  like `season-01` or `chiefs`. This is the ID used in the website's URLs, so treat it as permanent
  once a record is public.
- `Season Entries` is the join table between a `Manager`, a `Team`, and a `Season` — this is what lets
  a manager change teams between seasons while keeping their career record intact. There should only
  ever be one Season Entry per manager per season, and one per team per season.
- `Games`, `Team Game Stats`, and `Player Game Stats` all link back to a `Season Entry` (not directly
  to a Manager or Team) for the same reason: a historical game's manager/team pairing must never
  change just because that manager moved to a different team later.
- Only `Seasons.Public` = checked seasons appear on the website at all — use this to stage a season
  before announcing it.
- Only `News.Status` = `Published` articles appear on the website.
- Only `Power Rankings.Published` = checked rankings appear.

### 4.2 Create a read-only Personal Access Token

1. In Airtable, go to **Account → Developer Hub → Personal access tokens → Create new token**.
2. Name it something like `madden-league-website-readonly`.
3. Under **Scopes**, add only `data.records:read` and `schema.bases:read`.
4. Under **Access**, add only this league's base (not "all current and future bases").
5. Create the token and copy it immediately — Airtable only shows it once.
6. Put it in `.env` as `AIRTABLE_TOKEN` for local development, and as a Cloudflare Pages secret (see
   below) for production. Never commit it.

### 4.3 Switch the site over to Airtable

Set `USE_MOCK_DATA=false` (or remove it) once `AIRTABLE_TOKEN` and `AIRTABLE_BASE_ID` are set — the
site automatically falls back to mock data if either is missing, so this is safe to leave unset while
you're still building out the base.

## 5. Deploying to Cloudflare Pages

1. Push this repository to GitHub (or GitLab).
2. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git** and select
   the repository.
3. Build settings:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Add environment variables/secrets (**Settings → Environment variables**) for the Production (and
   Preview, if desired) environment:
   - `AIRTABLE_TOKEN` — mark this one **Secret**, not plaintext
   - `AIRTABLE_BASE_ID`
   - `AIRTABLE_API_URL` — `https://api.airtable.com/v0`
   - `USE_MOCK_DATA` — `false`
5. Deploy. Every push to your production branch redeploys automatically.

To set secrets from the CLI instead of the dashboard:

```bash
npx wrangler pages secret put AIRTABLE_TOKEN --project-name=<your-pages-project-name>
```

Before your first deploy, also update `site` in `astro.config.mjs` and the `Sitemap:` line in
`public/robots.txt` to your real Cloudflare Pages URL (or custom domain) — they're placeholders.

## 6. How caching works

League data changes infrequently, so it's cached at the edge rather than re-fetched from Airtable on
every request:

- The whole dataset (every table) is fetched from Airtable in one batch of parallel requests, cached
  as a single object, and reused by every page and API route for 5 minutes (`src/lib/cache.ts`,
  `src/lib/api.ts`). This is what keeps Airtable usage low — the site never makes one Airtable request
  per row rendered.
- If Airtable is unreachable when the cache expires, a stale copy (kept for 6 hours) is served instead
  of showing an error, and the page still renders normally.
- Add `?bypassCache=1` to any page or `/api/*` URL to skip the cache and force a fresh Airtable fetch —
  useful right after editing data in Airtable and wanting to see it immediately.
- In mock mode (`USE_MOCK_DATA=true`), there is nothing to cache — data comes straight from the bundled
  mock modules.

## 7. Commissioner workflows

### Add a new season

1. In `Seasons`, create a record: set `Season ID` (e.g. `season-03`), `Name`, `Status` (`Upcoming` or
   `Active`), and check `Public` once you're ready to announce it. Only one season should normally be
   `Active` at a time — that's the season the homepage and header default to.
2. In `Season Entries`, create one record per manager for the new season, linking their `Manager` and
   the `Team` they'll control this season.

### Assign (or reassign) a manager to a team

Managers and Teams are always connected through a `Season Entries` record for a specific season — never
edit a manager or team's identity to "move" them. To move a manager to a different team next season,
create a **new** Season Entry for the new season linking that manager to the new team; leave every
past season's entries untouched. This is what keeps career records and franchise history correct
across the change.

### Enter a completed game

1. Find the `Games` record for the matchup (or create it, if the schedule wasn't pre-loaded).
2. Set `Status` to `Final`, fill in `Home Score` and `Away Score`, and set `Game Date` if not already
   set.
3. Optionally add a `Recap`, mark it `Featured Game` to highlight it on the homepage, and check
   `Overtime` if applicable.

### Enter game statistics

After a game is marked `Final`:

1. Add **two** `Team Game Stats` records (one per team), each linked to the `Game` and the correct
   `Season Entry`. At minimum, fill in `Points`, `Total Offense Yards`, `Passing Yards`,
   `Rushing Yards`, `Turnovers`, and `Defensive Sacks` — these are what standings, rankings, and the
   Team Stats leaderboard are built from.
2. Add one `Player Game Stats` record per statistical performance worth tracking (passing, rushing,
   receiving, or defensive), linked to the `Game`, the `Player`, and the correct `Season Entry`. Only
   fill in the fields that apply to that performance — leave the rest blank.
3. To avoid an inaccurate season leaderboard, don't rely only on screenshots of each team's single top
   performer — a player who's the *second*-best performer in several games can still lead the season
   in cumulative stats. Capture stats for every player worth tracking each week.
4. Changes appear on the live site within 5 minutes (the cache TTL), or immediately with
   `?bypassCache=1`.

### Update the static Rules page

The Rules page (`/rules`) is intentionally **not** stored in Airtable — it's plain content in
`src/content/rules.ts`. Edit `leagueSettings` and `ruleSections` directly in that file and redeploy.
Sections not yet decided are left as visible `[Commissioner: ...]` placeholders on purpose; replace
the placeholder text once a rule is finalized rather than deleting the section.

## 8. Troubleshooting

- **"League data is temporarily unavailable" banner:** Airtable didn't respond and there was no stale
  cached copy to fall back to. Check that `AIRTABLE_TOKEN` and `AIRTABLE_BASE_ID` are correct and that
  the token's base access hasn't been revoked.
- **A page shows old data after an Airtable edit:** expected for up to 5 minutes; add
  `?bypassCache=1` to the URL to confirm the edit actually saved, or just wait out the cache window.
- **"No stats available" / "No games have been scheduled" messages:** this is the expected empty state,
  not an error — it means the relevant Airtable records don't exist yet (e.g. no `Team Game Stats` rows
  for a completed game).
- **A season/team/manager/news page 404s:** the slug in the URL doesn't match any public record's
  `Slug` (or the season's `Season ID`). Double check `Public` is checked on the `Seasons` record, and
  that `Status` is `Published` for `News`.
- **Local dev can't find environment variables:** make sure `.env` exists (copied from
  `.env.example`) and restart `npm run dev` — Vite only reads `.env` at startup.
- **`npm run preview` behaves differently from `npm run dev`:** that's expected — `preview` runs the
  actual Cloudflare Workers runtime (via Wrangler/Miniflare), including real edge caching, while `dev`
  runs Astro's own dev server. Use `preview` to sanity-check caching or Airtable behavior before
  deploying.

## 9. Testing

```bash
npm test
```

`tests/calculations.test.ts` covers every scoring/record calculation called out in the product spec:
wins/losses/ties, win percentage, points for/against, point differential, streaks, points per game,
manager career records across a team change, head-to-head records, player season totals and rate
stats (completion %, yards per attempt/reception), turnover differential, and edge cases (no games
played, division by zero, exhibition/cancelled games excluded). `tests/mockData.test.ts` checks the
bundled mock dataset itself stays internally consistent (every foreign key resolves, standings and
leaderboards compute without throwing, etc.) as a regression guard whenever the mock data changes.

## 10. Repository structure

```
src/
  components/       Reusable Astro components (Header, GameCard, StandingsTable, stat tables, ...)
  layouts/          Layout.astro — the shared page shell (head/SEO, header, footer)
  pages/            File-based routes, including pages/api/*.ts (the JSON API)
  lib/
    types.ts          All TypeScript domain types
    calculations.ts   Pure functions: standings, streaks, career records, leaderboards
    formatting.ts     Display formatting (signed differentials, win %, dates)
    api.ts            Data-access facade used by both pages and API routes
    airtable.ts        Minimal fetch-based Airtable REST client
    airtableTransform.ts  Maps raw Airtable records to domain types
    cache.ts          Cloudflare edge-cache wrapper with stale-on-error fallback
    markdown.ts       Tiny safe Markdown-subset renderer for News bodies
    mock/             Bundled mock dataset (two seasons, 8 managers, full schedule/stats)
  content/rules.ts   Static Rules page content
tests/               Vitest suite
public/              Static assets (team/league logo placeholders, robots.txt)
```

Note on architecture: the product spec's suggested layout puts the JSON API in a separate
`functions/api/*.ts` Cloudflare Pages Functions tree alongside the Astro app. In practice,
`@astrojs/cloudflare` bundles the whole site into a single `_worker.js`, and Cloudflare Pages ignores
a project's `functions/` directory whenever `_worker.js` is present — so a standalone `functions/`
tree would silently never run. The API is implemented instead as ordinary Astro server endpoints
under `src/pages/api/`, which are bundled into that same worker and do run. The result is the same:
a read-only JSON API, server-side only, that never exposes Airtable credentials to the browser.
