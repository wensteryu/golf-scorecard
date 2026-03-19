'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Scorecard, HoleScore, RoundStats } from '@/lib/types';
import { calculateStats, formatScoreToPar, scoreColor } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardBody } from '@/components/ui/card';

export default function ScorecardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const scorecardId = params.id as string;
  const supabase = createClient();

  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [stats, setStats] = useState<RoundStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScorecard() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('scorecards')
          .select('*, course:golf_courses(*), hole_scores(*)')
          .eq('id', scorecardId)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Scorecard not found');

        // Sort hole scores
        const sorted = ((data.hole_scores as HoleScore[]) ?? []).sort(
          (a, b) => a.hole_number - b.hole_number
        );
        data.hole_scores = sorted;

        setScorecard(data as Scorecard);
        setStats(calculateStats(sorted));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load scorecard');
      } finally {
        setLoading(false);
      }
    }

    fetchScorecard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scorecardId]);

  function formatDate(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-golf-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-golf-green border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-golf-gray-400">Loading scorecard...</p>
        </div>
      </div>
    );
  }

  if (error || !scorecard || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-golf-gray-50 px-6">
        <div className="text-center">
          <p className="text-lg font-bold text-golf-red mb-4">
            {error ?? 'Scorecard not found'}
          </p>
          <Button variant="secondary" onClick={() => router.push('/student')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const holes = scorecard.hole_scores ?? [];
  const front9 = holes.filter((h) => h.hole_number <= 9);
  const back9 = holes.filter((h) => h.hole_number > 9);
  const coachNotes = holes.filter((h) => h.coach_note);

  return (
    <div className="min-h-screen bg-golf-gray-50">
      {/* Header */}
      <div className="bg-surface border-b border-golf-gray-100 px-4 py-4 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/student')}
            className="text-sm font-bold text-golf-gray-400 hover:text-golf-gray-500 min-h-[44px] flex items-center cursor-pointer"
          >
            &larr; Dashboard
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold text-golf-gray-500">
              {scorecard.course?.name ?? 'Round Detail'}
            </h1>
          </div>
          {/* Status badge */}
          {scorecard.status === 'reviewed' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-golf-green/15 text-golf-green">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
              Reviewed
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-golf-blue/15 text-golf-blue">
              Submitted
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">
        {/* Round Info */}
        <div className="text-center">
          <p className="text-sm font-semibold text-golf-gray-400">{scorecard.tournament_name}</p>
          <p className="text-xs text-golf-gray-300 mt-1">{formatDate(scorecard.round_date)}</p>
        </div>

        {/* Stats Summary */}
        <Card>
          <CardHeader>Round Summary</CardHeader>
          <CardBody>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-extrabold text-golf-gray-500">{stats.totalScore}</p>
                <p className="text-xs font-bold text-golf-gray-300 uppercase">Total</p>
              </div>
              <div>
                <p className={`text-2xl font-extrabold ${
                  stats.scoreToPar < 0
                    ? 'text-emerald-600'
                    : stats.scoreToPar === 0
                    ? 'text-golf-gray-500'
                    : 'text-golf-red'
                }`}>
                  {formatScoreToPar(stats.scoreToPar)}
                </p>
                <p className="text-xs font-bold text-golf-gray-300 uppercase">vs Par</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-golf-gray-500">{stats.totalPutts}</p>
                <p className="text-xs font-bold text-golf-gray-300 uppercase">Putts</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-golf-gray-100 grid grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span className="text-sm text-golf-gray-400">Front 9</span>
                <span className="text-sm font-bold text-golf-gray-500">
                  {stats.front9Score} ({formatScoreToPar(stats.front9Score - stats.front9Par)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-golf-gray-400">Back 9</span>
                <span className="text-sm font-bold text-golf-gray-500">
                  {stats.back9Score} ({formatScoreToPar(stats.back9Score - stats.back9Par)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-golf-gray-400">Fairways</span>
                <span className="text-sm font-bold text-golf-gray-500">
                  {stats.fairwaysHit}/{stats.fairwaysTotal}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-golf-gray-400">GIR</span>
                <span className="text-sm font-bold text-golf-gray-500">
                  {stats.girHit}/{stats.girTotal}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-golf-gray-400">1-Putts</span>
                <span className="text-sm font-bold text-golf-gray-500">{stats.onePutts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-golf-gray-400">3-Putts</span>
                <span className="text-sm font-bold text-golf-gray-500">{stats.threePutts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-golf-gray-400">Up & Down</span>
                <span className="text-sm font-bold text-golf-gray-500">
                  {stats.upAndDownMade}/{stats.upAndDownAttempts}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-golf-gray-400">Penalties</span>
                <span className="text-sm font-bold text-golf-gray-500">{stats.penaltyStrokes}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Hole-by-Hole Table */}
        <Card>
          <CardHeader>Hole-by-Hole</CardHeader>
          <CardBody className="px-0 py-0">
            {/* Front 9 */}
            <div className="overflow-x-auto">
              <table className="w-full text-center text-sm">
                <thead>
                  <tr className="border-b border-golf-gray-100">
                    <th className="px-2 py-2 text-xs font-bold text-golf-gray-400 text-left pl-4">
                      Hole
                    </th>
                    {front9.map((h) => (
                      <th
                        key={h.hole_number}
                        className="px-1.5 py-2 text-xs font-bold text-golf-gray-400"
                      >
                        {h.hole_number}
                      </th>
                    ))}
                    <th className="px-2 py-2 text-xs font-bold text-golf-gray-500 pr-4">Out</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-golf-gray-100">
                    <td className="px-2 py-2 text-xs font-semibold text-golf-gray-400 text-left pl-4">
                      Par
                    </td>
                    {front9.map((h) => (
                      <td key={h.hole_number} className="px-1.5 py-2 text-xs text-golf-gray-400">
                        {h.par}
                      </td>
                    ))}
                    <td className="px-2 py-2 text-xs font-bold text-golf-gray-500 pr-4">
                      {stats.front9Par}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 py-2 text-xs font-semibold text-golf-gray-400 text-left pl-4">
                      Score
                    </td>
                    {front9.map((h) => (
                      <td key={h.hole_number} className="px-1.5 py-1.5">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${scoreColor(
                            h.score,
                            h.par
                          )}`}
                        >
                          {h.score ?? '-'}
                        </span>
                      </td>
                    ))}
                    <td className="px-2 py-2 text-sm font-extrabold text-golf-gray-500 pr-4">
                      {stats.front9Score}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Coach notes for front 9 */}
            {front9.filter((h) => h.coach_note).map((h) => (
              <div
                key={`note-${h.hole_number}`}
                className="mx-4 mb-2 px-3 py-2 rounded-lg bg-golf-blue/10 border border-golf-blue/20"
              >
                <p className="text-xs font-bold text-golf-blue">Hole {h.hole_number} - Coach Note</p>
                <p className="text-sm text-golf-gray-500 mt-0.5">{h.coach_note}</p>
              </div>
            ))}

            <div className="border-t-2 border-golf-gray-200" />

            {/* Back 9 */}
            <div className="overflow-x-auto">
              <table className="w-full text-center text-sm">
                <thead>
                  <tr className="border-b border-golf-gray-100">
                    <th className="px-2 py-2 text-xs font-bold text-golf-gray-400 text-left pl-4">
                      Hole
                    </th>
                    {back9.map((h) => (
                      <th
                        key={h.hole_number}
                        className="px-1.5 py-2 text-xs font-bold text-golf-gray-400"
                      >
                        {h.hole_number}
                      </th>
                    ))}
                    <th className="px-2 py-2 text-xs font-bold text-golf-gray-500 pr-4">In</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-golf-gray-100">
                    <td className="px-2 py-2 text-xs font-semibold text-golf-gray-400 text-left pl-4">
                      Par
                    </td>
                    {back9.map((h) => (
                      <td key={h.hole_number} className="px-1.5 py-2 text-xs text-golf-gray-400">
                        {h.par}
                      </td>
                    ))}
                    <td className="px-2 py-2 text-xs font-bold text-golf-gray-500 pr-4">
                      {stats.back9Par}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 py-2 text-xs font-semibold text-golf-gray-400 text-left pl-4">
                      Score
                    </td>
                    {back9.map((h) => (
                      <td key={h.hole_number} className="px-1.5 py-1.5">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${scoreColor(
                            h.score,
                            h.par
                          )}`}
                        >
                          {h.score ?? '-'}
                        </span>
                      </td>
                    ))}
                    <td className="px-2 py-2 text-sm font-extrabold text-golf-gray-500 pr-4">
                      {stats.back9Score}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Coach notes for back 9 */}
            {back9.filter((h) => h.coach_note).map((h) => (
              <div
                key={`note-${h.hole_number}`}
                className="mx-4 mb-2 px-3 py-2 rounded-lg bg-golf-blue/10 border border-golf-blue/20"
              >
                <p className="text-xs font-bold text-golf-blue">Hole {h.hole_number} - Coach Note</p>
                <p className="text-sm text-golf-gray-500 mt-0.5">{h.coach_note}</p>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Reflections */}
        {(scorecard.reflections || scorecard.what_transpired || scorecard.how_to_respond || scorecard.mentality_rating) && (
          <Card>
            <CardHeader>Reflections</CardHeader>
            <CardBody className="flex flex-col gap-4">
              {scorecard.mentality_rating && (
                <div>
                  <p className="text-xs font-bold text-golf-gray-400 uppercase tracking-wide mb-1">
                    Mentality Rating
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                          level <= scorecard.mentality_rating!
                            ? 'bg-golf-green text-white'
                            : 'bg-golf-gray-100 text-golf-gray-300'
                        }`}
                      >
                        {level}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {scorecard.hundred_yards_in !== null && scorecard.hundred_yards_in !== undefined && (
                <div>
                  <p className="text-xs font-bold text-golf-gray-400 uppercase tracking-wide mb-1">
                    100 Yards In
                  </p>
                  <p className="text-sm text-golf-gray-500">{scorecard.hundred_yards_in}</p>
                </div>
              )}

              {scorecard.reflections && (
                <div>
                  <p className="text-xs font-bold text-golf-gray-400 uppercase tracking-wide mb-1">
                    Reflections
                  </p>
                  <p className="text-sm text-golf-gray-500 whitespace-pre-wrap">
                    {scorecard.reflections}
                  </p>
                </div>
              )}

              {scorecard.what_transpired && (
                <div>
                  <p className="text-xs font-bold text-golf-gray-400 uppercase tracking-wide mb-1">
                    What Transpired
                  </p>
                  <p className="text-sm text-golf-gray-500 whitespace-pre-wrap">
                    {scorecard.what_transpired}
                  </p>
                </div>
              )}

              {scorecard.how_to_respond && (
                <div>
                  <p className="text-xs font-bold text-golf-gray-400 uppercase tracking-wide mb-1">
                    How to Respond
                  </p>
                  <p className="text-sm text-golf-gray-500 whitespace-pre-wrap">
                    {scorecard.how_to_respond}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Coach Feedback */}
        <Card className="border-2 border-golf-purple/30 bg-gradient-to-br from-golf-purple/5 to-golf-blue/5">
          <CardHeader className="text-golf-purple">Coach Feedback</CardHeader>
          <CardBody>
            {scorecard.coach_feedback ? (
              <p className="text-sm text-golf-gray-500 whitespace-pre-wrap leading-relaxed">
                {scorecard.coach_feedback}
              </p>
            ) : (
              <p className="text-sm text-golf-gray-300 italic">No feedback yet</p>
            )}
          </CardBody>
        </Card>

        {/* Back to Dashboard */}
        <div className="pb-8">
          <Button
            variant="ghost"
            size="md"
            onClick={() => router.push('/student')}
            className="w-full"
          >
            &larr; Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
