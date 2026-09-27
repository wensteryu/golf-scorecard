import { describe, expect, it } from 'vitest';
import { buildStudentRows } from './coach-inbox';
import { Profile, Scorecard, ScorecardStatus } from './types';

const student = (id: string, full_name: string) => ({ id, full_name }) as Profile;

const card = (student_id: string, status: ScorecardStatus, round_date: string) =>
  ({ id: `${student_id}-${round_date}`, student_id, status, round_date, round_type: 'tournament', hole_scores: [] }) as unknown as Scorecard;

describe('buildStudentRows', () => {
  const students = [student('a', 'Ann'), student('b', 'Bea'), student('c', 'Cal'), student('d', 'Dee'), student('e', 'Eve')];
  const cards = [
    card('a', 'reviewed', '2026-09-01'),
    card('b', 'submitted', '2026-09-10'),
    card('b', 'submitted', '2026-09-12'),
    card('b', 'reviewed', '2026-08-01'),
    card('c', 'submitted', '2026-09-14'),
    card('d', 'reviewed', '2026-09-15'),
  ];
  const rows = buildStudentRows(students, cards);

  it('puts students with pending reviews first, most pending first', () => {
    expect(rows.map((r) => r.student.id)).toEqual(['b', 'c', 'd', 'a', 'e']);
  });

  it('breaks pending-count ties by most recent pending round', () => {
    const tie = buildStudentRows(students.slice(0, 3), [
      card('a', 'submitted', '2026-09-01'),
      card('c', 'submitted', '2026-09-20'),
    ]);
    expect(tie.map((r) => r.student.id)).toEqual(['c', 'a', 'b']);
  });

  it('groups pending rounds per student, newest first', () => {
    const bea = rows.find((r) => r.student.id === 'b')!;
    expect(bea.pending.map((sc) => sc.round_date)).toEqual(['2026-09-12', '2026-09-10']);
    expect(bea.lastRoundDate).toBe('2026-09-12');
  });

  it('handles students with no rounds', () => {
    const eve = rows.find((r) => r.student.id === 'e')!;
    expect(eve.pending).toEqual([]);
    expect(eve.lastRoundDate).toBeNull();
    expect(eve.tournamentAvg18).toBeNull();
  });
});
