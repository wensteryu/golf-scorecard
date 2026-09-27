'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isAdmin } from '@/lib/admin';
import { Profile, UserRole } from '@/lib/types';
import { RoleSwitcher } from '@/components/ui/role-switcher';
import { shouldShowTopNav } from '@/lib/nav';
import { TopNav } from './top-nav';

/** Shared chrome for /student/* and /coach/*: top menu bar + admin role switcher. */
export function RoleLayout({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setProfile(data as Profile);
    }
    loadProfile();
  }, []);

  return (
    <>
      {shouldShowTopNav(pathname) && <TopNav role={role} profile={profile} />}
      {children}
      {profile && isAdmin(profile.email) && <RoleSwitcher />}
    </>
  );
}
