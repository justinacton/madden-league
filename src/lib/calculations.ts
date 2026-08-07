import type {
  Game,
  GameSummary,
  Manager,
  ManagerCareerSummary,
  ManagerStatsEntry,
  HeadToHeadRecord,
  PlayerGameStats,
  PlayerLeaderboardEntry,
  PlayerPosition,
  Season,
  SeasonEntry,
  Standing,
  Team,
  TeamGameStats,
  TeamLeaderboardEntry,
  TeamSummary,
  ManagerSummary,
} from './types';

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

/** Division that returns 0 instead of NaN/Infinity when the denominator is 0. */
export function safeDivide(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return numerator / denominator;
}

export function toTeamSummary(team: Team): TeamSummary {
  return {
    id: team.id,
    city: team.city,
    teamName: team.teamName,
    name: `${team.city} ${team.teamName}`,
    abbreviation: team.abbreviation,
    slug: team.slug,
    logoUrl: team.logoUrl,
    primaryColor: team.primaryColor,
    secondaryColor: team.secondaryColor,
  };
}

export function toManagerSummary(manager: Manager): ManagerSummary {
  return {
    id: manager.id,
    name: manager.displayName,
    slug: manager.slug,
    profileImageUrl: manager.profileImageUrl,
  };
}

function byId<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

export function toGameSummary(
  game: Game,
  input: { teams: Team[]; managers: Manager[] }
): GameSummary | null {
  const teamsById = byId(input.teams);
  const managersById = byId(input.managers);
  const homeTeam = teamsById.get(game.homeTeamId);
  const awayTeam = teamsById.get(game.awayTeamId);
  const homeManager = managersById.get(game.homeManagerId);
  const awayManager = managersById.get(game.awayManagerId);
  if (!homeTeam || !awayTeam || !homeManager || !awayManager) return null;

  return {
    id: game.id,
    seasonId: game.seasonId,
    week: game.week,
    gameDate: game.gameDate,
    gameType: game.gameType,
    status: game.status,
    homeTeam: toTeamSummary(homeTeam),
    awayTeam: toTeamSummary(awayTeam),
    homeManager: toManagerSummary(homeManager),
    awayManager: toManagerSummary(awayManager),
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    isTie: game.isTie,
    overtime: game.overtime,
    recap: game.recap,
    featuredGame: game.featuredGame,
    publicNotes: game.publicNotes,
  };
}

// ---------------------------------------------------------------------------
// Game filtering
//
// Rule used consistently across this module: regular-season statistics
// (standings, team stats, manager stats, player leaderboards) only count
// games with status "Final" and gameType "Regular Season". Exhibition games
// never count toward any statistic. Playoff/Championship results feed career
// playoff records and final finishes, but not the regular-season leaderboards.
// ---------------------------------------------------------------------------

export function filterFinalRegularSeasonGames(games: Game[]): Game[] {
  return games.filter((game) => game.status === 'Final' && game.gameType === 'Regular Season');
}

export function filterFinalPlayoffGames(games: Game[]): Game[] {
  return games.filter(
    (game) => game.status === 'Final' && (game.gameType === 'Playoff' || game.gameType === 'Championship')
  );
}

export type GameResult = 'W' | 'L' | 'T';

/** Result of a completed game from the perspective of a given Season Entry, or null if not applicable. */
export function getGameResultForEntry(game: Game, seasonEntryId: string): GameResult | null {
  if (game.status !== 'Final') return null;
  const isHome = game.homeSeasonEntryId === seasonEntryId;
  const isAway = game.awaySeasonEntryId === seasonEntryId;
  if (!isHome && !isAway) return null;
  const homeScore = game.homeScore ?? 0;
  const awayScore = game.awayScore ?? 0;
  if (homeScore === awayScore) return 'T';
  const homeWon = homeScore > awayScore;
  if (isHome) return homeWon ? 'W' : 'L';
  return homeWon ? 'L' : 'W';
}

