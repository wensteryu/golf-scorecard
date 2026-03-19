'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Scorecard } from '@/lib/types';
import { formatScoreToPar } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import Link from 'next/link';

export default function HistoryPage() {
  const router = useRouter();
  const supabase = createClient();

  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch submitted and reviewed scorecards with course info and hole scores
        const { data, error: fetchError } = await supabase
          .from('scorecards')
          .select('*, course:golf_courses(*), hole_scores(*)')
          .eq('student_id', user.id)
          .in('status', ['submitted', 'reviewed'])
          .order('round_date', { ascending: false });

        if (fetchError) throw fetchError;
        setScorecards((data as Scorecard[]) ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getTotalScore(scorecard: Scorecard): number {
    if (!scorecard.hole_scores) return 0;
    return scorecard.hole_scores.reduce((sum, h) => sum + (h.score ?? 0), 0);
  }

  function getTotalPar(scorecard: Scorecard): number {
    if (!scorecard.hole_scores) return 0;
    return scorecard.hole_scores.reduce((sum, h) => sum + h.par, 0);
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function scoreToParColor(diff: number): string {
    if (diff < 0) return 'text-emerald-600';
    if (diff === 0) return 'text-golf-gray-500';
    return 'text-golf-red';
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-golf-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-golf-green border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-golf-gray-400">Loading history...</p>
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
    <div className="min-h-screen bg-golf-gray-50">
      {/* Header */}
      <div className="bg-surface border-b border-golf-gray-100 px-4 py-4 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/student')}
            className="text-sm font-bold text-golf-gray-400 hover:text-golf-gray-500 min-h-[44px] flex items-center cursor-pointer"
          >
            &larr; Back
          </button>
          <h1 className="text-lg font-extrabold text-golf-gray-500">Round History</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-3">
        {scorecards.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <p className="text-golf-gray-400 font-semibold">
                No completed rounds yet.
              </p>
            </CardBody>
          </Card>
        ) : (
          scorecards.map((sc) => {
            const total = getTotalScore(sc);
            const par = getTotalPar(sc);
            const diff = total - par;
            const isReviewed = sc.status === 'reviewed';

            return (
              <Link key={sc.id} href={`/student/history/${sc.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardBody>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-golf-gray-500 truncate">
                          {sc.course?.name ?? 'Unknown Course'}
                        </p>
                        <p className="text-sm text-golf-gray-400 truncate">
                          {sc.tournament_name}
                        </p>
                        <p className="text-xs text-golf-gray-300 mt-1">
                          {formatDate(sc.round_date)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-4">
                        <span className="text-xl font-extrabold text-golf-gray-500">
                          {total}
                        </span>
                        <span className={`text-sm font-bold ${scoreToParColor(diff)}`}>
                          {formatScoreToPar(diff)}
                        </span>
                        {isReviewed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-golf-green/15 text-golf-green">
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
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-golf-blue/15 text-golf-blue">
                            Submitted
                          </span>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
