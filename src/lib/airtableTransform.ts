import type {
  Conference,
  FinalFinish,
  Game,
  GameStatus,
  GameType,
  LeagueDataset,
  Manager,
  NewsArticle,
  NewsStatus,
  PlayerPosition,
  PlayerStats,
  Season,
  SeasonEntry,
  SeasonStatus,
  Team,
} from './types';
import { AIRTABLE_TABLES, listAllRecords, type AirtableRecord } from './airtable';
import type { Env } from './env';

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

interface AirtableAttachment {
  id: string;
  url: string;
  filename?: string;
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function num(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function bool(value: unknown): boolean {
  return value === true;
}

/** A table's own stable "X ID" field, accepting either a text/formula field or an autoNumber field. */
function friendlyId(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length > 0) return value;
  if (typeof value === 'number') return String(value);
  return undefined;
}

/** First linked-record ID from an Airtable link field, or undefined. */
function firstLink(value: unknown): string | undefined {
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

/** Resolves an attachment field or a plain URL field to a single URL string. */
function resolveImageUrl(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0] as AirtableAttachment;
    return first?.url;
  }
  return undefined;
}

/** Builds a map from Airtable record ID to this table's own stable "X ID" field value. */
function buildFriendlyIdMap<F extends Record<string, unknown>>(
  records: AirtableRecord<F>[],
  idFieldName: string
): Map<string, string> {
  const map = new Map<string, string>();
  for (const record of records) {
    const id = friendlyId(record.fields[idFieldName]) ?? record.id;
    map.set(record.id, id);
  }
  return map;
}

function resolve(map: Map<string, string>, recordId: string | undefined): string | undefined {
  if (!recordId) return undefined;
  return map.get(recordId);
}

// ---------------------------------------------------------------------------
// Per-table transforms
//
// Note on lookups: the spec's "create a lookup field for X" instructions are
// for the commissioner's own convenience browsing Airtable — this transform
// layer never reads them. Instead it resolves Team/Manager for a Game or
// Player Stats row itself, in two hops through the linked Season Entry
// (Home/Away Entry -> Season Entry -> Team/Manager). That means none of
// those lookup fields are required for the site to work.
// ---------------------------------------------------------------------------

function transformSeason(record: AirtableRecord, ids: { managers: Map<string, string> }): Season {
  const f = record.fields;
  return {
    id: friendlyId(f['SeasonID']) ?? record.id,
    name: str(f['Name']) ?? 'Untitled Season',
    maddenVersion: str(f['MaddenVersion']),
    startDate: str(f['StartDate']),
    endDate: str(f['EndDate']),
    status: (str(f['Status']) as SeasonStatus) ?? 'Upcoming',
    currentWeek: num(f['CurrentWeek']),
    regularSeasonWeeks: num(f['RegularSeasonWeeks']),
    championManagerId: resolve(ids.managers, firstLink(f['Champion'])),
    runnerUpManagerId: resolve(ids.managers, firstLink(f['RunnerUp'])),
    public: bool(f['Public']),
  };
}

function transformManager(record: AirtableRecord): Manager {
  const f = record.fields;
  return {
    id: friendlyId(f['ManagerID']) ?? record.id,
    displayName: str(f['Name']) ?? 'Unnamed Manager',
    slug: str(f['Slug']) ?? record.id,
    active: bool(f['Active']),
    profileImageUrl: resolveImageUrl(f['Photo']),
    bio: str(f['Bio']),
  };
}

function transformTeam(record: AirtableRecord): Team {
  const f = record.fields;
  return {
    id: friendlyId(f['TeamID']) ?? record.id,
    city: str(f['City']) ?? '',
    teamName: str(f['TeamName']) ?? '',
    abbreviation: str(f['Abbreviation']) ?? '',
    slug: str(f['Slug']) ?? record.id,
    conference: str(f['Conference']) as Conference | undefined,
    division: str(f['Division']),
    primaryColor: str(f['PrimaryColor']),
    secondaryColor: str(f['SecondaryColor']),
    logoUrl: resolveImageUrl(f['Logo']) ?? '/images/teams/placeholder.svg',
    active: bool(f['Active']),
  };
}

