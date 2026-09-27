import { describe, expect, it } from 'vitest';
import { roundMatches } from './search';
import { Scorecard } from './types';

const sc = {
  round_date: '2026-09-20',
  tournament_name: 'JTNC Fall Series',
  course: { name: 'Coyote Creek' },
} as unknown as Scorecard;

describe('roundMatches', () => {
  it('matches course, event name and date, ignoring case', () => {
    expect(roundMatches(sc, 'coyote')).toBe(true);
    expect(roundMatches(sc, 'jtnc')).toBe(true);
    expect(roundMatches(sc, 'Sep 20')).toBe(true);
    expect(roundMatches(sc, '2026-09')).toBe(true);
  });

  it('treats a blank query as a match and rejects non-matches', () => {
    expect(roundMatches(sc, '  ')).toBe(true);
    expect(roundMatches(sc, 'ajga')).toBe(false);
  });

  it('handles a missing course', () => {
    expect(roundMatches({ ...sc, course: undefined } as Scorecard, 'jtnc')).toBe(true);
  });
});
