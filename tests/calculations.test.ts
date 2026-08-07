import { describe, expect, it } from 'vitest';
import type { Game, Manager, PlayerStats, Season, SeasonEntry, Team } from '../src/lib/types';
import {
  computeAllManagerCareerSummaries,
  computeDefenseLeaderboard,
  computeHeadToHead,
  computeLongestWinStreak,
  computeManagerCurrentStreak,
  computePassingLeaderboard,
  computePointDifferential,
  computePointsAllowedPerGame,
  computePointsPerGame,
  computeReceivingLeaderboard,
  computeRecord,
  computeRushingLeaderboard,
  computeStandings,
  computeStreak,
  computeTeamLeaderboard,
  computeWinPercentage,
  filterFinalPlayoffGames,
  filterFinalRegularSeasonGames,
  safeDivide,
} from '../src/lib/calculations';
import { formatSignedNumber, formatWinPercentage } from '../src/lib/formatting';

// ---------------------------------------------------------------------------
// Fixtures: two managers, two teams, two seasons, a mid-league team swap.
// ---------------------------------------------------------------------------

const teamA: Team = {
  id: 'teamA', city: 'Ashford', teamName: 'Aces', abbreviation: 'ASH', slug: 'aces', logoUrl: '/a.svg', active: true,
};
const teamB: Team = {
  id: 'teamB', city: 'Brookfield', teamName: 'Bears', abbreviation: 'BRK', slug: 'bears', logoUrl: '/b.svg', active: true,
};
const teams: Team[] = [teamA, teamB];

const managerM1: Manager = { id: 'm1', displayName: 'Jordan', slug: 'jordan', active: true };
const managerM2: Manager = { id: 'm2', displayName: 'Casey', slug: 'casey', active: true };
const managers: Manager[] = [managerM1, managerM2];

// m2 wins the Season 1 championship, m1 is runner-up — used by the career
// summary tests below (championships / championship appearances).
const season1: Season = {
  id: 's1', name: 'Season 1', status: 'Completed', public: true,
  championManagerId: 'm2', runnerUpManagerId: 'm1',
};
const season2: Season = { id: 's2', name: 'Season 2', status: 'Active', public: true };
const seasons: Season[] = [season1, season2];

// Season 1: m1 on Team A, m2 on Team B.
const e1: SeasonEntry = { id: 'e1', seasonId: 's1', managerId: 'm1', teamId: 'teamA', activeEntry: true };
const e2: SeasonEntry = { id: 'e2', seasonId: 's1', managerId: 'm2', teamId: 'teamB', activeEntry: true };
// Season 2: managers swap teams.
const e3: SeasonEntry = { id: 'e3', seasonId: 's2', managerId: 'm1', teamId: 'teamB', activeEntry: true };
const e4: SeasonEntry = { id: 'e4', seasonId: 's2', managerId: 'm2', teamId: 'teamA', activeEntry: true };
const seasonEntries: SeasonEntry[] = [e1, e2, e3, e4];

