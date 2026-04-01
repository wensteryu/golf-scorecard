'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { HoleScore, CourseHole } from '@/lib/types';
import { HoleInput } from '@/components/scorecard/hole-input';
import { CelebrationCard } from '@/components/scorecard/celebration-card';
import { BirdieCelebration } from '@/components/scorecard/birdie-celebration';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Button } from '@/components/ui/button';

export default function RoundScoringPage() {
  const params = useParams();
  const router = useRouter();
  const scorecardId = params.id as string;
  const supabase = createClient();

  const [holeScores, setHoleScores] = useState<HoleScore[]>([]);
  const [courseHoles, setCourseHoles] = useState<CourseHole[]>([]);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [currentHole, setCurrentHole] = useState(1);
  const [showCelebration, setShowCelebration] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [celebrationType, setCelebrationType] = useState<'birdie' | 'eagle' | 'hole-in-one' | null>(null);

  const saveTimeout = useRef<NodeJS.Timeout>(null);
  const pendingChanges = useRef<Record<string, unknown>>({});
  const celebrationTimeout = useRef<NodeJS.Timeout>(null);

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
        setCourseId(scorecard.course_id);

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

  // Flush all accumulated changes to Supabase
  const flushPendingSave = useCallback(async () => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
      saveTimeout.current = null;
    }
    const changes = { ...pendingChanges.current };
    pendingChanges.current = {};
    if (Object.keys(changes).length === 0) return;

    setSaveStatus('saving');
    const { error: saveError } = await supabase
      .from('hole_scores')
      .update(changes)
      .eq('scorecard_id', scorecardId)
      .eq('hole_number', currentHole);

    if (saveError) {
      console.error('Save failed:', changes, saveError.message);
      setSaveStatus('idle');
      return;
    }

    if ('par' in changes && courseId) {
      await supabase
        .from('course_holes')
        .update({ par: changes.par as number })
        .eq('course_id', courseId)
        .eq('hole_number', currentHole);
    }

    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 1500);
  }, [currentHole, scorecardId, courseId, supabase]);

  // Save immediately on page hide/unload (covers swipe-down, tab close, etc.)
  useEffect(() => {
    const flushOnHide = () => {
      if (Object.keys(pendingChanges.current).length > 0) {
        const changes = { ...pendingChanges.current };
        pendingChanges.current = {};
        // Use sendBeacon for reliability during page unload
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/hole_scores?scorecard_id=eq.${scorecardId}&hole_number=eq.${currentHole}`;
        const blob = new Blob([JSON.stringify(changes)], { type: 'application/json' });
        const headers = {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        };
        // sendBeacon doesn't support custom headers, fall back to fetch keepalive
        fetch(url, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(changes),
          keepalive: true,
        }).catch(() => {});
      }
    };

    const handleBeforeUnload = () => flushOnHide();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushOnHide();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      flushOnHide();
      if (celebrationTimeout.current) clearTimeout(celebrationTimeout.current);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [scorecardId, currentHole]);

  const triggerCelebration = useCallback((type: 'birdie' | 'eagle' | 'hole-in-one') => {
    if (celebrationTimeout.current) clearTimeout(celebrationTimeout.current);
    // Force unmount then remount to restart animations
    setCelebrationType(null);
    requestAnimationFrame(() => {
      setCelebrationType(type);
      const duration = type === 'hole-in-one' ? 4500 : type === 'eagle' ? 3500 : 3000;
      celebrationTimeout.current = setTimeout(() => {
        setCelebrationType(null);
      }, duration);
    });
  }, []);

  const handleFieldChange = useCallback(
    (field: string, value: unknown) => {
      // Update local state immediately
      setHoleScores((prev) =>
        prev.map((h) =>
          h.hole_number === currentHole ? { ...h, [field]: value } : h
        )
      );

      // Detect birdie or better when score changes
      if (field === 'score' && typeof value === 'number') {
        const hole = holeScores.find((h) => h.hole_number === currentHole);
        const par = hole?.par ?? courseHoles.find((h) => h.hole_number === currentHole)?.par ?? 4;
        const diff = value - par;
        if (value === 1) {
          triggerCelebration('hole-in-one');
        } else if (diff <= -2) {
          triggerCelebration('eagle');
        } else if (diff === -1) {
          triggerCelebration('birdie');
        }
      }

      // Accumulate changes — multiple fields in same tick get batched
      pendingChanges.current[field] = value;

      // Debounce: wait 100ms to batch rapid changes, then save all at once
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        const changes = { ...pendingChanges.current };
        pendingChanges.current = {};

        setSaveStatus('saving');
        const { error: saveError } = await supabase
          .from('hole_scores')
          .update(changes)
          .eq('scorecard_id', scorecardId)
          .eq('hole_number', currentHole);

        if (saveError) {
          console.error('Save failed:', changes, saveError.message);
          setSaveStatus('idle');
          return;
        }

        if ('par' in changes && courseId) {
          await supabase
            .from('course_holes')
            .update({ par: changes.par as number })
            .eq('course_id', courseId)
            .eq('hole_number', currentHole);
        }

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
      }, 100);
    },
    [currentHole, scorecardId, courseId, supabase, holeScores, courseHoles, triggerCelebration]
  );

  // Auto-set score to par if the user didn't explicitly change it
  const autoSaveCurrentHoleScore = useCallback(async () => {
    const hole = holeScores.find((h) => h.hole_number === currentHole);
    if (hole && hole.score === null) {
      const par = hole.par;
      // Update local state
      setHoleScores((prev) =>
        prev.map((h) =>
          h.hole_number === currentHole ? { ...h, score: par } : h
        )
      );
      // Save to DB
      const { error } = await supabase
        .from('hole_scores')
        .update({ score: par })
        .eq('scorecard_id', scorecardId)
        .eq('hole_number', currentHole);

      if (error) console.error('Auto-save par failed:', error.message);
    }
  }, [holeScores, currentHole, scorecardId, supabase]);

  async function goToHole(holeNumber: number) {
    const totalHoles = holeScores.length;
    if (holeNumber < 1 || holeNumber > totalHoles) return;

    // Auto-save par as score if student didn't change it
    await autoSaveCurrentHoleScore();

    // Flush any pending save before switching holes
    await flushPendingSave();

    // Show celebration after completing hole 9 (only for 18-hole rounds)
    if (totalHoles === 18 && currentHole === 9 && holeNumber === 10) {
      setShowCelebration(true);
      return;
    }

    setCurrentHole(holeNumber);
  }

  function handleContinueFromCelebration() {
    setShowCelebration(false);
    setCurrentHole(10);
  }

  async function handleReviewRound() {
    await autoSaveCurrentHoleScore();
    await flushPendingSave();
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
      <BirdieCelebration type={celebrationType} />

      {/* Top bar with progress and save status */}
      <div className="sticky top-0 z-10 bg-surface border-b border-golf-gray-100 px-4 pt-4 pb-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={async () => {
              await autoSaveCurrentHoleScore();
              await flushPendingSave();
              router.push('/student');
            }}
            className="text-sm font-bold text-golf-gray-400 hover:text-golf-gray-500 min-h-[44px] flex items-center cursor-pointer"
          >
            &larr; Home
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Elite Golf Realm" className="h-7 w-auto object-contain" />
            <h1 className="text-base font-extrabold text-golf-gray-500">
              Hole {currentHole} / {holeScores.length}
            </h1>
          </div>
          <div className="text-sm font-bold text-golf-gray-300 w-16 text-right">
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && 'Saved'}
          </div>
        </div>
        <ProgressBar
          currentHole={currentHole}
          holeScores={holeScores}
          onHoleClick={async (hole) => {
            await autoSaveCurrentHoleScore();
            await flushPendingSave();
            setCurrentHole(hole);
          }}
        />
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
            saveStatus={saveStatus}
          />
        )}
      </div>

      {/* Bottom navigation */}
      {!showCelebration && (
        <div className="sticky bottom-0 bg-surface border-t border-golf-gray-100 px-4 py-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
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

            {currentHole === holeScores.length ? (
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
          {currentHole < holeScores.length && (
            <button
              type="button"
              onClick={handleReviewRound}
              className="w-full mt-2 text-center text-xs font-bold text-golf-gray-300 hover:text-golf-gray-400 cursor-pointer py-1"
            >
              Skip remaining holes &amp; review &rarr;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