function pointsForAgainst(game: Game, seasonEntryId: string): { pointsFor: number; pointsAgainst: number } {
  const isHome = game.homeSeasonEntryId === seasonEntryId;
  const homeScore = game.homeScore ?? 0;
  const awayScore = game.awayScore ?? 0;
  return isHome
    ? { pointsFor: homeScore, pointsAgainst: awayScore }
    : { pointsFor: awayScore, pointsAgainst: homeScore };
}

export interface SeasonEntryRecord {
  wins: number;
  losses: number;
  ties: number;
  gamesPlayed: number;
  pointsFor: number;
  pointsAgainst: number;
}

export function computeRecord(games: Game[], seasonEntryId: string): SeasonEntryRecord {
  const record: SeasonEntryRecord = {
    wins: 0,
    losses: 0,
    ties: 0,
    gamesPlayed: 0,
    pointsFor: 0,
    pointsAgainst: 0,
  };

  for (const game of games) {
    const result = getGameResultForEntry(game, seasonEntryId);
    if (!result) continue;
    record.gamesPlayed += 1;
    if (result === 'W') record.wins += 1;
    else if (result === 'L') record.losses += 1;
    else record.ties += 1;

    const { pointsFor, pointsAgainst } = pointsForAgainst(game, seasonEntryId);
    record.pointsFor += pointsFor;
    record.pointsAgainst += pointsAgainst;
  }

  return record;
}

export function computeWinPercentage(wins: number, ties: number, gamesPlayed: number): number {
  if (gamesPlayed === 0) return 0;
  return (wins + 0.5 * ties) / gamesPlayed;
}

export function computePointDifferential(pointsFor: number, pointsAgainst: number): number {
  return pointsFor - pointsAgainst;
}

export function computePointsPerGame(pointsFor: number, gamesPlayed: number): number {
  return safeDivide(pointsFor, gamesPlayed);
}

export function computePointsAllowedPerGame(pointsAgainst: number, gamesPlayed: number): number {
  return safeDivide(pointsAgainst, gamesPlayed);
}

function gameSortValue(game: Game): number {
  if (game.gameDate) {
    const time = new Date(game.gameDate).getTime();
    if (!Number.isNaN(time)) return time;
  }
  // Fall back to week number so games without a date still sort deterministically.
  return game.week * 1_000_000;
}

/** Sorts completed regular-season games chronologically (oldest first). */
export function sortGamesChronologically(games: Game[]): Game[] {
  return [...games].sort((a, b) => gameSortValue(a) - gameSortValue(b));
}

/**
 * Calculates the current streak (e.g. "W3", "L1", "T2") for a Season Entry
 * from its completed regular-season games, sorted chronologically first.
 */
export function computeStreak(games: Game[], seasonEntryId: string): string {
  const relevant = sortGamesChronologically(games).filter(
    (game) => getGameResultForEntry(game, seasonEntryId) !== null
  );
  if (relevant.length === 0) return '-';

  const lastGame = relevant[relevant.length - 1];
  if (!lastGame) return '-';
  const lastResult = getGameResultForEntry(lastGame, seasonEntryId);
  if (!lastResult) return '-';

  let count = 0;
  for (let i = relevant.length - 1; i >= 0; i -= 1) {
    const game = relevant[i];
    if (!game) break;
    const result = getGameResultForEntry(game, seasonEntryId);
    if (result !== lastResult) break;
    count += 1;
  }

  return `${lastResult}${count}`;
}

// ---------------------------------------------------------------------------
// Standings
// ---------------------------------------------------------------------------

export interface StandingsInput {
  seasonEntries: SeasonEntry[];
  games: Game[];
  teams: Team[];
  managers: Manager[];
}

