'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Scorecard, HoleScore, ScorecardStatus, MentalityRating } from '@/lib/types';
import { calculateStats, formatScoreToPar } from '@/lib/calculations';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const CONFETTI_COLORS = [
  'bg-golf-green',
  'bg-golf-blue',
  'bg-golf-orange',
  'bg-golf-red',
  'bg-golf-purple',
  'bg-yellow-400',
  'bg-emerald-400',
  'bg-pink-400',
];

function ConfettiOverlay() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 2}s`,
    size: Math.random() > 0.5 ? 'w-3 h-3' : 'w-2 h-4',
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    rotate: `rotate(${Math.random() * 360}deg)`,
  }));

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className={[
            'absolute rounded-sm animate-confetti',
            piece.size,
            piece.color,
          ].join(' ')}
          style={{
            left: piece.left,
            top: '-20px',
            animationDelay: piece.delay,
            transform: piece.rotate,
          }}
        />
      ))}
    </div>
  );
}

function StatBar({
  value,
  total,
  color = 'bg-golf-green',
}: {
  value: number;
  total: number;
  color?: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 bg-golf-gray-100 rounded-full overflow-hidden">
        <div
          className={['h-full rounded-full transition-all duration-500', color].join(' ')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-bold text-golf-gray-500 w-12 text-right">{pct}%</span>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-golf-gray-400">{label}</span>
      <span className="text-sm font-bold text-golf-gray-500">{value}</span>
    </div>
  );
}

function mentalityLabel(rating: MentalityRating): string {
  switch (rating) {
    case 4: return 'Excellent';
    case 3: return 'Good';
    case 2: return 'Average';
    case 1: return 'Poor';
  }
}

export default function SummaryPage() {
  const params = useParams();
  const router = useRouter();
  const scorecardId = params.id as string;
  const supabase = createClient();

  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [holeScores, setHoleScores] = useState<HoleScore[]>([]);
  const [studentName, setStudentName] = useState('');
  const [parentEmail, setParentEmail] = useState<string | null>(null);
  const [parentFirstName, setParentFirstName] = useState<string | null>(null);
  const [courseName, setCourseName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: sc, error: scError } = await supabase
          .from('scorecards')
          .select('*, hole_scores(*)')
          .eq('id', scorecardId)
          .single();

        if (scError) throw scError;
        if (!sc) throw new Error('Scorecard not found');

        const sorted = (sc.hole_scores as HoleScore[]).sort(
          (a, b) => a.hole_number - b.hole_number
        );

        setScorecard(sc as Scorecard);
        setHoleScores(sorted);

        // Fetch student name and course name for email notification
        const [profileRes, courseRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('full_name, parent_email, parent_first_name')
            .eq('id', sc.student_id)
            .single(),
          supabase.from('golf_courses').select('name').eq('id', sc.course_id).single(),
        ]);
        if (profileRes.data) {
          setStudentName(profileRes.data.full_name);
          setParentEmail(profileRes.data.parent_email ?? null);
          setParentFirstName(profileRes.data.parent_first_name ?? null);
        }
        if (courseRes.data) setCourseName(courseRes.data.name);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load summary');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scorecardId]);

  const handleSubmit = useCallback(async () => {
    if (!scorecard || submitting) return;
    setSubmitting(true);

    try {
      const { error: updateError } = await supabase
        .from('scorecards')
        .update({
          status: 'submitted' as ScorecardStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', scorecardId);

      if (updateError) throw updateError;

      setScorecard((prev) => (prev ? { ...prev, status: 'submitted' } : prev));
      setShowConfetti(true);

      // Fire-and-forget email notification to coach
      const scores = calculateStats(holeScores);
      fetch('/api/notify-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          courseName,
          roundDate: scorecard.round_date,
          totalScore: scores.totalScore,
          scoreToPar: scores.scoreToPar,
          scorecardId,
        }),
      }).catch(() => {});

      // Fire-and-forget email notification to parent (if configured)
      if (parentEmail) {
        fetch('/api/notify-parent-submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parentEmail,
            parentFirstName,
            studentName,
            courseName,
            roundDate: scorecard.round_date,
            totalScore: scores.totalScore,
            scoreToPar: scores.scoreToPar,
            scorecardId,
          }),
        }).catch(() => {});
      }
    } catch {
      setSubmitting(false);
    }
  }, [scorecard, submitting, scorecardId, supabase, holeScores, studentName, courseName, parentEmail, parentFirstName]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-golf-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-golf-green border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-golf-gray-400">Loading summary...</p>
        </div>
      </div>
    );
  }

  if (error || !scorecard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-golf-gray-50 px-6">
        <div className="text-center">
          <p className="text-lg font-bold text-golf-red mb-4">
            {error ?? 'Scorecard not found'}
          </p>
          <Button variant="secondary" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const stats = calculateStats(holeScores);
  const scoreToParColor =
    stats.scoreToPar > 0
      ? 'text-golf-red'
      : stats.scoreToPar < 0
        ? 'text-emerald-600'
        : 'text-golf-gray-500';

  function parScoringColor(value: number) {
    if (value < 0) return 'text-emerald-600';
    if (value > 0) return 'text-golf-red';
    return 'text-golf-gray-500';
  }

  const upDownPct =
    stats.upAndDownAttempts > 0
      ? Math.round((stats.upAndDownMade / stats.upAndDownAttempts) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-golf-gray-50 flex flex-col">
      {showConfetti && <ConfettiOverlay />}

      {/* Header */}
      <div className="bg-surface border-b border-golf-gray-100 px-4 py-4 shadow-sm sticky top-0 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/student" className="text-sm font-bold text-golf-gray-400 hover:text-golf-gray-500 min-h-[44px] flex items-center">
            &larr; Home
          </Link>
          <h1 className="text-lg font-extrabold text-golf-gray-500">Summary</h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Summary content */}
      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-4">
        {/* Scoring Section */}
        <Card>
          <CardHeader>Scoring</CardHeader>
          <CardBody>
            <div className="text-center mb-4">
              <div className="text-5xl font-bold text-golf-gray-500">{stats.totalScore}</div>
              <div className={['text-xl font-bold mt-1', scoreToParColor].join(' ')}>
                {formatScoreToPar(stats.scoreToPar)}
              </div>
              <div className="text-xs text-golf-gray-400 mt-1">Par {stats.totalPar}</div>
            </div>
            {stats.back9Par > 0 && (
              <div className="grid grid-cols-2 gap-4 border-t border-golf-gray-100 pt-4">
                <div className="text-center">
                  <div className="text-xs text-golf-gray-400 uppercase tracking-wide mb-1">
                    Front 9
                  </div>
                  <div className="text-2xl font-bold text-golf-gray-500">
                    {stats.front9Score}
                  </div>
                  <div
                    className={[
                      'text-xs font-bold',
                      stats.front9Score - stats.front9Par > 0
                        ? 'text-golf-red'
                        : stats.front9Score - stats.front9Par < 0
                          ? 'text-emerald-600'
                          : 'text-golf-gray-400',
                    ].join(' ')}
                  >
                    {formatScoreToPar(stats.front9Score - stats.front9Par)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-golf-gray-400 uppercase tracking-wide mb-1">
                    Back 9
                  </div>
                  <div className="text-2xl font-bold text-golf-gray-500">
                    {stats.back9Score}
                  </div>
                  <div
                    className={[
                      'text-xs font-bold',
                      stats.back9Score - stats.back9Par > 0
                        ? 'text-golf-red'
                        : stats.back9Score - stats.back9Par < 0
                          ? 'text-emerald-600'
                          : 'text-golf-gray-400',
                    ].join(' ')}
                  >
                    {formatScoreToPar(stats.back9Score - stats.back9Par)}
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Accuracy Section */}
        <Card>
          <CardHeader>Accuracy</CardHeader>
          <CardBody className="space-y-5">
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-bold text-golf-gray-500">Fairways</span>
                <span className="text-sm font-bold text-golf-green">
                  {stats.fairwaysHit}/{stats.fairwaysTotal}
                </span>
              </div>
              <StatBar value={stats.fairwaysHit} total={stats.fairwaysTotal} />
              <div className="flex gap-4 mt-2">
                <span className="text-xs text-golf-gray-400">
                  Missed L: {stats.fairwaysMissedLeft}
                </span>
                <span className="text-xs text-golf-gray-400">
                  Missed R: {stats.fairwaysMissedRight}
                </span>
              </div>
            </div>

            <div className="border-t border-golf-gray-100 pt-4">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-bold text-golf-gray-500">
                  Greens in Regulation
                </span>
                <span className="text-sm font-bold text-golf-green">
                  {stats.girHit}/{stats.girTotal}
                </span>
              </div>
              <StatBar value={stats.girHit} total={stats.girTotal} />
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="text-xs text-golf-gray-400">
                  Left: {stats.pinPositionLeft}
                </span>
                <span className="text-xs text-golf-gray-400">
                  Right: {stats.pinPositionRight}
                </span>
                <span className="text-xs text-golf-gray-400">
                  Short: {stats.pinPositionShort}
                </span>
                <span className="text-xs text-golf-gray-400">
                  Over: {stats.pinPositionOver}
                </span>
                <span className="text-xs text-golf-gray-400">
                  Pin High: {stats.pinPositionPinHigh}
                </span>
              </div>
              {stats.avgFairwayMissDistance !== null && (
                <div className="mt-2">
                  <span className="text-xs text-golf-gray-400">
                    Avg FW Miss: {stats.avgFairwayMissDistance} yds
                  </span>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Approach Section */}
        {(stats.avgApproachDistance !== null || Object.keys(stats.clubUsageCounts).length > 0) && (
          <Card>
            <CardHeader>Approach</CardHeader>
            <CardBody>
              {stats.avgApproachDistance !== null && (
                <StatRow label="Avg Approach Distance" value={`${stats.avgApproachDistance} yds`} />
              )}
              {Object.keys(stats.clubUsageCounts).length > 0 && (
                <div className="border-t border-golf-gray-100 mt-2 pt-2">
                  <span className="text-xs text-golf-gray-400 uppercase tracking-wide">Club Usage</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(stats.clubUsageCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([club, count]) => (
                        <span key={club} className="inline-flex items-center gap-1 bg-golf-gray-100 text-golf-gray-500 text-xs font-bold px-2 py-1 rounded-lg">
                          {club}: {count}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Short Game Section */}
        <Card>
          <CardHeader>Short Game</CardHeader>
          <CardBody>
            <StatRow label="Total Putts" value={stats.totalPutts} />
            <StatRow label="1-Putts" value={stats.onePutts} />
            <StatRow label="3-Putts" value={stats.threePutts} />
            <StatRow label="Chip-ins" value={stats.chipIns} />
            <div className="border-t border-golf-gray-100 mt-2 pt-2">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm text-golf-gray-400">Up and Down</span>
                <span className="text-sm font-bold text-golf-gray-500">
                  {stats.upAndDownMade}/{stats.upAndDownAttempts}
                  {stats.upAndDownAttempts > 0 && (
                    <span className="text-golf-gray-400 font-normal ml-1">({upDownPct}%)</span>
                  )}
                </span>
              </div>
              <StatBar
                value={stats.upAndDownMade}
                total={stats.upAndDownAttempts}
                color="bg-golf-blue"
              />
            </div>
            {(stats.firstPuttMade + stats.firstPuttShort + stats.firstPuttOver + stats.firstPuttHighSide + stats.firstPuttLowSide) > 0 && (
              <div className="border-t border-golf-gray-100 mt-2 pt-2">
                <span className="text-xs text-golf-gray-400 uppercase tracking-wide">1st Putt Tendency</span>
                <div className="mt-2 space-y-1">
                  <StatRow label="Made" value={stats.firstPuttMade} />
                  <StatRow label="Short" value={stats.firstPuttShort} />
                  <StatRow label="Over" value={stats.firstPuttOver} />
                  <StatRow label="High Side" value={stats.firstPuttHighSide} />
                  <StatRow label="Low Side" value={stats.firstPuttLowSide} />
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Scoring by Par */}
        <Card>
          <CardHeader>Scoring by Par</CardHeader>
          <CardBody>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-golf-gray-400">Par 3s</span>
              <span
                className={[
                  'text-sm font-bold',
                  parScoringColor(stats.par3ScoringToPar),
                ].join(' ')}
              >
                {formatScoreToPar(stats.par3ScoringToPar)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-golf-gray-400">Par 4s</span>
              <span
                className={[
                  'text-sm font-bold',
                  parScoringColor(stats.par4ScoringToPar),
                ].join(' ')}
              >
                {formatScoreToPar(stats.par4ScoringToPar)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-golf-gray-400">Par 5s</span>
              <span
                className={[
                  'text-sm font-bold',
                  parScoringColor(stats.par5ScoringToPar),
                ].join(' ')}
              >
                {formatScoreToPar(stats.par5ScoringToPar)}
              </span>
            </div>
          </CardBody>
        </Card>

        {/* Other */}
        <Card>
          <CardHeader>Other</CardHeader>
          <CardBody>
            <StatRow label="Penalty Strokes" value={stats.penaltyStrokes} />
          </CardBody>
        </Card>

        {/* Reflections Summary */}
        {(scorecard.reflections ||
          scorecard.mentality_rating ||
          scorecard.what_transpired ||
          scorecard.how_to_respond) && (
          <Card>
            <CardHeader>Reflections</CardHeader>
            <CardBody className="space-y-4">
              {scorecard.mentality_rating && (
                <div>
                  <span className="text-xs text-golf-gray-400 uppercase tracking-wide">
                    Mentality Rating
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-golf-green text-white font-bold text-sm">
                      {scorecard.mentality_rating}
                    </span>
                    <span className="text-sm font-bold text-golf-gray-500">
                      {mentalityLabel(scorecard.mentality_rating)}
                    </span>
                  </div>
                </div>
              )}

              {scorecard.reflections && (
                <div>
                  <span className="text-xs text-golf-gray-400 uppercase tracking-wide">
                    Reflections
                  </span>
                  <p className="text-sm text-golf-gray-500 mt-1 whitespace-pre-wrap">
                    {scorecard.reflections}
                  </p>
                </div>
              )}

              {scorecard.what_transpired && (
                <div>
                  <span className="text-xs text-golf-gray-400 uppercase tracking-wide">
                    What Transpired
                  </span>
                  <p className="text-sm text-golf-gray-500 mt-1 whitespace-pre-wrap">
                    {scorecard.what_transpired}
                  </p>
                </div>
              )}

              {scorecard.how_to_respond && (
                <div>
                  <span className="text-xs text-golf-gray-400 uppercase tracking-wide">
                    How to Respond Differently
                  </span>
                  <p className="text-sm text-golf-gray-500 mt-1 whitespace-pre-wrap">
                    {scorecard.how_to_respond}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Coach Feedback (if reviewed) */}
        {scorecard.status === 'reviewed' && scorecard.coach_feedback && (
          <Card>
            <CardHeader>Coach Feedback</CardHeader>
            <CardBody>
              <p className="text-sm text-golf-gray-500 whitespace-pre-wrap">
                {scorecard.coach_feedback}
              </p>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Action Button */}
      <div className="sticky bottom-0 bg-surface border-t border-golf-gray-100 px-4 py-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-lg mx-auto space-y-3">
          {scorecard.status === 'in_progress' && (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              loading={submitting}
              onClick={handleSubmit}
            >
              Submit to Coach
            </Button>
          )}

          {scorecard.status === 'submitted' && (
            <>
              {showConfetti && (
                <p className="text-center text-sm font-bold text-golf-green">
                  Submitted! Your coach will review your round.
                </p>
              )}
              <Link href="/student" className="block">
                <Button variant="primary" size="lg" className="w-full">
                  Back to Dashboard
                </Button>
              </Link>
              {!showConfetti && (
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full"
                  loading={submitting}
                  onClick={async () => {
                    setSubmitting(true);
                    const { error: retractError } = await supabase
                      .from('scorecards')
                      .update({
                        status: 'in_progress' as ScorecardStatus,
                        updated_at: new Date().toISOString(),
                      })
                      .eq('id', scorecardId);
                    if (retractError) {
                      setSubmitting(false);
                      return;
                    }
                    router.push(`/student/round/${scorecardId}`);
                  }}
                >
                  Retract &amp; Edit Scores
                </Button>
              )}
            </>
          )}

          {scorecard.status === 'reviewed' && (
            <Link href="/student" className="block">
              <Button variant="primary" size="lg" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