function transformSeasonEntry(
  record: AirtableRecord,
  ids: { seasons: Map<string, string>; managers: Map<string, string>; teams: Map<string, string> }
): SeasonEntry {
  const f = record.fields;
  return {
    id: friendlyId(f['Entry ID']) ?? record.id,
    seasonId: resolve(ids.seasons, firstLink(f['Season'])) ?? '',
    managerId: resolve(ids.managers, firstLink(f['Manager'])) ?? '',
    teamId: resolve(ids.teams, firstLink(f['Team'])) ?? '',
    activeEntry: bool(f['Active']),
    playoffSeed: num(f['PlayoffSeed']),
    finalFinish: str(f['FinalFinish']) as FinalFinish | undefined,
  };
}

interface SeasonEntryInfo {
  teamId: string;
  managerId: string;
}

interface GameInfo {
  seasonId: string;
  week: number;
}

function transformGame(
  record: AirtableRecord,
  ids: { seasons: Map<string, string>; seasonEntries: Map<string, string> },
  seasonEntryInfoByFriendlyId: Map<string, SeasonEntryInfo>
): Game {
  const f = record.fields;
  const homeSeasonEntryId = resolve(ids.seasonEntries, firstLink(f['HomeEntry'])) ?? '';
  const awaySeasonEntryId = resolve(ids.seasonEntries, firstLink(f['AwayEntry'])) ?? '';
  const homeInfo = seasonEntryInfoByFriendlyId.get(homeSeasonEntryId);
  const awayInfo = seasonEntryInfoByFriendlyId.get(awaySeasonEntryId);

  return {
    id: friendlyId(f['GameID']) ?? record.id,
    seasonId: resolve(ids.seasons, firstLink(f['Season'])) ?? '',
    week: num(f['Week']) ?? 0,
    gameDate: str(f['GameDate']),
    gameType: (str(f['GameType']) as GameType) ?? 'Regular Season',
    status: (str(f['Status']) as GameStatus) ?? 'Scheduled',
    homeSeasonEntryId,
    awaySeasonEntryId,
    homeTeamId: homeInfo?.teamId ?? '',
    awayTeamId: awayInfo?.teamId ?? '',
    homeManagerId: homeInfo?.managerId ?? '',
    awayManagerId: awayInfo?.managerId ?? '',
    homeScore: num(f['HomeScore']),
    awayScore: num(f['AwayScore']),
    overtime: bool(f['Overtime']),
    recap: str(f['Recap']),
    featuredGame: bool(f['FeaturedGame']),
  };
}

function transformPlayerStats(
  record: AirtableRecord,
  ids: { games: Map<string, string>; seasonEntries: Map<string, string> },
  gameInfoByFriendlyId: Map<string, GameInfo>,
  seasonEntryInfoByFriendlyId: Map<string, SeasonEntryInfo>
): PlayerStats {
  const f = record.fields;
  const gameId = resolve(ids.games, firstLink(f['Game'])) ?? '';
  const gameInfo = gameInfoByFriendlyId.get(gameId);
  // This base's Player Stats table uses no-space field names (PlayerName,
  // PassingTD, ...) rather than the spec's spaced names — matched here as-is
  // rather than renaming ~19 live fields in Airtable.
  const seasonEntryId = resolve(ids.seasonEntries, firstLink(f['SeasonEntry'])) ?? '';
  const entryInfo = seasonEntryInfoByFriendlyId.get(seasonEntryId);

  return {
    // No dedicated ID formula field for this table in the spec — the raw
    // Airtable record ID is unique and stable enough on its own.
    id: record.id,
    gameId,
    seasonId: gameInfo?.seasonId ?? '',
    week: gameInfo?.week ?? 0,
    seasonEntryId,
    teamId: entryInfo?.teamId ?? '',
    managerId: entryInfo?.managerId ?? '',
    playerName: str(f['PlayerName']) ?? 'Unknown Player',
    position: (str(f['Position']) as PlayerPosition) ?? 'OTHER',
    passCompletions: num(f['PassCompletions']),
    passAttempts: num(f['PassAttempts']),
    passingYards: num(f['PassingYards']),
    passingTouchdowns: num(f['PassingTD']),
    interceptionsThrown: num(f['InterceptionsThrown']),
    rushAttempts: num(f['RushAttempts']),
    rushingYards: num(f['RushingYards']),
    rushingTouchdowns: num(f['RushingTD']),
    longRush: num(f['LongRush']),
    receptions: num(f['Receptions']),
    receivingYards: num(f['ReceivingYards']),
    receivingTouchdowns: num(f['ReceivingTD']),
    longReception: num(f['LongReception']),
    tackles: num(f['Tackles']),
    sacks: num(f['Sacks']),
    interceptions: num(f['Interceptions']),
    forcedFumbles: num(f['ForcedFumbles']),
    fumbleRecoveries: num(f['FumbleRecoveries']),
    defensiveTouchdowns: num(f['DefensiveTD']),
    fumbles: num(f['Fumbles']),
    fumblesLost: num(f['FumblesLost']),
  };
}

