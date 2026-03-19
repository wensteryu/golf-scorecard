'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { GolfCourse, CourseHole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const supabase = createClient();

  const [course, setCourse] = useState<GolfCourse | null>(null);
  const [courseName, setCourseName] = useState('');
  const [pars, setPars] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [savingHole, setSavingHole] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: courseData, error: courseError } = await supabase
          .from('golf_courses')
          .select('*, holes:course_holes(*)')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;
        if (!courseData) throw new Error('Course not found');

        setCourse(courseData as GolfCourse);
        setCourseName(courseData.name);

        // Build pars map from existing holes
        const parsMap: Record<number, number> = {};
        ((courseData.holes as CourseHole[]) ?? []).forEach((h) => {
          parsMap[h.hole_number] = h.par;
        });
        // Default all 18 holes to par 4 if not set
        for (let i = 1; i <= 18; i++) {
          if (!parsMap[i]) parsMap[i] = 4;
        }
        setPars(parsMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load course');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  async function handleParChange(holeNumber: number, par: number) {
    setPars((prev) => ({ ...prev, [holeNumber]: par }));
    setSavingHole(holeNumber);

    try {
      const { error: upsertError } = await supabase
        .from('course_holes')
        .upsert(
          {
            course_id: courseId,
            hole_number: holeNumber,
            par,
          },
          { onConflict: 'course_id,hole_number' }
        );

      if (upsertError) throw upsertError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save par');
    } finally {
      setSavingHole(null);
    }
  }

  async function handleSaveName() {
    const name = courseName.trim();
    if (!name || !course || name === course.name) return;

    setSavingName(true);
    try {
      const { error: updateError } = await supabase
        .from('golf_courses')
        .update({ name })
        .eq('id', courseId);

      if (updateError) throw updateError;
      setCourse((prev) => (prev ? { ...prev, name } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  }

  const totalPar = Object.values(pars).reduce((sum, p) => sum + p, 0);
  const front9Par = Array.from({ length: 9 }, (_, i) => pars[i + 1] ?? 4).reduce(
    (sum, p) => sum + p,
    0
  );
  const back9Par = Array.from({ length: 9 }, (_, i) => pars[i + 10] ?? 4).reduce(
    (sum, p) => sum + p,
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-golf-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-golf-green border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-golf-gray-400">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error && !course) {
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
            onClick={() => router.push('/coach/courses')}
            className="text-sm font-bold text-golf-gray-400 hover:text-golf-gray-500 min-h-[44px] flex items-center cursor-pointer"
          >
            &larr; Courses
          </button>
          <h1 className="text-lg font-extrabold text-golf-gray-500">
            Edit Course
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Course Name */}
        <section>
          <label className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide block mb-2">
            Course Name
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              onBlur={handleSaveName}
              className={[
                'flex-1 px-4 py-3 rounded-xl',
                'border-2 border-golf-gray-200 bg-surface',
                'text-golf-gray-500 font-semibold text-base',
                'focus:border-golf-green focus:outline-none',
                'min-h-[48px]',
                'transition-colors duration-150',
              ].join(' ')}
            />
            {savingName && (
              <span className="text-sm text-golf-gray-300 self-center">Saving...</span>
            )}
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 font-semibold text-sm">{error}</p>
          </div>
        )}

        {/* Hole Pars Grid */}
        <section>
          <h2 className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide mb-3">
            Front 9
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((holeNum) => (
              <Card key={holeNum}>
                <CardBody className="py-3 px-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-golf-gray-500">
                      Hole {holeNum}
                    </span>
                    {savingHole === holeNum && (
                      <span className="text-[10px] text-golf-gray-300">Saving</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {[3, 4, 5].map((par) => (
                      <button
                        key={par}
                        type="button"
                        onClick={() => handleParChange(holeNum, par)}
                        className={[
                          'flex-1 py-2 rounded-lg text-sm font-extrabold transition-colors cursor-pointer',
                          pars[holeNum] === par
                            ? 'bg-golf-green text-white'
                            : 'bg-golf-gray-100 text-golf-gray-400 hover:bg-golf-gray-200',
                        ].join(' ')}
                      >
                        {par}
                      </button>
                    ))}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide mb-3">
            Back 9
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }, (_, i) => i + 10).map((holeNum) => (
              <Card key={holeNum}>
                <CardBody className="py-3 px-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-golf-gray-500">
                      Hole {holeNum}
                    </span>
                    {savingHole === holeNum && (
                      <span className="text-[10px] text-golf-gray-300">Saving</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {[3, 4, 5].map((par) => (
                      <button
                        key={par}
                        type="button"
                        onClick={() => handleParChange(holeNum, par)}
                        className={[
                          'flex-1 py-2 rounded-lg text-sm font-extrabold transition-colors cursor-pointer',
                          pars[holeNum] === par
                            ? 'bg-golf-green text-white'
                            : 'bg-golf-gray-100 text-golf-gray-400 hover:bg-golf-gray-200',
                        ].join(' ')}
                      >
                        {par}
                      </button>
                    ))}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        {/* Total Par Summary */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-lg font-extrabold text-golf-gray-500">{front9Par}</p>
                <p className="text-xs font-bold text-golf-gray-300 uppercase">Front 9</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-lg font-extrabold text-golf-gray-500">{back9Par}</p>
                <p className="text-xs font-bold text-golf-gray-300 uppercase">Back 9</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-2xl font-extrabold text-golf-green">{totalPar}</p>
                <p className="text-xs font-bold text-golf-gray-300 uppercase">Total Par</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Back button */}
        <Button
          variant="ghost"
          size="md"
          onClick={() => router.push('/coach/courses')}
          className="w-full"
        >
          &larr; Back to Courses
        </Button>
      </div>
    </div>
  );
}
