/**
 * Domain types for the PUNT site, matching the 7-table Airtable architecture:
 * Seasons, Managers, Teams, Season Entries, Games, Player Stats, News.
 * These are the shapes produced by src/lib/api.ts (from either mock data or
 * Airtable), consumed by pages and returned by src/pages/api/*.ts. They
 * intentionally do not mirror raw Airtable records — see
 * src/lib/airtableTransform.ts for that mapping.
 */

export type SeasonStatus = 'Upcoming' | 'Active' | 'Completed';

export interface Season {
  id: string;
  name: string;
  maddenVersion?: string;
  startDate?: string;
  endDate?: string;
  status: SeasonStatus;
  currentWeek?: number;
  regularSeasonWeeks?: number;
  championManagerId?: string;
  runnerUpManagerId?: string;
  public: boolean;
}

export interface Manager {
  id: string;
  displayName: string;
  slug: string;
  active: boolean;
  profileImageUrl?: string;
  bio?: string;
}

export type Conference = 'AFC' | 'NFC';

export interface Team {
  id: string;
  city: string;
  teamName: string;
  abbreviation: string;
  slug: string;
  conference?: Conference;
  division?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl: string;
  active: boolean;
}

export type FinalFinish = 'Regular Season' | 'Playoff Qualifier' | 'Semifinalist' | 'Runner-Up' | 'Champion';

export interface SeasonEntry {
  id: string;
  seasonId: string;
  managerId: string;
  teamId: string;
  activeEntry: boolean;
  playoffSeed?: number;
  finalFinish?: FinalFinish;
}

export type GameType = 'Regular Season' | 'Playoff' | 'Championship' | 'Exhibition';
export type GameStatus = 'Scheduled' | 'Final' | 'Postponed' | 'Cancelled';

export interface Game {
  id: string;
  seasonId: string;
  week: number;
  gameDate?: string;
  gameType: GameType;
  status: GameStatus;
  homeSeasonEntryId: string;
  awaySeasonEntryId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeManagerId: string;
  awayManagerId: string;
  homeScore?: number;
  awayScore?: number;
  overtime?: boolean;
  recap?: string;
  featuredGame?: boolean;
}

export type PlayerPosition =
  | 'QB' | 'RB' | 'FB' | 'WR' | 'TE'
  | 'OL' | 'DL' | 'DE' | 'DT' | 'LB' | 'CB' | 'S' | 'K' | 'P' | 'OTHER';

/**
 * One player's full statistical line from one game — passing, rushing,
 * receiving, and defensive stats can all appear on the same record. There is
 * intentionally no separate Players table; `playerName` is the Madden roster
 * name as typed by the commissioner. Grouping/aggregation normalizes it
 * (trim + case-insensitive) rather than relying on a stable player ID.
 */
export interface PlayerStats {
  id: string;
  gameId: string;
  seasonId: string;
  week: number;
  seasonEntryId: string;
  teamId: string;
  managerId: string;
  playerName: string;
  position: PlayerPosition;

  // Passing
  passCompletions?: number;
  passAttempts?: number;
  passingYards?: number;
  passingTouchdowns?: number;
  interceptionsThrown?: number;

  // Rushing
  rushAttempts?: number;
  rushingYards?: number;
  rushingTouchdowns?: number;
  longRush?: number;

  // Receiving
  receptions?: number;
  receivingYards?: number;
  receivingTouchdowns?: number;
  longReception?: number;

  // Defense
  tackles?: number;
  sacks?: number;
  interceptions?: number;
  forcedFumbles?: number;
  fumbleRecoveries?: number;
  defensiveTouchdowns?: number;

  // Turnovers/fumbles — optional; may go unused if hard to collect consistently.
  fumbles?: number;
  fumblesLost?: number;
}

export type NewsStatus = 'Draft' | 'Published';

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  publishDate: string;
  status: NewsStatus;
  summary: string;
  body: string;
  featuredImageUrl?: string;
  seasonId?: string;
  week?: number;
  featured?: boolean;
  author?: string;
}

// ---------------------------------------------------------------------------
// Denormalized summaries embedded in computed/API response shapes
// ---------------------------------------------------------------------------

