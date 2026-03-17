'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
          <div className="rounded-2xl border-2 border-golf-gray-100 bg-white p-6 shadow-sm">
            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="touch-target flex w-full items-center justify-center gap-3 rounded-xl border-2 border-golf-gray-200 bg-white py-3 text-base font-bold text-golf-gray-500 transition-all hover:bg-golf-gray-50 active:translate-y-[1px] disabled:opacity-50 cursor-pointer"
            >
              {googleLoading ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-golf-gray-100" />
              <span className="text-xs font-bold uppercase text-golf-gray-300">or</span>
              <div className="h-px flex-1 bg-golf-gray-100" />
            </div>

            {/* Email login */}
            <form onSubmit={handleEmailLogin}>
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
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Send Magic Link'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
