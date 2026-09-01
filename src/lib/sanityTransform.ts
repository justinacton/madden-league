import type { Env } from './env';
import { getSanityClient } from './sanity';
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

/**
 * Alternate data source, evaluated against the same LeagueDataset shape as
 * src/lib/airtableTransform.ts. Not wired into getLeagueDataset() in api.ts
 * yet — this is a standalone path to try Sanity against the same schema
 * (studio/schemaTypes) the site already understands.
 *
 * Unlike Airtable, GROQ dereferences (`->`) resolve linked documents
 * directly, so there's no need for the friendly-ID map-building
 * airtableTransform.ts does — a reference's target slug is read straight off
 * the query result.
 */

// ---------------------------------------------------------------------------
// Raw query result shapes (nulls, not undefined — Sanity/GROQ has no
// "absent" distinct from "null" the way Airtable's JSON omits empty fields)
// ---------------------------------------------------------------------------

interface RawSeason {
  id: string | null;
  name: string | null;
  maddenVersion: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string | null;
  currentWeek: number | null;
  regularSeasonWeeks: number | null;
  championManagerId: string | null;
  runnerUpManagerId: string | null;
  public: boolean | null;
}

interface RawManager {
  id: string | null;
  displayName: string | null;
  slug: string | null;
  active: boolean | null;
  profileImageUrl: string | null;
  bio: string | null;
}

interface RawTeam {
  id: string | null;
  city: string | null;
  teamName: string | null;
  abbreviation: string | null;
  slug: string | null;
  conference: string | null;
  division: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  logoUrl: string | null;
  active: boolean | null;
}

interface RawSeasonEntry {
  id: string;
  seasonId: string | null;
  managerId: string | null;
  teamId: string | null;
  activeEntry: boolean | null;
  playoffSeed: number | null;
  finalFinish: string | null;
}

interface RawGame {
  id: string;
  seasonId: string | null;
  week: number | null;
  gameDate: string | null;
  gameType: string | null;
  status: string | null;
  homeSeasonEntryId: string | null;
  awaySeasonEntryId: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeManagerId: string | null;
  awayManagerId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  overtime: boolean | null;
  recap: string | null;
  featuredGame: boolean | null;
}

interface RawPlayerStats {
  id: string;
  gameId: string | null;
  seasonId: string | null;
  week: number | null;
  seasonEntryId: string | null;
  teamId: string | null;
  managerId: string | null;
  playerName: string | null;
  position: string | null;
  passCompletions: number | null;
  passAttempts: number | null;
  passingYards: number | null;
  passingTouchdowns: number | null;
  interceptionsThrown: number | null;
  rushAttempts: number | null;
  rushingYards: number | null;
  rushingTouchdowns: number | null;
  longRush: number | null;
  receptions: number | null;
  receivingYards: number | null;
  receivingTouchdowns: number | null;
  longReception: number | null;
  tackles: number | null;
  sacks: number | null;
  interceptions: number | null;
  forcedFumbles: number | null;
  fumbleRecoveries: number | null;
  defensiveTouchdowns: number | null;
  fumbles: number | null;
  fumblesLost: number | null;
}

interface RawNews {
  id: string | null;
  title: string | null;
  slug: string | null;
  publishDate: string | null;
  status: string | null;
  summary: string | null;
  body: string | null;
  featuredImageUrl: string | null;
  seasonId: string | null;
  week: number | null;
  featured: boolean | null;
  author: string | null;
}

interface RawDataset {
  seasons: RawSeason[];
  managers: RawManager[];
  teams: RawTeam[];
  seasonEntries: RawSeasonEntry[];
  games: RawGame[];
  playerStats: RawPlayerStats[];
  news: RawNews[];
}

