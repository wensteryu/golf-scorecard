'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/lib/types';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const TOTAL_STEPS = 2;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in to complete onboarding.');
      setLoading(false);
      return;
    }

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      email: user.email!,
      full_name: fullName.trim(),
      role: role!,
      coach_id: null,
      invite_code: null,
    });

    if (profileError) {
      setError('Failed to create profile. Please try again.');
      setLoading(false);
      return;
    }

    // Redirect to appropriate dashboard
    router.push(role === 'coach' ? '/coach' : '/student');
  };

  const canAdvance = () => {
    if (step === 1) return fullName.trim().length > 0;
    if (step === 2) return role !== null;
    if (step === 3) {
      return true; // Invite code is optional for students
    }
    return false;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      setError(null);
    } else {
      handleSubmit();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Progress indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i + 1 <= step
                  ? 'w-10 bg-golf-green'
                  : 'w-10 bg-golf-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="rounded-2xl border-2 border-golf-gray-100 bg-white p-6 shadow-sm">
          {/* Step 1: Name */}
          {step === 1 && (
            <div>
              <div className="mb-4 text-center text-4xl">👋</div>
              <h2 className="mb-1 text-center text-xl font-bold text-golf-gray-500">
                Welcome to Golf Scorecard!
              </h2>
              <p className="mb-6 text-center text-sm text-golf-gray-400">
                Let&apos;s get you set up. What&apos;s your name?
              </p>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-bold uppercase tracking-wide text-golf-gray-400"
              >
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Tiger Woods"
                autoFocus
                className="touch-target w-full rounded-xl border-2 border-golf-gray-100 bg-golf-gray-50 px-4 py-3 text-golf-gray-500 placeholder-golf-gray-300 outline-none transition-colors focus:border-golf-blue focus:bg-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canAdvance()) handleNext();
                }}
              />
            </div>
          )}

          {/* Step 2: Role selection */}
          {step === 2 && (
            <div>
              <div className="mb-4 text-center text-4xl">🏌️</div>
              <h2 className="mb-1 text-center text-xl font-bold text-golf-gray-500">
                How will you use this?
              </h2>
              <p className="mb-6 text-center text-sm text-golf-gray-400">
                Pick your role to get started.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setRole('coach')}
                  className={`touch-target flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                    role === 'coach'
                      ? 'border-golf-blue bg-golf-blue/5 shadow-sm'
                      : 'border-golf-gray-100 hover:border-golf-gray-200'
                  }`}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-golf-orange/10 text-2xl">
                    📋
                  </span>
                  <div>
                    <div className="font-bold text-golf-gray-500">Coach</div>
                    <div className="text-sm text-golf-gray-400">
                      Review scorecards, manage players, and track progress
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setRole('student')}
                  className={`touch-target flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                    role === 'student'
                      ? 'border-golf-blue bg-golf-blue/5 shadow-sm'
                      : 'border-golf-gray-100 hover:border-golf-gray-200'
                  }`}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-golf-green/10 text-2xl">
                    🏌️
                  </span>
                  <div>
                    <div className="font-bold text-golf-gray-500">Student</div>
                    <div className="text-sm text-golf-gray-400">
                      Record rounds, submit scorecards, and improve your game
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}


          {/* Error message */}
          {error && (
            <p className="mt-4 text-center text-sm text-golf-red">{error}</p>
          )}

          {/* Navigation buttons */}
          <div className="mt-6 flex gap-3">
            {step > 1 && (
              <button
                onClick={() => {
                  setStep(step - 1);
                  setError(null);
                }}
                className="touch-target rounded-xl border-2 border-golf-gray-200 px-5 py-3 font-bold text-golf-gray-400 transition-colors hover:border-golf-gray-300"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canAdvance() || loading}
              className="touch-target flex-1 rounded-xl bg-golf-green py-3 text-lg font-bold text-white shadow-[0_4px_0_0] shadow-golf-green-dark transition-all active:translate-y-[2px] active:shadow-[0_2px_0_0] active:shadow-golf-green-dark disabled:opacity-50 disabled:active:translate-y-0"
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <svg
                    className="h-5 w-5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Creating profile...
                </span>
              ) : step < TOTAL_STEPS ? (
                'Continue'
              ) : (
                "Let's Go!"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
