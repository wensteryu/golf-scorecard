import { HoleScore, RoundStats } from './types';

export function calculateStats(holes: HoleScore[]): RoundStats {
  const front9 = holes.filter((h) => h.hole_number <= 9);
  const back9 = holes.filter((h) => h.hole_number > 9);

  const sum = (arr: HoleScore[], key: 'score' | 'par' | 'putts' | 'penalty_strokes') =>
    arr.reduce((acc, h) => acc + (h[key] ?? 0), 0);

  const totalScore = sum(holes, 'score');
  const totalPar = sum(holes, 'par');

  // Fairway stats (only count non-par-3 holes)
  const fairwayHoles = holes.filter((h) => h.par > 3);
  const fairwaysHit = fairwayHoles.filter((h) => h.fairway === 'hit').length;
  const fairwaysMissedLeft = fairwayHoles.filter((h) => h.fairway === 'left').length;
  const fairwaysMissedRight = fairwayHoles.filter((h) => h.fairway === 'right').length;
  const fairwaysTotal = fairwayHoles.filter((h) => h.fairway !== null).length;

  // GIR stats
  const girHoles = holes.filter((h) => h.gir_hit !== null);
  const girHit = holes.filter((h) => h.gir_hit === true).length;
  const pinPositionLeft = holes.filter((h) => h.pin_position?.includes('left')).length;
  const pinPositionRight = holes.filter((h) => h.pin_position?.includes('right')).length;
  const pinPositionShort = holes.filter((h) => h.pin_position?.includes('short')).length;
  const pinPositionOver = holes.filter((h) => h.pin_position?.includes('over')).length;
  const pinPositionPinHigh = holes.filter((h) => h.pin_position?.includes('pin_high')).length;

  // Fairway miss distance
  const fwMissDistances = holes
    .filter((h) => h.fairway_miss_distance != null)
    .map((h) => h.fairway_miss_distance!);
  const avgFairwayMissDistance = fwMissDistances.length > 0
    ? Math.round(fwMissDistances.reduce((a, b) => a + b, 0) / fwMissDistances.length)
    : null;

  // Approach distance
  const approachDistances = holes
    .filter((h) => h.approach_distance != null)
    .map((h) => h.approach_distance!);
  const avgApproachDistance = approachDistances.length > 0
    ? Math.round(approachDistances.reduce((a, b) => a + b, 0) / approachDistances.length)
    : null;

  // Club usage counts
  const clubUsageCounts: Record<string, number> = {};
  holes.forEach((h) => {
    if (h.club_used) {
      clubUsageCounts[h.club_used] = (clubUsageCounts[h.club_used] ?? 0) + 1;
    }
  });

  // Putt stats
  const totalPutts = sum(holes, 'putts');
  const onePutts = holes.filter((h) => h.putts === 1).length;
  const threePutts = holes.filter((h) => (h.putts ?? 0) >= 3).length;
  const chipIns = holes.filter((h) => h.chip_in).length;

  // First putt result stats
  const firstPuttMade = holes.filter((h) => h.first_putt_result === 'made').length;
  const firstPuttShort = holes.filter((h) => h.first_putt_result === 'short').length;
  const firstPuttOver = holes.filter((h) => h.first_putt_result === 'over').length;
  const firstPuttHighSide = holes.filter((h) => h.first_putt_result === 'high_side').length;
  const firstPuttLowSide = holes.filter((h) => h.first_putt_result === 'low_side').length;

  // Up and down
  const upAndDownHoles = holes.filter((h) => h.up_and_down !== null);
  const upAndDownMade = upAndDownHoles.filter((h) => h.up_and_down === true).length;
  const upAndDownAttempts = upAndDownHoles.length;

  // Scoring by par
  const scoringToPar = (par: number) => {
    const parHoles = holes.filter((h) => h.par === par && h.score !== null);
    return parHoles.reduce((acc, h) => acc + ((h.score ?? 0) - h.par), 0);
  };

  return {
    totalScore,
    totalPar,
    scoreToPar: totalScore - totalPar,
    front9Score: sum(front9, 'score'),
    front9Par: sum(front9, 'par'),
    back9Score: sum(back9, 'score'),
    back9Par: sum(back9, 'par'),
    fairwaysHit,
    fairwaysTotal,
    fairwaysMissedLeft,
    fairwaysMissedRight,
    girHit,
    girTotal: girHoles.length,
    pinPositionLeft,
    pinPositionRight,
    pinPositionShort,
    pinPositionOver,
    pinPositionPinHigh,
    totalPutts,
    onePutts,
    threePutts,
    chipIns,
    upAndDownMade,
    upAndDownAttempts,
    par3ScoringToPar: scoringToPar(3),
    par4ScoringToPar: scoringToPar(4),
    par5ScoringToPar: scoringToPar(5),
    penaltyStrokes: sum(holes, 'penalty_strokes'),
    avgFairwayMissDistance,
    avgApproachDistance,
    clubUsageCounts,
    firstPuttMade,
    firstPuttShort,
    firstPuttOver,
    firstPuttHighSide,
    firstPuttLowSide,
  };
}

export function scoreColor(score: number | null, par: number): string {
  if (score === null) return 'bg-gray-100 text-gray-400';
  const diff = score - par;
  if (diff <= -2) return 'bg-yellow-400 text-yellow-900'; // Eagle or better
  if (diff === -1) return 'bg-emerald-500 text-white'; // Birdie
  if (diff === 0) return 'bg-gray-100 text-gray-800'; // Par
  if (diff === 1) return 'bg-amber-200 text-amber-900'; // Bogey
  if (diff === 2) return 'bg-orange-300 text-orange-900'; // Double
  return 'bg-red-400 text-white'; // Triple+
}

export function scoreLabel(score: number | null, par: number): string {
  if (score === null) return '';
  const diff = score - par;
  if (diff <= -2) return 'Eagle';
  if (diff === -1) return 'Birdie';
  if (diff === 0) return 'Par';
  if (diff === 1) return 'Bogey';
  if (diff === 2) return 'Double';
  return 'Triple+';
}

export function formatScoreToPar(score: number): string {
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : `${score}`;
}
