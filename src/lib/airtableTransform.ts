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
  Player,
  PlayerGameStats,
  PlayerPosition,
  PowerRanking,
  Season,
  SeasonEntry,
  SeasonStatus,
  Team,
  TeamGameStats,
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
    const friendlyId = str(record.fields[idFieldName]) ?? record.id;
    map.set(record.id, friendlyId);
  }
  return map;
}

function resolve(map: Map<string, string>, recordId: string | undefined): string | undefined {
  if (!recordId) return undefined;
  return map.get(recordId);
}

// ---------------------------------------------------------------------------
// Per-table transforms
// ---------------------------------------------------------------------------

function transformSeason(
  record: AirtableRecord,
  ids: { managers: Map<string, string>; teams: Map<string, string> }
): Season {
  const f = record.fields;
  return {
    id: str(f['Season ID']) ?? record.id,
    name: str(f['Name']) ?? 'Untitled Season',
    maddenVersion: str(f['Madden Version']),
    startDate: str(f['Start Date']),
    endDate: str(f['End Date']),
    status: (str(f['Status']) as SeasonStatus) ?? 'Upcoming',
    currentWeek: num(f['Current Week']),
    regularSeasonWeeks: num(f['Regular Season Weeks']),
    championManagerId: resolve(ids.managers, firstLink(f['Champion Manager'])),
    championTeamId: resolve(ids.teams, firstLink(f['Champion Team'])),
    runnerUpManagerId: resolve(ids.managers, firstLink(f['Runner-Up Manager'])),
    runnerUpTeamId: resolve(ids.teams, firstLink(f['Runner-Up Team'])),
    public: bool(f['Public']),
  };
}

function transformManager(record: AirtableRecord, ids: { seasons: Map<string, string> }): Manager {
  const f = record.fields;
  return {
    id: str(f['Manager ID']) ?? record.id,
    displayName: str(f['Display Name']) ?? 'Unnamed Manager',
    slug: str(f['Slug']) ?? record.id,
    active: bool(f['Active']),
    profileImageUrl: resolveImageUrl(f['Profile Image']),
    bio: str(f['Bio']),
    joinedSeasonId: resolve(ids.seasons, firstLink(f['Joined Season'])),
  };
}

function transformTeam(record: AirtableRecord): Team {
  const f = record.fields;
  return {
    id: str(f['Team ID']) ?? record.id,
    city: str(f['City']) ?? '',
    teamName: str(f['Team Name']) ?? '',
    abbreviation: str(f['Abbreviation']) ?? '',
    slug: str(f['Slug']) ?? record.id,
    conference: str(f['Conference']) as Conference | undefined,
    division: str(f['Division']),
    primaryColor: str(f['Primary Color']),
    secondaryColor: str(f['Secondary Color']),
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
    id: str(f['Season Entry ID']) ?? record.id,
    seasonId: resolve(ids.seasons, firstLink(f['Season'])) ?? '',
    managerId: resolve(ids.managers, firstLink(f['Manager'])) ?? '',
    teamId: resolve(ids.teams, firstLink(f['Team'])) ?? '',
    activeEntry: bool(f['Active Entry']),
    conference: str(f['Conference']) as Conference | undefined,
    division: str(f['Division']),
    playoffSeed: num(f['Playoff Seed']),
    finalFinish: str(f['Final Finish']) as FinalFinish | undefined,
  };
}

