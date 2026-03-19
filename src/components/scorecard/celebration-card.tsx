'use client';

import { Button } from '@/components/ui/button';

interface CelebrationCardProps {
  front9Score: number;
  front9Par: number;
  onContinue: () => void;
}

function ConfettiPiece({ index }: { index: number }) {
  const colors = [
    'bg-golf-green',
    'bg-golf-blue',
    'bg-golf-orange',
    'bg-golf-red',
    'bg-golf-purple',
    'bg-yellow-400',
  ];
  const color = colors[index % colors.length];
  const left = `${(index * 17 + 7) % 100}%`;
  const delay = `${(index * 0.3) % 2}s`;
  const size = index % 2 === 0 ? 'w-2 h-2' : 'w-3 h-1.5';

  return (
    <div
      className={[
        'absolute top-0 rounded-sm animate-confetti',
        color,
        size,
      ].join(' ')}
      style={{
        left,
        animationDelay: delay,
      }}
    />
  );
}

function formatScoreToPar(diff: number): string {
  if (diff === 0) return 'Even par';
  if (diff > 0) return `+${diff} over par`;
  return `${Math.abs(diff)} under par`;
}

export function CelebrationCard({
  front9Score,
  front9Par,
  onContinue,
}: CelebrationCardProps) {
  const diff = front9Score - front9Par;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface shadow-lg border border-golf-gray-100">
      {/* Confetti overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 12 }, (_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}
      </div>

      <div className="relative flex flex-col items-center gap-6 px-8 py-10 text-center">
        {/* Trophy */}
        <div className="text-6xl animate-celebrate">
          🏆
        </div>

        {/* Title */}
        <div>
          <h2 className="text-2xl font-extrabold text-golf-gray-500">
            Front 9 Complete!
          </h2>
          <p className="mt-2 text-golf-gray-400 font-semibold">
            Great work out there!
          </p>
        </div>

        {/* Score summary */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center px-6 py-3 bg-golf-gray-50 rounded-xl">
            <span className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide">
              Score
            </span>
            <span className="text-3xl font-extrabold text-golf-gray-500 tabular-nums">
              {front9Score}
            </span>
          </div>
          <div className="flex flex-col items-center px-6 py-3 bg-golf-gray-50 rounded-xl">
            <span className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide">
              Par
            </span>
            <span className="text-3xl font-extrabold text-golf-gray-500 tabular-nums">
              {front9Par}
            </span>
          </div>
        </div>

        <div className={[
          'text-lg font-bold px-4 py-1.5 rounded-full',
          diff < 0 ? 'bg-emerald-100 text-emerald-700' :
          diff === 0 ? 'bg-golf-gray-100 text-golf-gray-500' :
          'bg-amber-100 text-amber-700',
        ].join(' ')}>
          {formatScoreToPar(diff)}
        </div>

        {/* Continue button */}
        <Button
          variant="primary"
          size="lg"
          onClick={onContinue}
          className="w-full mt-2"
        >
          Continue to Back 9 &rarr;
        </Button>
      </div>
    </div>
  );
}
