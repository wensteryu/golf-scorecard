'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isAdmin } from '@/lib/admin';
import { Profile, UserRole } from '@/lib/types';
import { RoleSwitcher } from '@/components/ui/role-switcher';
import { shouldShowTopNav } from '@/lib/nav';
import { TopNav } from './top-nav';
import { ViewAsBar, ViewAsProvider } from './view-as';

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

  const admin = !!profile && isAdmin(profile.email);
  const showNav = shouldShowTopNav(pathname);

  return (
    <ViewAsProvider profile={profile} isAdmin={admin && role === 'student'}>
      {showNav && <TopNav role={role} profile={profile} />}
      {showNav && role === 'student' && <ViewAsBar />}
      {children}
      {admin && <RoleSwitcher />}
    </ViewAsProvider>
  );
}
