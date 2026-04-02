'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, Scorecard } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { ThemeToggle } from '@/lib/theme';

export default function CoachDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [students, setStudents] = useState<Profile[]>([]);
  const [pendingCards, setPendingCards] = useState<Scorecard[]>([]);
  const [loading, setLoading] = useState(true);

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

        // Fetch coach profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!profileData || profileData.role !== 'coach') {
          router.push('/login');
          return;
        }

        setProfile(profileData as Profile);

        // Fetch all students
        const { data: studentsData } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student')
          .order('full_name');

        setStudents((studentsData as Profile[]) ?? []);

        // Fetch all pending scorecards
        const { data: scorecards } = await supabase
          .from('scorecards')
          .select('*, course:golf_courses(*), student:profiles!student_id(*)')
          .eq('status', 'submitted')
          .order('updated_at', { ascending: false });

        setPendingCards((scorecards as Scorecard[]) ?? []);
      } catch {
        // Silent fail — user will see empty state
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

  return (
    <div className="min-h-screen bg-golf-gray-50">
      {/* Header */}
      <div className="bg-surface border-b border-golf-gray-100 px-4 py-4 shadow-sm">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Elite Golf Realm" className="h-10 w-auto object-contain" />
              <h1 className="text-lg font-extrabold text-golf-gray-500">
                Coach Dashboard
              </h1>
            </div>
            {profile && <NotificationBell userId={profile.id} />}
          </div>

        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-8">
        {/* Pending Reviews */}
        <section>
          <h2 className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide mb-3">
            Pending Reviews ({pendingCards.length})
          </h2>
          {pendingCards.length === 0 ? (
            <Card>
              <CardBody>
                <p className="text-golf-gray-300 text-center py-4">
                  No scorecards waiting for review.
                </p>
              </CardBody>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingCards.map((sc) => (
                <Card
                  key={sc.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/coach/review/${sc.id}`)}
                >
                  <CardBody>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-golf-gray-500">
                          {sc.student?.full_name ?? 'Student'}
                        </p>
                        <p className="text-sm text-golf-gray-400">
                          {sc.course?.name ?? 'Unknown Course'}
                        </p>
                        <p className="text-xs text-golf-gray-300 mt-1">
                          {new Date(sc.round_date).toLocaleDateString()} &middot;{' '}
                          {sc.tournament_name}
                        </p>
                      </div>
                      <span className="text-golf-gray-300 text-xl">&rsaquo;</span>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* My Students */}
        <section>
          <h2 className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide mb-3">
            My Students ({students.length})
          </h2>
          {students.length === 0 ? (
            <Card>
              <CardBody>
                <div className="text-center py-6">
                  <p className="text-4xl mb-3">&#127948;</p>
                  <p className="font-bold text-golf-gray-500 mb-1">
                    No students yet
                  </p>
                  <p className="text-sm text-golf-gray-300">
                    Share your invite code with students so they can join your roster.
                  </p>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {students.map((student) => (
                <Card
                  key={student.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/coach/student/${student.id}`)}
                >
                  <CardBody>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-golf-gray-500">
                        {student.full_name}
                      </p>
                      <span className="text-golf-gray-300 text-xl">&rsaquo;</span>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Manage Courses link */}
        <Button
          variant="secondary"
          size="md"
          onClick={() => router.push('/coach/courses')}
          className="w-full"
        >
          Manage Courses
        </Button>

        {/* Settings */}
        <div className="flex flex-col items-center gap-2">
          <ThemeToggle />
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
