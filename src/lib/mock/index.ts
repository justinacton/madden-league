import type { LeagueDataset } from '../types';
import { teams } from './teams';
import { managers } from './managers';
import { seasons, seasonEntries } from './seasons';
import { players } from './players';
import { games, teamGameStats, playerGameStats } from './schedule';
import { news } from './news';
import { powerRankings } from './powerRankings';

export const mockData: LeagueDataset = {
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
