import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'newsArticle',
  title: 'News Article',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'publishDate', title: 'Publish Date', type: 'datetime', validation: (r) => r.required() }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: { list: ['Draft', 'Published'] },
      initialValue: 'Draft',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'summary', title: 'Summary', type: 'text', validation: (r) => r.required() }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'text',
      description: 'Markdown — rendered the same way the site rendered Airtable\'s Body field.',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'featuredImage', title: 'Featured Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'season', title: 'Season', type: 'reference', to: [{ type: 'season' }] }),
    defineField({ name: 'week', title: 'Week', type: 'number' }),
    defineField({ name: 'featured', title: 'Featured', type: 'boolean', initialValue: false }),
    defineField({ name: 'author', title: 'Author', type: 'string' }),
  ],
  preview: {
    select: { title: 'title', status: 'status', media: 'featuredImage' },
    prepare: ({ title, status, media }) => ({ title, subtitle: status, media }),
  },
});
