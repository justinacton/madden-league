import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'team',
  title: 'Team',
  type: 'document',
  fields: [
    defineField({ name: 'city', title: 'City', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'teamName', title: 'Team Name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'abbreviation', title: 'Abbreviation', type: 'string', validation: (r) => r.required().max(5) }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'teamName' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'conference', title: 'Conference', type: 'string', options: { list: ['AFC', 'NFC'] } }),
    defineField({ name: 'division', title: 'Division', type: 'string' }),
    defineField({ name: 'primaryColor', title: 'Primary Color', type: 'string', description: 'Hex value, e.g. #003594' }),
    defineField({ name: 'secondaryColor', title: 'Secondary Color', type: 'string', description: 'Hex value' }),
    defineField({ name: 'logo', title: 'Logo', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'active', title: 'Active', type: 'boolean', initialValue: true }),
  ],
  preview: {
    select: { title: 'teamName', subtitle: 'city', media: 'logo' },
  },
});
