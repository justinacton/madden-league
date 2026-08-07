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
  { label: 'Difficulty', value: 'All Pro' },  
];

export const ruleSections: RuleSection[] = [
  { title: 'Scheduling Games', content: 'To keep league stats accurate, please try and play 1 game per week.  Reach out to your opponent via the contact information provided to schedule the game.' },
  { title: 'Game Completion Deadlines', content: 'This is not a hard rule, but try and complete your game for the week by Sunday evening.' },
  { title: 'Disconnects and Restarts', content: 'Things happen sometimes.  Work with your opponent to come up with a fair plan.  Try and keep stats intact.' },
  { title: 'Sportsmanship', content: 'Keep it friendly and respectful.' },
  { title: 'Streaming or Recording', content: 'Feel free to stream or record your games if that is what you are into.' },
  { title: 'Pausing Games', content: 'No excessive pausing.  Only pause before a kickoff or while you are on offense.' },
  { title: 'Running Up the Score', content: 'Do or do not, that is the question.' },
  { title: 'Play-Calling Restrictions', content: 'Call whatever plays you want.  It is the other teams responsibility to stop it.' },
  { title: 'Fourth-Down Rules', content: 'Go for it whenever you want.  Just make sure you get it!' },
  { title: 'Onside Kick Rules', content: 'There are no specific rules regarding onside kicks.  I believe the game only lets you do it in certain situations anyways.' },
  { title: 'Commissioner Decisions', content: 'Anything not covered here will be adjudicated by the commissioner.' },
  { title: 'Playoff Qualification and Tiebreakers', content: 'TBD' },
];
