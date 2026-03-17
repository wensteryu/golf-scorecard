'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { GolfCourse, CourseHole } from '@/lib/types';
import { Button } from '@/components/ui/button';

export default function NewScorecardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [courses, setCourses] = useState<(GolfCourse & { holes?: CourseHole[] })[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [tournamentName, setTournamentName] = useState('');
  const [roundDate, setRoundDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        // Get current user's profile to find their coach
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('coach_id')
          .eq('id', user.id)
          .single();

        if (!profile?.coach_id) {
          setError('No coach assigned. Please contact your coach for an invite code.');
          setLoading(false);
          return;
        }

        // Fetch courses from the student's coach, including holes
        const { data: coursesData, error: coursesError } = await supabase
          .from('golf_courses')
          .select('*, holes:course_holes(*)')
          .eq('coach_id', profile.coach_id)
          .order('name');

        if (coursesError) throw coursesError;

        setCourses(coursesData ?? []);
        if (coursesData && coursesData.length > 0) {
          setSelectedCourseId(coursesData[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedCourseId) {
      setError('Please select a course');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      // Create scorecard
      const { data: scorecard, error: scorecardError } = await supabase
        .from('scorecards')
        .insert({
          student_id: user.id,
          course_id: selectedCourseId,
          tournament_name: tournamentName.trim() || 'Practice Round',
          round_date: roundDate,
          status: 'in_progress',
        })
        .select()
        .single();

      if (scorecardError) throw scorecardError;

      // Get course holes for par values
      const selectedCourse = courses.find((c) => c.id === selectedCourseId);
      const courseHoles = selectedCourse?.holes ?? [];

      // Sort holes by hole_number
      const sortedHoles = [...courseHoles].sort(
        (a, b) => a.hole_number - b.hole_number
      );

      // Create 18 hole_score rows pre-populated with par
      const holeScoreRows = Array.from({ length: 18 }, (_, i) => {
        const holeNumber = i + 1;
        const courseHole = sortedHoles.find((h) => h.hole_number === holeNumber);
        const par = courseHole?.par ?? 4; // Default to par 4 if hole data missing

        return {
          scorecard_id: scorecard.id,
          hole_number: holeNumber,
          par,
          score: null,
          fairway: null,
          gir: null,
          putts: null,
          first_putt_distance: null,
          up_and_down: null,
          penalty_strokes: 0,
          chip_in: false,
        };
      });

      const { error: holesError } = await supabase
        .from('hole_scores')
        .insert(holeScoreRows);

      if (holesError) throw holesError;

      // Navigate to the round scoring page
      router.push(`/student/round/${scorecard.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create round');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-golf-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-golf-green border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-golf-gray-400">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-golf-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-golf-gray-100 px-4 py-4 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm font-bold text-golf-gray-400 hover:text-golf-gray-500 min-h-[44px] flex items-center cursor-pointer"
          >
            &larr; Back
          </button>
          <h1 className="text-lg font-extrabold text-golf-gray-500">
            New Round
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Course selection */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="course"
              className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide"
            >
              Course
            </label>
            {courses.length === 0 ? (
              <p className="text-golf-gray-400 text-sm">
                No courses available. Ask your coach to add a course.
              </p>
            ) : (
              <select
                id="course"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className={[
                  'w-full px-4 py-3 rounded-xl',
                  'border-2 border-golf-gray-200 bg-white',
                  'text-golf-gray-500 font-semibold text-base',
                  'focus:border-golf-green focus:outline-none',
                  'min-h-[48px]',
                  'transition-colors duration-150',
                  'appearance-none cursor-pointer',
                ].join(' ')}
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Tournament name */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="tournament"
              className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide"
            >
              Tournament / Round Name
            </label>
            <input
              id="tournament"
              type="text"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              placeholder="Practice Round"
              className={[
                'w-full px-4 py-3 rounded-xl',
                'border-2 border-golf-gray-200 bg-white',
                'text-golf-gray-500 font-semibold text-base',
                'focus:border-golf-green focus:outline-none',
                'min-h-[48px]',
                'transition-colors duration-150',
                'placeholder:text-golf-gray-300',
              ].join(' ')}
            />
          </div>

          {/* Round date */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="date"
              className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide"
            >
              Date
            </label>
            <input
              id="date"
              type="date"
              value={roundDate}
              onChange={(e) => setRoundDate(e.target.value)}
              className={[
                'w-full px-4 py-3 rounded-xl',
                'border-2 border-golf-gray-200 bg-white',
                'text-golf-gray-500 font-semibold text-base',
                'focus:border-golf-green focus:outline-none',
                'min-h-[48px]',
                'transition-colors duration-150',
              ].join(' ')}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-600 font-semibold text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            disabled={courses.length === 0}
            className="w-full mt-2"
          >
            Start Round
          </Button>
        </form>
      </div>
    </div>
  );
}