function transformGame(
  record: AirtableRecord,
  ids: {
    seasons: Map<string, string>;
    seasonEntries: Map<string, string>;
    teams: Map<string, string>;
    managers: Map<string, string>;
  }
): Game {
  const f = record.fields;
  const homeSeasonEntryId = resolve(ids.seasonEntries, firstLink(f['Home Season Entry'])) ?? '';
  const awaySeasonEntryId = resolve(ids.seasonEntries, firstLink(f['Away Season Entry'])) ?? '';
  return {
    id: str(f['Game ID']) ?? record.id,
    seasonId: resolve(ids.seasons, firstLink(f['Season'])) ?? '',
    week: num(f['Week']) ?? 0,
    gameDate: str(f['Game Date']),
    gameType: (str(f['Game Type']) as GameType) ?? 'Regular Season',
    status: (str(f['Status']) as GameStatus) ?? 'Scheduled',
    homeSeasonEntryId,
    awaySeasonEntryId,
    homeTeamId: resolve(ids.teams, firstLink(f['Home Team'])) ?? '',
    awayTeamId: resolve(ids.teams, firstLink(f['Away Team'])) ?? '',
    homeManagerId: resolve(ids.managers, firstLink(f['Home Manager'])) ?? '',
    awayManagerId: resolve(ids.managers, firstLink(f['Away Manager'])) ?? '',
    homeScore: num(f['Home Score']),
    awayScore: num(f['Away Score']),
    winnerManagerId: resolve(ids.managers, firstLink(f['Winner Manager'])),
    winnerTeamId: resolve(ids.teams, firstLink(f['Winner Team'])),
    losingManagerId: resolve(ids.managers, firstLink(f['Losing Manager'])),
    losingTeamId: resolve(ids.teams, firstLink(f['Losing Team'])),
    isTie: bool(f['Is Tie']),
    overtime: bool(f['Overtime']),
    recap: str(f['Recap']),
    featuredGame: bool(f['Featured Game']),
    // Screenshot Folder URL is intentionally never surfaced — internal commissioner reference only.
    publicNotes: str(f['Public Notes']),
    lastUpdated: str(f['Last Updated']),
  };
}

interface GameInfo {
  seasonId: string;
  week: number;
}

function transformTeamGameStats(
  record: AirtableRecord,
  ids: {
    games: Map<string, string>;
    seasonEntries: Map<string, string>;
    teams: Map<string, string>;
    managers: Map<string, string>;
    gameInfoByFriendlyId: Map<string, GameInfo>;
  }
): TeamGameStats {
  const f = record.fields;
  const gameId = resolve(ids.games, firstLink(f['Game'])) ?? '';
  const gameInfo = ids.gameInfoByFriendlyId.get(gameId);
  return {
    id: str(f['Team Game Stat ID']) ?? record.id,
    gameId,
    // Season/Week are lookups through Game in Airtable; derive them from the
    // already-resolved Game record instead of re-parsing the lookup shape.
    seasonId: gameInfo?.seasonId ?? '',
    week: gameInfo?.week ?? 0,
    seasonEntryId: resolve(ids.seasonEntries, firstLink(f['Season Entry'])) ?? '',
    teamId: resolve(ids.teams, firstLink(f['Team'])) ?? '',
    managerId: resolve(ids.managers, firstLink(f['Manager'])) ?? '',
    points: num(f['Points']) ?? 0,
    totalOffenseYards: num(f['Total Offense Yards']),
    passingYards: num(f['Passing Yards']),
    rushingYards: num(f['Rushing Yards']),
    firstDowns: num(f['First Downs']),
    turnovers: num(f['Turnovers']),
    takeaways: num(f['Takeaways']),
    sacksAllowed: num(f['Sacks Allowed']),
    defensiveSacks: num(f['Defensive Sacks']),
    thirdDownMade: num(f['Third Down Made']),
    thirdDownAttempts: num(f['Third Down Attempts']),
    redZoneTDs: num(f['Red Zone TDs']),
    redZoneAttempts: num(f['Red Zone Attempts']),
  };
}

function transformPlayer(record: AirtableRecord, ids: { teams: Map<string, string> }): Player {
  const f = record.fields;
  return {
    id: str(f['Player ID']) ?? record.id,
    fullName: str(f['Full Name']) ?? 'Unnamed Player',
    slug: str(f['Slug']) ?? record.id,
    position: (str(f['Position']) as PlayerPosition) ?? 'WR',
    nflTeamId: resolve(ids.teams, firstLink(f['NFL Team'])) ?? '',
    active: bool(f['Active']),
    headshotUrl: resolveImageUrl(f['Headshot']),
    sortName: str(f['Sort Name']),
  };
}

