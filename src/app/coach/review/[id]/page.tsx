'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Scorecard, HoleScore } from '@/lib/types';
import { calculateStats, scoreColor, formatScoreToPar } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardBody } from '@/components/ui/card';

export default function ReviewScorecardPage() {
  const params = useParams();
  const router = useRouter();
  const scorecardId = params.id as string;
  const supabase = createClient();

  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [holeNotes, setHoleNotes] = useState<Record<number, string>>({});
  const [overallFeedback, setOverallFeedback] = useState('');
  const [expandedHoles, setExpandedHoles] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState<string | null>(null);

  const savingNotes = useRef<Set<number>>(new Set());

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error: fetchError } = await supabase
          .from('scorecards')
          .select(
            '*, course:golf_courses(*), student:profiles!student_id(*), hole_scores(*)'
          )
          .eq('id', scorecardId)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Scorecard not found');

        const sc = data as Scorecard;
        // Sort hole_scores by hole_number
        if (sc.hole_scores) {
          sc.hole_scores.sort((a, b) => a.hole_number - b.hole_number);
        }

        setScorecard(sc);
        setOverallFeedback(sc.coach_feedback ?? '');

        // Initialize notes from existing data
        const notes: Record<number, string> = {};
        (sc.hole_scores ?? []).forEach((hs) => {
          notes[hs.hole_number] = hs.coach_note ?? '';
        });
        setHoleNotes(notes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load scorecard');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scorecardId]);

  function toggleHole(holeNumber: number) {
    setExpandedHoles((prev) => {
      const next = new Set(prev);
      if (next.has(holeNumber)) {
        next.delete(holeNumber);
      } else {
        next.add(holeNumber);
      }
      return next;
    });
  }

  async function saveNoteForHole(holeNumber: number) {
    if (savingNotes.current.has(holeNumber)) return;
    savingNotes.current.add(holeNumber);

    const holeScore = scorecard?.hole_scores?.find(
      (h) => h.hole_number === holeNumber
    );
    if (!holeScore) return;

    try {
      await supabase
        .from('hole_scores')
        .update({ coach_note: holeNotes[holeNumber] ?? '' })
        .eq('id', holeScore.id);
    } catch {
      // Silent fail — note will be saved on final submit
    } finally {
      savingNotes.current.delete(holeNumber);
    }
  }

  async function handleMarkReviewed() {
    if (!scorecard) return;
    setSubmitting(true);
    setError(null);

    try {
      // Save all hole notes
      const updates = (scorecard.hole_scores ?? []).map((hs) =>
        supabase
          .from('hole_scores')
          .update({ coach_note: holeNotes[hs.hole_number] ?? '' })
          .eq('id', hs.id)
      );
      await Promise.all(updates);

      // Save overall feedback and update status
      const { error: updateError } = await supabase
        .from('scorecards')
        .update({
          coach_feedback: overallFeedback,
          status: 'reviewed',
        })
        .eq('id', scorecard.id);

      if (updateError) throw updateError;

      setSuccessMsg('Scorecard marked as reviewed!');
      setTimeout(() => router.push('/coach'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save review');
      setSubmitting(false);
    }
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

  if (error && !scorecard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-golf-gray-50 px-6">
        <div className="text-center">
          <p className="text-lg font-bold text-golf-red mb-4">{error}</p>
          <Button variant="secondary" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!scorecard) return null;

  const holes = scorecard.hole_scores ?? [];
  const stats = calculateStats(holes);

  function fairwayLabel(val: string | null) {
    if (!val) return '--';
    if (val === 'hit') return 'Hit';
    if (val === 'left') return 'Left';
    return 'Right';
  }

  function girLabel(val: string | null) {
    if (!val) return '--';
    if (val === 'hit') return 'Hit';
    return val.charAt(0).toUpperCase() + val.slice(1);
  }

  return (
    <div className="min-h-screen bg-golf-gray-50">
      {/* Success banner */}
      {successMsg && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-golf-green text-white text-center py-3 font-bold shadow-lg">
          {successMsg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-golf-gray-100 px-4 py-4 shadow-sm">
        <div className="max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => router.push('/coach')}
            className="text-sm font-bold text-golf-gray-400 hover:text-golf-gray-500 min-h-[44px] flex items-center cursor-pointer mb-2"
          >
            &larr; Dashboard
          </button>
          <h1 className="text-lg font-extrabold text-golf-gray-500">
            {scorecard.student?.full_name ?? 'Student'}
          </h1>
          <p className="text-sm text-golf-gray-400">
            {scorecard.course?.name ?? 'Course'} &middot;{' '}
            {new Date(scorecard.round_date).toLocaleDateString()}
          </p>
          {scorecard.tournament_name && (
            <p className="text-xs text-golf-gray-300 mt-1">
              {scorecard.tournament_name}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Stats Summary */}
        <section>
          <h2 className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide mb-3">
            Round Summary
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardBody className="text-center py-3">
                <p className="text-2xl font-extrabold text-golf-gray-500">
                  {stats.totalScore}
                </p>
                <p className="text-xs font-bold text-golf-gray-300 uppercase">
                  Score ({formatScoreToPar(stats.scoreToPar)})
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center py-3">
                <p className="text-2xl font-extrabold text-golf-gray-500">
                  {stats.front9Score}
                </p>
                <p className="text-xs font-bold text-golf-gray-300 uppercase">
                  Front 9
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center py-3">
                <p className="text-2xl font-extrabold text-golf-gray-500">
                  {stats.back9Score}
                </p>
                <p className="text-xs font-bold text-golf-gray-300 uppercase">
                  Back 9
                </p>
              </CardBody>
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-3">
            <Card>
              <CardBody className="text-center py-3">
                <p className="text-lg font-extrabold text-golf-gray-500">
                  {stats.fairwaysHit}/{stats.fairwaysTotal}
                </p>
                <p className="text-xs font-bold text-golf-gray-300 uppercase">
                  Fairways
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center py-3">
                <p className="text-lg font-extrabold text-golf-gray-500">
                  {stats.girHit}/{stats.girTotal}
                </p>
                <p className="text-xs font-bold text-golf-gray-300 uppercase">
                  GIR
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center py-3">
                <p className="text-lg font-extrabold text-golf-gray-500">
                  {stats.totalPutts}
                </p>
                <p className="text-xs font-bold text-golf-gray-300 uppercase">
                  Putts
                </p>
              </CardBody>
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-3">
            <Card>
              <CardBody className="text-center py-3">
                <p className="text-lg font-extrabold text-golf-gray-500">
                  {stats.penaltyStrokes}
                </p>
                <p className="text-xs font-bold text-golf-gray-300 uppercase">
                  Penalties
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center py-3">
                <p className="text-lg font-extrabold text-golf-gray-500">
                  {stats.upAndDownMade}/{stats.upAndDownAttempts}
                </p>
                <p className="text-xs font-bold text-golf-gray-300 uppercase">
                  Up &amp; Down
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center py-3">
                <p className="text-lg font-extrabold text-golf-gray-500">
                  {stats.onePutts}
                </p>
                <p className="text-xs font-bold text-golf-gray-300 uppercase">
                  1-Putts
                </p>
              </CardBody>
            </Card>
          </div>
        </section>

        {/* Per-hole Detail */}
        <section>
          <h2 className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide mb-3">
            Hole-by-Hole
          </h2>
          <div className="flex flex-col gap-2">
            {holes.map((hole) => {
              const isExpanded = expandedHoles.has(hole.hole_number);
              return (
                <Card key={hole.hole_number}>
                  <button
                    type="button"
                    onClick={() => toggleHole(hole.hole_number)}
                    className="w-full text-left cursor-pointer"
                  >
                    <CardBody className="flex items-center gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-sm font-bold text-golf-gray-400 w-6 text-center">
                          {hole.hole_number}
                        </span>
                        <span className="text-xs text-golf-gray-300">
                          Par {hole.par}
                        </span>
                        <span
                          className={[
                            'inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-extrabold',
                            scoreColor(hole.score, hole.par),
                          ].join(' ')}
                        >
                          {hole.score ?? '-'}
                        </span>
                        <span className="text-xs text-golf-gray-300">
                          FW: {fairwayLabel(hole.fairway)}
                        </span>
                        <span className="text-xs text-golf-gray-300">
                          GIR: {girLabel(hole.gir)}
                        </span>
                        <span className="text-xs text-golf-gray-300">
                          {hole.putts ?? '-'}P
                        </span>
                        {hole.penalty_strokes > 0 && (
                          <span className="text-xs font-bold text-golf-red">
                            +{hole.penalty_strokes}pen
                          </span>
                        )}
                      </div>
                      <span className="text-golf-gray-300 transition-transform duration-200"
                        style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                      >
                        &rsaquo;
                      </span>
                    </CardBody>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-4 pt-0">
                      <label className="text-xs font-bold text-golf-gray-400 uppercase tracking-wide block mb-1">
                        Coach Note
                      </label>
                      <textarea
                        value={holeNotes[hole.hole_number] ?? ''}
                        onChange={(e) =>
                          setHoleNotes((prev) => ({
                            ...prev,
                            [hole.hole_number]: e.target.value,
                          }))
                        }
                        onBlur={() => saveNoteForHole(hole.hole_number)}
                        placeholder="Add a note for this hole..."
                        rows={2}
                        className={[
                          'w-full px-3 py-2 rounded-xl text-sm',
                          'border-2 border-golf-gray-200 bg-golf-gray-50',
                          'text-golf-gray-500 placeholder:text-golf-gray-300',
                          'focus:border-golf-blue focus:outline-none focus:bg-white',
                          'transition-colors duration-150 resize-none',
                        ].join(' ')}
                      />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        {/* Student Reflections */}
        {(scorecard.reflections ||
          scorecard.what_transpired ||
          scorecard.how_to_respond ||
          scorecard.mentality_rating) && (
          <section>
            <h2 className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide mb-3">
              Student Reflections
            </h2>
            <Card>
              <CardBody className="flex flex-col gap-3">
                {scorecard.mentality_rating && (
                  <div>
                    <p className="text-xs font-bold text-golf-gray-400 uppercase">
                      Mentality Rating
                    </p>
                    <p className="text-golf-gray-500 font-semibold">
                      {scorecard.mentality_rating}/4
                    </p>
                  </div>
                )}
                {scorecard.reflections && (
                  <div>
                    <p className="text-xs font-bold text-golf-gray-400 uppercase">
                      Reflections
                    </p>
                    <p className="text-sm text-golf-gray-500">
                      {scorecard.reflections}
                    </p>
                  </div>
                )}
                {scorecard.what_transpired && (
                  <div>
                    <p className="text-xs font-bold text-golf-gray-400 uppercase">
                      What Transpired
                    </p>
                    <p className="text-sm text-golf-gray-500">
                      {scorecard.what_transpired}
                    </p>
                  </div>
                )}
                {scorecard.how_to_respond && (
                  <div>
                    <p className="text-xs font-bold text-golf-gray-400 uppercase">
                      How to Respond Next Time
                    </p>
                    <p className="text-sm text-golf-gray-500">
                      {scorecard.how_to_respond}
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          </section>
        )}

        {/* Overall Feedback */}
        <section>
          <h2 className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide mb-3">
            Overall Feedback
          </h2>
          <textarea
            value={overallFeedback}
            onChange={(e) => setOverallFeedback(e.target.value)}
            placeholder="Write your overall feedback for this round..."
            rows={4}
            className={[
              'w-full px-4 py-3 rounded-xl',
              'border-2 border-golf-gray-200 bg-white',
              'text-golf-gray-500 font-semibold text-sm',
              'focus:border-golf-blue focus:outline-none',
              'transition-colors duration-150 resize-none',
              'placeholder:text-golf-gray-300',
            ].join(' ')}
          />
        </section>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 font-semibold text-sm">{error}</p>
          </div>
        )}

        {/* Mark as Reviewed */}
        {scorecard.status !== 'reviewed' && (
          <Button
            variant="primary"
            size="lg"
            onClick={handleMarkReviewed}
            loading={submitting}
            className="w-full"
          >
            Mark as Reviewed
          </Button>
        )}

        {scorecard.status === 'reviewed' && (
          <div className="text-center py-3">
            <p className="text-sm font-bold text-golf-green">
              This scorecard has been reviewed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
