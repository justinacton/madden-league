import { describe, expect, it } from 'vitest';
import { mockData } from '../src/lib/mock';
import {
  computeAllManagerCareerSummaries,
  computeHeadToHead,
  computePassingLeaderboard,
  computeStandings,
  computeTeamLeaderboard,
  filterFinalRegularSeasonGames,
} from '../src/lib/calculations';

describe('mock data integrity', () => {
  it('every season entry references a real season, manager, and team', () => {
    const seasonIds = new Set(mockData.seasons.map((s) => s.id));
    const managerIds = new Set(mockData.managers.map((m) => m.id));
    const teamIds = new Set(mockData.teams.map((t) => t.id));
    for (const entry of mockData.seasonEntries) {
      expect(seasonIds.has(entry.seasonId)).toBe(true);
      expect(managerIds.has(entry.managerId)).toBe(true);
      expect(teamIds.has(entry.teamId)).toBe(true);
    }
  });

  it('every game references real season entries and teams', () => {
    const entryIds = new Set(mockData.seasonEntries.map((e) => e.id));
    const teamIds = new Set(mockData.teams.map((t) => t.id));
    for (const game of mockData.games) {
      expect(entryIds.has(game.homeSeasonEntryId)).toBe(true);
      expect(entryIds.has(game.awaySeasonEntryId)).toBe(true);
      expect(teamIds.has(game.homeTeamId)).toBe(true);
      expect(teamIds.has(game.awayTeamId)).toBe(true);
    }
  });

  it('has both a completed season and an active season', () => {
    expect(mockData.seasons.some((s) => s.status === 'Completed')).toBe(true);
    expect(mockData.seasons.some((s) => s.status === 'Active')).toBe(true);
  });

  it('has both scheduled and completed games in the active season', () => {
    const active = mockData.games.filter((g) => g.seasonId === 'season-02');
    expect(active.some((g) => g.status === 'Final')).toBe(true);
    expect(active.some((g) => g.status === 'Scheduled')).toBe(true);
  });

  it('excludes exhibition and cancelled games from regular-season totals', () => {
    const regularSeason = filterFinalRegularSeasonGames(mockData.games.filter((g) => g.seasonId === 'season-01'));
    expect(regularSeason.every((g) => g.gameType === 'Regular Season')).toBe(true);
  });

  it('records at least one manager playing for two different teams across seasons', () => {
    const teamsByManager = new Map<string, Set<string>>();
    for (const entry of mockData.seasonEntries) {
      const set = teamsByManager.get(entry.managerId) ?? new Set<string>();
      set.add(entry.teamId);
      teamsByManager.set(entry.managerId, set);
    }
    expect([...teamsByManager.values()].some((teamSet) => teamSet.size > 1)).toBe(true);
  });

  it('computes standings for both seasons without throwing', () => {
    for (const season of mockData.seasons) {
      const standings = computeStandings(season.id, mockData);
      expect(standings.length).toBe(8);
      expect(standings[0]?.rank).toBe(1);
    }
  });

  it('computes team and player leaderboards for both seasons without throwing', () => {
    for (const season of mockData.seasons) {
      const teamLeaderboard = computeTeamLeaderboard(season.id, mockData);
      expect(teamLeaderboard.length).toBe(8);
      const passing = computePassingLeaderboard(season.id, mockData);
      expect(passing.length).toBeGreaterThan(0);
    }
  });

  it('computes manager career summaries spanning both teams a manager used', () => {
    const summaries = computeAllManagerCareerSummaries(mockData, 'season-02');
    const sam = summaries.find((s) => s.managerId === 'mgr-sam');
    expect(sam?.seasonsPlayed).toBe(2);
    expect(sam?.currentTeam?.id).toBe('ravens');
    expect(sam?.championships).toBe(1);
  });

  it('computes head-to-head record between two managers', () => {
    const h2h = computeHeadToHead('mgr-alex', 'mgr-sam', mockData);
    expect(h2h.wins + h2h.losses + h2h.ties).toBeGreaterThan(0);
  });
});
