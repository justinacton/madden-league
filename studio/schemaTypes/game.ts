import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'game',
  title: 'Game',
  type: 'document',
  fields: [
    defineField({ name: 'season', title: 'Season', type: 'reference', to: [{ type: 'season' }], validation: (r) => r.required() }),
    defineField({ name: 'week', title: 'Week', type: 'number', validation: (r) => r.required().integer().min(0) }),
    defineField({ name: 'gameDate', title: 'Game Date', type: 'datetime' }),
    defineField({
      name: 'gameType',
      title: 'Game Type',
      type: 'string',
      options: { list: ['Regular Season', 'Playoff', 'Championship', 'Exhibition'] },
      initialValue: 'Regular Season',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: { list: ['Scheduled', 'Final', 'Postponed', 'Cancelled'] },
      initialValue: 'Scheduled',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'homeEntry',
      title: 'Home Entry',
      type: 'reference',
      to: [{ type: 'seasonEntry' }],
      description: 'Home team/manager for this game — links via Season Entry, not directly, so history stays correct if a manager changes teams.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'awayEntry',
      title: 'Away Entry',
      type: 'reference',
      to: [{ type: 'seasonEntry' }],
      validation: (r) => r.required(),
    }),
    defineField({ name: 'homeScore', title: 'Home Score', type: 'number' }),
    defineField({ name: 'awayScore', title: 'Away Score', type: 'number' }),
    defineField({ name: 'overtime', title: 'Overtime', type: 'boolean', initialValue: false }),
    defineField({ name: 'recap', title: 'Recap', type: 'text' }),
    defineField({ name: 'featuredGame', title: 'Featured Game', type: 'boolean', initialValue: false }),
  ],
  preview: {
    select: { week: 'week', home: 'homeEntry.team.teamName', away: 'awayEntry.team.teamName', status: 'status' },
    prepare: ({ week, home, away, status }) => ({ title: `Wk ${week}: ${away ?? '?'} @ ${home ?? '?'}`, subtitle: status }),
  },
});