function transformNews(record: AirtableRecord, ids: { seasons: Map<string, string> }): NewsArticle {
  const f = record.fields;
  return {
    id: friendlyId(f['News ID']) ?? record.id,
    title: str(f['Title']) ?? 'Untitled',
    slug: str(f['Slug']) ?? record.id,
    publishDate: str(f['PublishDate']) ?? new Date(0).toISOString(),
    status: (str(f['Status']) as NewsStatus) ?? 'Draft',
    summary: str(f['Summary']) ?? '',
    body: str(f['Body']) ?? '',
    featuredImageUrl: resolveImageUrl(f['FeaturedImage']),
    seasonId: resolve(ids.seasons, firstLink(f['Season'])),
    week: num(f['Week']),
    featured: bool(f['Featured']),
    author: str(f['Author']),
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function fetchLeagueDatasetFromAirtable(env: Env): Promise<LeagueDataset> {
  const [rawSeasons, rawManagers, rawTeams, rawSeasonEntries, rawGames, rawPlayerStats, rawNews] =
    await Promise.all([
      listAllRecords(env, AIRTABLE_TABLES.seasons),
      listAllRecords(env, AIRTABLE_TABLES.managers),
      listAllRecords(env, AIRTABLE_TABLES.teams),
      listAllRecords(env, AIRTABLE_TABLES.seasonEntries),
      listAllRecords(env, AIRTABLE_TABLES.games),
      listAllRecords(env, AIRTABLE_TABLES.playerStats),
      listAllRecords(env, AIRTABLE_TABLES.news),
    ]);

  const managerIds = buildFriendlyIdMap(rawManagers, 'ManagerID');
  const teamIds = buildFriendlyIdMap(rawTeams, 'TeamID');
  const seasonIds = buildFriendlyIdMap(rawSeasons, 'SeasonID');
  const seasonEntryIds = buildFriendlyIdMap(rawSeasonEntries, 'Entry ID');
  const gameIds = buildFriendlyIdMap(rawGames, 'GameID');

  const seasons = rawSeasons.map((r) => transformSeason(r, { managers: managerIds })).filter((s) => s.public);
  const publicSeasonIds = new Set(seasons.map((s) => s.id));

  const managers = rawManagers.map((r) => transformManager(r));
  const teams = rawTeams.map((r) => transformTeam(r));

  const seasonEntries = rawSeasonEntries
    .map((r) => transformSeasonEntry(r, { seasons: seasonIds, managers: managerIds, teams: teamIds }))
    .filter((entry) => publicSeasonIds.has(entry.seasonId));

  const seasonEntryInfoByFriendlyId = new Map<string, SeasonEntryInfo>(
    seasonEntries.map((entry) => [entry.id, { teamId: entry.teamId, managerId: entry.managerId }])
  );

  const games = rawGames
    .map((r) => transformGame(r, { seasons: seasonIds, seasonEntries: seasonEntryIds }, seasonEntryInfoByFriendlyId))
    .filter((game) => publicSeasonIds.has(game.seasonId));

  const gameInfoByFriendlyId = new Map<string, GameInfo>(
    games.map((game) => [game.id, { seasonId: game.seasonId, week: game.week }])
  );

  const playerStats = rawPlayerStats
    .map((r) =>
      transformPlayerStats(
        r,
        { games: gameIds, seasonEntries: seasonEntryIds },
        gameInfoByFriendlyId,
        seasonEntryInfoByFriendlyId
      )
    )
    .filter((row) => publicSeasonIds.has(row.seasonId));

  const news = rawNews
    .map((r) => transformNews(r, { seasons: seasonIds }))
    .filter((article) => article.status === 'Published');

  return {
    leagueName: 'PUNT',
    seasons,
    managers,
    teams,
    seasonEntries,
    games,
    playerStats,
    news,
  };
}