// GROQ dereferences the way SQL joins do — homeEntry->team->slug.current
// walks Game -> Season Entry -> Team in one hop, no manual ID maps needed.
const QUERY = /* groq */ `{
  "seasons": *[_type == "season"]{
    "id": slug.current,
    name,
    maddenVersion,
    startDate,
    endDate,
    status,
    currentWeek,
    regularSeasonWeeks,
    "championManagerId": champion->slug.current,
    "runnerUpManagerId": runnerUp->slug.current,
    public
  },
  "managers": *[_type == "manager"]{
    "id": slug.current,
    "displayName": name,
    "slug": slug.current,
    active,
    "profileImageUrl": photo.asset->url,
    bio
  },
  "teams": *[_type == "team"]{
    "id": slug.current,
    city,
    teamName,
    abbreviation,
    "slug": slug.current,
    conference,
    division,
    primaryColor,
    secondaryColor,
    "logoUrl": logo.asset->url,
    active
  },
  "seasonEntries": *[_type == "seasonEntry"]{
    "id": _id,
    "seasonId": season->slug.current,
    "managerId": manager->slug.current,
    "teamId": team->slug.current,
    activeEntry,
    playoffSeed,
    finalFinish
  },
  "games": *[_type == "game"]{
    "id": _id,
    "seasonId": season->slug.current,
    week,
    gameDate,
    gameType,
    status,
    "homeSeasonEntryId": homeEntry->_id,
    "awaySeasonEntryId": awayEntry->_id,
    "homeTeamId": homeEntry->team->slug.current,
    "awayTeamId": awayEntry->team->slug.current,
    "homeManagerId": homeEntry->manager->slug.current,
    "awayManagerId": awayEntry->manager->slug.current,
    homeScore,
    awayScore,
    overtime,
    recap,
    featuredGame
  },
  "playerStats": *[_type == "playerStats"]{
    "id": _id,
    "gameId": game->_id,
    "seasonId": game->season->slug.current,
    "week": game->week,
    "seasonEntryId": seasonEntry->_id,
    "teamId": seasonEntry->team->slug.current,
    "managerId": seasonEntry->manager->slug.current,
    playerName,
    position,
    passCompletions, passAttempts, passingYards, passingTouchdowns, interceptionsThrown,
    rushAttempts, rushingYards, rushingTouchdowns, longRush,
    receptions, receivingYards, receivingTouchdowns, longReception,
    tackles, sacks, interceptions, forcedFumbles, fumbleRecoveries, defensiveTouchdowns,
    fumbles, fumblesLost
  },
  "news": *[_type == "newsArticle"]{
    "id": slug.current,
    title,
    "slug": slug.current,
    publishDate,
    status,
    summary,
    body,
    "featuredImageUrl": featuredImage.asset->url,
    "seasonId": season->slug.current,
    week,
    featured,
    author
  }
}`;

function str(value: string | null | undefined): string | undefined {
  return value ?? undefined;
}

function num(value: number | null | undefined): number | undefined {
  return value ?? undefined;
}

function transformSeason(r: RawSeason): Season {
  return {
    id: r.id ?? '',
    name: r.name ?? 'Untitled Season',
    maddenVersion: str(r.maddenVersion),
    startDate: str(r.startDate),
    endDate: str(r.endDate),
    status: (r.status as SeasonStatus | null) ?? 'Upcoming',
    currentWeek: num(r.currentWeek),
    regularSeasonWeeks: num(r.regularSeasonWeeks),
    championManagerId: str(r.championManagerId),
    runnerUpManagerId: str(r.runnerUpManagerId),
    public: r.public === true,
  };
}

function transformManager(r: RawManager): Manager {
  return {
    id: r.id ?? '',
    displayName: r.displayName ?? 'Unnamed Manager',
    slug: r.slug ?? '',
    active: r.active === true,
    profileImageUrl: str(r.profileImageUrl),
    bio: str(r.bio),
  };
}

function transformTeam(r: RawTeam): Team {
  return {
    id: r.id ?? '',
    city: r.city ?? '',
    teamName: r.teamName ?? '',
    abbreviation: r.abbreviation ?? '',
    slug: r.slug ?? '',
    conference: (r.conference as Conference | null) ?? undefined,
    division: str(r.division),
    primaryColor: str(r.primaryColor),
    secondaryColor: str(r.secondaryColor),
    logoUrl: r.logoUrl ?? '/images/teams/placeholder.svg',
    active: r.active === true,
  };
}

