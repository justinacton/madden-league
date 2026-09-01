import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemaTypes';

// Same base data model as the Airtable-backed site (see ../src/lib/types.ts):
// Seasons, Managers, Teams, Season Entries, Games, Player Stats, News.
export default defineConfig({
  name: 'default',
  title: 'PUNT League',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? '',
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
});
