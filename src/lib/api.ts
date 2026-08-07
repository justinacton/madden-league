import type { Env } from './env';
import { isMockMode } from './env';
import { mockData } from './mock';
import { fetchLeagueDatasetFromAirtable } from './airtableTransform';
import { getOrFetchWithCache } from './cache';
import type {
  GameSummary,
  GameStatus,
  GameType,
  LeagueDataset,
  ManagerCareerSummary,
  NewsArticle,
  PlayerLeaderboardEntry,
  PowerRanking,
  Season,
  SiteInfo,
  Standing,
  Team,
  TeamLeaderboardEntry,
  TeamSummary,
  ManagerSummary,
} from './types';
import {
  computeAllManagerCareerSummaries,
  computeDefenseLeaderboard,
  computeHeadToHead,
  computeManagerCareerSummary,
  computeManagerSeasonStats,
  computePassingLeaderboard,
  computeReceivingLeaderboard,
  computeRushingLeaderboard,
  computeStandings,
  computeTeamLeaderboard,
  filterFinalRegularSeasonGames,
  findNumberOneDefense,
  findNumberOneOffense,
  sortGamesChronologically,
  toGameSummary,
  toManagerSummary,
  toTeamSummary,
  type DefenseCategory,
} from './calculations';

const CACHE_TTL_SECONDS = 5 * 60;
const STALE_TTL_SECONDS = 6 * 60 * 60;

export interface DataOptions {
  bypassCache?: boolean;
}

export class LeagueDataUnavailableError extends Error {}

export async function getLeagueDataset(
  env: Env,
  opts: DataOptions = {}
): Promise<{ data: LeagueDataset; stale: boolean }> {
  if (isMockMode(env)) {
    return { data: mockData, stale: false };
  }

  try {
    const result = await getOrFetchWithCache(
      'league-dataset',
      { ttlSeconds: CACHE_TTL_SECONDS, staleTtlSeconds: STALE_TTL_SECONDS, bypass: opts.bypassCache },
      () => fetchLeagueDatasetFromAirtable(env)
    );
    return { data: result.data, stale: result.stale };
  } catch (error) {
    throw new LeagueDataUnavailableError(
      error instanceof Error ? error.message : 'League data is temporarily unavailable.'
    );
  }
}

function pickActiveOrLatestSeason(seasons: Season[]): Season | null {
  const publicSeasons = seasons.filter((s) => s.public);
  const active = publicSeasons.find((s) => s.status === 'Active');
  if (active) return active;
  const sorted = [...publicSeasons].sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''));
  return sorted[0] ?? null;
}

export async function getSiteInfo(env: Env, opts?: DataOptions): Promise<SiteInfo> {
  const { data } = await getLeagueDataset(env, opts);
  const publicSeasons = data.seasons.filter((s) => s.public);
  const active = pickActiveOrLatestSeason(data.seasons);
  return {
    leagueName: data.leagueName,
    activeSeasonId: active?.id ?? null,
    seasons: publicSeasons
      .map((s) => ({ id: s.id, name: s.name, status: s.status }))
      .sort((a, b) => b.id.localeCompare(a.id)),
  };
}

export async function getSeasons(env: Env, opts?: DataOptions): Promise<Season[]> {
  const { data } = await getLeagueDataset(env, opts);
  return data.seasons.filter((s) => s.public).sort((a, b) => b.id.localeCompare(a.id));
}

export async function getSeason(env: Env, seasonId: string, opts?: DataOptions): Promise<Season | null> {
  const { data } = await getLeagueDataset(env, opts);
  return data.seasons.find((s) => s.id === seasonId && s.public) ?? null;
}

export async function getStandings(env: Env, seasonId: string, opts?: DataOptions): Promise<Standing[]> {
  const { data } = await getLeagueDataset(env, opts);
  return computeStandings(seasonId, data);
}

export interface ScheduleFilters {
  week?: number;
  teamId?: string;
  managerId?: string;
  status?: GameStatus;
  gameType?: GameType;
}