export function computeStandings(seasonId: string, input: StandingsInput): Standing[] {
  const entriesForSeason = input.seasonEntries.filter((entry) => entry.seasonId === seasonId);
  const teamsById = byId(input.teams);
  const managersById = byId(input.managers);
  const regularSeasonGames = filterFinalRegularSeasonGames(
    input.games.filter((game) => game.seasonId === seasonId)
  );

  const unranked = entriesForSeason.map((entry) => {
    const team = teamsById.get(entry.teamId);
    const manager = managersById.get(entry.managerId);
    if (!team || !manager) {
      throw new Error(`Season entry ${entry.id} references a missing team or manager`);
    }
    const record = computeRecord(regularSeasonGames, entry.id);
    const winPercentage = computeWinPercentage(record.wins, record.ties, record.gamesPlayed);
    const pointDifferential = computePointDifferential(record.pointsFor, record.pointsAgainst);
    // Streaks reflect regular-season results only, consistent with the standings themselves.
    const streak = computeStreak(regularSeasonGames, entry.id);

    const standing: Standing = {
      rank: 0,
      seasonEntryId: entry.id,
      team: toTeamSummary(team),
      manager: toManagerSummary(manager),
      wins: record.wins,
      losses: record.losses,
      ties: record.ties,
      winPercentage,
      pointsFor: record.pointsFor,
      pointsAgainst: record.pointsAgainst,
      pointDifferential,
      gamesPlayed: record.gamesPlayed,
      streak,
      playoffSeed: entry.playoffSeed,
    };
    return standing;
  });

  const headToHeadWinner = (a: Standing, b: Standing): number => {
    const aVsB = computeRecord(
      regularSeasonGames.filter(
        (game) =>
          (game.homeSeasonEntryId === a.seasonEntryId && game.awaySeasonEntryId === b.seasonEntryId) ||
          (game.awaySeasonEntryId === a.seasonEntryId && game.homeSeasonEntryId === b.seasonEntryId)
      ),
      a.seasonEntryId
    );
    if (aVsB.gamesPlayed === 0) return 0;
    return aVsB.wins - aVsB.losses;
  };

  const sorted = [...unranked].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
    const headToHead = headToHeadWinner(a, b);
    if (headToHead !== 0) return -headToHead;
    if (b.pointDifferential !== a.pointDifferential) return b.pointDifferential - a.pointDifferential;
    return b.pointsFor - a.pointsFor;
  });

  return sorted.map((standing, index) => ({ ...standing, rank: index + 1 }));
}

// ---------------------------------------------------------------------------
// Manager career records
// ---------------------------------------------------------------------------

export interface CareerInput {
  managers: Manager[];
  seasonEntries: SeasonEntry[];
  games: Game[];
  teams: Team[];
  seasons: Season[];
}

export function computeManagerCareerSummary(
  managerId: string,
  input: CareerInput,
  currentSeasonId?: string
): ManagerCareerSummary | null {
  const manager = input.managers.find((m) => m.id === managerId);
  if (!manager) return null;

  const managerEntries = input.seasonEntries.filter((entry) => entry.managerId === managerId);
  const managerEntryIds = new Set(managerEntries.map((entry) => entry.id));

  const relevantGames = input.games.filter(
    (game) => managerEntryIds.has(game.homeSeasonEntryId) || managerEntryIds.has(game.awaySeasonEntryId)
  );
  const regularSeasonGames = filterFinalRegularSeasonGames(relevantGames);
  const playoffGames = filterFinalPlayoffGames(relevantGames);

  let careerWins = 0;
  let careerLosses = 0;
  let careerTies = 0;
  for (const entry of managerEntries) {
    const record = computeRecord(regularSeasonGames, entry.id);
    careerWins += record.wins;
    careerLosses += record.losses;
    careerTies += record.ties;
  }

  let careerPlayoffWins = 0;
  let careerPlayoffLosses = 0;
  for (const entry of managerEntries) {
    const record = computeRecord(playoffGames, entry.id);
    careerPlayoffWins += record.wins;
    careerPlayoffLosses += record.losses;
  }

  const seasonsPlayed = new Set(managerEntries.map((entry) => entry.seasonId)).size;
  const championships = input.seasons.filter((s) => s.championManagerId === managerId).length;
  const runnerUpFinishes = input.seasons.filter((s) => s.runnerUpManagerId === managerId).length;

  const careerGamesPlayed = careerWins + careerLosses + careerTies;
  const careerWinPercentage = computeWinPercentage(careerWins, careerTies, careerGamesPlayed);

  const currentEntry = currentSeasonId
    ? managerEntries.find((entry) => entry.seasonId === currentSeasonId)
    : undefined;
  const teamsById = byId(input.teams);
  const currentTeam = currentEntry ? teamsById.get(currentEntry.teamId) : undefined;

  let currentSeasonRecord: ManagerCareerSummary['currentSeasonRecord'];
  if (currentEntry) {
    const seasonGames = filterFinalRegularSeasonGames(
      input.games.filter((game) => game.seasonId === currentSeasonId)
    );
    const record = computeRecord(seasonGames, currentEntry.id);
    currentSeasonRecord = { wins: record.wins, losses: record.losses, ties: record.ties };
  }

  return {
    managerId,
    displayName: manager.displayName,
    slug: manager.slug,
    currentTeam: currentTeam ? toTeamSummary(currentTeam) : undefined,
    careerWins,
    careerLosses,
    careerTies,
    careerWinPercentage,
    careerPlayoffWins,
    careerPlayoffLosses,
    championships,
    runnerUpFinishes,
    seasonsPlayed,
    currentSeasonRecord,
  };
}

