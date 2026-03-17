'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { HoleScore, CourseHole } from '@/lib/types';
import { HoleInput } from '@/components/scorecard/hole-input';
import { CelebrationCard } from '@/components/scorecard/celebration-card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Button } from '@/components/ui/button';

export default function RoundScoringPage() {
  const params = useParams();
  const router = useRouter();
  const scorecardId = params.id as string;
  const supabase = createClient();

  const [holeScores, setHoleScores] = useState<HoleScore[]>([]);
  const [courseHoles, setCourseHoles] = useState<CourseHole[]>([]);
  const [currentHole, setCurrentHole] = useState(1);
  const [showCelebration, setShowCelebration] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');

  const saveTimeout = useRef<NodeJS.Timeout>(null);

  // Fetch scorecard data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch scorecard with hole_scores
        const { data: scorecard, error: scorecardError } = await supabase
          .from('scorecards')
          .select('*, hole_scores(*)')
          .eq('id', scorecardId)
          .single();

        if (scorecardError) throw scorecardError;
        if (!scorecard) throw new Error('Scorecard not found');

        // Fetch course holes
        const { data: holes, error: holesError } = await supabase
          .from('course_holes')
          .select('*')
          .eq('course_id', scorecard.course_id)
          .order('hole_number');

        if (holesError) throw holesError;

        const sortedScores = (scorecard.hole_scores as HoleScore[]).sort(
          (a, b) => a.hole_number - b.hole_number
        );

        setHoleScores(sortedScores);
        setCourseHoles(holes as CourseHole[]);

        // Find the first hole without a score to resume from
        const firstIncomplete = sortedScores.find((h) => h.score === null);
        if (firstIncomplete) {
          setCurrentHole(firstIncomplete.hole_number);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load round');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scorecardId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, []);

  const handleFieldChange = useCallback(
    (field: string, value: unknown) => {
      // Update local state immediately
      setHoleScores((prev) =>
        prev.map((h) =>
          h.hole_number === currentHole ? { ...h, [field]: value } : h
        )
      );

      // Debounce save to Supabase
      setSaveStatus('saving');
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        try {
          await supabase.from('hole_scores').upsert(
            {
              scorecard_id: scorecardId,
              hole_number: currentHole,
              [field]: value,
            },
            { onConflict: 'scorecard_id,hole_number' }
          );
          setSaveStatus('saved');
          // Reset to idle after a short delay
          setTimeout(() => setSaveStatus('idle'), 1500);
        } catch {
          setSaveStatus('idle');
        }
      }, 300);
    },
    [currentHole, scorecardId, supabase]
  );

  function goToHole(holeNumber: number) {
    if (holeNumber < 1 || holeNumber > 18) return;

    // Show celebration after completing hole 9
    if (currentHole === 9 && holeNumber === 10) {
      setShowCelebration(true);
      return;
    }

    setCurrentHole(holeNumber);
  }

  function handleContinueFromCelebration() {
    setShowCelebration(false);
    setCurrentHole(10);
  }

  function handleReviewRound() {
    router.push(`/student/round/${scorecardId}/review`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-golf-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-golf-green border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-golf-gray-400">Loading round...</p>
        </div>
      </div>
    );
  }

  if (error) {
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

  const currentHoleScore = holeScores.find((h) => h.hole_number === currentHole);
  const currentCourseHole = courseHoles.find((h) => h.hole_number === currentHole);

  if (!currentHoleScore || !currentCourseHole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-golf-gray-50">
        <p className="text-golf-gray-400 font-bold">Hole data not found</p>
      </div>
    );
  }

  // Calculate front 9 stats for celebration card
  const front9Scores = holeScores.filter((h) => h.hole_number <= 9);
  const front9Score = front9Scores.reduce((sum, h) => sum + (h.score ?? h.par), 0);
  const front9Par = front9Scores.reduce((sum, h) => sum + h.par, 0);

  return (
    <div className="min-h-screen bg-golf-gray-50 flex flex-col">
      {/* Top bar with progress and save status */}
      <div className="sticky top-0 z-10 bg-white border-b border-golf-gray-100 px-4 pt-4 pb-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm font-bold text-golf-gray-400 hover:text-golf-gray-500 min-h-[44px] flex items-center cursor-pointer"
          >
            &larr; Exit
          </button>
          <div className="text-sm font-bold text-golf-gray-300">
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && 'Saved'}
          </div>
        </div>
        <ProgressBar currentHole={currentHole} />
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {showCelebration ? (
          <CelebrationCard
            front9Score={front9Score}
            front9Par={front9Par}
            onContinue={handleContinueFromCelebration}
          />
        ) : (
          <HoleInput
            hole={currentHoleScore}
            par={currentCourseHole.par}
            onUpdate={handleFieldChange}
          />
        )}
      </div>

      {/* Bottom navigation */}
      {!showCelebration && (
        <div className="sticky bottom-0 bg-white border-t border-golf-gray-100 px-4 py-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <div className="max-w-lg mx-auto flex gap-3">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => goToHole(currentHole - 1)}
              disabled={currentHole === 1}
              className="flex-1"
            >
              &larr; Previous
            </Button>

            {currentHole === 18 ? (
              <Button
                variant="primary"
                size="lg"
                onClick={handleReviewRound}
                className="flex-1"
              >
                Review Round &rarr;
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={() => goToHole(currentHole + 1)}
                className="flex-1"
              >
                Next Hole &rarr;
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
