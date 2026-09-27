'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useStudentScope } from '@/components/nav/view-as';
import { Scorecard } from '@/lib/types';
import { StatsPanel } from '@/components/stats/stats-panel';

export default function StudentStatsPage() {
  const supabase = createClient();
  const { studentId } = useStudentScope();

  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    async function fetchData() {
      try {
        const { data, error: cardsError } = await supabase
          .from('scorecards')
          .select('*, hole_scores(*)')
          .eq('student_id', studentId)
          .not('round_type', 'is', null)
          .neq('status', 'in_progress');

        if (cardsError) throw cardsError;
        setScorecards((data as Scorecard[]) ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  return (
    <div className="min-h-screen bg-golf-gray-50">
      {/* Header */}
      <div className="bg-surface border-b border-golf-gray-100 px-4 py-4 shadow-sm">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-extrabold text-golf-gray-500">My Stats</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-golf-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-center font-bold text-golf-red">{error}</p>
        ) : (
          <StatsPanel scorecards={scorecards} />
        )}
      </div>
    </div>
  );
}
