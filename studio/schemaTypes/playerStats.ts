import { defineField, defineType } from 'sanity';

const stat = (name: string, title: string) => defineField({ name, title, type: 'number' });

export default defineType({
  name: 'playerStats',
  title: 'Player Stats',
  type: 'document',
  description:
    'One player\'s full statistical line from one game. There is intentionally no separate Players document — playerName is free text (the Madden roster name); use the same spelling all season so stats aggregate correctly.',
  fields: [
    defineField({ name: 'game', title: 'Game', type: 'reference', to: [{ type: 'game' }], validation: (r) => r.required() }),
    defineField({ name: 'seasonEntry', title: 'Season Entry', type: 'reference', to: [{ type: 'seasonEntry' }], validation: (r) => r.required() }),
    defineField({ name: 'playerName', title: 'Player Name', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'position',
      title: 'Position',
      type: 'string',
      options: { list: ['QB', 'RB', 'FB', 'WR', 'TE', 'OL', 'DL', 'DE', 'DT', 'LB', 'CB', 'S', 'K', 'P', 'OTHER'] },
      validation: (r) => r.required(),
    }),

    // Passing
    stat('passCompletions', 'Pass Completions'),
    stat('passAttempts', 'Pass Attempts'),
    stat('passingYards', 'Passing Yards'),
    stat('passingTouchdowns', 'Passing Touchdowns'),
    stat('interceptionsThrown', 'Interceptions Thrown'),

    // Rushing
    stat('rushAttempts', 'Rush Attempts'),
    stat('rushingYards', 'Rushing Yards'),
    stat('rushingTouchdowns', 'Rushing Touchdowns'),
    stat('longRush', 'Long Rush'),

    // Receiving
    stat('receptions', 'Receptions'),
    stat('receivingYards', 'Receiving Yards'),
    stat('receivingTouchdowns', 'Receiving Touchdowns'),
    stat('longReception', 'Long Reception'),

    // Defense
    stat('tackles', 'Tackles'),
    stat('sacks', 'Sacks'),
    stat('interceptions', 'Interceptions'),
    stat('forcedFumbles', 'Forced Fumbles'),
    stat('fumbleRecoveries', 'Fumble Recoveries'),
    stat('defensiveTouchdowns', 'Defensive Touchdowns'),

    // Fumbles
    stat('fumbles', 'Fumbles'),
    stat('fumblesLost', 'Fumbles Lost'),
  ],
  preview: {
    select: { title: 'playerName', subtitle: 'position' },
  },
});
