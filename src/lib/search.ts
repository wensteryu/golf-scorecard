import { Scorecard } from './types';

/** Case-insensitive match on course name, round/event name, or date (e.g. "coyote", "jtnc", "sep 20"). */
export function roundMatches(sc: Scorecard, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const date = new Date(sc.round_date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return [sc.course?.name, sc.tournament_name, date, sc.round_date]
    .filter(Boolean)
    .some((field) => field!.toLowerCase().includes(q));
}
