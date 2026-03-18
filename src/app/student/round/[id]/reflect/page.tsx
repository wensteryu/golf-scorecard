'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Scorecard, MentalityRating } from '@/lib/types';
import { Button } from '@/components/ui/button';

const MENTALITY_OPTIONS: {
  rating: MentalityRating;
  label: string;
  description: string;
}[] = [
  {
    rating: 4,
    label: 'Excellent',
    description: 'Maintained focus and avoided distractions',
  },
  {
    rating: 3,
    label: 'Good',
    description: 'Occasionally experienced distractions but refocused',
  },
  {
    rating: 2,
    label: 'Average',
    description: 'Distractions occasionally hindered performance',
  },
  {
    rating: 1,
    label: 'Poor',
    description: 'Distractions significantly impacted performance',
  },
];

export default function ReflectPage() {
  const params = useParams();
  const router = useRouter();
  const scorecardId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hundredYardsIn, setHundredYardsIn] = useState<number | null>(null);
  const [reflections, setReflections] = useState('');
  const [mentalityRating, setMentalityRating] = useState<MentalityRating | null>(null);
  const [whatTranspired, setWhatTranspired] = useState('');
  const [howToRespond, setHowToRespond] = useState('');

  const saveTimeout = useRef<NodeJS.Timeout>(null);
  const pendingSave = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: scorecard, error: scorecardError } = await supabase
          .from('scorecards')
          .select('*')
          .eq('id', scorecardId)
          .single();

        if (scorecardError) throw scorecardError;
        if (!scorecard) throw new Error('Scorecard not found');

        const sc = scorecard as Scorecard;
        if (sc.hundred_yards_in !== null) setHundredYardsIn(sc.hundred_yards_in);
        if (sc.reflections) setReflections(sc.reflections);
        if (sc.mentality_rating) setMentalityRating(sc.mentality_rating);
        if (sc.what_transpired) setWhatTranspired(sc.what_transpired);
        if (sc.how_to_respond) setHowToRespond(sc.how_to_respond);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load scorecard');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scorecardId]);

  const saveField = useCallback(
    (field: string, value: unknown) => {
      const doSave = async () => {
        try {
          await supabase
            .from('scorecards')
            .update({ [field]: value, updated_at: new Date().toISOString() })
            .eq('id', scorecardId);
        } catch {
          // Silent fail - data persists in local state
        }
      };

      pendingSave.current = doSave;

      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        await doSave();
        pendingSave.current = null;
      }, 300);
    },
    [scorecardId, supabase]
  );

  // Flush pending saves on unmount so data is not lost on navigation
  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
        // Fire the pending save immediately
        saveTimeout.current = null;
      }
      if (pendingSave.current) {
        pendingSave.current();
        pendingSave.current = null;
      }
    };
  }, []);

  function handleHundredYardsIn(value: string) {
    const num = value === '' ? null : parseInt(value, 10);
    setHundredYardsIn(num);
    saveField('hundred_yards_in', num);
  }

  function handleReflections(value: string) {
    setReflections(value);
    saveField('reflections', value);
  }

  function handleMentality(rating: MentalityRating) {
    setMentalityRating(rating);
    saveField('mentality_rating', rating);
  }

  function handleWhatTranspired(value: string) {
    setWhatTranspired(value);
    saveField('what_transpired', value);
  }

  function handleHowToRespond(value: string) {
    setHowToRespond(value);
    saveField('how_to_respond', value);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-golf-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-golf-green border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-golf-gray-400">Loading reflections...</p>
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

  return (
    <div className="min-h-screen bg-golf-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-golf-gray-100 px-4 py-4 shadow-sm sticky top-0 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/student" className="text-sm font-bold text-golf-gray-400 hover:text-golf-gray-500 min-h-[44px] flex items-center">
            &larr; Home
          </Link>
          <h1 className="text-lg font-extrabold text-golf-gray-500">Reflections</h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Form content */}
      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-8">
        {/* 100 Yards and In */}
        <div>
          <label className="block text-sm font-bold text-golf-gray-500 mb-2">
            100 Yards and In
          </label>
          <p className="text-xs text-golf-gray-400 mb-3">
            Count all strokes inside 100 yards
          </p>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            value={hundredYardsIn ?? ''}
            onChange={(e) => handleHundredYardsIn(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 rounded-xl border-2 border-golf-gray-200 bg-white text-golf-gray-500 font-bold text-lg focus:outline-none focus:border-golf-green transition-colors min-h-[44px]"
          />
        </div>

        {/* Reflections */}
        <div>
          <label className="block text-sm font-bold text-golf-gray-500 mb-2">
            Reflections
          </label>
          <textarea
            value={reflections}
            onChange={(e) => handleReflections(e.target.value)}
            placeholder="Swing keys, lessons learned, mental keys, key takeaways..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border-2 border-golf-gray-200 bg-white text-golf-gray-500 text-sm focus:outline-none focus:border-golf-green transition-colors resize-none"
          />
        </div>

        {/* Tournament Mentality Rating */}
        <div>
          <label className="block text-sm font-bold text-golf-gray-500 mb-2">
            Tournament Mentality Rating
          </label>
          <div className="space-y-3">
            {MENTALITY_OPTIONS.map((option) => {
              const isSelected = mentalityRating === option.rating;
              return (
                <button
                  key={option.rating}
                  type="button"
                  onClick={() => handleMentality(option.rating)}
                  className={[
                    'w-full text-left px-4 py-4 rounded-xl border-2 transition-all cursor-pointer',
                    'min-h-[44px]',
                    isSelected
                      ? 'border-golf-green bg-emerald-50'
                      : 'border-golf-gray-200 bg-white hover:border-golf-gray-300',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={[
                        'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg',
                        isSelected
                          ? 'bg-golf-green text-white'
                          : 'bg-golf-gray-100 text-golf-gray-400',
                      ].join(' ')}
                    >
                      {option.rating}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={[
                          'font-bold text-sm',
                          isSelected ? 'text-golf-green-dark' : 'text-golf-gray-500',
                        ].join(' ')}
                      >
                        {option.label}
                      </p>
                      <p className="text-xs text-golf-gray-400 mt-0.5">
                        {option.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0 text-golf-green">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Analysis Section */}
        <div>
          <h2 className="text-sm font-bold text-golf-gray-500 mb-4 uppercase tracking-wide">
            Analysis
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-golf-gray-500 mb-2">
                What transpired?
              </label>
              <textarea
                value={whatTranspired}
                onChange={(e) => handleWhatTranspired(e.target.value)}
                placeholder="Describe what happened during the round..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-golf-gray-200 bg-white text-golf-gray-500 text-sm focus:outline-none focus:border-golf-green transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-golf-gray-500 mb-2">
                How I should have responded differently?
              </label>
              <textarea
                value={howToRespond}
                onChange={(e) => handleHowToRespond(e.target.value)}
                placeholder="Reflect on how you could have responded differently..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-golf-gray-200 bg-white text-golf-gray-500 text-sm focus:outline-none focus:border-golf-green transition-colors resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom button */}
      <div className="sticky bottom-0 bg-white border-t border-golf-gray-100 px-4 py-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-lg mx-auto">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => router.push(`/student/round/${scorecardId}/summary`)}
          >
            View Summary &rarr;
          </Button>
        </div>
      </div>
    </div>
  );
}
