/**
 * PUNT league base setup script — Airtable Scripting Extension.
 *
 * HOW TO RUN
 *   1. Open your Airtable base.
 *   2. Extensions (left sidebar) → + Add an extension → Scripting.
 *   3. Delete the sample code in the editor and paste in this entire file.
 *   4. Click "Run".
 *
 * There is nothing to configure first and nothing to type in — this script
 * runs inside Airtable itself and already has access to `base`. It does not
 * use (and does not need) an Airtable Personal Access Token, a Base ID, or
 * any Cloudflare credentials; those are only needed by the *website*, and
 * only once you switch it off mock data (see the README).
 *
 * WHAT THIS DOES
 *   Creates the 7 tables the site expects (Managers, Teams, Seasons,
 *   Season Entries, Games, Player Stats, News) and every field Airtable's
 *   scripting API is able to create. It's safe to run more than once —
 *   anything that already exists (by name) is left alone and skipped.
 *
 * WHAT THIS CANNOT DO
 *   Airtable's scripting API cannot create Formula or Lookup fields — that
 *   is an Airtable platform limitation, not something this script works
 *   around. At the end, it prints a checklist of exactly which fields to
 *   add by hand and what formula/lookup to use for each. Two categories:
 *     - "Required for clean URLs": stable ID/Slug formulas used in the
 *       website's URLs (e.g. /teams/chiefs). The site works immediately
 *       without them — it falls back to Airtable's own record ID
 *       (e.g. /teams/recXXXXXXXXXXXXXX) — these just make the URLs nicer.
 *     - "Optional (Airtable convenience only)": lookup fields the website
 *       never reads at all (it resolves Team/Manager names itself by
 *       following the linked records). These only help *you* browse the
 *       Games/Season Entries/Player Stats tables in the Airtable UI.
 */

const requiredSteps = [];
const optionalSteps = [];

function requireStep(table, field, detail) {
  requiredSteps.push({ table, field, detail });
}

function optionalStep(table, field, detail) {
  optionalSteps.push({ table, field, detail });
}

async function getOrCreateTable(name, fields) {
  const existing = base.getTableByNameIfExists(name);
  if (existing) {
    output.text(`Table "${name}" already exists — skipping.`);
    return existing;
  }
  try {
    output.text(`Creating table "${name}"...`);
    const table = await base.createTableAsync(name, fields);
    output.text(`  Created "${name}".`);
    return table;
  } catch (error) {
    output.text(`  Could not create table "${name}" automatically (${error.message}).`);
    output.text(
      `  Create it manually with a Single line text primary field named "${fields[0].name}", then re-run this script to fill in the rest of its fields.`
    );
    return null;
  }
}

async function getOrCreateField(table, name, type, options) {
  if (!table) return null;
  const existing = table.getFieldByNameIfExists(name);
  if (existing) {
    output.text(`  Field "${name}" already exists on "${table.name}" — skipping.`);
    return existing;
  }
  try {
    const field = options
      ? await table.createFieldAsync(name, type, options)
      : await table.createFieldAsync(name, type);
    output.text(`  Created field "${name}" (${type}) on "${table.name}".`);
    return field;
  } catch (error) {
    output.text(`  Could not create field "${name}" on "${table.name}" (${error.message}).`);
    return null;
  }
}

const CHECK = { icon: 'check', color: 'greenBright' };
const INT = { precision: 0 };

output.markdown('# Setting up the PUNT league base');
output.markdown(
  'Creating tables and fields. Anything that already exists is left untouched. See the checklist at the end for the handful of Formula/Lookup fields Airtable\'s scripting API cannot create.'
);

// ---------------------------------------------------------------------------
// 1. Managers (no dependencies)
// ---------------------------------------------------------------------------
output.markdown('## Managers');
const managersTable = await getOrCreateTable('Managers', [{ name: 'Name', type: 'singleLineText' }]);
await getOrCreateField(managersTable, 'Active', 'checkbox', CHECK);
await getOrCreateField(managersTable, 'Photo', 'multipleAttachments');
await getOrCreateField(managersTable, 'Bio', 'multilineText');
requireStep(
  'Managers',
  'Manager ID',
  'Formula field — a stable identifier, e.g. LOWER(SUBSTITUTE({Name}, " ", "-")).'
);
requireStep(
  'Managers',
  'Slug',
  'Formula field — used in manager page URLs (/managers/your-slug). Can reuse the same formula as Manager ID.'
);

