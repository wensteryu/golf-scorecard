'use client';

import { HoleScore, FairwayResult, GIRResult, FirstPuttResult } from '@/lib/types';
import { scoreColor, scoreLabel } from '@/lib/calculations';
import { Stepper } from '@/components/ui/stepper';
import { ToggleGroup } from '@/components/ui/toggle-group';

interface HoleInputProps {
  hole: HoleScore;
  par: number;
  onUpdate: (field: string, value: unknown) => void;
  saveStatus?: 'saved' | 'saving' | 'idle';
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
  { label: 'Over', value: 'over', icon: <span>&uarr;</span> },
  { label: 'Pin High', value: 'pin_high', icon: <span>&#9679;</span> },
];

const firstPuttResultOptions = [
  { label: 'Made', value: 'made', icon: <span>&#10003;</span> },
  { label: 'Short', value: 'short' },
  { label: 'Over', value: 'over' },
  { label: 'High Side', value: 'high_side' },
  { label: 'Low Side', value: 'low_side' },
];

const yesNoOptions = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

const clubOptions = [
  { value: '', label: 'Select club...' },
  { value: 'LW', label: 'LW' },
  { value: 'SW', label: 'SW' },
  { value: 'GW', label: 'GW' },
  { value: 'PW', label: 'PW' },
  { value: '9i', label: '9i' },
  { value: '8i', label: '8i' },
  { value: '7i', label: '7i' },
  { value: '6i', label: '6i' },
  { value: '5i', label: '5i' },
  { value: '4i', label: '4i' },
  { value: '3i', label: '3i' },
  { value: '5w', label: '5w' },
  { value: '3w', label: '3w' },
  { value: 'D', label: 'Driver' },
];

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="flex-1 h-px bg-golf-gray-200" />
      <span className="text-xs font-bold text-golf-gray-300 uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-golf-gray-200" />
    </div>
  );
}

export function HoleInput({ hole, par: initialPar, onUpdate, saveStatus = 'idle' }: HoleInputProps) {
  const par = hole.par ?? initialPar;
  const score = hole.score ?? par;
  const scoreDiff = score - par;
  const colorClass = scoreColor(hole.score, par);
  const label = scoreLabel(hole.score, par);

  function formatDiff(diff: number): string {
    if (diff === 0) return 'E';
    return diff > 0 ? `+${diff}` : `${diff}`;
  }

  const showFairwayMissDistance = hole.fairway === 'left' || hole.fairway === 'right';
  const showFirstPuttResult = (hole.putts ?? 0) > 0;

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Save indicator */}
      <div className="flex justify-center h-6">
        {saveStatus === 'saved' && (
          <span className="inline-flex items-center gap-1 bg-golf-green/10 text-golf-green text-xs font-bold px-3 py-1 rounded-full animate-[fadeInOut_1.5s_ease-in-out]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z" clipRule="evenodd" />
            </svg>
            Saved
          </span>
        )}
        {saveStatus === 'saving' && (
          <span className="inline-flex items-center gap-1 bg-golf-gray-100 text-golf-gray-400 text-xs font-bold px-3 py-1 rounded-full">
            Saving...
          </span>
        )}
      </div>

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

      {/* ─── OFF THE TEE ─── (hidden on par 3) */}
      {par !== 3 && (
        <>
          <SectionDivider label="Off the Tee" />

          <ToggleGroup
            label="Fairway"
            options={fairwayOptions}
            value={hole.fairway}
            onChange={(val) => {
              onUpdate('fairway', val as FairwayResult);
              if (val === 'hit') {
                onUpdate('fairway_miss_distance', null);
              }
            }}
          />

          {showFairwayMissDistance && (
            <Stepper
              label="How Far Off? (Yards)"
              value={hole.fairway_miss_distance ?? 5}
              min={5}
              max={100}
              step={5}
              onChange={(val) => onUpdate('fairway_miss_distance', val)}
            />
          )}
        </>
      )}

      {/* ─── APPROACH SHOT ─── */}
      <SectionDivider label="Approach Shot" />

      <div className="flex flex-col items-center gap-2">
        <span className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide">
          Club Used
        </span>
        <select
          value={hole.club_used ?? ''}
          onChange={(e) => {
            const val = e.target.value === '' ? null : e.target.value;
            onUpdate('club_used', val);
          }}
          className={[
            'w-40 text-center text-lg font-bold',
            'px-4 py-3 rounded-xl',
            'border-2 border-golf-gray-200 bg-white',
            'focus:border-golf-green focus:outline-none',
            'min-h-[48px]',
            'transition-colors duration-150',
            'appearance-none cursor-pointer',
          ].join(' ')}
        >
          {clubOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col items-center gap-2">
        <span className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide">
          Distance to Pin (Yds)
        </span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={600}
          value={hole.approach_distance ?? ''}
          onChange={(e) => {
            const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
            onUpdate('approach_distance', val);
          }}
          placeholder="Yards"
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

      {/* Green in Regulation */}
      <ToggleGroup
        label="Green in Regulation"
        options={girOptions}
        value={hole.gir}
        onChange={(val) => onUpdate('gir', val as GIRResult)}
      />

      {/* ─── ON THE GREEN ─── */}
      <SectionDivider label="On the Green" />

      {/* Putts */}
      <Stepper
        label="Putts"
        value={hole.putts ?? 0}
        min={0}
        max={9}
        onChange={(val) => {
          onUpdate('putts', val);
          if (val === 0) {
            onUpdate('first_putt_result', null);
          } else if (val === 1 && hole.first_putt_result === null) {
            onUpdate('first_putt_result', 'made');
          }
        }}
      />

      {/* 1st Putt Distance (only when putts > 0) */}
      {showFirstPuttResult && (
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

      {/* 1st Putt Result (only when putts > 0) */}
      {showFirstPuttResult && (
        <ToggleGroup
          label="1st Putt Result"
          options={firstPuttResultOptions}
          value={hole.first_putt_result}
          onChange={(val) => onUpdate('first_putt_result', val as FirstPuttResult)}
        />
      )}

      {/* ─── OTHER ─── */}
      <SectionDivider label="Other" />

      {/* Up and Down (only when GIR is NOT hit) */}
      {hole.gir !== null && hole.gir !== 'hit' && (
        <ToggleGroup
          label="Up and Down"
          options={yesNoOptions}
          value={hole.up_and_down === true ? 'yes' : hole.up_and_down === false ? 'no' : null}
          onChange={(val) => onUpdate('up_and_down', val === 'yes')}
        />
      )}

      {/* Chip In */}
      {hole.gir !== null && hole.gir !== 'hit' && (
        <ToggleGroup
          label="Chip In"
          options={yesNoOptions}
          value={hole.chip_in === true ? 'yes' : hole.chip_in === false ? 'no' : null}
          onChange={(val) => onUpdate('chip_in', val === 'yes')}
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
    </div>
  );
}