export function computeAllManagerCareerSummaries(
  input: CareerInput,
  currentSeasonId?: string
): ManagerCareerSummary[] {
  return input.managers
    .map((manager) => computeManagerCareerSummary(manager.id, input, currentSeasonId))
    .filter((summary): summary is ManagerCareerSummary => summary !== null);
}

/**
 * Head-to-head record between two managers across all completed regular
 * season games, using the manager linked to each Season Entry at the time
 * of the game (so a manager's record follows them across team changes).
 */
export function computeHeadToHead(
  managerAId: string,
  managerBId: string,
  input: { games: Game[]; managers: Manager[] }
): HeadToHeadRecord {
  const opponent = input.managers.find((m) => m.id === managerBId);
  const relevantGames = filterFinalRegularSeasonGames(input.games).filter(
    (game) =>
      (game.homeManagerId === managerAId && game.awayManagerId === managerBId) ||
      (game.awayManagerId === managerAId && game.homeManagerId === managerBId)
  );

  let wins = 0;
  let losses = 0;
  let ties = 0;
  let pointsFor = 0;
  let pointsAgainst = 0;

  for (const game of relevantGames) {
    const isA = game.homeManagerId === managerAId;
    const aScore = isA ? game.homeScore ?? 0 : game.awayScore ?? 0;
    const bScore = isA ? game.awayScore ?? 0 : game.homeScore ?? 0;
    pointsFor += aScore;
    pointsAgainst += bScore;
    if (aScore === bScore) ties += 1;
    else if (aScore > bScore) wins += 1;
    else losses += 1;
  }

  return {
    opponentManagerId: managerBId,
    opponentName: opponent?.displayName ?? 'Unknown Manager',
    wins,
    losses,
    ties,
    pointsFor,
    pointsAgainst,
    pointDifferential: pointsFor - pointsAgainst,
  };
}

// ---------------------------------------------------------------------------
// Team leaderboard / rankings
// ---------------------------------------------------------------------------

export interface TeamStatsInput {
  seasonEntries: SeasonEntry[];
  games: Game[];
  teamGameStats: TeamGameStats[];
  teams: Team[];
  managers: Manager[];
}

