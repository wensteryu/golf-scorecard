'use client';

interface ProgressBarProps {
  currentHole: number;
  totalHoles?: number;
  className?: string;
}

export function ProgressBar({
  currentHole,
  totalHoles = 18,
  className = '',
}: ProgressBarProps) {
  const frontNine = Math.min(totalHoles, 9);
  const backNine = Math.max(0, totalHoles - 9);

  return (
    <div className={['w-full', className].join(' ')}>
      {/* Front 9 */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-golf-gray-400 uppercase tracking-wide">
            Front 9
          </span>
          <span className="text-xs font-semibold text-golf-gray-300">
            {Math.min(currentHole, frontNine)}/{frontNine}
          </span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: frontNine }, (_, i) => {
            const holeNumber = i + 1;
            const isFilled = holeNumber <= currentHole;
            const isCurrent = holeNumber === currentHole;
            return (
              <div
                key={holeNumber}
                className={[
                  'flex-1 h-3 rounded-full transition-all duration-300',
                  isCurrent
                    ? 'bg-golf-green scale-y-125 shadow-sm'
                    : isFilled
                      ? 'bg-golf-green'
                      : 'bg-golf-gray-200',
                ].join(' ')}
                title={`Hole ${holeNumber}`}
                aria-label={`Hole ${holeNumber}${isCurrent ? ' (current)' : isFilled ? ' (complete)' : ''}`}
              />
            );
          })}
        </div>
      </div>

      {/* Back 9 */}
      {backNine > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-golf-gray-400 uppercase tracking-wide">
              Back 9
            </span>
            <span className="text-xs font-semibold text-golf-gray-300">
              {Math.max(0, Math.min(currentHole - 9, backNine))}/{backNine}
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: backNine }, (_, i) => {
              const holeNumber = i + 10;
              const isFilled = holeNumber <= currentHole;
              const isCurrent = holeNumber === currentHole;
              return (
                <div
                  key={holeNumber}
                  className={[
                    'flex-1 h-3 rounded-full transition-all duration-300',
                    isCurrent
                      ? 'bg-golf-green scale-y-125 shadow-sm'
                      : isFilled
                        ? 'bg-golf-green'
                        : 'bg-golf-gray-200',
                  ].join(' ')}
                  title={`Hole ${holeNumber}`}
                  aria-label={`Hole ${holeNumber}${isCurrent ? ' (current)' : isFilled ? ' (complete)' : ''}`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
