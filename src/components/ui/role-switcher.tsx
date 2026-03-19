'use client';

import { useRouter, usePathname } from 'next/navigation';

export function RoleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const isCoachView = pathname.startsWith('/coach');

  return (
    <button
      type="button"
      onClick={() => router.push(isCoachView ? '/student' : '/coach')}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-golf-accent px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-golf-accent transition-colors cursor-pointer"
    >
      <span className="text-base">{isCoachView ? '🏌️' : '📋'}</span>
      {isCoachView ? 'Student View' : 'Coach View'}
    </button>
  );
}