export async function getSchedule(
  env: Env,
  seasonId: string,
  filters: ScheduleFilters = {},
  opts?: DataOptions
): Promise<GameSummary[]> {
  const { data } = await getLeagueDataset(env, opts);
  let games = data.games.filter((g) => g.seasonId === seasonId);
  if (filters.week !== undefined) games = games.filter((g) => g.week === filters.week);
  if (filters.teamId) games = games.filter((g) => g.homeTeamId === filters.teamId || g.awayTeamId === filters.teamId);
  if (filters.managerId) {
    games = games.filter((g) => g.homeManagerId === filters.managerId || g.awayManagerId === filters.managerId);
  }
  if (filters.status) games = games.filter((g) => g.status === filters.status);
  if (filters.gameType) games = games.filter((g) => g.gameType === filters.gameType);

  return sortGamesChronologically(games)
    .map((game) => toGameSummary(game, data))
    .filter((summary): summary is GameSummary => summary !== null);
}

export interface StatLine {
  label: string;
  team: TeamSummary;
  manager: ManagerSummary;
  value: string;
}

export interface GameDetail {
  game: GameSummary;
  homeStats: ReturnType<typeof buildTeamStatLine> | null;
  awayStats: ReturnType<typeof buildTeamStatLine> | null;
  leaders: {
    passing: StatLine[];
    rushing: StatLine[];
    receiving: StatLine[];
    defense: StatLine[];
  };
}

function buildTeamStatLine(data: LeagueDataset, gameId: string, teamId: string) {
  const row = data.teamGameStats.find((r) => r.gameId === gameId && r.teamId === teamId);
  return row ?? null;
}

export async function getGameDetail(env: Env, gameId: string, opts?: DataOptions): Promise<GameDetail | null> {
  const { data } = await getLeagueDataset(env, opts);
  const game = data.games.find((g) => g.id === gameId);
  if (!game) return null;
  const summary = toGameSummary(game, data);
  if (!summary) return null;

  const playerRows = data.playerGameStats.filter((r) => r.gameId === gameId);
  const playersById = new Map(data.players.map((p) => [p.id, p]));
  const teamsById = new Map(data.teams.map((t) => [t.id, t]));
  const managersById = new Map(data.managers.map((m) => [m.id, m]));

  const topBy = (
    rows: typeof playerRows,
    selector: (r: (typeof playerRows)[number]) => number | undefined,
    formatter: (r: (typeof playerRows)[number]) => string
  ): StatLine[] => {
    return [game.homeTeamId, game.awayTeamId]
      .map((teamId) => {
        const candidates = rows.filter((r) => r.teamId === teamId && (selector(r) ?? 0) > 0);
        const best = candidates.sort((a, b) => (selector(b) ?? 0) - (selector(a) ?? 0))[0];
        if (!best) return null;
        const player = playersById.get(best.playerId);
        const team = teamsById.get(best.teamId);
        const manager = managersById.get(best.managerId);
        if (!player || !team || !manager) return null;
        return {
          label: player.fullName,
          team: toTeamSummary(team),
          manager: toManagerSummary(manager),
          value: formatter(best),
        };
      })
      .filter((line): line is StatLine => line !== null);
  };

  return {
    game: summary,
    homeStats: buildTeamStatLine(data, gameId, game.homeTeamId),
    awayStats: buildTeamStatLine(data, gameId, game.awayTeamId),
    leaders: {
      passing: topBy(
        playerRows,
        (r) => r.passingYards,
        (r) => `${r.passingYards ?? 0} yds, ${r.passingTouchdowns ?? 0} TD`
      ),
      rushing: topBy(
        playerRows,
        (r) => r.rushingYards,
        (r) => `${r.rushingYards ?? 0} yds, ${r.rushingTouchdowns ?? 0} TD`
      ),
      receiving: topBy(
        playerRows,
        (r) => r.receivingYards,
        (r) => `${r.receivingYards ?? 0} yds, ${r.receivingTouchdowns ?? 0} TD`
      ),
      defense: topBy(
        playerRows,
        (r) => (r.sacks ?? 0) + (r.interceptions ?? 0) * 2,
        (r) => `${r.tackles ?? 0} tkl, ${r.sacks ?? 0} sk, ${r.interceptions ?? 0} INT`
      ),
    },
  };
}

export interface TeamListEntry {
  team: TeamSummary;
  manager: ManagerSummary;
  standing: Standing | null;
}