export function computeTeamLeaderboard(seasonId: string, input: TeamStatsInput): TeamLeaderboardEntry[] {
  const entries = input.seasonEntries.filter((entry) => entry.seasonId === seasonId);
  const teamsById = byId(input.teams);
  const managersById = byId(input.managers);
  const regularSeasonGameIds = new Set(
    filterFinalRegularSeasonGames(input.games.filter((game) => game.seasonId === seasonId)).map((g) => g.id)
  );

  const unranked = entries.map((entry) => {
    const team = teamsById.get(entry.teamId);
    const manager = managersById.get(entry.managerId);
    if (!team || !manager) {
      throw new Error(`Season entry ${entry.id} references a missing team or manager`);
    }
    const statsRows = input.teamGameStats.filter(
      (row) => row.seasonEntryId === entry.id && regularSeasonGameIds.has(row.gameId)
    );
    const games = statsRows.length;
    const sum = (selector: (row: TeamGameStats) => number | undefined) =>
      statsRows.reduce((total, row) => total + (selector(row) ?? 0), 0);

    const pointsFor = sum((r) => r.points);
    const pointsAgainstBySeasonEntry = computeRecord(
      input.games.filter((g) => regularSeasonGameIds.has(g.id)),
      entry.id
    ).pointsAgainst;
    const turnovers = sum((r) => r.turnovers);
    const takeaways = sum((r) => r.takeaways);

    const result: TeamLeaderboardEntry = {
      rank: 0,
      team: toTeamSummary(team),
      manager: toManagerSummary(manager),
      games,
      pointsPerGame: safeDivide(pointsFor, games),
      pointsAllowedPerGame: safeDivide(pointsAgainstBySeasonEntry, games),
      pointDifferentialPerGame: safeDivide(pointsFor - pointsAgainstBySeasonEntry, games),
      offensiveYardsPerGame: safeDivide(sum((r) => r.totalOffenseYards), games),
      passingYardsPerGame: safeDivide(sum((r) => r.passingYards), games),
      rushingYardsPerGame: safeDivide(sum((r) => r.rushingYards), games),
      turnoversPerGame: safeDivide(turnovers, games),
      takeawaysPerGame: safeDivide(takeaways, games),
      turnoverDifferential: takeaways - turnovers,
      sacksPerGame: safeDivide(sum((r) => r.defensiveSacks), games),
    };
    return result;
  });

  return unranked
    .sort((a, b) => b.pointsPerGame - a.pointsPerGame)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function findNumberOneOffense(leaderboard: TeamLeaderboardEntry[]): TeamLeaderboardEntry | null {
  const eligible = leaderboard.filter((entry) => entry.games > 0);
  if (eligible.length === 0) return null;
  return eligible.reduce((best, entry) => (entry.pointsPerGame > best.pointsPerGame ? entry : best));
}

export function findNumberOneDefense(leaderboard: TeamLeaderboardEntry[]): TeamLeaderboardEntry | null {
  const eligible = leaderboard.filter((entry) => entry.games > 0);
  if (eligible.length === 0) return null;
  return eligible.reduce((best, entry) =>
    entry.pointsAllowedPerGame < best.pointsAllowedPerGame ? entry : best
  );
}

// ---------------------------------------------------------------------------
// Manager (season) stats table
// ---------------------------------------------------------------------------

export function computeManagerSeasonStats(seasonId: string, input: TeamStatsInput): ManagerStatsEntry[] {
  const teamLeaderboard = computeTeamLeaderboard(seasonId, input);
  const standings = computeStandings(seasonId, {
    seasonEntries: input.seasonEntries,
    games: input.games,
    teams: input.teams,
    managers: input.managers,
  });
  const standingsByEntry = new Map(standings.map((s) => [s.seasonEntryId, s]));
  const entries = input.seasonEntries.filter((entry) => entry.seasonId === seasonId);

  return entries.map((entry) => {
    const teamStats = teamLeaderboard.find((t) => t.manager.id === entry.managerId);
    const standing = standingsByEntry.get(entry.id);
    return {
      manager: teamStats?.manager ?? { id: entry.managerId, name: 'Unknown', slug: 'unknown' },
      team: teamStats?.team ?? { id: entry.teamId, city: '', teamName: '', name: '', abbreviation: '', slug: '', logoUrl: '' },
      wins: standing?.wins ?? 0,
      losses: standing?.losses ?? 0,
      winPercentage: standing?.winPercentage ?? 0,
      pointsPerGame: teamStats?.pointsPerGame ?? 0,
      pointsAllowedPerGame: teamStats?.pointsAllowedPerGame ?? 0,
      pointDifferential: standing?.pointDifferential ?? 0,
      turnovers: Math.round((teamStats?.turnoversPerGame ?? 0) * (teamStats?.games ?? 0)),
      takeaways: Math.round((teamStats?.takeawaysPerGame ?? 0) * (teamStats?.games ?? 0)),
    };
  });
}

// ---------------------------------------------------------------------------
// Player leaderboards
// ---------------------------------------------------------------------------

export interface PlayerStatsInput {
  playerGameStats: PlayerGameStats[];
  players: { id: string; fullName: string; position: PlayerPosition }[];
  seasonEntries: SeasonEntry[];
  teams: Team[];
  managers: Manager[];
  games: Game[];
}

interface AggregatedPlayerStats {
  playerId: string;
  seasonEntryId: string;
  games: number;
  totals: Record<string, number>;
}

function aggregatePlayerGameStats(seasonId: string, input: PlayerStatsInput): AggregatedPlayerStats[] {
  const regularSeasonGameIds = new Set(
    filterFinalRegularSeasonGames(input.games.filter((g) => g.seasonId === seasonId)).map((g) => g.id)
  );
  const rows = input.playerGameStats.filter(
    (row) => row.seasonId === seasonId && regularSeasonGameIds.has(row.gameId)
  );

  const byPlayer = new Map<string, AggregatedPlayerStats>();
  const numericKeys: (keyof PlayerGameStats)[] = [
    'passCompletions', 'passAttempts', 'passingYards', 'passingTouchdowns', 'interceptionsThrown', 'sacksTaken',
    'rushingAttempts', 'rushingYards', 'rushingTouchdowns', 'longestRush', 'fumbles',
    'receptions', 'receivingYards', 'receivingTouchdowns', 'longestReception', 'drops',
    'tackles', 'tacklesForLoss', 'sacks', 'interceptions', 'forcedFumbles', 'fumbleRecoveries', 'defensiveTouchdowns',
  ];

  for (const row of rows) {
    const key = `${row.playerId}:${row.seasonEntryId}`;
    const existing = byPlayer.get(key) ?? {
      playerId: row.playerId,
      seasonEntryId: row.seasonEntryId,
      games: 0,
      totals: {},
    };
    existing.games += row.gamesPlayedValue ?? 1;
    for (const field of numericKeys) {
      const value = row[field];
      if (typeof value === 'number') {
        const isMaxStat = field === 'longestRush' || field === 'longestReception';
        existing.totals[field] = isMaxStat
          ? Math.max(existing.totals[field] ?? 0, value)
          : (existing.totals[field] ?? 0) + value;
      }
    }
    byPlayer.set(key, existing);
  }

  return Array.from(byPlayer.values());
}

function buildLeaderboardBase(
  aggregated: AggregatedPlayerStats,
  input: PlayerStatsInput
): { base: PlayerLeaderboardEntry; totals: Record<string, number> } | null {
  const player = input.players.find((p) => p.id === aggregated.playerId);
  const entry = input.seasonEntries.find((e) => e.id === aggregated.seasonEntryId);
  if (!player || !entry) return null;
  const team = input.teams.find((t) => t.id === entry.teamId);
  const manager = input.managers.find((m) => m.id === entry.managerId);
  if (!team || !manager) return null;

  return {
    base: {
      rank: 0,
      playerId: player.id,
      playerName: player.fullName,
      position: player.position,
      team: toTeamSummary(team),
      manager: toManagerSummary(manager),
      games: aggregated.games,
    },
    totals: aggregated.totals,
  };
}

function rank<T>(items: T[], sortDesc: (item: T) => number): (T & { rank: number })[] {
  return [...items]
    .sort((a, b) => sortDesc(b) - sortDesc(a))
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

export function computePassingLeaderboard(seasonId: string, input: PlayerStatsInput): PlayerLeaderboardEntry[] {
  const aggregated = aggregatePlayerGameStats(seasonId, input).filter((a) => (a.totals.passAttempts ?? 0) > 0);
  const entries = aggregated
    .map((a) => buildLeaderboardBase(a, input))
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .map(({ base, totals }) => ({
      ...base,
      completions: totals.passCompletions ?? 0,
      attempts: totals.passAttempts ?? 0,
      completionPercentage: safeDivide((totals.passCompletions ?? 0) * 100, totals.passAttempts ?? 0),
      passingYards: totals.passingYards ?? 0,
      passingTouchdowns: totals.passingTouchdowns ?? 0,
      interceptions: totals.interceptionsThrown ?? 0,
    }));
  return rank(entries, (e) => e.passingYards ?? 0);
}

export function computeRushingLeaderboard(seasonId: string, input: PlayerStatsInput): PlayerLeaderboardEntry[] {
  const aggregated = aggregatePlayerGameStats(seasonId, input).filter((a) => (a.totals.rushingAttempts ?? 0) > 0);
  const entries = aggregated
    .map((a) => buildLeaderboardBase(a, input))
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .map(({ base, totals }) => ({
      ...base,
      rushingAttempts: totals.rushingAttempts ?? 0,
      rushingYards: totals.rushingYards ?? 0,
      yardsPerAttempt: safeDivide(totals.rushingYards ?? 0, totals.rushingAttempts ?? 0),
      rushingTouchdowns: totals.rushingTouchdowns ?? 0,
      longestRush: totals.longestRush ?? 0,
    }));
  return rank(entries, (e) => e.rushingYards ?? 0);
}

export function computeReceivingLeaderboard(seasonId: string, input: PlayerStatsInput): PlayerLeaderboardEntry[] {
  const aggregated = aggregatePlayerGameStats(seasonId, input).filter((a) => (a.totals.receptions ?? 0) > 0);
  const entries = aggregated
    .map((a) => buildLeaderboardBase(a, input))
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .map(({ base, totals }) => ({
      ...base,
      receptions: totals.receptions ?? 0,
      receivingYards: totals.receivingYards ?? 0,
      yardsPerReception: safeDivide(totals.receivingYards ?? 0, totals.receptions ?? 0),
      receivingTouchdowns: totals.receivingTouchdowns ?? 0,
      longestReception: totals.longestReception ?? 0,
    }));
  return rank(entries, (e) => e.receivingYards ?? 0);
}

const DEFENSE_FIELD_MAP = {
  sacks: 'sacks',
  interceptions: 'interceptions',
  forcedFumbles: 'forcedFumbles',
  fumbleRecoveries: 'fumbleRecoveries',
  defensiveTouchdowns: 'defensiveTouchdowns',
  tackles: 'tackles',
} as const;

export type DefenseCategory = keyof typeof DEFENSE_FIELD_MAP;

export function computeDefenseLeaderboard(
  seasonId: string,
  category: DefenseCategory,
  input: PlayerStatsInput
): PlayerLeaderboardEntry[] {
  const field = DEFENSE_FIELD_MAP[category];
  const aggregated = aggregatePlayerGameStats(seasonId, input).filter((a) => (a.totals[field] ?? 0) > 0);
  const entries = aggregated
    .map((a) => buildLeaderboardBase(a, input))
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .map(({ base, totals }) => ({
      ...base,
      sacks: totals.sacks ?? 0,
      interceptions: totals.interceptions ?? 0,
      forcedFumbles: totals.forcedFumbles ?? 0,
      fumbleRecoveries: totals.fumbleRecoveries ?? 0,
      defensiveTouchdowns: totals.defensiveTouchdowns ?? 0,
      tackles: totals.tackles ?? 0,
    }));
  return rank(entries, (e) => e[category] ?? 0);
}
