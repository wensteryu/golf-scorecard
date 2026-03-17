'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, Scorecard } from '@/lib/types';
import { formatScoreToPar } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { NotificationBell } from '@/components/notifications/notification-bell';
import Link from 'next/link';

export default function StudentDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData as Profile);

        // Fetch scorecards with course info
        const { data: scorecardsData, error: scorecardsError } = await supabase
          .from('scorecards')
          .select('*, course:golf_courses(*), hole_scores(*)')
          .eq('student_id', user.id)
          .order('round_date', { ascending: false });

        if (scorecardsError) throw scorecardsError;
        setScorecards((scorecardsData as Scorecard[]) ?? []);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-golf-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-golf-green border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-golf-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-golf-gray-50 px-6">
        <div className="text-center">
          <p className="text-lg font-bold text-golf-red mb-4">{error}</p>
          <Button variant="secondary" onClick={() => router.push('/login')}>
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  const inProgress = scorecards.filter((s) => s.status === 'in_progress');
  const submitted = scorecards.filter((s) => s.status === 'submitted');
  const reviewed = scorecards.filter((s) => s.status === 'reviewed');

  return (
    <div className="min-h-screen bg-golf-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-golf-gray-100 px-4 py-4 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-golf-gray-500">My Rounds</h1>
            {profile && (
              <p className="text-sm text-golf-gray-400 font-semibold">{profile.full_name}</p>
            )}
          </div>
          {profile && <NotificationBell userId={profile.id} />}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">
        {/* New Round Button */}
        <Link href="/student/new">
          <Button variant="primary" size="lg" className="w-full">
            New Round +
          </Button>
        </Link>

        {/* Empty State */}
        {scorecards.length === 0 && (
          <Card>
            <CardBody className="text-center py-12">
              <div className="text-5xl mb-4">&#9971;</div>
              <p className="text-golf-gray-400 font-semibold text-lg">
                No rounds yet!
              </p>
              <p className="text-golf-gray-300 mt-1">
                Tap + to start your first round.
              </p>
            </CardBody>
          </Card>
        )}

        {/* In Progress */}
        {inProgress.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide mb-3">
              In Progress
            </h2>
            <div className="flex flex-col gap-3">
              {inProgress.map((sc) => (
                <Link key={sc.id} href={`/student/round/${sc.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardBody>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-golf-gray-500">
                            {sc.course?.name ?? 'Unknown Course'}
                          </p>
                          <p className="text-sm text-golf-gray-400">{sc.tournament_name}</p>
                          <p className="text-xs text-golf-gray-300 mt-1">
                            {formatDate(sc.round_date)}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-golf-green">
                          Continue &rarr;
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Awaiting Review */}
        {submitted.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide mb-3">
              Awaiting Review
            </h2>
            <div className="flex flex-col gap-3">
              {submitted.map((sc) => {
                const total = getTotalScore(sc);
                const par = getTotalPar(sc);
                const diff = total - par;
                return (
                  <Card key={sc.id}>
                    <CardBody>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-golf-gray-500">
                            {sc.course?.name ?? 'Unknown Course'}
                          </p>
                          <p className="text-sm text-golf-gray-400">{sc.tournament_name}</p>
                          <p className="text-xs text-golf-gray-300 mt-1">
                            {formatDate(sc.round_date)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-lg font-extrabold text-golf-gray-500">
                            {total}
                          </span>
                          <span className="text-xs font-bold text-golf-gray-300">
                            {formatScoreToPar(diff)}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-golf-blue/15 text-golf-blue">
                            Submitted
                          </span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Reviewed */}
        {reviewed.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide mb-3">
              Reviewed
            </h2>
            <div className="flex flex-col gap-3">
              {reviewed.map((sc) => {
                const total = getTotalScore(sc);
                const par = getTotalPar(sc);
                const diff = total - par;
                return (
                  <Link key={sc.id} href={`/student/history/${sc.id}`}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardBody>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-golf-gray-500">
                              {sc.course?.name ?? 'Unknown Course'}
                            </p>
                            <p className="text-sm text-golf-gray-400">{sc.tournament_name}</p>
                            <p className="text-xs text-golf-gray-300 mt-1">
                              {formatDate(sc.round_date)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-lg font-extrabold text-golf-gray-500">
                              {total}
                            </span>
                            <span className="text-xs font-bold text-golf-gray-300">
                              {formatScoreToPar(diff)}
                            </span>
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
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* View Full History Link */}
        {(submitted.length > 0 || reviewed.length > 0) && (
          <Link href="/student/history" className="text-center">
            <span className="text-sm font-bold text-golf-blue hover:text-golf-blue-dark">
              View Full History &rarr;
            </span>
          </Link>
        )}

        {/* Sign Out */}
        <div className="pt-4 pb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
