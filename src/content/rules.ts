/**
 * Static rules content — intentionally not sourced from Airtable/Sanity.
 * Edit this file directly to change league settings or house rules.
 */

export interface RuleSetting {
  label: string;
  value: string;
}

export type RuleBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[]; ordered?: boolean };

export interface RuleSection {
  title: string;
  blocks: RuleBlock[];
}

const p = (text: string): RuleBlock => ({ type: 'paragraph', text });
const ul = (items: string[]): RuleBlock => ({ type: 'list', items });
const ol = (items: string[]): RuleBlock => ({ type: 'list', items, ordered: true });

export const leagueSettings: RuleSetting[] = [
  { label: 'Game Style', value: 'Competitive' },
  { label: 'Quarter Length', value: '6 minutes' },
  { label: 'Injuries', value: 'Off' },
  { label: 'Rosters', value: 'Updated NFL rosters' },
  { label: 'Difficulty', value: 'All Pro' },
  { label: 'Games Per Week', value: '1' },
];

export const ruleSections: RuleSection[] = [
  {
    title: 'Scheduling Games',
    blocks: [
      ul([
        'To keep league stats accurate, please try and play 1 game per week.',
        'Reach out to your opponent via the contact information provided or in the #scheduling channel.',
      ]),
    ],
  },
  {
    title: 'Game Completion Deadlines',
    blocks: [p('This is not a hard rule, but try and complete your game for the week by Sunday evening.')],
  },
  {
    title: 'Disconnects and Restarts',
    blocks: [p('Things happen sometimes. Work with your opponent to come up with a fair plan. Try and keep stats intact.')],
  },
  {
    title: 'Sportsmanship',
    blocks: [p('Keep it friendly and respectful.')],
  },
  {
    title: 'Streaming or Recording',
    blocks: [p('Feel free to stream or record your games if that is what you are into.')],
  },
  {
    title: 'Pausing Games',
    blocks: [p('No excessive pausing. Only pause before a kickoff or while you are on offense.')],
  },
  {
    title: 'Running Up The Score',
    blocks: [p('Do or do not, that is the question.')],
  },
  {
    title: 'Play Calling Restrictions',
    blocks: [
      p(
        'Call whatever plays you want. It is the other team’s responsibility to stop it. Every year there are plays that are considered "cheesy" but I feel they can all be stopped.'
      ),
    ],
  },
  {
    title: 'Fourth Down Rules',
    blocks: [p('Go for it whenever you want. Just make sure you get it!')],
  },
  {
    title: 'Onside Kick Rules',
    blocks: [
      p('There are no specific rules regarding onside kicks. I believe the game only lets you do it in certain situations anyways.'),
    ],
  },
  {
    title: 'Commissioner Decisions',
    blocks: [p('Anything not covered here will be adjudicated by the commissioner.')],
  },
  {
    title: 'Playoff Qualifications and Tiebreakers',
    blocks: [
      ul([
        'The top 4 teams from each conference will make the playoffs.',
        'It will be seeded, 1-4, with 1 playing 4 and 2 playing 3.',
      ]),
      p('Tiebreakers are as follows:'),
      ol([
        'Head-to-head — If the tied teams played each other, winner gets the higher seed.',
        'Conference record — Best winning percentage in conference games.',
        'Common-games record — Best record against opponents both teams played.',
        'Strength of victory — Combined winning percentage of the teams you beat.',
        'Point differential — Points scored minus points allowed for the season.',
        'Random draw — Last-resort tiebreaker.',
      ]),
    ],
  },
  {
    title: 'Playbooks',
    blocks: [p('Use whatever playbook (standard or custom) that you’d like.')],
  },
  {
    title: 'Stat Collection',
    blocks: [
      p(
        'Since we don’t have a full league, we can’t run it through the online Madden league stuff. Each game will be "play now" against a friend.'
      ),
      p('Once the game is complete, please send screenshots of the following items (either in the #game-stats channel, or via email/text):'),
      ul([
        'Team stats',
        'Player stats — Passing (pass yds, attempts, completions, TD, INT), Rushing (attempts, yds, TD, long), Receiving (receptions, yds, TD, long), Defense (tackles, sacks, INT, forced fumbles, fumble recoveries, defensive TDs)',
      ]),
    ],
  },
];
