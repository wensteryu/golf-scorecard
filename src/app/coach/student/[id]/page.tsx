'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, Scorecard } from '@/lib/types';
import { formatScoreToPar, calculateStats } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const supabase = createClient();

  const [student, setStudent] = useState<Profile | null>(null);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch student profile
        const { data: studentData, error: studentError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', studentId)
          .single();

        if (studentError) throw studentError;
        if (!studentData) throw new Error('Student not found');

        setStudent(studentData as Profile);

        // Fetch student scorecards
        const { data: cardsData, error: cardsError } = await supabase
          .from('scorecards')
          .select('*, course:golf_courses(*), hole_scores(*)')
          .eq('student_id', studentId)
          .order('round_date', { ascending: false });

        if (cardsError) throw cardsError;

        setScorecards((cardsData as Scorecard[]) ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load student');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  function statusBadge(status: string) {
    switch (status) {
      case 'in_progress':
        return (
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-golf-orange/15 text-golf-orange">
            In Progress
          </span>
        );
      case 'submitted':
        return (
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-golf-blue/15 text-golf-blue">
            Submitted
          </span>
        );
      case 'reviewed':
        return (
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-golf-green/15 text-golf-green">
            Reviewed
          </span>
        );
      default:
        return null;
    }
  }

  function handleCardClick(sc: Scorecard) {
    if (sc.status === 'submitted' || sc.status === 'reviewed') {
      router.push(`/coach/review/${sc.id}`);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-golf-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-golf-green border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-golf-gray-400">Loading student...</p>
        </div>
      </div>
    );
  }

  if (error && !student) {
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
        <div className="max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => router.push('/coach')}
            className="text-sm font-bold text-golf-gray-400 hover:text-golf-gray-500 min-h-[44px] flex items-center cursor-pointer mb-1"
          >
            &larr; Dashboard
          </button>
          <h1 className="text-lg font-extrabold text-golf-gray-500">
            {student?.full_name ?? 'Student'}
          </h1>
          <p className="text-sm text-golf-gray-300">
            {scorecards.length} round{scorecards.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {scorecards.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-golf-gray-300 text-center py-6">
                This student has no scorecards yet.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {scorecards.map((sc) => {
              const holes = sc.hole_scores ?? [];
              const hasScores = holes.some((h) => h.score !== null);
              const stats = hasScores ? calculateStats(holes) : null;

              return (
                <Card
                  key={sc.id}
                  className={
                    sc.status !== 'in_progress'
                      ? 'cursor-pointer hover:shadow-md transition-shadow'
                      : 'opacity-75'
                  }
                  onClick={() => handleCardClick(sc)}
                >
                  <CardBody>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-golf-gray-500">
                            {new Date(sc.round_date).toLocaleDateString()}
                          </p>
                          {statusBadge(sc.status)}
                        </div>
                        <p className="text-sm text-golf-gray-400">
                          {sc.course?.name ?? 'Unknown Course'}
                        </p>
                        {sc.tournament_name && (
                          <p className="text-xs text-golf-gray-300 mt-1">
                            {sc.tournament_name}
                          </p>
                        )}
                      </div>
                      {stats && (
                        <div className="text-right ml-3">
                          <p className="text-xl font-extrabold text-golf-gray-500">
                            {stats.totalScore}
                          </p>
                          <p className="text-xs font-bold text-golf-gray-300">
                            {formatScoreToPar(stats.scoreToPar)}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
