'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isAdmin } from '@/lib/admin';
import { RoleSwitcher } from '@/components/ui/role-switcher';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [showSwitcher, setShowSwitcher] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();
      if (profile && isAdmin(profile.email)) {
        setShowSwitcher(true);
      }
    }
    checkAdmin();
  }, []);

  return (
    <>
      {children}
      {showSwitcher && <RoleSwitcher />}
    </>
  );
}
