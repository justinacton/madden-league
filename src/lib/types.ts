/**
 * Domain types for the PUNT site. These are the shapes produced by
 * src/lib/api.ts (from either mock data or Airtable), consumed by pages and
 * returned by src/pages/api/*.ts. They intentionally do not mirror raw
 * Airtable records — see src/lib/airtableTransform.ts for that mapping.
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
  championTeamId?: string;
  runnerUpManagerId?: string;
  runnerUpTeamId?: string;
  public: boolean;
}

export interface Manager {
  id: string;
  displayName: string;
  slug: string;
  active: boolean;
  profileImageUrl?: string;
  bio?: string;
  joinedSeasonId?: string;
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

export type FinalFinish =
  | 'Champion'
  | 'Runner-Up'
  | 'Semifinal'
  | 'Quarterfinal'
  | 'Missed Playoffs'
  | 'Eliminated';

export interface SeasonEntry {
  id: string;
  seasonId: string;
  managerId: string;
  teamId: string;
  activeEntry: boolean;
  conference?: Conference;
  division?: string;
  playoffSeed?: number;
  finalFinish?: FinalFinish;
}

export type GameType = 'Regular Season' | 'Playoff' | 'Championship' | 'Exhibition';
export type GameStatus = 'Scheduled' | 'In Progress' | 'Final' | 'Postponed' | 'Cancelled';

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
  winnerManagerId?: string;
  winnerTeamId?: string;
  losingManagerId?: string;
  losingTeamId?: string;
  isTie?: boolean;
  overtime?: boolean;
  recap?: string;
  featuredGame?: boolean;
  publicNotes?: string;
  lastUpdated?: string;
}

export interface TeamGameStats {
  id: string;
  gameId: string;
  seasonId: string;
  week: number;
  seasonEntryId: string;
  teamId: string;
  managerId: string;
  points: number;
  totalOffenseYards?: number;
  passingYards?: number;
  rushingYards?: number;
  firstDowns?: number;
  turnovers?: number;
  takeaways?: number;
  sacksAllowed?: number;
  defensiveSacks?: number;
  timeOfPossessionSeconds?: number;
  thirdDownMade?: number;
  thirdDownAttempts?: number;
  redZoneTDs?: number;
  redZoneAttempts?: number;
}

export type PlayerPosition =
  | 'QB' | 'RB' | 'FB' | 'WR' | 'TE'
  | 'OL' | 'DL' | 'LB' | 'CB' | 'S' | 'K' | 'P';

export interface Player {
  id: string;
  fullName: string;
  slug: string;
  position: PlayerPosition;
  nflTeamId: string;
  active: boolean;
  headshotUrl?: string;
  sortName?: string;
}

export interface PlayerGameStats {
  id: string;
  gameId: string;
  seasonId: string;
  week: number;
  playerId: string;
  position: PlayerPosition;
  seasonEntryId: string;
  teamId: string;
  managerId: string;
  gamesPlayedValue: number;

  // Passing
  passCompletions?: number;
  passAttempts?: number;
  passingYards?: number;
  passingTouchdowns?: number;
  interceptionsThrown?: number;
  sacksTaken?: number;
  passerRating?: number;

  // Rushing
  rushingAttempts?: number;
  rushingYards?: number;
  rushingTouchdowns?: number;
  longestRush?: number;
  fumbles?: number;

  // Receiving
  receptions?: number;
  receivingYards?: number;
  receivingTouchdowns?: number;
  longestReception?: number;
  drops?: number;

  // Defense
  tackles?: number;
  tacklesForLoss?: number;
  sacks?: number;
  interceptions?: number;
  forcedFumbles?: number;
  fumbleRecoveries?: number;
  defensiveTouchdowns?: number;
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

export interface PowerRanking {
  id: string;
  seasonId: string;
  week: number;
  rank: number;
  previousRank?: number;
  seasonEntryId: string;
  commentary?: string;
  published: boolean;
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
  conferenceRecord?: string;
  divisionRecord?: string;
  lastFive?: string;
  playoffSeed?: number;
}

export interface ManagerCareerSummary {
  managerId: string;
  displayName: string;
  slug: string;
  currentTeam?: TeamSummary;
  careerWins: number;
  careerLosses: number;
  careerTies: number;
  careerWinPercentage: number;
  careerPlayoffWins: number;
  careerPlayoffLosses: number;
  championships: number;
  runnerUpFinishes: number;
  seasonsPlayed: number;
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
  publicNotes?: string;
}

export type StatCategory = 'passing' | 'rushing' | 'receiving' | 'defense' | 'team' | 'manager';
export type DefenseSubCategory =
  | 'sacks' | 'interceptions' | 'forcedFumbles' | 'fumbleRecoveries' | 'defensiveTouchdowns' | 'tackles';

export interface PlayerLeaderboardEntry {
  rank: number;
  playerId: string;
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
  passerRating?: number;

  // Rushing
  rushingAttempts?: number;
  rushingYards?: number;
  yardsPerAttempt?: number;
  rushingTouchdowns?: number;
  longestRush?: number;

  // Receiving
  receptions?: number;
  receivingYards?: number;
  yardsPerReception?: number;
  receivingTouchdowns?: number;
  longestReception?: number;

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
  teamGameStats: TeamGameStats[];
  players: Player[];
  playerGameStats: PlayerGameStats[];
  news: NewsArticle[];
  powerRankings: PowerRanking[];
}