function transformSeasonEntry(r: RawSeasonEntry): SeasonEntry {
  return {
    id: r.id,
    seasonId: r.seasonId ?? '',
    managerId: r.managerId ?? '',
    teamId: r.teamId ?? '',
    activeEntry: r.activeEntry === true,
    playoffSeed: num(r.playoffSeed),
    finalFinish: (r.finalFinish as FinalFinish | null) ?? undefined,
  };
}

function transformGame(r: RawGame): Game {
  return {
    id: r.id,
    seasonId: r.seasonId ?? '',
    week: num(r.week) ?? 0,
    gameDate: str(r.gameDate),
    gameType: (r.gameType as GameType | null) ?? 'Regular Season',
    status: (r.status as GameStatus | null) ?? 'Scheduled',
    homeSeasonEntryId: r.homeSeasonEntryId ?? '',
    awaySeasonEntryId: r.awaySeasonEntryId ?? '',
    homeTeamId: r.homeTeamId ?? '',
    awayTeamId: r.awayTeamId ?? '',
    homeManagerId: r.homeManagerId ?? '',
    awayManagerId: r.awayManagerId ?? '',
    homeScore: num(r.homeScore),
    awayScore: num(r.awayScore),
    overtime: r.overtime === true,
    recap: str(r.recap),
    featuredGame: r.featuredGame === true,
  };
}

function transformPlayerStats(r: RawPlayerStats): PlayerStats {
  return {
    id: r.id,
    gameId: r.gameId ?? '',
    seasonId: r.seasonId ?? '',
    week: num(r.week) ?? 0,
    seasonEntryId: r.seasonEntryId ?? '',
    teamId: r.teamId ?? '',
    managerId: r.managerId ?? '',
    playerName: r.playerName ?? 'Unknown Player',
    position: (r.position as PlayerPosition | null) ?? 'OTHER',
    passCompletions: num(r.passCompletions),
    passAttempts: num(r.passAttempts),
    passingYards: num(r.passingYards),
    passingTouchdowns: num(r.passingTouchdowns),
    interceptionsThrown: num(r.interceptionsThrown),
    rushAttempts: num(r.rushAttempts),
    rushingYards: num(r.rushingYards),
    rushingTouchdowns: num(r.rushingTouchdowns),
    longRush: num(r.longRush),
    receptions: num(r.receptions),
    receivingYards: num(r.receivingYards),
    receivingTouchdowns: num(r.receivingTouchdowns),
    longReception: num(r.longReception),
    tackles: num(r.tackles),
    sacks: num(r.sacks),
    interceptions: num(r.interceptions),
    forcedFumbles: num(r.forcedFumbles),
    fumbleRecoveries: num(r.fumbleRecoveries),
    defensiveTouchdowns: num(r.defensiveTouchdowns),
    fumbles: num(r.fumbles),
    fumblesLost: num(r.fumblesLost),
  };
}

function transformNews(r: RawNews): NewsArticle {
  return {
    id: r.id ?? '',
    title: r.title ?? 'Untitled',
    slug: r.slug ?? '',
    publishDate: str(r.publishDate) ?? new Date(0).toISOString(),
    status: (r.status as NewsStatus | null) ?? 'Draft',
    summary: r.summary ?? '',
    body: r.body ?? '',
    featuredImageUrl: str(r.featuredImageUrl),
    seasonId: str(r.seasonId),
    week: num(r.week),
    featured: r.featured === true,
    author: str(r.author),
  };
}

export async function fetchLeagueDatasetFromSanity(env: Env): Promise<LeagueDataset> {
  const client = getSanityClient(env);
  const raw = await client.fetch<RawDataset>(QUERY);

  const seasons = raw.seasons.map(transformSeason).filter((s) => s.public);
  const publicSeasonIds = new Set(seasons.map((s) => s.id));

  const managers = raw.managers.map(transformManager);
  const teams = raw.teams.map(transformTeam);

  const seasonEntries = raw.seasonEntries
    .map(transformSeasonEntry)
    .filter((entry) => publicSeasonIds.has(entry.seasonId));

  const games = raw.games.map(transformGame).filter((game) => publicSeasonIds.has(game.seasonId));

  const playerStats = raw.playerStats
    .map(transformPlayerStats)
    .filter((row) => publicSeasonIds.has(row.seasonId));

  const news = raw.news.map(transformNews).filter((article) => article.status === 'Published');

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