// ---------------------------------------------------------------------------
// 2. Teams (no dependencies)
// ---------------------------------------------------------------------------
output.markdown('## Teams');
const teamsTable = await getOrCreateTable('Teams', [{ name: 'Team Name', type: 'singleLineText' }]);
await getOrCreateField(teamsTable, 'City', 'singleLineText');
await getOrCreateField(teamsTable, 'Abbreviation', 'singleLineText');
await getOrCreateField(teamsTable, 'Conference', 'singleSelect', {
  choices: [{ name: 'AFC' }, { name: 'NFC' }],
});
await getOrCreateField(teamsTable, 'Division', 'singleSelect', {
  choices: [
    { name: 'AFC East' }, { name: 'AFC North' }, { name: 'AFC South' }, { name: 'AFC West' },
    { name: 'NFC East' }, { name: 'NFC North' }, { name: 'NFC South' }, { name: 'NFC West' },
  ],
});
await getOrCreateField(teamsTable, 'Primary Color', 'singleLineText');
await getOrCreateField(teamsTable, 'Secondary Color', 'singleLineText');
await getOrCreateField(teamsTable, 'Logo', 'multipleAttachments');
await getOrCreateField(teamsTable, 'Active', 'checkbox', CHECK);
requireStep('Teams', 'Team ID', 'Formula field — a stable slug (e.g. "chiefs") used in team page URLs (/teams/your-slug).');
requireStep('Teams', 'Slug', 'Formula field — same idea as Team ID; keep them consistent (or reuse the same formula).');
optionalStep('Teams', 'Full Name', 'Formula field, e.g. {City} & " " & {Team Name} — cosmetic only. The website already combines City + Team Name itself.');

// ---------------------------------------------------------------------------
// 3. Seasons (links to Managers)
// ---------------------------------------------------------------------------
output.markdown('## Seasons');
const seasonsTable = await getOrCreateTable('Seasons', [{ name: 'Name', type: 'singleLineText' }]);
await getOrCreateField(seasonsTable, 'Madden Version', 'singleLineText');
await getOrCreateField(seasonsTable, 'Status', 'singleSelect', {
  choices: [{ name: 'Upcoming' }, { name: 'Active' }, { name: 'Completed' }],
});
await getOrCreateField(seasonsTable, 'Current Week', 'number', INT);
await getOrCreateField(seasonsTable, 'Regular Season Weeks', 'number', INT);
await getOrCreateField(seasonsTable, 'Start Date', 'date', { dateFormat: { name: 'iso' } });
await getOrCreateField(seasonsTable, 'End Date', 'date', { dateFormat: { name: 'iso' } });
if (managersTable) {
  await getOrCreateField(seasonsTable, 'Champion', 'multipleRecordLinks', { linkedTableId: managersTable.id });
  await getOrCreateField(seasonsTable, 'Runner-Up', 'multipleRecordLinks', { linkedTableId: managersTable.id });
} else {
  optionalStep('Seasons', 'Champion / Runner-Up', 'Add these as "Link to Managers" fields by hand — the Managers table failed to create above.');
}
await getOrCreateField(seasonsTable, 'Notes', 'multilineText');
await getOrCreateField(seasonsTable, 'Public', 'checkbox', CHECK);
requireStep('Seasons', 'Season ID', 'Formula field — a stable slug (e.g. "season-01") used throughout the website\'s URLs. Only one season should normally have Status = Active, and only Public seasons appear on the site.');

// ---------------------------------------------------------------------------
// 4. Season Entries (links to Seasons, Managers, Teams)
// ---------------------------------------------------------------------------
output.markdown('## Season Entries');
const seasonEntryFields = [];
if (seasonsTable) seasonEntryFields.push({ name: 'Season', type: 'multipleRecordLinks', options: { linkedTableId: seasonsTable.id } });
else seasonEntryFields.push({ name: 'Season Entry', type: 'singleLineText' });
const seasonEntriesTable = await getOrCreateTable('Season Entries', seasonEntryFields);
if (!seasonsTable) optionalStep('Season Entries', 'Season', 'Add as a "Link to Seasons" field by hand — the Seasons table failed to create above.');
if (managersTable) await getOrCreateField(seasonEntriesTable, 'Manager', 'multipleRecordLinks', { linkedTableId: managersTable.id });
if (teamsTable) await getOrCreateField(seasonEntriesTable, 'Team', 'multipleRecordLinks', { linkedTableId: teamsTable.id });
await getOrCreateField(seasonEntriesTable, 'Active', 'checkbox', CHECK);
await getOrCreateField(seasonEntriesTable, 'Playoff Seed', 'number', INT);
await getOrCreateField(seasonEntriesTable, 'Final Finish', 'singleSelect', {
  choices: [
    { name: 'Regular Season' }, { name: 'Playoff Qualifier' }, { name: 'Semifinalist' },
    { name: 'Runner-Up' }, { name: 'Champion' },
  ],
});
await getOrCreateField(seasonEntriesTable, 'Notes', 'multilineText');
optionalStep('Season Entries', 'Entry ID', 'Formula field for your own reference — not required (Season Entries are never shown individually in a URL).');
optionalStep('Season Entries', 'Manager Name / Team Name / Team Abbreviation / Season Name', 'Lookup fields (from Manager/Team/Season) so this table reads nicely in the Airtable UI. The website never reads these — it resolves names itself.');

