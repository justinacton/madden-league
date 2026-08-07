import type { Game, PlayerGameStats, SeasonEntry, TeamGameStats } from '../types';
import { season1Entries, season2Entries } from './seasons';
import { playerIdsByTeamAndSlot } from './players';
import { createRng, pick, randomInt, roundRobinRounds } from './rng';

const rng = createRng(20260806);

function entryLookup(entries: SeasonEntry[]): Map<string, SeasonEntry> {
  const map = new Map<string, SeasonEntry>();
  for (const entry of entries) map.set(entry.teamId, entry);
  return map;
}

function addDays(iso: string, days: number): string {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

const TD_COUNT_WEIGHTS = [0, 0, 1, 1, 1, 2, 2, 3, 4];
const TURNOVER_WEIGHTS = [0, 0, 0, 1, 1, 2, 3];
const RARE_EVENT_WEIGHTS = [0, 0, 0, 0, 0, 0, 0, 1, 1, 2];

interface GeneratedGame {
  game: Game;
  teamGameStats: TeamGameStats[];
  playerGameStats: PlayerGameStats[];
}

function generateFinalGame(params: {
  id: string;
  seasonId: string;
  week: number;
  gameDate: string;
  gameType: Game['gameType'];
  homeTeamId: string;
  awayTeamId: string;
  entries: Map<string, SeasonEntry>;
  featured?: boolean;
  recap?: string;
  minMargin?: number;
}): GeneratedGame {
  const homeEntry = params.entries.get(params.homeTeamId);
  const awayEntry = params.entries.get(params.awayTeamId);
  if (!homeEntry || !awayEntry) {
    throw new Error(`Missing season entry for ${params.homeTeamId} or ${params.awayTeamId}`);
  }

  const homeScore = randomInt(rng, 10, 34);
  let awayScore = randomInt(rng, 10, 34);
  if (params.minMargin && Math.abs(homeScore - awayScore) < params.minMargin) {
    awayScore = homeScore - params.minMargin - randomInt(rng, 0, 6);
    if (awayScore < 0) awayScore = homeScore + params.minMargin + randomInt(rng, 0, 6);
  }
  const isTie = homeScore === awayScore;
  const homeWon = homeScore > awayScore;

  const game: Game = {
    id: params.id,
    seasonId: params.seasonId,
    week: params.week,
    gameDate: params.gameDate,
    gameType: params.gameType,
    status: 'Final',
    homeSeasonEntryId: homeEntry.id,
    awaySeasonEntryId: awayEntry.id,
    homeTeamId: params.homeTeamId,
    awayTeamId: params.awayTeamId,
    homeManagerId: homeEntry.managerId,
    awayManagerId: awayEntry.managerId,
    homeScore,
    awayScore,
    isTie,
    overtime: Math.abs(homeScore - awayScore) <= 3 && rng() > 0.7,
    winnerManagerId: isTie ? undefined : homeWon ? homeEntry.managerId : awayEntry.managerId,
    winnerTeamId: isTie ? undefined : homeWon ? params.homeTeamId : params.awayTeamId,
    losingManagerId: isTie ? undefined : homeWon ? awayEntry.managerId : homeEntry.managerId,
    losingTeamId: isTie ? undefined : homeWon ? params.awayTeamId : params.homeTeamId,
    recap: params.recap,
    featuredGame: params.featured,
    lastUpdated: params.gameDate,
  };

  // --- Team Game Stats -----------------------------------------------------
  const homeTurnovers = pick(rng, TURNOVER_WEIGHTS);
  const awayTurnovers = pick(rng, TURNOVER_WEIGHTS);
  const sacksOnHome = randomInt(rng, 0, 5);
  const sacksOnAway = randomInt(rng, 0, 5);

  const buildTeamStats = (
    entry: SeasonEntry,
    teamId: string,
    points: number,
    turnovers: number,
    takeaways: number,
    sacksAllowed: number,
    defensiveSacks: number
  ): TeamGameStats => {
    const totalOffenseYards = randomInt(rng, 260, 480);
    const passingYards = Math.round(totalOffenseYards * (0.5 + rng() * 0.2));
    const rushingYards = totalOffenseYards - passingYards;
    const thirdDownAttempts = randomInt(rng, 10, 15);
    const redZoneAttempts = randomInt(rng, 2, 5);
    return {
      id: `tgs-${params.id}-${teamId}`,
      gameId: params.id,
      seasonId: params.seasonId,
      week: params.week,
      seasonEntryId: entry.id,
      teamId,
      managerId: entry.managerId,
      points,
      totalOffenseYards,
      passingYards,
      rushingYards,
      firstDowns: randomInt(rng, 14, 26),
      turnovers,
      takeaways,
      sacksAllowed,
      defensiveSacks,
      timeOfPossessionSeconds: randomInt(rng, 1500, 2100),
      thirdDownMade: Math.round(thirdDownAttempts * (0.3 + rng() * 0.35)),
      thirdDownAttempts,
      redZoneTDs: Math.min(redZoneAttempts, randomInt(rng, 0, redZoneAttempts)),
      redZoneAttempts,
    };
  };

  const homeStats = buildTeamStats(homeEntry, params.homeTeamId, homeScore, homeTurnovers, awayTurnovers, sacksOnHome, sacksOnAway);
  const awayStats = buildTeamStats(awayEntry, params.awayTeamId, awayScore, awayTurnovers, homeTurnovers, sacksOnAway, sacksOnHome);

  // --- Player Game Stats -----------------------------------------------------
  const buildPlayerStats = (entry: SeasonEntry, teamId: string, teamStats: TeamGameStats): PlayerGameStats[] => {
    const slots = playerIdsByTeamAndSlot[teamId];
    if (!slots) return [];

    const passAttempts = randomInt(rng, 24, 40);
    const passCompletions = Math.round(passAttempts * (0.5 + rng() * 0.25));
    const passingTouchdowns = pick(rng, TD_COUNT_WEIGHTS);
    const giveaways = teamStats.turnovers ?? 0;
    const interceptionsThrown = Math.min(giveaways, Math.round(giveaways * 0.65));
    const fumbles = Math.max(0, giveaways - interceptionsThrown);

    const rushingAttempts = randomInt(rng, 10, 26);
    const rushingTouchdowns = pick(rng, TD_COUNT_WEIGHTS.slice(0, 6));

    const receptions = randomInt(rng, 2, 10);
    const receivingTouchdowns = Math.min(passingTouchdowns, pick(rng, TD_COUNT_WEIGHTS.slice(0, 6)));

    const qb: PlayerGameStats = {
      id: `pgs-${params.id}-${slots.qb}`,
      gameId: params.id,
      seasonId: params.seasonId,
      week: params.week,
      playerId: slots.qb,
      position: 'QB',
      seasonEntryId: entry.id,
      teamId,
      managerId: entry.managerId,
      gamesPlayedValue: 1,
      passCompletions,
      passAttempts,
      passingYards: teamStats.passingYards ?? randomInt(rng, 150, 380),
      passingTouchdowns,
      interceptionsThrown,
      sacksTaken: teamStats.sacksAllowed,
    };

    const rb: PlayerGameStats = {
      id: `pgs-${params.id}-${slots.rb}`,
      gameId: params.id,
      seasonId: params.seasonId,
      week: params.week,
      playerId: slots.rb,
      position: 'RB',
      seasonEntryId: entry.id,
      teamId,
      managerId: entry.managerId,
      gamesPlayedValue: 1,
      rushingAttempts,
      rushingYards: teamStats.rushingYards ?? randomInt(rng, 40, 160),
      rushingTouchdowns,
      longestRush: randomInt(rng, 6, 45),
      fumbles,
    };

    const wr: PlayerGameStats = {
      id: `pgs-${params.id}-${slots.wr}`,
      gameId: params.id,
      seasonId: params.seasonId,
      week: params.week,
      playerId: slots.wr,
      position: 'WR',
      seasonEntryId: entry.id,
      teamId,
      managerId: entry.managerId,
      gamesPlayedValue: 1,
      receptions,
      receivingYards: Math.round((teamStats.passingYards ?? 200) * (0.4 + rng() * 0.3)),
      receivingTouchdowns,
      longestReception: randomInt(rng, 9, 55),
    };

    const def: PlayerGameStats = {
      id: `pgs-${params.id}-${slots.def}`,
      gameId: params.id,
      seasonId: params.seasonId,
      week: params.week,
      playerId: slots.def,
      position: 'LB',
      seasonEntryId: entry.id,
      teamId,
      managerId: entry.managerId,
      gamesPlayedValue: 1,
      tackles: randomInt(rng, 3, 11),
      tacklesForLoss: randomInt(rng, 0, 2),
      sacks: Math.round((teamStats.defensiveSacks ?? 0) * (0.3 + rng() * 0.4) * 2) / 2,
      interceptions: pick(rng, RARE_EVENT_WEIGHTS),
      forcedFumbles: pick(rng, RARE_EVENT_WEIGHTS),
      fumbleRecoveries: pick(rng, RARE_EVENT_WEIGHTS),
      defensiveTouchdowns: rng() > 0.95 ? 1 : 0,
    };

    return [qb, rb, wr, def];
  };

  const playerStats = [
    ...buildPlayerStats(homeEntry, params.homeTeamId, homeStats),
    ...buildPlayerStats(awayEntry, params.awayTeamId, awayStats),
  ];

  return { game, teamGameStats: [homeStats, awayStats], playerGameStats: playerStats };
}

function generateScheduledGame(params: {
  id: string;
  seasonId: string;
  week: number;
  gameDate: string;
  gameType: Game['gameType'];
  homeTeamId: string;
  awayTeamId: string;
  entries: Map<string, SeasonEntry>;
}): Game {
  const homeEntry = params.entries.get(params.homeTeamId);
  const awayEntry = params.entries.get(params.awayTeamId);
  if (!homeEntry || !awayEntry) {
    throw new Error(`Missing season entry for ${params.homeTeamId} or ${params.awayTeamId}`);
  }
  return {
    id: params.id,
    seasonId: params.seasonId,
    week: params.week,
    gameDate: params.gameDate,
    gameType: params.gameType,
    status: 'Scheduled',
    homeSeasonEntryId: homeEntry.id,
    awaySeasonEntryId: awayEntry.id,
    homeTeamId: params.homeTeamId,
    awayTeamId: params.awayTeamId,
    homeManagerId: homeEntry.managerId,
    awayManagerId: awayEntry.managerId,
  };
}

const games: Game[] = [];
const teamGameStats: TeamGameStats[] = [];
const playerGameStats: PlayerGameStats[] = [];

function record(generated: GeneratedGame) {
  games.push(generated.game);
  teamGameStats.push(...generated.teamGameStats);
  playerGameStats.push(...generated.playerGameStats);
}

// ---------------------------------------------------------------------------
// Season 1 — 4 regular-season weeks (completed), then playoffs.
// ---------------------------------------------------------------------------

const SEASON1_TEAM_ORDER = ['chiefs', 'bills', 'niners', 'eagles', 'cowboys', 'ravens', 'lions', 'dolphins'];
const season1Rounds = roundRobinRounds(SEASON1_TEAM_ORDER);
const season1EntriesByTeam = entryLookup(season1Entries);

season1Rounds.slice(0, 4).forEach((round, weekIndex) => {
  const week = weekIndex + 1;
  const gameDate = addDays('2025-09-06T18:00:00.000Z', weekIndex * 7);
  round.forEach(([teamA, teamB], gameIndex) => {
    const [home, away] = (week + gameIndex) % 2 === 0 ? [teamA, teamB] : [teamB, teamA];
    record(
      generateFinalGame({
        id: `season-01-w${week}-${home}-${away}`,
        seasonId: 'season-01',
        week,
        gameDate,
        gameType: 'Regular Season',
        homeTeamId: home,
        awayTeamId: away,
        entries: season1EntriesByTeam,
        featured: gameIndex === 0,
      })
    );
  });
});

// One-off Exhibition (preseason) game — excluded from all standings/stat calculations.
record(
  generateFinalGame({
    id: 'season-01-exhibition-1',
    seasonId: 'season-01',
    week: 0,
    gameDate: '2025-08-30T18:00:00.000Z',
    gameType: 'Exhibition',
    homeTeamId: 'lions',
    awayTeamId: 'dolphins',
    entries: season1EntriesByTeam,
  })
);

// Playoffs: seed 1 Niners (Sam), seed 2 Chiefs (Alex), seed 3 Ravens (Drew), seed 4 Bills (Jordan).
record(
  generateFinalGame({
    id: 'season-01-semifinal-1',
    seasonId: 'season-01',
    week: 5,
    gameDate: '2025-10-04T18:00:00.000Z',
    gameType: 'Playoff',
    homeTeamId: 'niners',
    awayTeamId: 'bills',
    entries: season1EntriesByTeam,
    minMargin: 3,
    recap: 'Sam\'s Niners leaned on a fourth-quarter goal-line stand to hold off Jordan\'s Bills and reach the championship.',
  })
);
record(
  generateFinalGame({
    id: 'season-01-semifinal-2',
    seasonId: 'season-01',
    week: 5,
    gameDate: '2025-10-04T21:00:00.000Z',
    gameType: 'Playoff',
    homeTeamId: 'chiefs',
    awayTeamId: 'ravens',
    entries: season1EntriesByTeam,
    minMargin: 3,
    recap: 'Alex\'s Chiefs pulled away in the second half to eliminate Drew\'s Ravens.',
  })
);
record(
  generateFinalGame({
    id: 'season-01-championship',
    seasonId: 'season-01',
    week: 6,
    gameDate: '2025-10-11T18:00:00.000Z',
    gameType: 'Championship',
    homeTeamId: 'niners',
    awayTeamId: 'chiefs',
    entries: season1EntriesByTeam,
    featured: true,
    minMargin: 2,
    recap: 'Sam capped an undefeated playoff run with a last-minute field goal to win the Season 1 championship over Alex\'s Chiefs.',
  })
);

// ---------------------------------------------------------------------------
// Season 2 — 4 completed weeks, week 5 scheduled but not yet played.
// ---------------------------------------------------------------------------

const SEASON2_TEAM_ORDER = ['niners', 'dolphins', 'chiefs', 'ravens', 'bills', 'lions', 'cowboys', 'eagles'];
const season2Rounds = roundRobinRounds(SEASON2_TEAM_ORDER);
const season2EntriesByTeam = entryLookup(season2Entries);

season2Rounds.slice(0, 4).forEach((round, weekIndex) => {
  const week = weekIndex + 1;
  const gameDate = addDays('2026-06-05T18:00:00.000Z', weekIndex * 7);
  round.forEach(([teamA, teamB], gameIndex) => {
    const [home, away] = (week + gameIndex) % 2 === 0 ? [teamA, teamB] : [teamB, teamA];
    record(
      generateFinalGame({
        id: `season-02-w${week}-${home}-${away}`,
        seasonId: 'season-02',
        week,
        gameDate,
        gameType: 'Regular Season',
        homeTeamId: home,
        awayTeamId: away,
        entries: season2EntriesByTeam,
        featured: gameIndex === 0,
      })
    );
  });
});

// Week 5 — scheduled, not yet played (current week).
const week5Round = season2Rounds[4] ?? [];
const week5Date = addDays('2026-06-05T18:00:00.000Z', 4 * 7);
week5Round.forEach(([teamA, teamB], gameIndex) => {
  const [home, away] = (5 + gameIndex) % 2 === 0 ? [teamA, teamB] : [teamB, teamA];
  games.push(
    generateScheduledGame({
      id: `season-02-w5-${home}-${away}`,
      seasonId: 'season-02',
      week: 5,
      gameDate: week5Date,
      gameType: 'Regular Season',
      homeTeamId: home,
      awayTeamId: away,
      entries: season2EntriesByTeam,
    })
  );
});

export { games, teamGameStats, playerGameStats };