function transformPlayerGameStats(
  record: AirtableRecord,
  ids: {
    games: Map<string, string>;
    players: Map<string, string>;
    seasonEntries: Map<string, string>;
    teams: Map<string, string>;
    managers: Map<string, string>;
    gameInfoByFriendlyId: Map<string, GameInfo>;
  }
): PlayerGameStats {
  const f = record.fields;
  const gameId = resolve(ids.games, firstLink(f['Game'])) ?? '';
  const gameInfo = ids.gameInfoByFriendlyId.get(gameId);
  return {
    id: str(f['Player Game Stat ID']) ?? record.id,
    gameId,
    seasonId: gameInfo?.seasonId ?? '',
    week: gameInfo?.week ?? 0,
    playerId: resolve(ids.players, firstLink(f['Player'])) ?? '',
    position: (str(f['Position']) as PlayerPosition) ?? 'WR',
    seasonEntryId: resolve(ids.seasonEntries, firstLink(f['Season Entry'])) ?? '',
    teamId: resolve(ids.teams, firstLink(f['Team'])) ?? '',
    managerId: resolve(ids.managers, firstLink(f['Manager'])) ?? '',
    gamesPlayedValue: num(f['Games Played Value']) ?? 1,
    passCompletions: num(f['Pass Completions']),
    passAttempts: num(f['Pass Attempts']),
    passingYards: num(f['Passing Yards']),
    passingTouchdowns: num(f['Passing Touchdowns']),
    interceptionsThrown: num(f['Interceptions Thrown']),
    sacksTaken: num(f['Sacks Taken']),
    passerRating: num(f['Passer Rating']),
    rushingAttempts: num(f['Rushing Attempts']),
    rushingYards: num(f['Rushing Yards']),
    rushingTouchdowns: num(f['Rushing Touchdowns']),
    longestRush: num(f['Longest Rush']),
    fumbles: num(f['Fumbles']),
    receptions: num(f['Receptions']),
    receivingYards: num(f['Receiving Yards']),
    receivingTouchdowns: num(f['Receiving Touchdowns']),
    longestReception: num(f['Longest Reception']),
    drops: num(f['Drops']),
    tackles: num(f['Tackles']),
    tacklesForLoss: num(f['Tackles for Loss']),
    sacks: num(f['Sacks']),
    interceptions: num(f['Interceptions']),
    forcedFumbles: num(f['Forced Fumbles']),
    fumbleRecoveries: num(f['Fumble Recoveries']),
    defensiveTouchdowns: num(f['Defensive Touchdowns']),
  };
}

function transformNews(record: AirtableRecord, ids: { seasons: Map<string, string> }): NewsArticle {
  const f = record.fields;
  return {
    id: str(f['News ID']) ?? record.id,
    title: str(f['Title']) ?? 'Untitled',
    slug: str(f['Slug']) ?? record.id,
    publishDate: str(f['Publish Date']) ?? new Date(0).toISOString(),
    status: (str(f['Status']) as NewsStatus) ?? 'Draft',
    summary: str(f['Summary']) ?? '',
    body: str(f['Body']) ?? '',
    featuredImageUrl: resolveImageUrl(f['Featured Image']),
    seasonId: resolve(ids.seasons, firstLink(f['Season'])),
    week: num(f['Week']),
    featured: bool(f['Featured']),
    author: str(f['Author']),
  };
}

