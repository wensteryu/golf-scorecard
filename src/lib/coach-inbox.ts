import { aggregateStats } from './stats';
import { Profile, Scorecard } from './types';

export interface StudentRow {
  student: Profile;
  /** Submitted rounds awaiting review, most recent round first. */
  pending: Scorecard[];
  lastRoundDate: string | null;
  tournamentAvg18: number | null;
}

/**
 * Groups scorecards by student for the coach inbox.
 * Students with pending reviews come first (most pending first, then most recent pending round);
 * the rest follow by most recent round, then students with no rounds by name.
 */
export function buildStudentRows(students: Profile[], scorecards: Scorecard[]): StudentRow[] {
  const byStudent = new Map<string, Scorecard[]>();
  for (const sc of scorecards) {
    const list = byStudent.get(sc.student_id) ?? [];
    list.push(sc);
    byStudent.set(sc.student_id, list);
  }

  const rows = students.map((student): StudentRow => {
    const cards = byStudent.get(student.id) ?? [];
    const pending = cards
      .filter((sc) => sc.status === 'submitted')
      .sort((a, b) => b.round_date.localeCompare(a.round_date));
    const lastRoundDate = cards.reduce<string | null>(
      (max, sc) => (max === null || sc.round_date > max ? sc.round_date : max),
      null
    );
    return {
      student,
      pending,
      lastRoundDate,
      tournamentAvg18: aggregateStats(cards, 'tournament')?.scoringAvg18 ?? null,
    };
  });

  const latestPending = (r: StudentRow) => r.pending[0]?.round_date ?? '';
  return rows.sort((a, b) => {
    if (a.pending.length > 0 !== b.pending.length > 0) return a.pending.length > 0 ? -1 : 1;
    if (a.pending.length !== b.pending.length) return b.pending.length - a.pending.length;
    if (a.pending.length > 0) return latestPending(b).localeCompare(latestPending(a));
    if (a.lastRoundDate !== b.lastRoundDate) {
      if (a.lastRoundDate === null) return 1;
      if (b.lastRoundDate === null) return -1;
      return b.lastRoundDate.localeCompare(a.lastRoundDate);
    }
    return a.student.full_name.localeCompare(b.student.full_name);
  });
}
