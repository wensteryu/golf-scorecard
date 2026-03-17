'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { GolfCourse, CourseHole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';

export default function ManageCoursesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [courses, setCourses] = useState<(GolfCourse & { holes?: CourseHole[] })[]>([]);
  const [newCourseName, setNewCourseName] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchCourses() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('golf_courses')
        .select('*, holes:course_holes(*)')
        .eq('coach_id', user.id)
        .order('name');

      if (fetchError) throw fetchError;

      setCourses((data as (GolfCourse & { holes?: CourseHole[] })[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCourse(e: React.FormEvent) {
    e.preventDefault();
    const name = newCourseName.trim();
    if (!name) return;

    setAdding(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { data: course, error: insertError } = await supabase
        .from('golf_courses')
        .insert({ name, coach_id: user.id })
        .select()
        .single();

      if (insertError) throw insertError;

      setCourses((prev) => [...prev, { ...course, holes: [] }]);
      setNewCourseName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add course');
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteCourse(courseId: string) {
    setDeletingId(courseId);
    setError(null);

    try {
      // Delete course holes first
      await supabase.from('course_holes').delete().eq('course_id', courseId);

      const { error: deleteError } = await supabase
        .from('golf_courses')
        .delete()
        .eq('id', courseId);

      if (deleteError) throw deleteError;

      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      setConfirmDeleteId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete course');
    } finally {
      setDeletingId(null);
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
            onClick={() => router.push('/coach')}
            className="text-sm font-bold text-golf-gray-400 hover:text-golf-gray-500 min-h-[44px] flex items-center cursor-pointer"
          >
            &larr; Dashboard
          </button>
          <h1 className="text-lg font-extrabold text-golf-gray-500">
            Manage Courses
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Add New Course */}
        <section>
          <h2 className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide mb-3">
            Add New Course
          </h2>
          <form onSubmit={handleAddCourse} className="flex gap-3">
            <input
              type="text"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              placeholder="Course name"
              className={[
                'flex-1 px-4 py-3 rounded-xl',
                'border-2 border-golf-gray-200 bg-white',
                'text-golf-gray-500 font-semibold text-base',
                'focus:border-golf-green focus:outline-none',
                'min-h-[48px]',
                'transition-colors duration-150',
                'placeholder:text-golf-gray-300',
              ].join(' ')}
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={adding}
              disabled={!newCourseName.trim()}
            >
              Add
            </Button>
          </form>
        </section>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 font-semibold text-sm">{error}</p>
          </div>
        )}

        {/* Course List */}
        <section>
          <h2 className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide mb-3">
            Your Courses ({courses.length})
          </h2>
          {courses.length === 0 ? (
            <Card>
              <CardBody>
                <p className="text-golf-gray-300 text-center py-4">
                  No courses yet. Add one above.
                </p>
              </CardBody>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {courses.map((course) => {
                const holeCount = course.holes?.length ?? 0;
                const isConfirming = confirmDeleteId === course.id;

                return (
                  <Card key={course.id}>
                    <CardBody>
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => router.push(`/coach/courses/${course.id}`)}
                          className="flex-1 text-left cursor-pointer"
                        >
                          <p className="font-bold text-golf-gray-500">
                            {course.name}
                          </p>
                          <p className="text-xs text-golf-gray-300 mt-1">
                            {holeCount === 0
                              ? 'No holes configured'
                              : `${holeCount} hole${holeCount !== 1 ? 's' : ''} configured`}
                          </p>
                        </button>

                        <div className="flex items-center gap-2 ml-3">
                          {isConfirming ? (
                            <>
                              <Button
                                variant="danger"
                                size="sm"
                                loading={deletingId === course.id}
                                onClick={() => handleDeleteCourse(course.id)}
                              >
                                Delete
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setConfirmDeleteId(null)}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(course.id)}
                              className="text-golf-gray-300 hover:text-golf-red transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                              aria-label={`Delete ${course.name}`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