// ---------------------------------------------------------------------------
// 5. Games (links to Seasons, Season Entries)
// ---------------------------------------------------------------------------
output.markdown('## Games');
const gameFields = [];
if (seasonsTable) gameFields.push({ name: 'Season', type: 'multipleRecordLinks', options: { linkedTableId: seasonsTable.id } });
else gameFields.push({ name: 'Game', type: 'singleLineText' });
const gamesTable = await getOrCreateTable('Games', gameFields);
if (!seasonsTable) optionalStep('Games', 'Season', 'Add as a "Link to Seasons" field by hand — the Seasons table failed to create above.');
await getOrCreateField(gamesTable, 'Week', 'number', INT);
await getOrCreateField(gamesTable, 'Game Date', 'dateTime', {
  dateFormat: { name: 'us' },
  timeFormat: { name: '12hour' },
  timeZone: 'client',
});
await getOrCreateField(gamesTable, 'Game Type', 'singleSelect', {
  choices: [{ name: 'Regular Season' }, { name: 'Playoff' }, { name: 'Championship' }, { name: 'Exhibition' }],
});
await getOrCreateField(gamesTable, 'Status', 'singleSelect', {
  choices: [{ name: 'Scheduled' }, { name: 'Final' }, { name: 'Postponed' }, { name: 'Cancelled' }],
});
if (seasonEntriesTable) {
  await getOrCreateField(gamesTable, 'Away Entry', 'multipleRecordLinks', { linkedTableId: seasonEntriesTable.id });
  await getOrCreateField(gamesTable, 'Home Entry', 'multipleRecordLinks', { linkedTableId: seasonEntriesTable.id });
} else {
  optionalStep('Games', 'Away Entry / Home Entry', 'Add these as "Link to Season Entries" fields by hand — that table failed to create above.');
}
await getOrCreateField(gamesTable, 'Away Score', 'number', INT);
await getOrCreateField(gamesTable, 'Home Score', 'number', INT);
await getOrCreateField(gamesTable, 'Overtime', 'checkbox', CHECK);
await getOrCreateField(gamesTable, 'Featured Game', 'checkbox', CHECK);
await getOrCreateField(gamesTable, 'Recap', 'multilineText');
await getOrCreateField(gamesTable, 'Notes', 'multilineText');
requireStep('Games', 'Game ID', 'Formula field — a stable identifier used in game detail URLs. Recommended but not required: without it, the URL just uses Airtable\'s own record ID instead.');
optionalStep('Games', 'Away Manager / Away Team / Away Team Abbreviation / Home Manager / Home Team / Home Team Abbreviation', 'Lookup fields (from Away Entry / Home Entry) so this table reads nicely in the Airtable UI. The website never reads these — it resolves Team/Manager itself through Away Entry/Home Entry.');
optionalStep('Games', 'Last Updated', 'A "Last modified time" field, if you\'d like one for your own reference — the website does not use it.');

// ---------------------------------------------------------------------------
// 6. Player Stats (links to Games, Season Entries)
// ---------------------------------------------------------------------------
output.markdown('## Player Stats');
const playerStatsTable = await getOrCreateTable('Player Stats', [{ name: 'Player Name', type: 'singleLineText' }]);
await getOrCreateField(playerStatsTable, 'Position', 'singleSelect', {
  choices: [
    { name: 'QB' }, { name: 'RB' }, { name: 'FB' }, { name: 'WR' }, { name: 'TE' }, { name: 'OL' },
    { name: 'DL' }, { name: 'DE' }, { name: 'DT' }, { name: 'LB' }, { name: 'CB' }, { name: 'S' },
    { name: 'K' }, { name: 'P' }, { name: 'OTHER' },
  ],
});
if (gamesTable) await getOrCreateField(playerStatsTable, 'Game', 'multipleRecordLinks', { linkedTableId: gamesTable.id });
else optionalStep('Player Stats', 'Game', 'Add as a "Link to Games" field by hand — the Games table failed to create above.');
if (seasonEntriesTable) await getOrCreateField(playerStatsTable, 'Season Entry', 'multipleRecordLinks', { linkedTableId: seasonEntriesTable.id });
else optionalStep('Player Stats', 'Season Entry', 'Add as a "Link to Season Entries" field by hand — that table failed to create above.');

