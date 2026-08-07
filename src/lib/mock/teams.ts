import type { Team } from '../types';

export const teams: Team[] = [
  {
    id: 'chiefs', city: 'Kansas City', teamName: 'Chiefs', abbreviation: 'KC', slug: 'chiefs',
    conference: 'AFC', division: 'AFC West', primaryColor: '#E31837', secondaryColor: '#FFB81C',
    logoUrl: '/images/teams/chiefs.svg', active: true,
  },
  {
    id: 'bills', city: 'Buffalo', teamName: 'Bills', abbreviation: 'BUF', slug: 'bills',
    conference: 'AFC', division: 'AFC East', primaryColor: '#00338D', secondaryColor: '#C60C30',
    logoUrl: '/images/teams/bills.svg', active: true,
  },
  {
    id: 'niners', city: 'San Francisco', teamName: '49ers', abbreviation: 'SF', slug: '49ers',
    conference: 'NFC', division: 'NFC West', primaryColor: '#AA0000', secondaryColor: '#B3995D',
    logoUrl: '/images/teams/niners.svg', active: true,
  },
  {
    id: 'eagles', city: 'Philadelphia', teamName: 'Eagles', abbreviation: 'PHI', slug: 'eagles',
    conference: 'NFC', division: 'NFC East', primaryColor: '#004C54', secondaryColor: '#A5ACAF',
    logoUrl: '/images/teams/eagles.svg', active: true,
  },
  {
    id: 'cowboys', city: 'Dallas', teamName: 'Cowboys', abbreviation: 'DAL', slug: 'cowboys',
    conference: 'NFC', division: 'NFC East', primaryColor: '#041E42', secondaryColor: '#869397',
    logoUrl: '/images/teams/cowboys.svg', active: true,
  },
  {
    id: 'ravens', city: 'Baltimore', teamName: 'Ravens', abbreviation: 'BAL', slug: 'ravens',
    conference: 'AFC', division: 'AFC North', primaryColor: '#241773', secondaryColor: '#9E7C0C',
    logoUrl: '/images/teams/ravens.svg', active: true,
  },
  {
    id: 'lions', city: 'Detroit', teamName: 'Lions', abbreviation: 'DET', slug: 'lions',
    conference: 'NFC', division: 'NFC North', primaryColor: '#0076B6', secondaryColor: '#B0B7BC',
    logoUrl: '/images/teams/lions.svg', active: true,
  },
  {
    id: 'dolphins', city: 'Miami', teamName: 'Dolphins', abbreviation: 'MIA', slug: 'dolphins',
    conference: 'AFC', division: 'AFC East', primaryColor: '#008E97', secondaryColor: '#FC4C02',
    logoUrl: '/images/teams/dolphins.svg', active: true,
  },
];
