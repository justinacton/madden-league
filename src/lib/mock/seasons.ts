import type { Season, SeasonEntry } from '../types';

export const seasons: Season[] = [
  {
    id: 'season-01',
    name: 'Season 1',
    maddenVersion: 'Madden NFL 25',
    startDate: '2025-09-06',
    endDate: '2025-10-18',
    status: 'Completed',
    regularSeasonWeeks: 4,
    currentWeek: 4,
    championManagerId: 'mgr-sam',
    championTeamId: 'niners',
    runnerUpManagerId: 'mgr-alex',
    runnerUpTeamId: 'chiefs',
    public: true,
  },
  {
    id: 'season-02',
    name: 'Season 2',
    maddenVersion: 'Madden NFL 26',
    startDate: '2026-06-05',
    status: 'Active',
    regularSeasonWeeks: 10,
    currentWeek: 5,
    public: true,
  },
];

// Season 1 assignments (initial rosters).
export const season1Entries: SeasonEntry[] = [
  { id: 'se1-alex', seasonId: 'season-01', managerId: 'mgr-alex', teamId: 'chiefs', activeEntry: true, conference: 'AFC', division: 'AFC West', playoffSeed: 2, finalFinish: 'Runner-Up' },
  { id: 'se1-jordan', seasonId: 'season-01', managerId: 'mgr-jordan', teamId: 'bills', activeEntry: true, conference: 'AFC', division: 'AFC East', playoffSeed: 4, finalFinish: 'Semifinal' },
  { id: 'se1-sam', seasonId: 'season-01', managerId: 'mgr-sam', teamId: 'niners', activeEntry: true, conference: 'NFC', division: 'NFC West', playoffSeed: 1, finalFinish: 'Champion' },
  { id: 'se1-taylor', seasonId: 'season-01', managerId: 'mgr-taylor', teamId: 'eagles', activeEntry: true, conference: 'NFC', division: 'NFC East', finalFinish: 'Missed Playoffs' },
  { id: 'se1-casey', seasonId: 'season-01', managerId: 'mgr-casey', teamId: 'cowboys', activeEntry: true, conference: 'NFC', division: 'NFC East', finalFinish: 'Missed Playoffs' },
  { id: 'se1-drew', seasonId: 'season-01', managerId: 'mgr-drew', teamId: 'ravens', activeEntry: true, conference: 'AFC', division: 'AFC North', playoffSeed: 3, finalFinish: 'Semifinal' },
  { id: 'se1-morgan', seasonId: 'season-01', managerId: 'mgr-morgan', teamId: 'lions', activeEntry: true, conference: 'NFC', division: 'NFC North', finalFinish: 'Missed Playoffs' },
  { id: 'se1-jamie', seasonId: 'season-01', managerId: 'mgr-jamie', teamId: 'dolphins', activeEntry: true, conference: 'AFC', division: 'AFC East', finalFinish: 'Missed Playoffs' },
];

// Season 2 assignments — Sam and Drew swap teams between seasons.
export const season2Entries: SeasonEntry[] = [
  { id: 'se2-alex', seasonId: 'season-02', managerId: 'mgr-alex', teamId: 'chiefs', activeEntry: true, conference: 'AFC', division: 'AFC West' },
  { id: 'se2-jordan', seasonId: 'season-02', managerId: 'mgr-jordan', teamId: 'bills', activeEntry: true, conference: 'AFC', division: 'AFC East' },
  { id: 'se2-sam', seasonId: 'season-02', managerId: 'mgr-sam', teamId: 'ravens', activeEntry: true, conference: 'AFC', division: 'AFC North' },
  { id: 'se2-taylor', seasonId: 'season-02', managerId: 'mgr-taylor', teamId: 'eagles', activeEntry: true, conference: 'NFC', division: 'NFC East' },
  { id: 'se2-casey', seasonId: 'season-02', managerId: 'mgr-casey', teamId: 'cowboys', activeEntry: true, conference: 'NFC', division: 'NFC East' },
  { id: 'se2-drew', seasonId: 'season-02', managerId: 'mgr-drew', teamId: 'niners', activeEntry: true, conference: 'NFC', division: 'NFC West' },
  { id: 'se2-morgan', seasonId: 'season-02', managerId: 'mgr-morgan', teamId: 'lions', activeEntry: true, conference: 'NFC', division: 'NFC North' },
  { id: 'se2-jamie', seasonId: 'season-02', managerId: 'mgr-jamie', teamId: 'dolphins', activeEntry: true, conference: 'AFC', division: 'AFC East' },
];

export const seasonEntries: SeasonEntry[] = [...season1Entries, ...season2Entries];
