import { UserRole } from './types';

export interface NavTab {
  label: string;
  href: string;
  /** Pathname prefixes that mark this tab active; the first tab is the fallback. */
  match: string[];
}

export const NAV_TABS: Record<UserRole, NavTab[]> = {
  student: [
    { label: 'Rounds', href: '/student', match: [] },
    { label: 'Stats', href: '/student/stats', match: ['/student/stats'] },
    { label: 'History', href: '/student/history', match: ['/student/history'] },
  ],
  coach: [
    { label: 'Students', href: '/coach', match: [] },
    { label: 'Courses', href: '/coach/courses', match: ['/coach/courses'] },
  ],
};

// Hole entry, review and reflect keep their focused full-screen flow.
const HIDDEN = /^\/student\/round\/[^/]+(\/review|\/reflect)?$/;

export function shouldShowTopNav(pathname: string): boolean {
  return !HIDDEN.test(pathname);
}

export function activeTab(role: UserRole, pathname: string): NavTab {
  const tabs = NAV_TABS[role];
  return tabs.find((t) => t.match.some((m) => pathname.startsWith(m))) ?? tabs[0];
}
