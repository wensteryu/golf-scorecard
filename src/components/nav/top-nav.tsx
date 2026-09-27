'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, UserRole } from '@/lib/types';
import { NAV_TABS, activeTab } from '@/lib/nav';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { ThemeToggle } from '@/lib/theme';

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('') || '?'
  );
}

function AccountMenu({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function signOut() {
    await createClient().auth.signOut();
    router.push('/login');
  }

  const item =
    'w-full text-left px-4 min-h-[44px] flex items-center text-sm font-bold text-golf-gray-500 hover:bg-golf-gray-50 cursor-pointer';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((o) => !o)}
        className="w-9 h-9 rounded-full bg-golf-green text-white text-sm font-extrabold flex items-center justify-center cursor-pointer"
      >
        {initials(profile.full_name)}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 bg-surface rounded-2xl shadow-lg border border-golf-gray-100 z-50 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-golf-gray-100">
            <p className="text-sm font-bold text-golf-gray-500 truncate">{profile.full_name}</p>
            <p className="text-xs text-golf-gray-300 truncate">{profile.email}</p>
          </div>
          {profile.role === 'student' && (
            <Link href="/student/settings" role="menuitem" className={item} onClick={() => setOpen(false)}>
              Settings
            </Link>
          )}
          <div className="px-1">
            <ThemeToggle />
          </div>
          <button type="button" role="menuitem" onClick={signOut} className={`${item} border-t border-golf-gray-100`}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export function TopNav({ role, profile }: { role: UserRole; profile: Profile | null }) {
  const pathname = usePathname();
  const tabs = NAV_TABS[role];
  const active = activeTab(role, pathname);

  return (
    <nav className="sticky top-0 z-40 bg-surface border-b border-golf-gray-100 shadow-sm" aria-label="Main">
      <div className="max-w-lg mx-auto px-3 h-14 flex items-center gap-2">
        <Link href={tabs[0].href} className="shrink-0 max-[359px]:hidden" aria-label="Home">
          <img src="/logo.png" alt="Elite Golf Realm" className="h-9 w-auto object-contain" />
        </Link>
        <div className="flex-1 flex items-center min-w-0">
          {tabs.map((t) => {
            const isActive = t === active;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'px-2 min-h-[44px] flex items-center text-sm font-bold border-b-3 transition-colors',
                  isActive
                    ? 'text-golf-green border-golf-green'
                    : 'text-golf-gray-400 border-transparent hover:text-golf-gray-500',
                ].join(' ')}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
        {profile && (
          <div className="shrink-0 flex items-center gap-1">
            <NotificationBell userId={profile.id} />
            <AccountMenu profile={profile} />
          </div>
        )}
      </div>
    </nav>
  );
}