const g1: Game = {
  id: 'g1', seasonId: 's1', week: 1, gameDate: '2026-01-01', gameType: 'Regular Season', status: 'Final',
  homeSeasonEntryId: 'e1', awaySeasonEntryId: 'e2', homeTeamId: 'teamA', awayTeamId: 'teamB',
  homeManagerId: 'm1', awayManagerId: 'm2', homeScore: 28, awayScore: 14,
};
const g2: Game = {
  id: 'g2', seasonId: 's1', week: 2, gameDate: '2026-01-08', gameType: 'Regular Season', status: 'Final',
  homeSeasonEntryId: 'e2', awaySeasonEntryId: 'e1', homeTeamId: 'teamB', awayTeamId: 'teamA',
  homeManagerId: 'm2', awayManagerId: 'm1', homeScore: 20, awayScore: 20,
};
const g3: Game = {
  id: 'g3', seasonId: 's1', week: 3, gameDate: '2026-01-15', gameType: 'Regular Season', status: 'Final',
  homeSeasonEntryId: 'e1', awaySeasonEntryId: 'e2', homeTeamId: 'teamA', awayTeamId: 'teamB',
  homeManagerId: 'm1', awayManagerId: 'm2', homeScore: 10, awayScore: 24,
};
// Playoff game season 1: m1 (e1) beats m2 (e2).
const g6: Game = {
  id: 'g6', seasonId: 's1', week: 4, gameDate: '2026-01-22', gameType: 'Playoff', status: 'Final',
  homeSeasonEntryId: 'e1', awaySeasonEntryId: 'e2', homeTeamId: 'teamA', awayTeamId: 'teamB',
  homeManagerId: 'm1', awayManagerId: 'm2', homeScore: 35, awayScore: 10,
};
// Exhibition game season 1: should never count toward any statistic.
const g7: Game = {
  id: 'g7', seasonId: 's1', week: 0, gameDate: '2025-12-20', gameType: 'Exhibition', status: 'Final',
  homeSeasonEntryId: 'e1', awaySeasonEntryId: 'e2', homeTeamId: 'teamA', awayTeamId: 'teamB',
  homeManagerId: 'm1', awayManagerId: 'm2', homeScore: 100, awayScore: 0,
};
// Cancelled regular-season game: should never count.
const g8: Game = {
  id: 'g8', seasonId: 's1', week: 3, gameDate: '2026-01-16', gameType: 'Regular Season', status: 'Cancelled',
  homeSeasonEntryId: 'e1', awaySeasonEntryId: 'e2', homeTeamId: 'teamA', awayTeamId: 'teamB',
  homeManagerId: 'm1', awayManagerId: 'm2',
};

// Season 2, after the team swap: m1 (now on Team B / e3) beats m2 (now on Team A / e4) twice.
const g4: Game = {
  id: 'g4', seasonId: 's2', week: 1, gameDate: '2026-09-01', gameType: 'Regular Season', status: 'Final',
  homeSeasonEntryId: 'e3', awaySeasonEntryId: 'e4', homeTeamId: 'teamB', awayTeamId: 'teamA',
  homeManagerId: 'm1', awayManagerId: 'm2', homeScore: 30, awayScore: 10,
};
const g5: Game = {
  id: 'g5', seasonId: 's2', week: 2, gameDate: '2026-09-08', gameType: 'Regular Season', status: 'Final',
  homeSeasonEntryId: 'e4', awaySeasonEntryId: 'e3', homeTeamId: 'teamA', awayTeamId: 'teamB',
  homeManagerId: 'm2', awayManagerId: 'm1', homeScore: 14, awayScore: 21,
};

const allGames: Game[] = [g1, g2, g3, g4, g5, g6, g7, g8];

describe('game filtering', () => {
  it('excludes exhibition and cancelled games from regular-season stats', () => {
    const filtered = filterFinalRegularSeasonGames(allGames);
    expect(filtered.map((g) => g.id).sort()).toEqual(['g1', 'g2', 'g3', 'g4', 'g5']);
  });

  it('isolates playoff/championship games separately', () => {
    const filtered = filterFinalPlayoffGames(allGames);
    expect(filtered.map((g) => g.id)).toEqual(['g6']);
  });
});

describe('computeRecord', () => {
  const regularSeason = filterFinalRegularSeasonGames(allGames);

  it('computes wins, losses, and ties for a season entry', () => {
    const record = computeRecord(regularSeason, 'e1');
    expect(record.wins).toBe(1);
    expect(record.losses).toBe(1);
    expect(record.ties).toBe(1);
    expect(record.gamesPlayed).toBe(3);
  });

  it('computes points for and against, and point differential', () => {
    const record = computeRecord(regularSeason, 'e1');
    expect(record.pointsFor).toBe(58);
    expect(record.pointsAgainst).toBe(58);
    expect(computePointDifferential(record.pointsFor, record.pointsAgainst)).toBe(0);
  });

  it('computes points per game and points allowed per game', () => {
    const record = computeRecord(regularSeason, 'e1');
    expect(computePointsPerGame(record.pointsFor, record.gamesPlayed)).toBeCloseTo(19.333, 2);
    expect(computePointsAllowedPerGame(record.pointsAgainst, record.gamesPlayed)).toBeCloseTo(19.333, 2);
  });

  it('returns all zeros for a season entry with no games', () => {
    const record = computeRecord(regularSeason, 'no-such-entry');
    expect(record).toEqual({ wins: 0, losses: 0, ties: 0, gamesPlayed: 0, pointsFor: 0, pointsAgainst: 0 });
  });
});

