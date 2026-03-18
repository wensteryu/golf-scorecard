'use client';

import { HoleScore } from '@/lib/types';
import { scoreColor } from '@/lib/calculations';

interface ProgressBarProps {
  currentHole: number;
  holeScores: HoleScore[];
  onHoleClick: (holeNumber: number) => void;
  className?: string;
}

export function ProgressBar({
  currentHole,
  holeScores,
  onHoleClick,
  className = '',
}: ProgressBarProps) {
  const front9 = holeScores.filter((h) => h.hole_number <= 9).sort((a, b) => a.hole_number - b.hole_number);
  const back9 = holeScores.filter((h) => h.hole_number > 9).sort((a, b) => a.hole_number - b.hole_number);

  function renderHoleBox(hole: HoleScore) {
    const isCurrent = hole.hole_number === currentHole;
    const hasScore = hole.score !== null;
    const bgColor = hasScore ? scoreColor(hole.score, hole.par) : 'bg-golf-gray-100 text-golf-gray-300';

    return (
      <button
        key={hole.hole_number}
        type="button"
        onClick={() => onHoleClick(hole.hole_number)}
        className={[
          'flex-1 flex flex-col items-center rounded-lg py-1 transition-all cursor-pointer min-w-0',
          isCurrent ? 'ring-2 ring-golf-blue ring-offset-1' : '',
          hasScore ? bgColor : bgColor,
        ].join(' ')}
      >
        <span className={[
          'text-[10px] font-bold leading-tight',
          hasScore ? '' : 'text-golf-gray-400',
        ].join(' ')}>
          {hole.hole_number}
        </span>
        <span className={[
          'text-sm font-extrabold leading-tight tabular-nums',
          hasScore ? '' : 'text-golf-gray-300',
        ].join(' ')}>
          {hasScore ? hole.score : '-'}
        </span>
        <span className={[
          'text-[9px] font-semibold leading-tight',
          hasScore ? 'opacity-70' : 'text-golf-gray-300',
        ].join(' ')}>
          P{hole.par}
        </span>
      </button>
    );
  }

  return (
    <div className={['w-full', className].join(' ')}>
      {/* Front 9 */}
      <div className="mb-2">
        <span className="text-[10px] font-bold text-golf-gray-400 uppercase tracking-wide">
          Front 9
        </span>
        <div className="flex gap-0.5 mt-1">
          {front9.map(renderHoleBox)}
        </div>
      </div>

      {/* Back 9 */}
      {back9.length > 0 && (
        <div>
          <span className="text-[10px] font-bold text-golf-gray-400 uppercase tracking-wide">
            Back 9
          </span>
          <div className="flex gap-0.5 mt-1">
            {back9.map(renderHoleBox)}
          </div>
        </div>
      )}
    </div>
  );
}
