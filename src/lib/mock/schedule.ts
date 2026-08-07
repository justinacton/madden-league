import type { Game, PlayerPosition, PlayerStats, SeasonEntry } from '../types';
import { season1Entries, season2Entries } from './seasons';
import { createRng, pick, randomInt, roundRobinRounds } from './rng';

const rng = createRng(20260806);

/** One QB, RB, WR, and defender tracked per team — enough to exercise every stat category. */
const ROSTER_BY_TEAM: Record<string, { qb: string; rb: string; wr: string; def: string; defPosition: PlayerPosition }> = {
  chiefs: { qb: 'Derek Vance', rb: 'Malik Green', wr: 'Tyson Reed', def: 'Bobby Sharp', defPosition: 'LB' },
  bills: { qb: 'Colton Vaughn', rb: 'Ezra Combs', wr: 'Nate Ellison', def: 'Marcus Doyle', defPosition: 'CB' },
  niners: { qb: 'Gavin Marsh', rb: 'Devon Kessler', wr: 'Isaiah Cruz', def: 'Trent Lowry', defPosition: 'S' },
  eagles: { qb: 'Owen Whitfield', rb: 'Julian Marks', wr: 'Andre Booker', def: 'Sean Cargill', defPosition: 'LB' },
  cowboys: { qb: 'Ryder Holcomb', rb: 'Xavier Pruitt', wr: 'Damon Weller', def: 'Chase Ambrose', defPosition: 'CB' },
  ravens: { qb: 'Miles Sutton', rb: 'Corey Nash', wr: 'Jared Finch', def: 'Reggie Voss', defPosition: 'LB' },
  lions: { qb: 'Preston Boyle', rb: 'Dante Rowell', wr: 'Cody Larkin', def: 'Wes Hartman', defPosition: 'S' },
  dolphins: { qb: 'Lucas Trent', rb: 'Amir Delgado', wr: 'Blake Sorensen', def: 'Nico Farrow', defPosition: 'CB' },
};

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
const SHORT_TD_WEIGHTS = [0, 0, 0, 1, 1, 2];
const TURNOVER_WEIGHTS = [0, 0, 0, 1, 1, 2, 3];
const RARE_EVENT_WEIGHTS = [0, 0, 0, 0, 0, 0, 0, 1, 1, 2];

interface GeneratedGame {
  game: Game;
  playerStats: PlayerStats[];
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
    overtime: Math.abs(homeScore - awayScore) <= 3 && rng() > 0.7,
    recap: params.recap,
    featuredGame: params.featured,
  };

  const homeGiveaways = pick(rng, TURNOVER_WEIGHTS);
  const awayGiveaways = pick(rng, TURNOVER_WEIGHTS);

  const buildPlayerStats = (
    entry: SeasonEntry,
    teamId: string,
    ownGiveaways: number,
    opponentGiveaways: number
  ): PlayerStats[] => {
    const roster = ROSTER_BY_TEAM[teamId];
    if (!roster) return [];

    const base = {
      gameId: params.id,
      seasonId: params.seasonId,
      week: params.week,
      seasonEntryId: entry.id,
      teamId,
      managerId: entry.managerId,
    };

    const passAttempts = randomInt(rng, 24, 40);
    const passCompletions = Math.round(passAttempts * (0.5 + rng() * 0.25));
    const interceptionsThrown = Math.min(ownGiveaways, randomInt(rng, 0, ownGiveaways));
    const fumblesLost = Math.max(0, ownGiveaways - interceptionsThrown);

    const qb: PlayerStats = {
      ...base,
      id: `ps-${params.id}-${teamId}-qb`,
      playerName: roster.qb,
      position: 'QB',
      passCompletions,
      passAttempts,
      passingYards: randomInt(rng, 150, 380),
      passingTouchdowns: pick(rng, TD_COUNT_WEIGHTS),
      interceptionsThrown,
    };

    const rb: PlayerStats = {
      ...base,
      id: `ps-${params.id}-${teamId}-rb`,
      playerName: roster.rb,
      position: 'RB',
      rushAttempts: randomInt(rng, 10, 26),
      rushingYards: randomInt(rng, 40, 160),
      rushingTouchdowns: pick(rng, SHORT_TD_WEIGHTS),
      longRush: randomInt(rng, 6, 45),
      fumbles: fumblesLost > 0 ? fumblesLost : undefined,
      fumblesLost: fumblesLost > 0 ? fumblesLost : undefined,
    };

    const wr: PlayerStats = {
      ...base,
      id: `ps-${params.id}-${teamId}-wr`,
      playerName: roster.wr,
      position: 'WR',
      receptions: randomInt(rng, 2, 10),
      receivingYards: randomInt(rng, 20, 160),
      receivingTouchdowns: pick(rng, SHORT_TD_WEIGHTS),
      longReception: randomInt(rng, 9, 55),
    };

    const defInterceptions = Math.min(opponentGiveaways, randomInt(rng, 0, opponentGiveaways));
    const defFumbleRecoveries = Math.max(0, opponentGiveaways - defInterceptions);
    const def: PlayerStats = {
      ...base,
      id: `ps-${params.id}-${teamId}-def`,
      playerName: roster.def,
      position: roster.defPosition,
      tackles: randomInt(rng, 3, 11),
      sacks: Math.round(randomInt(rng, 0, 5) * 2) / 2,
      interceptions: defInterceptions,
      forcedFumbles: defFumbleRecoveries > 0 ? defFumbleRecoveries : pick(rng, RARE_EVENT_WEIGHTS),
      fumbleRecoveries: defFumbleRecoveries,
      defensiveTouchdowns: rng() > 0.95 ? 1 : 0,
    };

    return [qb, rb, wr, def];
  };

  const playerStats = [
    ...buildPlayerStats(homeEntry, params.homeTeamId, homeGiveaways, awayGiveaways),
    ...buildPlayerStats(awayEntry, params.awayTeamId, awayGiveaways, homeGiveaways),
  ];

  return { game, playerStats };
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
const playerStats: PlayerStats[] = [];

function record(generated: GeneratedGame) {
  games.push(generated.game);
  playerStats.push(...generated.playerStats);
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

export { games, playerStats };
