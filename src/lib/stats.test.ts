import { describe, expect, it } from 'vitest';
import { aggregateStats } from './stats';
import { HoleScore, RoundType, Scorecard, ScorecardStatus } from './types';

function hole(n: number, par: number, score: number | null, extra: Partial<HoleScore> = {}): HoleScore {
  return {
    id: `h${n}`, scorecard_id: 's', hole_number: n, par, score,
    fairway: null, gir_hit: null, pin_position: null, putts: null, first_putt_distance: null,
    up_and_down: null, penalty_strokes: 0, chip_in: false, coach_note: null,
    fairway_miss_distance: null, club_used: null, approach_distance: null, first_putt_result: null,
    ...extra,
  };
}

function round(
  holes: HoleScore[],
  opts: { type?: RoundType | null; status?: ScorecardStatus; hundred?: number | null } = {}
): Scorecard {
  return {
    id: Math.random().toString(), student_id: 'st', course_id: 'c', tournament_name: '',
    round_type: opts.type === undefined ? 'tournament' : opts.type, round_date: '2026-09-01',
    status: opts.status ?? 'reviewed', hole_count: holes.length, hundred_yards_in: opts.hundred ?? null,
    reflections: null, mentality_rating: null, what_transpired: null, how_to_respond: null,
    coach_feedback: null, created_at: '', updated_at: '', hole_scores: holes,
  };
}

// 18 holes, all par 4, every hole bogey (5) with 2 putts
const bogey18 = () =>
  Array.from({ length: 18 }, (_, i) => hole(i + 1, 4, 5, { putts: 2, fairway: 'hit', gir_hit: false }));
// 9 holes, all par 4, every hole par (4) with 2 putts
const par9 = () =>
  Array.from({ length: 9 }, (_, i) => hole(i + 1, 4, 4, { putts: 2, fairway: 'left', gir_hit: true }));

describe('aggregateStats', () => {
  it('returns null when there are no countable rounds', () => {
    expect(aggregateStats([], 'tournament')).toBeNull();
    expect(aggregateStats([round(bogey18(), { type: 'practice' })], 'tournament')).toBeNull();
  });

  it('ignores unlabeled, in-progress and partially scored rounds', () => {
    const partial = bogey18();
    partial[17] = hole(18, 4, null);
    const cards = [
      round(bogey18(), { type: null }),
      round(bogey18(), { status: 'in_progress' }),
      round(partial),
      round(bogey18()),
    ];
    expect(aggregateStats(cards, 'tournament')!.rounds).toBe(1);
  });

  it('keeps 9-hole rounds out of the 18-hole scoring average', () => {
    const s = aggregateStats([round(bogey18()), round(par9())], 'tournament')!;
    expect(s.rounds).toBe(2);
    expect(s.scoringAvg18).toBe(90);
    expect(s.toParAvg18).toBe(18);
    expect(s.best18).toBe(90);
    expect(s.scoringAvg9).toBe(36);
    // par-4 average pools all 27 holes: (18*5 + 9*4) / 27
    expect(s.par4Avg).toBeCloseTo(126 / 27);
    expect(s.par3Avg).toBeNull();
  });

  it('pools holes for percentages and normalizes rates per 18', () => {
    const s = aggregateStats([round(bogey18()), round(par9())], 'tournament')!;
    expect(s.fairwayPct).toBeCloseTo((18 / 27) * 100);
    expect(s.missLeftPct).toBeCloseTo((9 / 27) * 100);
    expect(s.girPct).toBeCloseTo((9 / 27) * 100);
    expect(s.puttsPer18).toBe(36);
    expect(s.puttsPerGir).toBe(2);
    expect(s.doublesPer18).toBe(0);
    expect(s.birdiesPer18).toBe(0);
  });

  it('skips unanswered fields instead of counting them as zero', () => {
    const holes = bogey18().map((h, i) => (i < 9 ? { ...h, putts: null, gir_hit: null } : h));
    const s = aggregateStats([round(holes)], 'tournament')!;
    expect(s.puttsPer18).toBe(36);
    expect(s.girPct).toBe(0);
    expect(s.upAndDownPct).toBeNull();
  });

  it('scales 100-yards-in to 18 holes using only rounds that recorded it', () => {
    const s = aggregateStats(
      [round(bogey18(), { hundred: 20 }), round(par9(), { hundred: 8 }), round(bogey18())],
      'tournament'
    )!;
    expect(s.hundredYardsInPer18).toBeCloseTo((28 / 27) * 18);
  });

  it('filters by round type', () => {
    const s = aggregateStats([round(bogey18()), round(par9(), { type: 'practice' })], 'practice')!;
    expect(s.rounds).toBe(1);
    expect(s.scoringAvg18).toBeNull();
    expect(s.scoringAvg9).toBe(36);
  });
});