describe('computeWinPercentage', () => {
  it('counts ties as half a win', () => {
    expect(computeWinPercentage(1, 1, 3)).toBeCloseTo(0.5, 5);
  });

  it('returns 0 (not NaN) when no games have been played', () => {
    expect(computeWinPercentage(0, 0, 0)).toBe(0);
  });
});

describe('computeStreak', () => {
  const regularSeason = filterFinalRegularSeasonGames(allGames);

  it('reports the current streak based on the most recent chronological result', () => {
    // e1: W (g1), T (g2), L (g3) -> most recent result is a loss.
    expect(computeStreak(regularSeason, 'e1')).toBe('L1');
  });

  it('reports a multi-game win streak', () => {
    // e3: W (g4), W (g5) -> two-game win streak.
    expect(computeStreak(regularSeason, 'e3')).toBe('W2');
  });

  it('returns a placeholder when there are no completed games', () => {
    expect(computeStreak([], 'e1')).toBe('-');
  });
});

describe('career-wide manager streaks', () => {
  const regularSeason = filterFinalRegularSeasonGames(allGames);
  const m1EntryIds = new Set(['e1', 'e3']);

  it('follows the manager across a team change for the current streak', () => {
    // m1 chronologically: W (g1), T (g2), L (g3), W (g4), W (g5) -> current streak is 2 wins.
    expect(computeManagerCurrentStreak(regularSeason, m1EntryIds)).toBe('W2');
  });

  it('finds the longest win streak across a career, not just the current season', () => {
    // Win runs are [g1] (length 1) and [g4, g5] (length 2) -> longest is 2.
    expect(computeLongestWinStreak(regularSeason, m1EntryIds)).toBe(2);
  });

  it('returns a placeholder current streak and zero longest streak with no games', () => {
    expect(computeManagerCurrentStreak([], m1EntryIds)).toBe('-');
    expect(computeLongestWinStreak([], m1EntryIds)).toBe(0);
  });
});

describe('computeStandings', () => {
  const standings = computeStandings('s1', { seasonEntries, games: allGames, teams, managers });

  it('ranks entries and computes core columns', () => {
    expect(standings).toHaveLength(2);
    const e1Standing = standings.find((s) => s.seasonEntryId === 'e1');
    expect(e1Standing).toMatchObject({ wins: 1, losses: 1, ties: 1, pointsFor: 58, pointsAgainst: 58 });
  });

  it('returns an empty list for a season with no entries', () => {
    expect(computeStandings('no-such-season', { seasonEntries, games: allGames, teams, managers })).toEqual([]);
  });
});

describe('manager career records across team changes', () => {
  const summaries = computeAllManagerCareerSummaries({ managers, seasonEntries, games: allGames, teams, seasons }, 's2');
  const m1Summary = summaries.find((s) => s.managerId === 'm1');

  it('aggregates regular-season wins/losses/ties across both teams the manager used', () => {
    // Season 1 (Team A): 1W-1L-1T. Season 2 (Team B): 2W-0L-0T. Career: 3W-1L-1T.
    expect(m1Summary).toMatchObject({ careerWins: 3, careerLosses: 1, careerTies: 1, careerGames: 5, seasonsPlayed: 2 });
  });

  it('tracks playoff wins separately from regular-season wins', () => {
    expect(m1Summary?.careerPlayoffWins).toBe(1);
    expect(m1Summary?.careerPlayoffLosses).toBe(0);
  });

  it('reflects the manager\'s current team for the requested season', () => {
    expect(m1Summary?.currentTeam?.id).toBe('teamB');
  });

  it('counts championship appearances (champion or runner-up) separately from championships won', () => {
    // m1 was the Season 1 runner-up, not the champion.
    expect(m1Summary?.championships).toBe(0);
    expect(m1Summary?.championshipAppearances).toBe(1);
  });

  it('includes the career-wide current and longest win streaks', () => {
    expect(m1Summary?.currentStreak).toBe('W2');
    expect(m1Summary?.longestWinStreak).toBe(2);
  });
});

describe('head-to-head manager records', () => {
  it('follows managers across the season entries they used at the time of each game', () => {
    const h2h = computeHeadToHead('m1', 'm2', { games: allGames, managers });
    // g1 (W), g2 (T), g3 (L), g4 (W), g5 (W) => 3W-1L-1T for m1 vs m2.
    expect(h2h).toMatchObject({ wins: 3, losses: 1, ties: 1, pointsFor: 109, pointsAgainst: 82, pointDifferential: 27 });
  });
});