export async function getTeamsForSeason(env: Env, seasonId: string, opts?: DataOptions): Promise<TeamListEntry[]> {
  const { data } = await getLeagueDataset(env, opts);
  const standings = computeStandings(seasonId, data);
  const standingsByTeamId = new Map(standings.map((s) => [s.team.id, s]));
  const entries = data.seasonEntries.filter((e) => e.seasonId === seasonId);
  const teamsById = new Map(data.teams.map((t) => [t.id, t]));
  const managersById = new Map(data.managers.map((m) => [m.id, m]));

  return entries
    .map((entry) => {
      const team = teamsById.get(entry.teamId);
      const manager = managersById.get(entry.managerId);
      if (!team || !manager) return null;
      return {
        team: toTeamSummary(team),
        manager: toManagerSummary(manager),
        standing: standingsByTeamId.get(team.id) ?? null,
      };
    })
    .filter((entry): entry is TeamListEntry => entry !== null)
    .sort((a, b) => (a.standing?.rank ?? 99) - (b.standing?.rank ?? 99));
}

export interface TeamDetail {
  team: Team;
  currentManager: ManagerSummary | null;
  currentStanding: Standing | null;
  schedule: GameSummary[];
  historicalSeasons: { seasonId: string; seasonName: string; managerName: string; finalFinish?: string }[];
}

