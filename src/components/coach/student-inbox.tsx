'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Profile, Scorecard } from '@/lib/types';
import { buildStudentRows, StudentRow } from '@/lib/coach-inbox';
import { calculateStats, formatScoreToPar } from '@/lib/calculations';
import { Card, CardBody } from '@/components/ui/card';

const shortDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function subline(row: StudentRow) {
  const parts = [row.lastRoundDate ? `Last: ${shortDate(row.lastRoundDate)}` : 'No rounds yet'];
  if (row.tournamentAvg18 !== null) parts.push(`Tourn avg ${row.tournamentAvg18.toFixed(1)}`);
  return parts.join(' · ');
}

function StudentCard({ row }: { row: StudentRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const count = row.pending.length;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => router.push(`/coach/student/${row.student.id}`)}
          className="flex-1 min-w-0 text-left px-5 py-4 cursor-pointer"
        >
          <p className="font-bold text-golf-gray-500 truncate">{row.student.full_name}</p>
          <p className="text-xs text-golf-gray-300 mt-0.5">{subline(row)}</p>
        </button>
        {count > 0 ? (
          <button
            type="button"
            aria-expanded={open}
            aria-label={`${count} pending review${count !== 1 ? 's' : ''} for ${row.student.full_name}`}
            onClick={() => setOpen((o) => !o)}
            className="mr-3 min-h-[44px] px-3 rounded-full bg-golf-blue/15 text-golf-blue text-xs font-bold whitespace-nowrap cursor-pointer hover:bg-golf-blue/25"
          >
            {count} pending {open ? '▴' : '▾'}
          </button>
        ) : (
          <span className="pr-5 text-golf-gray-300 text-xl">&rsaquo;</span>
        )}
      </div>

      {open && (
        <div className="border-t border-golf-gray-100">
          {row.pending.map((sc) => (
            <PendingRound key={sc.id} sc={sc} />
          ))}
        </div>
      )}
    </Card>
  );
}

function PendingRound({ sc }: { sc: Scorecard }) {
  const router = useRouter();
  const holes = sc.hole_scores ?? [];
  const stats = holes.some((h) => h.score !== null) ? calculateStats(holes) : null;

  return (
    <button
      type="button"
      onClick={() => router.push(`/coach/review/${sc.id}`)}
      className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left border-b last:border-b-0 border-golf-gray-100 hover:bg-golf-gray-50 cursor-pointer min-h-[44px]"
    >
      <div className="min-w-0">
        <p className="text-sm font-bold text-golf-gray-500 truncate">
          {shortDate(sc.round_date)} · {sc.tournament_name}
        </p>
        <p className="text-xs text-golf-gray-300 truncate">{sc.course?.name ?? 'Unknown Course'}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {stats && (
          <span className="text-sm font-extrabold text-golf-gray-500">
            {stats.totalScore}{' '}
            <span className="text-xs font-bold text-golf-gray-300">{formatScoreToPar(stats.scoreToPar)}</span>
          </span>
        )}
        <span className="text-golf-gray-300 text-xl">&rsaquo;</span>
      </div>
    </button>
  );
}

export function StudentInbox({ students, scorecards }: { students: Profile[]; scorecards: Scorecard[] }) {
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const rows = useMemo(() => buildStudentRows(students, scorecards), [students, scorecards]);
  const q = query.trim().toLowerCase();
  const visible = q ? rows.filter((r) => r.student.full_name.toLowerCase().includes(q)) : rows;
  const needsReview = visible.filter((r) => r.pending.length > 0);
  const others = visible.filter((r) => r.pending.length === 0);
  const pendingTotal = needsReview.reduce((acc, r) => acc + r.pending.length, 0);
  const othersOpen = showAll || q.length > 0;

  const heading = 'text-sm font-bold text-golf-gray-400 uppercase tracking-wide mb-3';

  return (
    <div className="flex flex-col gap-8">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search students…"
        aria-label="Search students"
        className="w-full px-4 py-3 rounded-xl border-2 border-golf-gray-200 bg-surface text-golf-gray-500 font-semibold text-base focus:border-golf-green focus:outline-none min-h-[48px] placeholder:text-golf-gray-300"
      />

      <section>
        <h2 className={heading}>
          Needs Review ({needsReview.length} student{needsReview.length !== 1 ? 's' : ''} · {pendingTotal} round
          {pendingTotal !== 1 ? 's' : ''})
        </h2>
        {needsReview.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-golf-gray-300 text-center py-4">
                {q ? 'No matching students with pending reviews.' : 'No scorecards waiting for review.'}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {needsReview.map((row) => (
              <StudentCard key={row.student.id} row={row} />
            ))}
          </div>
        )}
      </section>

      {others.length > 0 && (
        <section>
          <button
            type="button"
            aria-expanded={othersOpen}
            onClick={() => setShowAll((s) => !s)}
            disabled={q.length > 0}
            className={`${heading} flex items-center gap-1 min-h-[44px] cursor-pointer disabled:cursor-default`}
          >
            {needsReview.length > 0 ? 'Other Students' : 'Students'} ({others.length}) {othersOpen ? '▴' : '▸'}
          </button>
          {othersOpen && (
            <div className="flex flex-col gap-3">
              {others.map((row) => (
                <StudentCard key={row.student.id} row={row} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