describe('player season totals and rate stats', () => {
  const playerStats: PlayerStats[] = [
    { id: 'pg1', gameId: 'g1', seasonId: 's1', week: 1, seasonEntryId: 'e1', teamId: 'teamA', managerId: 'm1', playerName: 'Pat Passer', position: 'QB', passCompletions: 20, passAttempts: 30, passingYards: 250, passingTouchdowns: 2, interceptionsThrown: 1 },
    { id: 'pg2', gameId: 'g2', seasonId: 's1', week: 2, seasonEntryId: 'e1', teamId: 'teamA', managerId: 'm1', playerName: 'Pat Passer', position: 'QB', passCompletions: 15, passAttempts: 25, passingYards: 180, passingTouchdowns: 1, interceptionsThrown: 0 },
    { id: 'pg3', gameId: 'g3', seasonId: 's1', week: 3, seasonEntryId: 'e1', teamId: 'teamA', managerId: 'm1', playerName: 'Pat Passer', position: 'QB', passCompletions: 10, passAttempts: 20, passingYards: 90, passingTouchdowns: 0, interceptionsThrown: 2 },
    { id: 'pg4', gameId: 'g1', seasonId: 's1', week: 1, seasonEntryId: 'e1', teamId: 'teamA', managerId: 'm1', playerName: 'Rae Rusher', position: 'RB', rushAttempts: 10, rushingYards: 50 },
    { id: 'pg5', gameId: 'g2', seasonId: 's1', week: 2, seasonEntryId: 'e1', teamId: 'teamA', managerId: 'm1', playerName: 'Rae Rusher', position: 'RB', rushAttempts: 8, rushingYards: 32 },
    { id: 'pg6', gameId: 'g1', seasonId: 's1', week: 1, seasonEntryId: 'e1', teamId: 'teamA', managerId: 'm1', playerName: 'Wes Wideout', position: 'WR', receptions: 5, receivingYards: 80 },
    { id: 'pg7', gameId: 'g2', seasonId: 's1', week: 2, seasonEntryId: 'e1', teamId: 'teamA', managerId: 'm1', playerName: 'Wes Wideout', position: 'WR', receptions: 3, receivingYards: 20 },
    { id: 'pg8', gameId: 'g1', seasonId: 's1', week: 1, seasonEntryId: 'e2', teamId: 'teamB', managerId: 'm2', playerName: 'Del Fender', position: 'CB', interceptions: 1, sacks: 0.5 },
    // Exhibition-game stat line should be excluded entirely from season totals.
    { id: 'pg9', gameId: 'g7', seasonId: 's1', week: 0, seasonEntryId: 'e1', teamId: 'teamA', managerId: 'm1', playerName: 'Pat Passer', position: 'QB', passCompletions: 99, passAttempts: 99, passingYards: 999 },
  ];

  const input = { playerStats, seasonEntries, teams, managers, games: allGames };

  it('sums passing totals by season, computes completion percentage, and counts distinct games played', () => {
    const leaders = computePassingLeaderboard('s1', input);
    const pat = leaders.find((l) => l.playerName === 'Pat Passer');
    expect(pat).toMatchObject({ completions: 45, attempts: 75, passingYards: 520, passingTouchdowns: 3, interceptions: 3, games: 3 });
    expect(pat?.completionPercentage).toBeCloseTo(60, 5);
  });

  it('computes rushing yards per attempt', () => {
    const leaders = computeRushingLeaderboard('s1', input);
    const rae = leaders.find((l) => l.playerName === 'Rae Rusher');
    expect(rae?.rushingYards).toBe(82);
    expect(rae?.yardsPerAttempt).toBeCloseTo(82 / 18, 5);
  });

  it('computes receiving yards per reception', () => {
    const leaders = computeReceivingLeaderboard('s1', input);
    const wes = leaders.find((l) => l.playerName === 'Wes Wideout');
    expect(wes?.receivingYards).toBe(100);
    expect(wes?.yardsPerReception).toBeCloseTo(12.5, 5);
  });

  it('ranks a defensive category leaderboard', () => {
    const leaders = computeDefenseLeaderboard('s1', 'interceptions', input);
    expect(leaders[0]).toMatchObject({ playerName: 'Del Fender', interceptions: 1 });
  });

  it('avoids division by zero when a player has zero attempts/receptions', () => {
    const noAttempts = computeRushingLeaderboard('s1', {
      ...input,
      playerStats: [
        { id: 'pgX', gameId: 'g1', seasonId: 's1', week: 1, seasonEntryId: 'e1', teamId: 'teamA', managerId: 'm1', playerName: 'Rae Rusher', position: 'RB', rushAttempts: 0, rushingYards: 0 },
      ],
    });
    expect(noAttempts).toEqual([]);
    expect(safeDivide(82, 0)).toBe(0);
  });

  it('is not fooled by a duplicate stat row for the same game (still counts one distinct game)', () => {
    const duplicated = [...playerStats, { ...playerStats[0]!, id: 'pg1-duplicate' }];
    const leaders = computePassingLeaderboard('s1', { ...input, playerStats: duplicated });
    const pat = leaders.find((l) => l.playerName === 'Pat Passer');
    expect(pat?.games).toBe(3);
  });
});