export async function getTeamDetail(
  env: Env,
  teamSlug: string,
  seasonId: string,
  opts?: DataOptions
): Promise<TeamDetail | null> {
  const { data } = await getLeagueDataset(env, opts);
  const team = data.teams.find((t) => t.slug === teamSlug);
  if (!team) return null;

  const currentEntry = data.seasonEntries.find((e) => e.seasonId === seasonId && e.teamId === team.id);
  const currentManager = currentEntry
    ? data.managers.find((m) => m.id === currentEntry.managerId)
    : undefined;
  const standings = computeStandings(seasonId, data);
  const currentStanding = standings.find((s) => s.team.id === team.id) ?? null;

  const schedule = sortGamesChronologically(
    data.games.filter((g) => g.seasonId === seasonId && (g.homeTeamId === team.id || g.awayTeamId === team.id))
  )
    .map((game) => toGameSummary(game, data))
    .filter((s): s is GameSummary => s !== null);

  const historicalSeasons = data.seasonEntries
    .filter((e) => e.teamId === team.id)
    .map((entry) => {
      const season = data.seasons.find((s) => s.id === entry.seasonId);
      const manager = data.managers.find((m) => m.id === entry.managerId);
      if (!season || !manager) return null;
      return {
        seasonId: season.id,
        seasonName: season.name,
        managerName: manager.displayName,
        finalFinish: entry.finalFinish,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.seasonId.localeCompare(a.seasonId));

  return {
    team,
    currentManager: currentManager ? toManagerSummary(currentManager) : null,
    currentStanding,
    schedule,
    historicalSeasons,
  };
}

export async function getManagerLeaderboard(env: Env, opts?: DataOptions): Promise<ManagerCareerSummary[]> {
  const { data } = await getLeagueDataset(env, opts);
  const activeSeason = pickActiveOrLatestSeason(data.seasons);
  return computeAllManagerCareerSummaries(data, activeSeason?.id).sort(
    (a, b) => b.careerWins - a.careerWins || b.careerWinPercentage - a.careerWinPercentage
  );
}

export interface ManagerDetail {
  summary: ManagerCareerSummary;
  teamsBySeason: { seasonId: string; seasonName: string; team: TeamSummary; finalFinish?: string }[];
  recentGames: GameSummary[];
  headToHead: ReturnType<typeof computeHeadToHead>[];
}

export async function getManagerDetail(
  env: Env,
  managerSlug: string,
  opts?: DataOptions
): Promise<ManagerDetail | null> {
  const { data } = await getLeagueDataset(env, opts);
  const manager = data.managers.find((m) => m.slug === managerSlug);
  if (!manager) return null;

  const activeSeason = pickActiveOrLatestSeason(data.seasons);
  const summary = computeManagerCareerSummary(manager.id, data, activeSeason?.id ?? undefined);
  if (!summary) return null;

  const teamsBySeason = data.seasonEntries
    .filter((e) => e.managerId === manager.id)
    .map((entry) => {
      const season = data.seasons.find((s) => s.id === entry.seasonId);
      const team = data.teams.find((t) => t.id === entry.teamId);
      if (!season || !team) return null;
      return { seasonId: season.id, seasonName: season.name, team: toTeamSummary(team), finalFinish: entry.finalFinish };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.seasonId.localeCompare(a.seasonId));

  const recentGames = sortGamesChronologically(
    filterFinalRegularSeasonGames(data.games).filter(
      (g) => g.homeManagerId === manager.id || g.awayManagerId === manager.id
    )
  )
    .slice(-10)
    .reverse()
    .map((game) => toGameSummary(game, data))
    .filter((s): s is GameSummary => s !== null);

  const opponents = data.managers.filter((m) => m.id !== manager.id);
  const headToHead = opponents
    .map((opponent) => computeHeadToHead(manager.id, opponent.id, data))
    .filter((record) => record.wins + record.losses + record.ties > 0)
    .sort((a, b) => a.opponentName.localeCompare(b.opponentName));

  return { summary, teamsBySeason, recentGames, headToHead };
}

export interface StatsResult {
  passing?: PlayerLeaderboardEntry[];
  rushing?: PlayerLeaderboardEntry[];
  receiving?: PlayerLeaderboardEntry[];
  defense?: PlayerLeaderboardEntry[];
  team?: TeamLeaderboardEntry[];
  manager?: Awaited<ReturnType<typeof computeManagerSeasonStats>>;
}

export async function getPassingStats(env: Env, seasonId: string, opts?: DataOptions) {
  const { data } = await getLeagueDataset(env, opts);
  return computePassingLeaderboard(seasonId, data);
}

export async function getRushingStats(env: Env, seasonId: string, opts?: DataOptions) {
  const { data } = await getLeagueDataset(env, opts);
  return computeRushingLeaderboard(seasonId, data);
}

export async function getReceivingStats(env: Env, seasonId: string, opts?: DataOptions) {
  const { data } = await getLeagueDataset(env, opts);
  return computeReceivingLeaderboard(seasonId, data);
}

export async function getDefenseStats(env: Env, seasonId: string, category: DefenseCategory, opts?: DataOptions) {
  const { data } = await getLeagueDataset(env, opts);
  return computeDefenseLeaderboard(seasonId, category, data);
}

export async function getTeamStats(env: Env, seasonId: string, opts?: DataOptions) {
  const { data } = await getLeagueDataset(env, opts);
  return computeTeamLeaderboard(seasonId, data);
}

export async function getManagerSeasonStats(env: Env, seasonId: string, opts?: DataOptions) {
  const { data } = await getLeagueDataset(env, opts);
  return computeManagerSeasonStats(seasonId, data);
}

export interface HomeDashboard {
  season: Season;
  managerCount: number;
  numberOneTeam: (Standing & { team: TeamSummary }) | null;
  numberOneOffense: TeamLeaderboardEntry | null;
  numberOneDefense: TeamLeaderboardEntry | null;
  passingLeader: PlayerLeaderboardEntry | null;
  rushingLeader: PlayerLeaderboardEntry | null;
  receivingLeader: PlayerLeaderboardEntry | null;
  sackLeader: PlayerLeaderboardEntry | null;
  interceptionLeader: PlayerLeaderboardEntry | null;
  standingsPreview: Standing[];
  currentWeekGames: GameSummary[];
  recentResults: GameSummary[];
  news: NewsArticle[];
  powerRankings: (PowerRanking & { team: TeamSummary; manager: ManagerSummary })[];
  leagueLeaders: {
    passing: PlayerLeaderboardEntry[];
    rushing: PlayerLeaderboardEntry[];
    receiving: PlayerLeaderboardEntry[];
    sacks: PlayerLeaderboardEntry[];
    interceptions: PlayerLeaderboardEntry[];
  };
}

export async function getHomeDashboard(env: Env, opts?: DataOptions): Promise<HomeDashboard | null> {
  const { data } = await getLeagueDataset(env, opts);
  const season = pickActiveOrLatestSeason(data.seasons);
  if (!season) return null;

  const standings = computeStandings(season.id, data);
  const teamLeaderboard = computeTeamLeaderboard(season.id, data);
  const passing = computePassingLeaderboard(season.id, data);
  const rushing = computeRushingLeaderboard(season.id, data);
  const receiving = computeReceivingLeaderboard(season.id, data);
  const sacks = computeDefenseLeaderboard(season.id, 'sacks', data);
  const interceptions = computeDefenseLeaderboard(season.id, 'interceptions', data);

  const managerCount = new Set(data.seasonEntries.filter((e) => e.seasonId === season.id).map((e) => e.managerId))
    .size;

  const currentWeek = season.currentWeek ?? 1;
  const currentWeekGames = sortGamesChronologically(
    data.games.filter((g) => g.seasonId === season.id && g.week === currentWeek)
  )
    .map((g) => toGameSummary(g, data))
    .filter((s): s is GameSummary => s !== null);

  const recentResults = sortGamesChronologically(
    filterFinalRegularSeasonGames(data.games.filter((g) => g.seasonId === season.id))
  )
    .slice(-6)
    .reverse()
    .map((g) => toGameSummary(g, data))
    .filter((s): s is GameSummary => s !== null);

  const teamsById = new Map(data.teams.map((t) => [t.id, t]));
  const managersById = new Map(data.managers.map((m) => [m.id, m]));
  const latestPowerRankingWeek = Math.max(
    0,
    ...data.powerRankings.filter((r) => r.seasonId === season.id && r.published).map((r) => r.week)
  );
  const powerRankings = data.powerRankings
    .filter((r) => r.seasonId === season.id && r.published && r.week === latestPowerRankingWeek)
    .sort((a, b) => a.rank - b.rank)
    .map((ranking) => {
      const entry = data.seasonEntries.find((e) => e.id === ranking.seasonEntryId);
      const team = entry ? teamsById.get(entry.teamId) : undefined;
      const manager = entry ? managersById.get(entry.managerId) : undefined;
      if (!team || !manager) return null;
      return { ...ranking, team: toTeamSummary(team), manager: toManagerSummary(manager) };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  return {
    season,
    managerCount,
    numberOneTeam: standings[0] ?? null,
    numberOneOffense: findNumberOneOffense(teamLeaderboard),
    numberOneDefense: findNumberOneDefense(teamLeaderboard),
    passingLeader: passing[0] ?? null,
    rushingLeader: rushing[0] ?? null,
    receivingLeader: receiving[0] ?? null,
    sackLeader: sacks[0] ?? null,
    interceptionLeader: interceptions[0] ?? null,
    standingsPreview: standings.slice(0, standings.length <= 8 ? standings.length : 4),
    currentWeekGames,
    recentResults,
    news: data.news
      .filter((n) => n.status === 'Published')
      .sort((a, b) => b.publishDate.localeCompare(a.publishDate))
      .slice(0, 3),
    powerRankings,
    leagueLeaders: {
      passing: passing.slice(0, 3),
      rushing: rushing.slice(0, 3),
      receiving: receiving.slice(0, 3),
      sacks: sacks.slice(0, 3),
      interceptions: interceptions.slice(0, 3),
    },
  };
}

export interface NewsFilters {
  seasonId?: string;
}

export async function getNewsList(env: Env, filters: NewsFilters = {}, opts?: DataOptions): Promise<NewsArticle[]> {
  const { data } = await getLeagueDataset(env, opts);
  let articles = data.news.filter((n) => n.status === 'Published');
  if (filters.seasonId) articles = articles.filter((n) => n.seasonId === filters.seasonId);
  return articles.sort((a, b) => b.publishDate.localeCompare(a.publishDate));
}

export async function getNewsArticle(env: Env, slug: string, opts?: DataOptions): Promise<NewsArticle | null> {
  const { data } = await getLeagueDataset(env, opts);
  return data.news.find((n) => n.slug === slug && n.status === 'Published') ?? null;
}

export async function getPowerRankingsForSeason(
  env: Env,
  seasonId: string,
  opts?: DataOptions
): Promise<(PowerRanking & { team: TeamSummary; manager: ManagerSummary })[]> {
  const { data } = await getLeagueDataset(env, opts);
  const latestWeek = Math.max(
    0,
    ...data.powerRankings.filter((r) => r.seasonId === seasonId && r.published).map((r) => r.week)
  );
  const teamsById = new Map(data.teams.map((t) => [t.id, t]));
  const managersById = new Map(data.managers.map((m) => [m.id, m]));

  return data.powerRankings
    .filter((r) => r.seasonId === seasonId && r.published && r.week === latestWeek)
    .sort((a, b) => a.rank - b.rank)
    .map((ranking) => {
      const entry = data.seasonEntries.find((e) => e.id === ranking.seasonEntryId);
      const team = entry ? teamsById.get(entry.teamId) : undefined;
      const manager = entry ? managersById.get(entry.managerId) : undefined;
      if (!team || !manager) return null;
      return { ...ranking, team: toTeamSummary(team), manager: toManagerSummary(manager) };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
}
