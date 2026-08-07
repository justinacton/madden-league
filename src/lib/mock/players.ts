import type { Player } from '../types';

/**
 * A lightweight roster: one QB, RB, WR, and defender per team — enough to
 * exercise every stat category on the Stats page without maintaining full
 * 53-man rosters (the Players table is not meant to be a public page).
 */
export const players: Player[] = [
  { id: 'pl-chiefs-qb', fullName: 'Derek Vance', slug: 'derek-vance', position: 'QB', nflTeamId: 'chiefs', active: true },
  { id: 'pl-chiefs-rb', fullName: 'Malik Green', slug: 'malik-green', position: 'RB', nflTeamId: 'chiefs', active: true },
  { id: 'pl-chiefs-wr', fullName: 'Tyson Reed', slug: 'tyson-reed', position: 'WR', nflTeamId: 'chiefs', active: true },
  { id: 'pl-chiefs-def', fullName: 'Bobby Sharp', slug: 'bobby-sharp', position: 'LB', nflTeamId: 'chiefs', active: true },

  { id: 'pl-bills-qb', fullName: 'Colton Vaughn', slug: 'colton-vaughn', position: 'QB', nflTeamId: 'bills', active: true },
  { id: 'pl-bills-rb', fullName: 'Ezra Combs', slug: 'ezra-combs', position: 'RB', nflTeamId: 'bills', active: true },
  { id: 'pl-bills-wr', fullName: 'Nate Ellison', slug: 'nate-ellison', position: 'WR', nflTeamId: 'bills', active: true },
  { id: 'pl-bills-def', fullName: 'Marcus Doyle', slug: 'marcus-doyle', position: 'CB', nflTeamId: 'bills', active: true },

  { id: 'pl-niners-qb', fullName: 'Gavin Marsh', slug: 'gavin-marsh', position: 'QB', nflTeamId: 'niners', active: true },
  { id: 'pl-niners-rb', fullName: 'Devon Kessler', slug: 'devon-kessler', position: 'RB', nflTeamId: 'niners', active: true },
  { id: 'pl-niners-wr', fullName: 'Isaiah Cruz', slug: 'isaiah-cruz', position: 'WR', nflTeamId: 'niners', active: true },
  { id: 'pl-niners-def', fullName: 'Trent Lowry', slug: 'trent-lowry', position: 'S', nflTeamId: 'niners', active: true },

  { id: 'pl-eagles-qb', fullName: 'Owen Whitfield', slug: 'owen-whitfield', position: 'QB', nflTeamId: 'eagles', active: true },
  { id: 'pl-eagles-rb', fullName: 'Julian Marks', slug: 'julian-marks', position: 'RB', nflTeamId: 'eagles', active: true },
  { id: 'pl-eagles-wr', fullName: 'Andre Booker', slug: 'andre-booker', position: 'WR', nflTeamId: 'eagles', active: true },
  { id: 'pl-eagles-def', fullName: 'Sean Cargill', slug: 'sean-cargill', position: 'LB', nflTeamId: 'eagles', active: true },

  { id: 'pl-cowboys-qb', fullName: 'Ryder Holcomb', slug: 'ryder-holcomb', position: 'QB', nflTeamId: 'cowboys', active: true },
  { id: 'pl-cowboys-rb', fullName: 'Xavier Pruitt', slug: 'xavier-pruitt', position: 'RB', nflTeamId: 'cowboys', active: true },
  { id: 'pl-cowboys-wr', fullName: 'Damon Weller', slug: 'damon-weller', position: 'WR', nflTeamId: 'cowboys', active: true },
  { id: 'pl-cowboys-def', fullName: 'Chase Ambrose', slug: 'chase-ambrose', position: 'CB', nflTeamId: 'cowboys', active: true },

  { id: 'pl-ravens-qb', fullName: 'Miles Sutton', slug: 'miles-sutton', position: 'QB', nflTeamId: 'ravens', active: true },
  { id: 'pl-ravens-rb', fullName: 'Corey Nash', slug: 'corey-nash', position: 'RB', nflTeamId: 'ravens', active: true },
  { id: 'pl-ravens-wr', fullName: 'Jared Finch', slug: 'jared-finch', position: 'WR', nflTeamId: 'ravens', active: true },
  { id: 'pl-ravens-def', fullName: 'Reggie Voss', slug: 'reggie-voss', position: 'LB', nflTeamId: 'ravens', active: true },

  { id: 'pl-lions-qb', fullName: 'Preston Boyle', slug: 'preston-boyle', position: 'QB', nflTeamId: 'lions', active: true },
  { id: 'pl-lions-rb', fullName: 'Dante Rowell', slug: 'dante-rowell', position: 'RB', nflTeamId: 'lions', active: true },
  { id: 'pl-lions-wr', fullName: 'Cody Larkin', slug: 'cody-larkin', position: 'WR', nflTeamId: 'lions', active: true },
  { id: 'pl-lions-def', fullName: 'Wes Hartman', slug: 'wes-hartman', position: 'S', nflTeamId: 'lions', active: true },

  { id: 'pl-dolphins-qb', fullName: 'Lucas Trent', slug: 'lucas-trent', position: 'QB', nflTeamId: 'dolphins', active: true },
  { id: 'pl-dolphins-rb', fullName: 'Amir Delgado', slug: 'amir-delgado', position: 'RB', nflTeamId: 'dolphins', active: true },
  { id: 'pl-dolphins-wr', fullName: 'Blake Sorensen', slug: 'blake-sorensen', position: 'WR', nflTeamId: 'dolphins', active: true },
  { id: 'pl-dolphins-def', fullName: 'Nico Farrow', slug: 'nico-farrow', position: 'CB', nflTeamId: 'dolphins', active: true },
];

export const playerIdsByTeamAndSlot: Record<string, { qb: string; rb: string; wr: string; def: string }> = {
  chiefs: { qb: 'pl-chiefs-qb', rb: 'pl-chiefs-rb', wr: 'pl-chiefs-wr', def: 'pl-chiefs-def' },
  bills: { qb: 'pl-bills-qb', rb: 'pl-bills-rb', wr: 'pl-bills-wr', def: 'pl-bills-def' },
  niners: { qb: 'pl-niners-qb', rb: 'pl-niners-rb', wr: 'pl-niners-wr', def: 'pl-niners-def' },
  eagles: { qb: 'pl-eagles-qb', rb: 'pl-eagles-rb', wr: 'pl-eagles-wr', def: 'pl-eagles-def' },
  cowboys: { qb: 'pl-cowboys-qb', rb: 'pl-cowboys-rb', wr: 'pl-cowboys-wr', def: 'pl-cowboys-def' },
  ravens: { qb: 'pl-ravens-qb', rb: 'pl-ravens-rb', wr: 'pl-ravens-wr', def: 'pl-ravens-def' },
  lions: { qb: 'pl-lions-qb', rb: 'pl-lions-rb', wr: 'pl-lions-wr', def: 'pl-lions-def' },
  dolphins: { qb: 'pl-dolphins-qb', rb: 'pl-dolphins-rb', wr: 'pl-dolphins-wr', def: 'pl-dolphins-def' },
};