// Passing
await getOrCreateField(playerStatsTable, 'Pass Completions', 'number', INT);
await getOrCreateField(playerStatsTable, 'Pass Attempts', 'number', INT);
await getOrCreateField(playerStatsTable, 'Passing Yards', 'number', INT);
await getOrCreateField(playerStatsTable, 'Passing Touchdowns', 'number', INT);
await getOrCreateField(playerStatsTable, 'Interceptions Thrown', 'number', INT);
// Rushing
await getOrCreateField(playerStatsTable, 'Rush Attempts', 'number', INT);
await getOrCreateField(playerStatsTable, 'Rushing Yards', 'number', INT);
await getOrCreateField(playerStatsTable, 'Rushing Touchdowns', 'number', INT);
await getOrCreateField(playerStatsTable, 'Long Rush', 'number', INT);
// Receiving
await getOrCreateField(playerStatsTable, 'Receptions', 'number', INT);
await getOrCreateField(playerStatsTable, 'Receiving Yards', 'number', INT);
await getOrCreateField(playerStatsTable, 'Receiving Touchdowns', 'number', INT);
await getOrCreateField(playerStatsTable, 'Long Reception', 'number', INT);
// Defense
await getOrCreateField(playerStatsTable, 'Tackles', 'number', INT);
await getOrCreateField(playerStatsTable, 'Sacks', 'number', { precision: 1 }); // half-sacks
await getOrCreateField(playerStatsTable, 'Interceptions', 'number', INT);
await getOrCreateField(playerStatsTable, 'Forced Fumbles', 'number', INT);
await getOrCreateField(playerStatsTable, 'Fumble Recoveries', 'number', INT);
await getOrCreateField(playerStatsTable, 'Defensive Touchdowns', 'number', INT);
// Turnovers / fumbles (optional per spec — may go unused)
await getOrCreateField(playerStatsTable, 'Fumbles', 'number', INT);
await getOrCreateField(playerStatsTable, 'Fumbles Lost', 'number', INT);

optionalStep('Player Stats', 'Season / Week / Team / Manager', 'Lookup fields (from Game / Season Entry) so this table reads nicely in the Airtable UI. The website never reads these — it resolves Season/Week from Game and Team/Manager from Season Entry itself.');

// ---------------------------------------------------------------------------
// 7. News (links to Seasons)
// ---------------------------------------------------------------------------
output.markdown('## News');
const newsTable = await getOrCreateTable('News', [{ name: 'Title', type: 'singleLineText' }]);
await getOrCreateField(newsTable, 'Publish Date', 'dateTime', {
  dateFormat: { name: 'us' },
  timeFormat: { name: '12hour' },
  timeZone: 'client',
});
await getOrCreateField(newsTable, 'Status', 'singleSelect', { choices: [{ name: 'Draft' }, { name: 'Published' }] });
await getOrCreateField(newsTable, 'Summary', 'multilineText');
await getOrCreateField(newsTable, 'Body', 'multilineText');
await getOrCreateField(newsTable, 'Featured Image', 'multipleAttachments');
if (seasonsTable) await getOrCreateField(newsTable, 'Season', 'multipleRecordLinks', { linkedTableId: seasonsTable.id });
await getOrCreateField(newsTable, 'Week', 'number', INT);
await getOrCreateField(newsTable, 'Featured', 'checkbox', CHECK);
await getOrCreateField(newsTable, 'Author', 'singleLineText');
requireStep('News', 'Slug', 'Formula field — used in article URLs (/news/your-slug). Only Published articles appear on the site.');

// ---------------------------------------------------------------------------
// Final report
// ---------------------------------------------------------------------------
output.markdown('---');
output.markdown('# Manual steps checklist');
output.markdown(
  'Everything below has to be added by hand in the Airtable UI — Airtable\'s scripting API cannot create Formula or Lookup fields. **The website works right now without any of these** (it falls back to Airtable\'s own record ID wherever a friendly ID is missing); add them whenever it\'s convenient.'
);

output.markdown('## Required for clean URLs');
for (const step of requiredSteps) {
  output.markdown(`- **${step.table} → ${step.field}**: ${step.detail}`);
}

output.markdown('## Optional (Airtable convenience only — the website never reads these)');
for (const step of optionalSteps) {
  output.markdown(`- **${step.table} → ${step.field}**: ${step.detail}`);
}

output.markdown('---');
output.markdown('Setup complete. Re-run this script anytime — existing tables and fields are left untouched.');
