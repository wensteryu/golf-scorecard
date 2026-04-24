'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';

export default function StudentSettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [parentFirstName, setParentFirstName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        const p = data as Profile;
        setProfile(p);
        setFullName(p.full_name ?? '');
        setParentFirstName(p.parent_first_name ?? '');
        setParentEmail(p.parent_email ?? '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validEmail(email: string): boolean {
    if (email.trim().length === 0) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  async function handleSave() {
    if (!profile) return;
    setError(null);
    setSavedMsg(null);

    if (fullName.trim().length === 0) {
      setError('Your name cannot be empty.');
      return;
    }
    if (!validEmail(parentEmail)) {
      setError('Parent email looks invalid.');
      return;
    }
    if (parentEmail.trim().length > 0 && parentFirstName.trim().length === 0) {
      setError('Please enter a parent first name so we can personalize the email.');
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          parent_first_name: parentFirstName.trim() || null,
          parent_email: parentEmail.trim().toLowerCase() || null,
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setSavedMsg('Saved!');
      setTimeout(() => setSavedMsg(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-golf-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-golf-green border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-golf-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-golf-gray-50">
      <div className="bg-surface border-b border-golf-gray-100 px-4 py-4 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/student"
              className="text-sm font-bold text-golf-blue hover:text-golf-blue-dark"
            >
              &larr; Back
            </Link>
          </div>
          <h1 className="text-lg font-extrabold text-golf-gray-500">Settings</h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">
        <Card>
          <CardBody>
            <h2 className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide mb-4">
              Your profile
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-bold uppercase tracking-wide text-golf-gray-400"
                >
                  Your full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="touch-target w-full rounded-xl border-2 border-golf-gray-100 bg-golf-gray-50 px-4 py-3 text-golf-gray-500 placeholder-golf-gray-300 outline-none transition-colors focus:border-golf-blue focus:bg-surface"
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wide text-golf-gray-400">
                  Email
                </label>
                <p className="mt-1 text-golf-gray-400">{profile?.email}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide mb-1">
              Parent
            </h2>
            <p className="mb-4 text-sm text-golf-gray-400">
              Optional. If you add a parent, they&apos;ll be emailed when you submit a round and
              when the coach finishes their review.
            </p>

            <div className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="parentFirstName"
                  className="mb-2 block text-sm font-bold uppercase tracking-wide text-golf-gray-400"
                >
                  Parent first name
                </label>
                <input
                  id="parentFirstName"
                  type="text"
                  value={parentFirstName}
                  onChange={(e) => setParentFirstName(e.target.value)}
                  placeholder="e.g. Sarah"
                  className="touch-target w-full rounded-xl border-2 border-golf-gray-100 bg-golf-gray-50 px-4 py-3 text-golf-gray-500 placeholder-golf-gray-300 outline-none transition-colors focus:border-golf-blue focus:bg-surface"
                />
              </div>

              <div>
                <label
                  htmlFor="parentEmail"
                  className="mb-2 block text-sm font-bold uppercase tracking-wide text-golf-gray-400"
                >
                  Parent email
                </label>
                <input
                  id="parentEmail"
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="touch-target w-full rounded-xl border-2 border-golf-gray-100 bg-golf-gray-50 px-4 py-3 text-golf-gray-500 placeholder-golf-gray-300 outline-none transition-colors focus:border-golf-blue focus:bg-surface"
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {error && (
          <p className="text-center text-sm font-bold text-golf-red">{error}</p>
        )}
        {savedMsg && (
          <p className="text-center text-sm font-bold text-golf-green">{savedMsg}</p>
        )}

        <Button variant="primary" size="lg" onClick={handleSave} loading={saving} className="w-full">
          Save
        </Button>
      </div>
    </div>
  );
}
