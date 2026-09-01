# PUNT League — Sanity Studio (experimental)

An alternative content model to the Airtable base, covering the same 7 record
types: Season, Manager, Team, Season Entry, Game, Player Stats, News Article —
see `schemaTypes/`. Not yet wired into the live site; `src/lib/sanityTransform.ts`
in the main app can fetch this shape into the same `LeagueDataset` type the
Airtable path produces, but `src/lib/api.ts` still only calls the Airtable
path.

## Setup

1. Create a free project at [sanity.io/manage](https://sanity.io/manage) (or run `npx sanity@latest login` then `npx sanity@latest init --env` from this folder to create one from the CLI). Note the **Project ID**.
2. `cd studio && npm install`
3. `cp .env.example .env` and fill in `SANITY_STUDIO_PROJECT_ID` (dataset defaults to `production`).
4. `npm run dev` — opens the Studio locally at `localhost:3333`.
5. Add a few records by hand (or write an import script against `@sanity/client`) to try it out.
6. `npm run deploy` hosts the Studio at `https://<project-id>.sanity.studio` so non-technical commissioners can use it without running anything locally — same role `airtable/setup.js` + the Airtable UI plays today.

## Wiring it into the site (not done yet)

To actually switch the live site over:

1. In the main app's `.env` (local) / Cloudflare env (prod), set `SANITY_PROJECT_ID`, `SANITY_DATASET`, and `SANITY_API_VERSION` (see `src/lib/env.ts`). Leave `SANITY_TOKEN` unset unless you need to read draft/unpublished documents — an unauthenticated read only sees published content, which is normally what you want.
2. In `src/lib/api.ts`, `getLeagueDataset()` would need a second branch calling `fetchLeagueDatasetFromSanity(env)` instead of `fetchLeagueDatasetFromAirtable(env)`, gated by an explicit env flag (following the same strict-string-equality convention as `USE_MOCK_DATA` — no silent fallback heuristics).
3. Data would need to be migrated from Airtable to Sanity (one-off script using `@sanity/client`'s `createOrReplace`, or manual entry for a league this size).

None of the above has been done — this is groundwork to evaluate the schema and query shape before committing to a migration.
