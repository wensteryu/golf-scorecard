import { calculateStats } from './calculations';
import { HoleScore, RoundType, Scorecard } from './types';

export interface AggregateStats {
  rounds: number;
  /** Countable rounds of this type before the `lastN` limit was applied. */
  totalRounds: number;
  holes: number;
  // Scoring (by round length so 9s don't drag down 18-hole averages)
  rounds18: number;
  scoringAvg18: number | null;
  toParAvg18: number | null;
  best18: number | null;
  rounds9: number;
  scoringAvg9: number | null;
  par3Avg: number | null;
  par4Avg: number | null;
  par5Avg: number | null;
  // Percentages (0-100)
  fairwayPct: number | null;
  missLeftPct: number | null;
  missRightPct: number | null;
  girPct: number | null;
  upAndDownPct: number | null;
  // Per-18-hole rates
  puttsPer18: number | null;
  onePuttsPer18: number | null;
  threePuttsPer18: number | null;
  birdiesPer18: number;
  doublesPer18: number;
  penaltiesPer18: number;
  hundredYardsInPer18: number | null;
  puttsPerGir: number | null;
}

/** Finished rounds (submitted/reviewed, every hole scored) of the given type. */
export function countableRounds(scorecards: Scorecard[], type: RoundType): Scorecard[] {
  return scorecards.filter(
    (sc) =>
      sc.round_type === type &&
      sc.status !== 'in_progress' &&
      (sc.hole_scores?.length ?? 0) > 0 &&
      sc.hole_scores!.every((h) => h.score !== null)
  );
}

const avg = (nums: number[]) =>
  nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
const pct = (n: number, d: number) => (d > 0 ? (n / d) * 100 : null);

/** `lastN` limits to the most recent N countable rounds by round date; omit for all rounds. */
export function aggregateStats(
  scorecards: Scorecard[],
  type: RoundType,
  lastN?: number
): AggregateStats | null {
  const all = countableRounds(scorecards, type).sort((a, b) => b.round_date.localeCompare(a.round_date));
  if (all.length === 0) return null;
  const rounds = lastN === undefined ? all : all.slice(0, lastN);

  const holes: HoleScore[] = rounds.flatMap((sc) => sc.hole_scores!);
  const pooled = calculateStats(holes);
  const per18 = (n: number, holeCount: number) => (holeCount > 0 ? (n / holeCount) * 18 : null);

  const totals = (len: number) =>
    rounds.filter((sc) => sc.hole_scores!.length === len).map((sc) => calculateStats(sc.hole_scores!));
  const t18 = totals(18);
  const t9 = totals(9);

  const parAvg = (par: number) => avg(holes.filter((h) => h.par === par).map((h) => h.score!));

  const puttHoles = holes.filter((h) => h.putts !== null);
  const girHoles = holes.filter((h) => h.gir_hit === true && h.putts !== null);

  const withHundred = rounds.filter((sc) => sc.hundred_yards_in !== null);
  const hundredHoles = withHundred.reduce((acc, sc) => acc + sc.hole_scores!.length, 0);
  const hundredTotal = withHundred.reduce((acc, sc) => acc + sc.hundred_yards_in!, 0);

  return {
    rounds: rounds.length,
    totalRounds: all.length,
    holes: holes.length,
    rounds18: t18.length,
    scoringAvg18: avg(t18.map((s) => s.totalScore)),
    toParAvg18: avg(t18.map((s) => s.scoreToPar)),
    best18: t18.length > 0 ? Math.min(...t18.map((s) => s.totalScore)) : null,
    rounds9: t9.length,
    scoringAvg9: avg(t9.map((s) => s.totalScore)),
    par3Avg: parAvg(3),
    par4Avg: parAvg(4),
    par5Avg: parAvg(5),
    fairwayPct: pct(pooled.fairwaysHit, pooled.fairwaysTotal),
    missLeftPct: pct(pooled.fairwaysMissedLeft, pooled.fairwaysTotal),
    missRightPct: pct(pooled.fairwaysMissedRight, pooled.fairwaysTotal),
    girPct: pct(pooled.girHit, pooled.girTotal),
    upAndDownPct: pct(pooled.upAndDownMade, pooled.upAndDownAttempts),
    puttsPer18: per18(pooled.totalPutts, puttHoles.length),
    onePuttsPer18: per18(pooled.onePutts, puttHoles.length),
    threePuttsPer18: per18(pooled.threePutts, puttHoles.length),
    birdiesPer18: per18(holes.filter((h) => h.score! - h.par <= -1).length, holes.length)!,
    doublesPer18: per18(holes.filter((h) => h.score! - h.par >= 2).length, holes.length)!,
    penaltiesPer18: per18(pooled.penaltyStrokes, holes.length)!,
    hundredYardsInPer18: per18(hundredTotal, hundredHoles),
    puttsPerGir: avg(girHoles.map((h) => h.putts!)),
  };
}