export interface TeamSummary {
  id: string;
  city: string;
  teamName: string;
  name: string;
  abbreviation: string;
  slug: string;
  logoUrl: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface ManagerSummary {
  id: string;
  name: string;
  slug: string;
  profileImageUrl?: string;
}

// ---------------------------------------------------------------------------
// Computed / derived types
// ---------------------------------------------------------------------------

export interface Standing {
  rank: number;
  seasonEntryId: string;
  team: TeamSummary;
  manager: ManagerSummary;
  wins: number;
  losses: number;
  ties: number;
  winPercentage: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  gamesPlayed: number;
  streak: string;
  playoffSeed?: number;
}

export interface ManagerCareerSummary {
  managerId: string;
  displayName: string;
  slug: string;
  currentTeam?: TeamSummary;
  careerGames: number;
  careerWins: number;
  careerLosses: number;
  careerTies: number;
  careerWinPercentage: number;
  careerPointsFor: number;
  careerPointsAgainst: number;
  careerPointDifferential: number;
  careerPlayoffWins: number;
  careerPlayoffLosses: number;
  championshipAppearances: number;
  championships: number;
  seasonsPlayed: number;
  currentStreak: string;
  longestWinStreak: number;
  currentSeasonRecord?: {
    wins: number;
    losses: number;
    ties: number;
  };
}

export interface HeadToHeadRecord {
  opponentManagerId: string;
  opponentName: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
}

export interface GameSummary {
  id: string;
  seasonId: string;
  week: number;
  gameDate?: string;
  gameType: GameType;
  status: GameStatus;
  homeTeam: TeamSummary;
  awayTeam: TeamSummary;
  homeManager: ManagerSummary;
  awayManager: ManagerSummary;
  homeScore?: number;
  awayScore?: number;
  isTie?: boolean;
  overtime?: boolean;
  recap?: string;
  featuredGame?: boolean;
}

export type StatCategory = 'passing' | 'rushing' | 'receiving' | 'defense' | 'team' | 'manager';

export interface PlayerLeaderboardEntry {
  rank: number;
  playerName: string;
  position: PlayerPosition;
  team: TeamSummary;
  manager: ManagerSummary;
  games: number;

  // Passing
  completions?: number;
  attempts?: number;
  completionPercentage?: number;
  passingYards?: number;
  passingTouchdowns?: number;
  interceptions?: number;

  // Rushing
  rushAttempts?: number;
  rushingYards?: number;
  yardsPerAttempt?: number;
  rushingTouchdowns?: number;
  longRush?: number;

  // Receiving
  receptions?: number;
  receivingYards?: number;
  yardsPerReception?: number;
  receivingTouchdowns?: number;
  longReception?: number;

  // Defense
  sacks?: number;
  forcedFumbles?: number;
  fumbleRecoveries?: number;
  defensiveTouchdowns?: number;
  tackles?: number;
}

export interface TeamLeaderboardEntry {
  rank: number;
  team: TeamSummary;
  manager: ManagerSummary;
  games: number;
  pointsPerGame: number;
  pointsAllowedPerGame: number;
  pointDifferentialPerGame: number;
  offensiveYardsPerGame: number;
  passingYardsPerGame: number;
  rushingYardsPerGame: number;
  turnoversPerGame: number;
  takeawaysPerGame: number;
  turnoverDifferential: number;
  sacksPerGame: number;
  tacklesPerGame: number;
}

export interface ManagerStatsEntry {
  manager: ManagerSummary;
  team: TeamSummary;
  wins: number;
  losses: number;
  winPercentage: number;
  pointsPerGame: number;
  pointsAllowedPerGame: number;
  pointDifferential: number;
  turnovers: number;
  takeaways: number;
}

export interface SiteInfo {
  leagueName: string;
  activeSeasonId: string | null;
  seasons: Pick<Season, 'id' | 'name' | 'status'>[];
}

/**
 * The full league dataset, in the shape both the mock data module and the
 * Airtable transform layer produce. Everything else (calculations, pages,
 * API routes) is written against this shape so the data source is an
 * implementation detail.
 */
export interface LeagueDataset {
  leagueName: string;
  seasons: Season[];
  managers: Manager[];
  teams: Team[];
  seasonEntries: SeasonEntry[];
  games: Game[];
  playerStats: PlayerStats[];
  news: NewsArticle[];
}
