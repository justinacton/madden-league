/**
 * Static rules content per PRD §6.9 — intentionally not sourced from
 * Airtable. Only the settings explicitly given in the PRD are filled in;
 * everything else is a visible placeholder for the commissioner to edit
 * directly in this file. Do not invent league rules that were not provided.
 */

export interface RuleSetting {
  label: string;
  value: string;
}

export interface RuleSection {
  title: string;
  content: string;
}

export const leagueSettings: RuleSetting[] = [
  { label: 'Game Style', value: 'Competitive' },
  { label: 'Quarter Length', value: '6 minutes' },
  { label: 'Injuries', value: 'Disabled' },
  { label: 'Rosters', value: 'Updated NFL rosters' },
  { label: 'Game Speed', value: '[Commissioner: Set game speed]' },
  { label: 'Difficulty', value: '[Commissioner: Set difficulty level]' },
  { label: 'Salary Cap / Roster Rules', value: '[Commissioner: Not used in this league — teams are NFL franchises, not managed rosters]' },
];

export const ruleSections: RuleSection[] = [
  { title: 'Scheduling Games', content: '[Commissioner: Add scheduling policy — how weekly matchups are arranged and confirmed.]' },
  { title: 'Game Completion Deadlines', content: '[Commissioner: Add the deadline for completing each week\'s games.]' },
  { title: 'Disconnects and Restarts', content: '[Commissioner: Add disconnect policy — when a game must be replayed vs. resumed from the last known score.]' },
  { title: 'Sportsmanship', content: '[Commissioner: Add expectations for conduct during and after games.]' },
  { title: 'Streaming or Recording', content: '[Commissioner: Add policy on streaming or recording league games, if applicable.]' },
  { title: 'Pausing Games', content: '[Commissioner: Add rules for when and how games may be paused.]' },
  { title: 'Running Up the Score', content: '[Commissioner: Add guidance on play-calling once a game is out of reach.]' },
  { title: 'Play-Calling Restrictions', content: '[Commissioner: Add any restricted formations, plays, or defensive schemes, if any.]' },
  { title: 'Fourth-Down Rules', content: '[Commissioner: Add any house rules for fourth-down attempts, if any.]' },
  { title: 'Onside Kick Rules', content: '[Commissioner: Add any restrictions on onside kicks, if any.]' },
  { title: 'Commissioner Decisions', content: '[Commissioner: Add how disputes and edge cases not covered here will be resolved.]' },
  { title: 'Playoff Qualification and Tiebreakers', content: '[Commissioner: Add how many teams make the playoffs and how ties in the standings are broken.]' },
];
