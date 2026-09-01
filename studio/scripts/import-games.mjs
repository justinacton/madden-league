// One-off import: creates/updates `game` documents for the Season 1 regular
// season schedule. Safe to re-run — each game gets a deterministic _id
// derived from season/week/matchup, so re-running updates instead of
// duplicating.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return env;
}

const env = loadEnv(join(__dirname, '..', '.env'));
const PROJECT_ID = env.SANITY_STUDIO_PROJECT_ID;
const DATASET = env.SANITY_STUDIO_DATASET || 'production';
const TOKEN = env.SANITY_TOKEN;
if (!PROJECT_ID || !TOKEN) {
  throw new Error('Missing SANITY_STUDIO_PROJECT_ID or SANITY_TOKEN in studio/.env');
}

const API_VERSION = '2024-01-01';
const BASE = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data`;

async function groq(query) {
  const res = await fetch(`${BASE}/query/${DATASET}?query=${encodeURIComponent(query)}`);
  const body = await res.json();
  if (!res.ok) throw new Error(`GROQ query failed: ${JSON.stringify(body)}`);
  return body.result;
}

async function mutate(mutations) {
  const res = await fetch(`${BASE}/mutate/${DATASET}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mutations }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Mutation failed: ${JSON.stringify(body)}`);
  return body;
}

// Week,Home Team,Away Team,Game Date,Game Type — from
// punt_2026_regular_season_schedule.csv (all Regular Season).
const SCHEDULE_CSV = `
1,DEN,BUF,2026-09-07
1,KC,BAL,2026-09-07
1,NE,HOU,2026-09-07
1,DAL,ATL,2026-09-07
1,DET,PHI,2026-09-07
1,LAR,SF,2026-09-07
2,KC,DEN,2026-09-14
2,BUF,HOU,2026-09-14
2,NE,BAL,2026-09-14
2,DET,DAL,2026-09-14
2,ATL,SF,2026-09-14
2,LAR,PHI,2026-09-14
3,DEN,HOU,2026-09-21
3,NE,KC,2026-09-21
3,BUF,BAL,2026-09-21
3,DAL,SF,2026-09-21
3,LAR,DET,2026-09-21
3,ATL,PHI,2026-09-21
4,NE,DEN,2026-09-28
4,HOU,BAL,2026-09-28
4,BUF,KC,2026-09-28
4,LAR,DAL,2026-09-28
4,SF,PHI,2026-09-28
4,ATL,DET,2026-09-28
5,DEN,BAL,2026-10-05
5,BUF,NE,2026-10-05
5,HOU,KC,2026-10-05
5,DAL,PHI,2026-10-05
5,ATL,LAR,2026-10-05
5,SF,DET,2026-10-05
6,DEN,DAL,2026-10-12
6,BAL,PHI,2026-10-12
6,NE,LAR,2026-10-12
6,HOU,SF,2026-10-12
6,KC,DET,2026-10-12
6,BUF,ATL,2026-10-12
7,PHI,DEN,2026-10-19
7,LAR,BAL,2026-10-19
7,SF,NE,2026-10-19
7,DET,HOU,2026-10-19
7,ATL,KC,2026-10-19
7,DAL,BUF,2026-10-19
8,DEN,LAR,2026-10-26
8,BAL,SF,2026-10-26
8,NE,DET,2026-10-26
8,HOU,ATL,2026-10-26
8,KC,DAL,2026-10-26
8,BUF,PHI,2026-10-26
9,SF,DEN,2026-11-02
9,DET,BAL,2026-11-02
9,ATL,NE,2026-11-02
9,DAL,HOU,2026-11-02
9,PHI,KC,2026-11-02
9,LAR,BUF,2026-11-02
10,DEN,DET,2026-11-09
10,BAL,ATL,2026-11-09
10,NE,DAL,2026-11-09
10,HOU,PHI,2026-11-09
10,KC,LAR,2026-11-09
10,BUF,SF,2026-11-09
11,ATL,DEN,2026-11-16
11,DAL,BAL,2026-11-16
11,PHI,NE,2026-11-16
11,LAR,HOU,2026-11-16
11,SF,KC,2026-11-16
11,DET,BUF,2026-11-16
13,BUF,DEN,2026-11-30
13,BAL,KC,2026-11-30
13,HOU,NE,2026-11-30
13,ATL,DAL,2026-11-30
13,PHI,DET,2026-11-30
13,SF,LAR,2026-11-30
14,DEN,KC,2026-12-07
14,HOU,BUF,2026-12-07
14,BAL,NE,2026-12-07
14,DAL,DET,2026-12-07
14,SF,ATL,2026-12-07
14,PHI,LAR,2026-12-07
15,HOU,DEN,2026-12-14
15,KC,NE,2026-12-14
15,BAL,BUF,2026-12-14
15,SF,DAL,2026-12-14
15,DET,LAR,2026-12-14
15,PHI,ATL,2026-12-14
16,DEN,NE,2026-12-21
16,BAL,HOU,2026-12-21
16,KC,BUF,2026-12-21
16,DAL,LAR,2026-12-21
16,PHI,SF,2026-12-21
16,DET,ATL,2026-12-21
17,BAL,DEN,2026-12-28
17,NE,BUF,2026-12-28
17,KC,HOU,2026-12-28
17,PHI,DAL,2026-12-28
17,LAR,ATL,2026-12-28
17,DET,SF,2026-12-28
18,DAL,DEN,2027-01-04
18,PHI,BAL,2027-01-04
18,LAR,NE,2027-01-04
18,SF,HOU,2027-01-04
18,DET,KC,2027-01-04
18,ATL,BUF,2027-01-04
`.trim();

const games = SCHEDULE_CSV.split('\n').map((line) => {
  const [week, home, away, date] = line.split(',');
  return { week: Number(week), home, away, date };
});

async function main() {
  const season = (await groq('*[_type == "season" && slug.current == "season-1"][0]{ _id, "slug": slug.current }'));
  if (!season) throw new Error('Season "season-1" not found in Sanity');

  const entries = await groq(
    '*[_type == "seasonEntry" && season->slug.current == "season-1"]{ _id, "abbr": team->abbreviation }'
  );
  const entryByAbbr = new Map(entries.map((e) => [e.abbr, e._id]));

  const missing = new Set();
  for (const g of games) {
    if (!entryByAbbr.has(g.home)) missing.add(g.home);
    if (!entryByAbbr.has(g.away)) missing.add(g.away);
  }
  if (missing.size > 0) {
    throw new Error(`No Season Entry found for team abbreviation(s): ${[...missing].join(', ')}`);
  }

  const mutations = games.map((g) => {
    const id = `game-season-1-wk${g.week}-${g.away.toLowerCase()}-at-${g.home.toLowerCase()}`;
    return {
      createOrReplace: {
        _id: id,
        _type: 'game',
        season: { _type: 'reference', _ref: season._id },
        week: g.week,
        gameDate: new Date(`${g.date}T00:00:00Z`).toISOString(),
        gameType: 'Regular Season',
        status: 'Scheduled',
        homeEntry: { _type: 'reference', _ref: entryByAbbr.get(g.home) },
        awayEntry: { _type: 'reference', _ref: entryByAbbr.get(g.away) },
        overtime: false,
        featuredGame: false,
      },
    };
  });

  console.log(`Importing ${mutations.length} games...`);
  const result = await mutate(mutations);
  console.log(`Done. ${result.results?.length ?? 0} documents written.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
