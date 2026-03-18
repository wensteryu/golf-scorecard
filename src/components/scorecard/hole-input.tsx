'use client';

import { HoleScore, FairwayResult, GIRResult } from '@/lib/types';
import { scoreColor, scoreLabel } from '@/lib/calculations';
import { Stepper } from '@/components/ui/stepper';
import { ToggleGroup } from '@/components/ui/toggle-group';

interface HoleInputProps {
  hole: HoleScore;
  par: number;
  onUpdate: (field: string, value: unknown) => void;
}

const fairwayOptions = [
  { label: 'Hit', value: 'hit', icon: <span>&#10003;</span> },
  { label: 'Left', value: 'left', icon: <span>&larr;</span> },
  { label: 'Right', value: 'right', icon: <span>&rarr;</span> },
];

const girOptions = [
  { label: 'Hit', value: 'hit', icon: <span>&#10003;</span> },
  { label: 'Left', value: 'left', icon: <span>&larr;</span> },
  { label: 'Right', value: 'right', icon: <span>&rarr;</span> },
  { label: 'Short', value: 'short', icon: <span>&darr;</span> },
  { label: 'Long', value: 'long', icon: <span>&uarr;</span> },
];

const yesNoOptions = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

export function HoleInput({ hole, par: initialPar, onUpdate }: HoleInputProps) {
  const par = hole.par ?? initialPar;
  const score = hole.score ?? par;
  const scoreDiff = score - par;
  const colorClass = scoreColor(hole.score, par);
  const label = scoreLabel(hole.score, par);

  function formatDiff(diff: number): string {
    if (diff === 0) return 'E';
    return diff > 0 ? `+${diff}` : `${diff}`;
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Hole Header */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide">
          Hole {hole.hole_number}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-golf-gray-400">Par</span>
          {[3, 4, 5].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onUpdate('par', p)}
              className={[
                'w-11 h-11 rounded-xl font-bold text-lg transition-all cursor-pointer',
                par === p
                  ? 'bg-golf-green text-white border-b-3 border-golf-green-dark'
                  : 'bg-golf-gray-100 text-golf-gray-400 border-b-3 border-golf-gray-200 hover:bg-golf-gray-200',
              ].join(' ')}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Score Section */}
      <div className="flex flex-col items-center gap-3">
        <span className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide">
          Score
        </span>
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => onUpdate('score', Math.max(1, score - 1))}
            disabled={score <= 1}
            aria-label="Decrease score"
            className={[
              'w-16 h-16 rounded-full',
              'flex items-center justify-center',
              'text-3xl font-bold',
              'transition-all duration-100 select-none',
              'min-h-[48px] min-w-[48px]',
              score > 1
                ? 'bg-golf-gray-100 text-golf-gray-500 border-b-4 border-golf-gray-200 hover:bg-golf-gray-200 active:border-b-0 active:mt-1 cursor-pointer'
                : 'bg-golf-gray-50 text-golf-gray-200 cursor-not-allowed',
            ].join(' ')}
          >
            &minus;
          </button>

          <div className="flex flex-col items-center gap-1">
            <div
              className={[
                'w-20 h-20 rounded-2xl flex items-center justify-center',
                'text-4xl font-extrabold tabular-nums',
                'transition-colors duration-200',
                colorClass,
              ].join(' ')}
            >
              {score}
            </div>
            <div className="flex items-center gap-2">
              {label && (
                <span className="text-sm font-bold text-golf-gray-400">
                  {label}
                </span>
              )}
              <span className="text-sm font-bold text-golf-gray-300">
                ({formatDiff(scoreDiff)})
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onUpdate('score', Math.min(15, score + 1))}
            disabled={score >= 15}
            aria-label="Increase score"
            className={[
              'w-16 h-16 rounded-full',
              'flex items-center justify-center',
              'text-3xl font-bold',
              'transition-all duration-100 select-none',
              'min-h-[48px] min-w-[48px]',
              score < 15
                ? 'bg-golf-green text-white border-b-4 border-golf-green-dark hover:brightness-105 active:border-b-0 active:mt-1 cursor-pointer'
                : 'bg-golf-gray-50 text-golf-gray-200 cursor-not-allowed',
            ].join(' ')}
          >
            +
          </button>
        </div>
      </div>

      {/* Fairway (hidden for par 3) */}
      {par !== 3 && (
        <ToggleGroup
          label="Fairway"
          options={fairwayOptions}
          value={hole.fairway}
          onChange={(val) => onUpdate('fairway', val as FairwayResult)}
        />
      )}

      {/* Green in Regulation */}
      <ToggleGroup
        label="Green in Regulation"
        options={girOptions}
        value={hole.gir}
        onChange={(val) => onUpdate('gir', val as GIRResult)}
      />

      {/* Putts */}
      <Stepper
        label="Putts"
        value={hole.putts ?? 0}
        min={0}
        max={9}
        onChange={(val) => onUpdate('putts', val)}
      />

      {/* 1st Putt Distance (only when putts > 0) */}
      {(hole.putts ?? 0) > 0 && (
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide">
            1st Putt Distance (ft)
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={200}
            value={hole.first_putt_distance ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
              onUpdate('first_putt_distance', val);
            }}
            placeholder="Distance in feet"
            className={[
              'w-40 text-center text-2xl font-bold tabular-nums',
              'px-4 py-3 rounded-xl',
              'border-2 border-golf-gray-200 bg-white',
              'focus:border-golf-green focus:outline-none',
              'min-h-[48px]',
              'transition-colors duration-150',
            ].join(' ')}
          />
        </div>
      )}

      {/* Up and Down (only when GIR is NOT hit) */}
      {hole.gir !== null && hole.gir !== 'hit' && (
        <ToggleGroup
          label="Up and Down"
          options={yesNoOptions}
          value={hole.up_and_down === true ? 'yes' : hole.up_and_down === false ? 'no' : null}
          onChange={(val) => onUpdate('up_and_down', val === 'yes')}
        />
      )}

      {/* Penalty Strokes */}
      <Stepper
        label="Penalty Strokes"
        value={hole.penalty_strokes}
        min={0}
        max={9}
        onChange={(val) => onUpdate('penalty_strokes', val)}
      />

      {/* Chip In */}
      <ToggleGroup
        label="Chip In"
        options={yesNoOptions}
        value={hole.chip_in === true ? 'yes' : hole.chip_in === false ? 'no' : null}
        onChange={(val) => onUpdate('chip_in', val === 'yes')}
      />
    </div>
  );
}
