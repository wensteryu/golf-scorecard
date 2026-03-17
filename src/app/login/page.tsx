'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + '/auth/callback',
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 text-6xl">⛳</div>
          <h1 className="text-3xl font-bold text-golf-gray-500">
            Golf Scorecard
          </h1>
          <p className="mt-2 text-golf-gray-400">
            Track your rounds. Improve your game.
          </p>
        </div>

        {sent ? (
          /* Success state */
          <div className="rounded-2xl border-2 border-golf-green bg-white p-8 text-center shadow-sm">
            <div className="mb-4 text-5xl">📬</div>
            <h2 className="mb-2 text-xl font-bold text-golf-gray-500">
              Check your email!
            </h2>
            <p className="text-golf-gray-400">
              We sent a login link to{' '}
              <span className="font-semibold text-golf-gray-500">{email}</span>.
              Click the link to sign in.
            </p>
            <button
              onClick={() => {
                setSent(false);
                setEmail('');
              }}
              className="mt-6 text-sm font-semibold text-golf-blue hover:text-golf-blue-dark"
            >
              Use a different email
            </button>
          </div>
        ) : (
          /* Login form */
          <form onSubmit={handleLogin}>
            <div className="rounded-2xl border-2 border-golf-gray-100 bg-white p-6 shadow-sm">
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-bold uppercase tracking-wide text-golf-gray-400"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="touch-target w-full rounded-xl border-2 border-golf-gray-100 bg-golf-gray-50 px-4 py-3 text-golf-gray-500 placeholder-golf-gray-300 outline-none transition-colors focus:border-golf-blue focus:bg-white"
              />

              {error && (
                <p className="mt-3 text-sm text-golf-red">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="touch-target mt-4 w-full rounded-xl bg-golf-green py-3 text-lg font-bold text-white shadow-[0_4px_0_0] shadow-golf-green-dark transition-all active:translate-y-[2px] active:shadow-[0_2px_0_0] active:shadow-golf-green-dark disabled:opacity-50 disabled:active:translate-y-0"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
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
                    Sending...
                  </span>
                ) : (
                  'Send Magic Link'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
