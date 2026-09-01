import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'seasonEntry',
  title: 'Season Entry',
  type: 'document',
  description:
    'Join record between a Manager, a Team, and a Season for one season — lets a manager change teams between seasons while keeping career history intact. One per manager per season, one per team per season.',
  fields: [
    defineField({ name: 'season', title: 'Season', type: 'reference', to: [{ type: 'season' }], validation: (r) => r.required() }),
    defineField({ name: 'manager', title: 'Manager', type: 'reference', to: [{ type: 'manager' }], validation: (r) => r.required() }),
    defineField({ name: 'team', title: 'Team', type: 'reference', to: [{ type: 'team' }], validation: (r) => r.required() }),
    defineField({ name: 'activeEntry', title: 'Active', type: 'boolean', initialValue: true }),
    defineField({ name: 'playoffSeed', title: 'Playoff Seed', type: 'number' }),
    defineField({
      name: 'finalFinish',
      title: 'Final Finish',
      type: 'string',
      options: { list: ['Regular Season', 'Playoff Qualifier', 'Semifinalist', 'Runner-Up', 'Champion'] },
    }),
  ],
  preview: {
    select: { manager: 'manager.name', team: 'team.teamName', season: 'season.name' },
    prepare: ({ manager, team, season }) => ({ title: `${manager ?? '?'} — ${team ?? '?'}`, subtitle: season }),
  },
});
