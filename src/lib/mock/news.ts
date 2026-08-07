import type { NewsArticle } from '../types';

export const news: NewsArticle[] = [
  {
    id: 'news-season2-kickoff',
    title: 'Season 2 Kicks Off With Two Blockbuster Trades',
    slug: 'season-2-kickoff',
    publishDate: '2026-06-04T15:00:00.000Z',
    status: 'Published',
    summary:
      'Defending champion Sam Chen swaps rosters with Drew Patel in the offseason\'s biggest surprise, headlining a new-look Season 2.',
    body: `Season 2 is officially underway, and the headline is the offseason trade that sent reigning champion **Sam Chen** from the 49ers to the Ravens, with **Drew Patel** moving the other direction into San Francisco.

## What to watch this season

- Can Sam repeat as champion with a brand new roster?
- Drew inherits a 49ers team that made the semifinals a year ago.
- Ten full regular-season weeks are on the schedule this year, up from four in Season 1.

Ten weeks of regular-season football kick off now, with the top four teams advancing to the playoffs once again. Good luck to all eight managers.`,
    seasonId: 'season-02',
    week: 1,
    featured: true,
    author: 'Commissioner',
  },
  {
    id: 'news-season1-championship-recap',
    title: 'Sam Chen Wins It All in Season 1 Championship Thriller',
    slug: 'season-1-championship-recap',
    publishDate: '2025-10-11T22:30:00.000Z',
    status: 'Published',
    summary:
      'A last-minute field goal capped an undefeated playoff run for the 49ers over Alex Rivera\'s Chiefs in the inaugural championship.',
    body: `The league's first-ever championship game lived up to the billing. **Sam Chen**'s 49ers held off **Alex Rivera**'s Chiefs behind a last-minute field goal to close out an undefeated playoff run and claim the Season 1 title.

Alex's Chiefs finished as runner-up after knocking out Drew Patel's Ravens in the semifinals, while Jordan Blake's Bills fell just short in the other semifinal matchup.

Congratulations to everyone who competed in the league's first season — see you all in Season 2.`,
    seasonId: 'season-01',
    week: 6,
    featured: false,
    author: 'Commissioner',
  },
  {
    id: 'news-week4-recap',
    title: 'Week 4 Recap: Undefeated Teams Put on Notice',
    slug: 'week-4-recap',
    publishDate: '2026-06-27T12:00:00.000Z',
    status: 'Published',
    summary: 'Four weeks into Season 2, the race for playoff seeding is already taking shape. Here is what stood out.',
    body: `Four weeks into Season 2 and the standings are starting to separate.

## Statistical leaders through Week 4

1. Passing offenses have been explosive across the league.
2. Turnover margin continues to be the single biggest predictor of wins.
3. Special attention should go to the defenses forcing takeaways at an early-season pace.

Check the [full standings](/seasons/season-02/standings) and [statistical leaders](/seasons/season-02/stats) for the complete breakdown heading into Week 5.`,
    seasonId: 'season-02',
    week: 4,
    featured: true,
    author: 'Commissioner',
  },
];
