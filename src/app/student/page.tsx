'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, Scorecard } from '@/lib/types';
import { formatScoreToPar } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { ThemeToggle } from '@/lib/theme';
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

  async function handleDeleteRound(id: string) {
    if (!window.confirm('Delete this round? This cannot be undone.')) return;
    await supabase.from('scorecards').delete().eq('id', id);
    setScorecards((prev) => prev.filter((s) => s.id !== id));
  }

  const inProgress = scorecards.filter((s) => s.status === 'in_progress');
  const submitted = scorecards.filter((s) => s.status === 'submitted');
  const reviewed = scorecards.filter((s) => s.status === 'reviewed');

  return (
    <div className="min-h-screen bg-golf-gray-50">
      {/* Header */}
      <div className="bg-surface border-b border-golf-gray-100 px-4 py-4 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Elite Golf Realm" className="h-10 w-auto object-contain" />
            <div>
              <h1 className="text-lg font-extrabold text-golf-gray-500">My Rounds</h1>
              {profile && (
                <p className="text-xs text-golf-gray-400 font-semibold">{profile.full_name}</p>
              )}
            </div>
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
              {inProgress.map((sc) => {
                const holesCompleted = sc.hole_scores?.filter((h) => h.score !== null).length ?? 0;
                const allHolesDone = holesCompleted === 18;

                // Smart resume: if all holes scored, go to review/reflect/summary
                // If reflections filled, go to summary. If review done, go to reflect.
                let continueLink = `/student/round/${sc.id}`;
                let continueLabel = 'Continue scoring';
                if (allHolesDone) {
                  if (sc.reflections || sc.mentality_rating) {
                    continueLink = `/student/round/${sc.id}/summary`;
                    continueLabel = 'View summary';
                  } else if (sc.hundred_yards_in !== null) {
                    continueLink = `/student/round/${sc.id}/reflect`;
                    continueLabel = 'Continue reflections';
                  } else {
                    continueLink = `/student/round/${sc.id}/review`;
                    continueLabel = 'Review round';
                  }
                }

                return (
                  <Card key={sc.id} className="relative hover:shadow-md transition-shadow">
                    <CardBody>
                      <div className="flex items-center justify-between">
                        <Link href={continueLink} className="flex-1">
                          <div>
                            <p className="font-bold text-golf-gray-500">
                              {sc.course?.name ?? 'Unknown Course'}
                            </p>
                            <p className="text-sm text-golf-gray-400">{sc.tournament_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-golf-gray-300">
                                {formatDate(sc.round_date)}
                              </p>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                allHolesDone
                                  ? 'text-golf-green bg-golf-green/10'
                                  : 'text-golf-blue bg-golf-blue/10'
                              }`}>
                                {allHolesDone ? '18/18 ✓' : `Hole ${holesCompleted}/18`}
                              </span>
                            </div>
                          </div>
                        </Link>
                        <div className="flex items-center gap-3">
                          <Link href={continueLink} className="text-sm font-bold text-golf-green whitespace-nowrap">
                            {allHolesDone ? continueLabel : 'Continue'} &rarr;
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteRound(sc.id);
                            }}
                            className="p-2 text-golf-gray-300 hover:text-golf-red transition-colors cursor-pointer"
                            aria-label="Delete round"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
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
                  <Link key={sc.id} href={`/student/round/${sc.id}/summary`}>
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
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-golf-blue/15 text-golf-blue">
                              Submitted
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-golf-gray-100 text-center">
                          <span className="text-xs font-bold text-golf-blue">
                            Tap to view or edit &rarr;
                          </span>
                        </div>
                      </CardBody>
                    </Card>
                  </Link>
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

        {/* Settings */}
        <div className="pt-4 pb-8 flex flex-col items-center gap-2">
          <ThemeToggle />
          <Link href="/student/settings" className="w-full">
            <Button variant="ghost" size="sm" className="w-full">
              Settings
            </Button>
          </Link>
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