function transformPowerRanking(
  record: AirtableRecord,
  ids: { seasons: Map<string, string>; seasonEntries: Map<string, string> }
): PowerRanking {
  const f = record.fields;
  return {
    id: str(f['Ranking ID']) ?? record.id,
    seasonId: resolve(ids.seasons, firstLink(f['Season'])) ?? '',
    week: num(f['Week']) ?? 0,
    rank: num(f['Rank']) ?? 0,
    previousRank: num(f['Previous Rank']),
    seasonEntryId: resolve(ids.seasonEntries, firstLink(f['Season Entry'])) ?? '',
    commentary: str(f['Commentary']),
    published: bool(f['Published']),
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function fetchLeagueDatasetFromAirtable(env: Env): Promise<LeagueDataset> {
  const [
    rawSeasons,
    rawManagers,
    rawTeams,
    rawSeasonEntries,
    rawGames,
    rawTeamGameStats,
    rawPlayers,
    rawPlayerGameStats,
    rawNews,
    rawPowerRankings,
  ] = await Promise.all([
    listAllRecords(env, AIRTABLE_TABLES.seasons),
    listAllRecords(env, AIRTABLE_TABLES.managers),
    listAllRecords(env, AIRTABLE_TABLES.teams),
    listAllRecords(env, AIRTABLE_TABLES.seasonEntries),
    listAllRecords(env, AIRTABLE_TABLES.games),
    listAllRecords(env, AIRTABLE_TABLES.teamGameStats),
    listAllRecords(env, AIRTABLE_TABLES.players),
    listAllRecords(env, AIRTABLE_TABLES.playerGameStats),
    listAllRecords(env, AIRTABLE_TABLES.news),
    listAllRecords(env, AIRTABLE_TABLES.powerRankings),
  ]);

  const seasonIds = buildFriendlyIdMap(rawSeasons, 'Season ID');
  const managerIds = buildFriendlyIdMap(rawManagers, 'Manager ID');
  const teamIds = buildFriendlyIdMap(rawTeams, 'Team ID');
  const seasonEntryIds = buildFriendlyIdMap(rawSeasonEntries, 'Season Entry ID');
  const gameIds = buildFriendlyIdMap(rawGames, 'Game ID');
  const playerIds = buildFriendlyIdMap(rawPlayers, 'Player ID');

  const seasons = rawSeasons
    .map((r) => transformSeason(r, { managers: managerIds, teams: teamIds }))
    .filter((season) => season.public);
  const publicSeasonIds = new Set(seasons.map((s) => s.id));

  const managers = rawManagers.map((r) => transformManager(r, { seasons: seasonIds }));
  const teams = rawTeams.map((r) => transformTeam(r));
  const seasonEntries = rawSeasonEntries
    .map((r) => transformSeasonEntry(r, { seasons: seasonIds, managers: managerIds, teams: teamIds }))
    .filter((entry) => publicSeasonIds.has(entry.seasonId));
  const games = rawGames
    .map((r) => transformGame(r, { seasons: seasonIds, seasonEntries: seasonEntryIds, teams: teamIds, managers: managerIds }))
    .filter((game) => publicSeasonIds.has(game.seasonId));

  const gameInfoByFriendlyId = new Map<string, GameInfo>(
    games.map((game) => [game.id, { seasonId: game.seasonId, week: game.week }])
  );

  const teamGameStats = rawTeamGameStats
    .map((r) =>
      transformTeamGameStats(r, {
        games: gameIds,
        seasonEntries: seasonEntryIds,
        teams: teamIds,
        managers: managerIds,
        gameInfoByFriendlyId,
      })
    )
    .filter((row) => publicSeasonIds.has(row.seasonId));
  const players = rawPlayers.map((r) => transformPlayer(r, { teams: teamIds }));
  const playerGameStats = rawPlayerGameStats
    .map((r) =>
      transformPlayerGameStats(r, {
        games: gameIds,
        players: playerIds,
        seasonEntries: seasonEntryIds,
        teams: teamIds,
        managers: managerIds,
        gameInfoByFriendlyId,
      })
    )
    .filter((row) => publicSeasonIds.has(row.seasonId));
  const news = rawNews
    .map((r) => transformNews(r, { seasons: seasonIds }))
    .filter((article) => article.status === 'Published');
  const powerRankings = rawPowerRankings
    .map((r) => transformPowerRanking(r, { seasons: seasonIds, seasonEntries: seasonEntryIds }))
    .filter((ranking) => ranking.published);

  return {
    leagueName: 'PUNT',
    seasons,
    managers,
    teams,
    seasonEntries,
    games,
    teamGameStats,
    players,
    playerGameStats,
    news,
    powerRankings,
  };
}