describe('team leaderboard — calculated from Games + Player Stats, no Team Stats table', () => {
  const playerStats: PlayerStats[] = [
    { id: 'pg1', gameId: 'g1', seasonId: 's1', week: 1, seasonEntryId: 'e1', teamId: 'teamA', managerId: 'm1', playerName: 'Pat Passer', position: 'QB', passingYards: 250, interceptionsThrown: 1 },
    { id: 'pg2', gameId: 'g2', seasonId: 's1', week: 2, seasonEntryId: 'e1', teamId: 'teamA', managerId: 'm1', playerName: 'Pat Passer', position: 'QB', passingYards: 180, interceptionsThrown: 0 },
    { id: 'pg3', gameId: 'g3', seasonId: 's1', week: 3, seasonEntryId: 'e1', teamId: 'teamA', managerId: 'm1', playerName: 'Pat Passer', position: 'QB', passingYards: 90, interceptionsThrown: 2 },
    { id: 'pg4', gameId: 'g1', seasonId: 's1', week: 1, seasonEntryId: 'e1', teamId: 'teamA', managerId: 'm1', playerName: 'Rae Rusher', position: 'RB', rushingYards: 150 },
  ];
  const input = { seasonEntries, games: allGames, playerStats, teams, managers };

  it('sums points from Games and yards/turnovers from Player Stats', () => {
    const leaderboard = computeTeamLeaderboard('s1', input);
    const teamAEntry = leaderboard.find((entry) => entry.team.id === 'teamA');
    // Points come from Games (g1: 28, g2: 20, g3: 10 for Team A) regardless of Player Stats.
    expect(teamAEntry?.games).toBe(3);
    expect(teamAEntry?.pointsPerGame).toBeCloseTo(58 / 3, 5);
    // Turnovers: 1 + 0 + 2 = 3 interceptions thrown, no takeaways recorded for Team A.
    expect(teamAEntry?.turnoverDifferential).toBe(0 - 3);
    expect(teamAEntry?.passingYardsPerGame).toBeCloseTo((250 + 180 + 90) / 3, 5);
    expect(teamAEntry?.rushingYardsPerGame).toBeCloseTo(150 / 3, 5);
  });

  it('still reports games played from the Games table even when no Player Stats rows exist yet', () => {
    const leaderboard = computeTeamLeaderboard('s1', { ...input, playerStats: [] });
    const teamAEntry = leaderboard.find((entry) => entry.team.id === 'teamA');
    expect(teamAEntry?.games).toBe(3);
    expect(teamAEntry?.pointsPerGame).toBeCloseTo(58 / 3, 5);
    expect(teamAEntry?.passingYardsPerGame).toBe(0);
  });
});

describe('formatting', () => {
  it('formats signed point differentials', () => {
    expect(formatSignedNumber(42)).toBe('+42');
    expect(formatSignedNumber(-15)).toBe('-15');
    expect(formatSignedNumber(0)).toBe('0');
  });

  it('formats win percentage to three decimals, including the zero-games case', () => {
    expect(formatWinPercentage(0)).toBe('0.000');
    expect(formatWinPercentage(0.5)).toBe('0.500');
  });
});
