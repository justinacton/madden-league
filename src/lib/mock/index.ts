import type { LeagueDataset } from '../types';
import { teams } from './teams';
import { managers } from './managers';
import { seasons, seasonEntries } from './seasons';
import { games, playerStats } from './schedule';
import { news } from './news';

export const mockData: LeagueDataset = {
  leagueName: 'PUNT',
  seasons,
  managers,
  teams,
  seasonEntries,
  games,
  playerStats,
  news,
};
