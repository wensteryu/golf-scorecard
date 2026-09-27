'use client';

import { Fragment, createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/lib/types';

const STORAGE_KEY = 'egr:view-as-student';

interface StudentScope {
  /** Whose rounds the student pages show; null until the signed-in profile has loaded. */
  studentId: string | null;
  /** True when an admin is viewing another student's pages; hide actions that change data. */
  readOnly: boolean;
}

interface ViewAsState extends StudentScope {
  isAdmin: boolean;
  students: Profile[];
  viewAsId: string | null;
  setViewAsId: (id: string | null) => void;
}

const ViewAsContext = createContext<ViewAsState>({
  studentId: null,
  readOnly: false,
  isAdmin: false,
  students: [],
  viewAsId: null,
  setViewAsId: () => {},
});

function readStored(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStored(id: string | null) {
  try {
    if (id) sessionStorage.setItem(STORAGE_KEY, id);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode etc.) — selection just won't survive a reload.
  }
}

export function ViewAsProvider({
  profile,
  isAdmin,
  children,
}: {
  profile: Profile | null;
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  const [viewAsId, setViewAsIdState] = useState<string | null>(null);
  const [students, setStudents] = useState<Profile[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    createClient()
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('full_name')
      .then(({ data }) => {
        const list = (data as Profile[]) ?? [];
        setStudents(list);
        // Restore this tab's last pick, if that student still exists.
        const stored = readStored();
        setViewAsIdState(stored && list.some((s) => s.id === stored) ? stored : null);
      });
  }, [isAdmin]);

  function setViewAsId(id: string | null) {
    writeStored(id);
    setViewAsIdState(id);
  }

  const activeViewAs = isAdmin ? viewAsId : null;
  const value: ViewAsState = {
    studentId: activeViewAs ?? profile?.id ?? null,
    readOnly: activeViewAs !== null,
    isAdmin,
    students,
    viewAsId: activeViewAs,
    setViewAsId,
  };

  // Remount the page on switch so it starts from a clean loading state.
  return (
    <ViewAsContext.Provider value={value}>
      <Fragment key={activeViewAs ?? 'self'}>{children}</Fragment>
    </ViewAsContext.Provider>
  );
}

/** Which student the /student pages should load, honoring an admin's "view as" choice. */
export function useStudentScope(): StudentScope {
  const { studentId, readOnly } = useContext(ViewAsContext);
  return { studentId, readOnly };
}

/** Admin-only bar under the top nav: pick a student to view their pages read-only. */
export function ViewAsBar() {
  const { isAdmin, students, viewAsId, setViewAsId } = useContext(ViewAsContext);
  if (!isAdmin) return null;

  return (
    <div className="bg-golf-orange/10 border-b border-golf-orange/30">
      <div className="max-w-lg mx-auto px-4 py-2 flex items-center gap-2">
        <label htmlFor="view-as" className="text-sm font-bold text-golf-gray-500 whitespace-nowrap">
          Viewing as:
        </label>
        <select
          id="view-as"
          value={viewAsId ?? ''}
          onChange={(e) => setViewAsId(e.target.value || null)}
          className="flex-1 min-w-0 min-h-[44px] px-3 rounded-xl border-2 border-golf-gray-200 bg-surface text-golf-gray-500 font-semibold text-sm focus:border-golf-green focus:outline-none"
        >
          <option value="">Myself</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>
        {viewAsId && (
          <button
            type="button"
            onClick={() => setViewAsId(null)}
            aria-label="Stop viewing as student"
            className="min-h-[44px] min-w-[44px] rounded-xl text-golf-gray-400 hover:text-golf-gray-500 font-bold cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>
      {viewAsId && (
        <p className="max-w-lg mx-auto px-4 pb-2 text-xs font-semibold text-golf-orange">
          Read-only — you&apos;re seeing this student&apos;s screens.
        </p>
      )}
    </div>
  );
}
