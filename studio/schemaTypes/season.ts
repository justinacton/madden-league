import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'season',
  title: 'Season',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Used in URLs, e.g. "season-1". Also serves as this season\'s stable ID.',
      options: { source: 'name' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'maddenVersion', title: 'Madden Version', type: 'string' }),
    defineField({ name: 'startDate', title: 'Start Date', type: 'date' }),
    defineField({ name: 'endDate', title: 'End Date', type: 'date' }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: { list: ['Upcoming', 'Active', 'Completed'] },
      initialValue: 'Upcoming',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'currentWeek', title: 'Current Week', type: 'number' }),
    defineField({ name: 'regularSeasonWeeks', title: 'Regular Season Weeks', type: 'number' }),
    defineField({ name: 'champion', title: 'Champion', type: 'reference', to: [{ type: 'manager' }] }),
    defineField({ name: 'runnerUp', title: 'Runner-Up', type: 'reference', to: [{ type: 'manager' }] }),
    defineField({
      name: 'public',
      title: 'Public',
      type: 'boolean',
      description: 'Only public seasons (and the records linked to them) are shown on the site.',
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: 'name', status: 'status' },
    prepare: ({ title, status }) => ({ title, subtitle: status }),
  },
});
