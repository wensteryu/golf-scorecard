'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { HoleScore } from '@/lib/types';
import { scoreColor, formatScoreToPar } from '@/lib/calculations';
import { Button } from '@/components/ui/button';

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const scorecardId = params.id as string;
  const supabase = createClient();

  const [holeScores, setHoleScores] = useState<HoleScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: scorecard, error: scorecardError } = await supabase
          .from('scorecards')
          .select('*, hole_scores(*)')
          .eq('id', scorecardId)
          .single();

        if (scorecardError) throw scorecardError;
        if (!scorecard) throw new Error('Scorecard not found');

        const sorted = (scorecard.hole_scores as HoleScore[]).sort(
          (a, b) => a.hole_number - b.hole_number
        );
        setHoleScores(sorted);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load round');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scorecardId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-golf-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-golf-green border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-golf-gray-400">Loading review...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-golf-gray-50 px-6">
        <div className="text-center">
          <p className="text-lg font-bold text-golf-red mb-4">{error}</p>
          <Button variant="secondary" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const front9 = holeScores.filter((h) => h.hole_number <= 9);
  const back9 = holeScores.filter((h) => h.hole_number > 9);

  function subtotal(holes: HoleScore[]) {
    return {
      par: holes.reduce((s, h) => s + h.par, 0),
      score: holes.reduce((s, h) => s + (h.score ?? 0), 0),
      putts: holes.reduce((s, h) => s + (h.putts ?? 0), 0),
      penalty: holes.reduce((s, h) => s + h.penalty_strokes, 0),
      fw: holes.filter((h) => h.fairway === 'hit').length,
      fwTotal: holes.filter((h) => h.par > 3 && h.fairway !== null).length,
      gir: holes.filter((h) => h.gir === 'hit').length,
      girTotal: holes.filter((h) => h.gir !== null).length,
    };
  }

  const front9Stats = subtotal(front9);
  const back9Stats = subtotal(back9);
  const totalStats = subtotal(holeScores);

  function handleRowTap(holeNumber: number) {
    router.push(`/student/round/${scorecardId}?hole=${holeNumber}`);
  }

  function fairwayDisplay(h: HoleScore) {
    if (h.par === 3) return '--';
    if (h.fairway === 'hit') return '\u2713';
    if (h.fairway === 'left') return 'L';
    if (h.fairway === 'right') return 'R';
    return '--';
  }

  function girDisplay(h: HoleScore) {
    if (h.gir === 'hit') return '\u2713';
    if (h.gir === 'left') return 'L';
    if (h.gir === 'right') return 'R';
    if (h.gir === 'short') return 'S';
    if (h.gir === 'over') return 'O';
    if (h.gir === 'pin_high') return 'PH';
    return '--';
  }

  function SubtotalRow({ label, stats }: { label: string; stats: ReturnType<typeof subtotal> }) {
    const diff = stats.score - stats.par;
    return (
      <tr className="bg-golf-gray-100 font-bold text-sm">
        <td className="px-2 py-2 text-golf-gray-500">{label}</td>
        <td className="px-2 py-2 text-center text-golf-gray-400">{stats.par}</td>
        <td className="px-2 py-2 text-center">
          <span className="text-golf-gray-500">{stats.score}</span>
          <span className={[
            'ml-1 text-xs',
            diff > 0 ? 'text-golf-red' : diff < 0 ? 'text-emerald-600' : 'text-golf-gray-400',
          ].join(' ')}>
            ({formatScoreToPar(diff)})
          </span>
        </td>
        <td className="px-2 py-2 text-center text-golf-gray-400">
          {stats.fw}/{stats.fwTotal}
        </td>
        <td className="px-2 py-2 text-center text-golf-gray-400">
          {stats.gir}/{stats.girTotal}
        </td>
        <td className="px-2 py-2 text-center text-golf-gray-400">{stats.putts}</td>
        <td className="px-2 py-2 text-center text-golf-gray-400">{stats.penalty}</td>
      </tr>
    );
  }

  return (
    <div className="min-h-screen bg-golf-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-golf-gray-100 px-4 py-4 shadow-sm sticky top-0 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/student" className="text-sm font-bold text-golf-gray-400 hover:text-golf-gray-500 min-h-[44px] flex items-center">
            &larr; Home
          </Link>
          <h1 className="text-lg font-extrabold text-golf-gray-500">Review</h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Scorecard Table */}
      <div className="flex-1 px-2 py-4 max-w-lg mx-auto w-full overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-golf-gray-500 text-white text-xs uppercase tracking-wide">
              <th className="px-2 py-2.5 text-left rounded-tl-lg">Hole</th>
              <th className="px-2 py-2.5 text-center">Par</th>
              <th className="px-2 py-2.5 text-center">Score</th>
              <th className="px-2 py-2.5 text-center">FW</th>
              <th className="px-2 py-2.5 text-center">GIR</th>
              <th className="px-2 py-2.5 text-center">Putts</th>
              <th className="px-2 py-2.5 text-center rounded-tr-lg">Pen</th>
            </tr>
          </thead>
          <tbody>
            {/* Front 9 */}
            {front9.map((h, i) => (
              <tr
                key={h.hole_number}
                onClick={() => handleRowTap(h.hole_number)}
                className={[
                  'cursor-pointer active:bg-golf-gray-200 transition-colors',
                  i % 2 === 0 ? 'bg-white' : 'bg-golf-gray-50',
                ].join(' ')}
              >
                <td className="px-2 py-2.5 font-bold text-golf-gray-500">{h.hole_number}</td>
                <td className="px-2 py-2.5 text-center text-golf-gray-400">{h.par}</td>
                <td className="px-2 py-2.5 text-center">
                  {h.score !== null ? (
                    <span
                      className={[
                        'inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm',
                        scoreColor(h.score, h.par),
                      ].join(' ')}
                    >
                      {h.score}
                    </span>
                  ) : (
                    <span className="text-golf-gray-300">--</span>
                  )}
                </td>
                <td className="px-2 py-2.5 text-center text-golf-gray-400">
                  {fairwayDisplay(h)}
                </td>
                <td className="px-2 py-2.5 text-center text-golf-gray-400">
                  {girDisplay(h)}
                </td>
                <td className="px-2 py-2.5 text-center text-golf-gray-400">
                  {h.putts ?? '--'}
                </td>
                <td className="px-2 py-2.5 text-center text-golf-gray-400">
                  {h.penalty_strokes > 0 ? h.penalty_strokes : '--'}
                </td>
              </tr>
            ))}

            {/* Front 9 Subtotal */}
            <SubtotalRow label="OUT" stats={front9Stats} />

            {/* Back 9 */}
            {back9.map((h, i) => (
              <tr
                key={h.hole_number}
                onClick={() => handleRowTap(h.hole_number)}
                className={[
                  'cursor-pointer active:bg-golf-gray-200 transition-colors',
                  i % 2 === 0 ? 'bg-white' : 'bg-golf-gray-50',
                ].join(' ')}
              >
                <td className="px-2 py-2.5 font-bold text-golf-gray-500">{h.hole_number}</td>
                <td className="px-2 py-2.5 text-center text-golf-gray-400">{h.par}</td>
                <td className="px-2 py-2.5 text-center">
                  {h.score !== null ? (
                    <span
                      className={[
                        'inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm',
                        scoreColor(h.score, h.par),
                      ].join(' ')}
                    >
                      {h.score}
                    </span>
                  ) : (
                    <span className="text-golf-gray-300">--</span>
                  )}
                </td>
                <td className="px-2 py-2.5 text-center text-golf-gray-400">
                  {fairwayDisplay(h)}
                </td>
                <td className="px-2 py-2.5 text-center text-golf-gray-400">
                  {girDisplay(h)}
                </td>
                <td className="px-2 py-2.5 text-center text-golf-gray-400">
                  {h.putts ?? '--'}
                </td>
                <td className="px-2 py-2.5 text-center text-golf-gray-400">
                  {h.penalty_strokes > 0 ? h.penalty_strokes : '--'}
                </td>
              </tr>
            ))}

            {/* Back 9 Subtotal */}
            <SubtotalRow label="IN" stats={back9Stats} />

            {/* Total */}
            <tr className="bg-golf-gray-500 text-white font-bold text-sm">
              <td className="px-2 py-3 rounded-bl-lg">TOT</td>
              <td className="px-2 py-3 text-center">{totalStats.par}</td>
              <td className="px-2 py-3 text-center">
                {totalStats.score}
                <span className="ml-1 text-xs opacity-80">
                  ({formatScoreToPar(totalStats.score - totalStats.par)})
                </span>
              </td>
              <td className="px-2 py-3 text-center text-sm">
                {totalStats.fw}/{totalStats.fwTotal}
              </td>
              <td className="px-2 py-3 text-center text-sm">
                {totalStats.gir}/{totalStats.girTotal}
              </td>
              <td className="px-2 py-3 text-center">{totalStats.putts}</td>
              <td className="px-2 py-3 text-center rounded-br-lg">{totalStats.penalty}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bottom button */}
      <div className="sticky bottom-0 bg-white border-t border-golf-gray-100 px-4 py-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-lg mx-auto">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => router.push(`/student/round/${scorecardId}/reflect`)}
          >
            Continue to Reflections &rarr;
          </Button>
        </div>
      </div>
    </div>
  );
}
