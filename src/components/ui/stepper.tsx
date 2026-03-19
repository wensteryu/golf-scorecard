'use client';

interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  className?: string;
}

export function Stepper({
  value,
  min = 1,
  max = 20,
  step = 1,
  onChange,
  label,
  className = '',
}: StepperProps) {
  const canDecrement = value > min;
  const canIncrement = value < max;

  return (
    <div className={['flex flex-col items-center gap-2', className].join(' ')}>
      {label && (
        <span className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide">
          {label}
        </span>
      )}
      <div className="flex items-center gap-5">
        {/* Decrement button */}
        <button
          type="button"
          onClick={() => canDecrement && onChange(value - step)}
          disabled={!canDecrement}
          aria-label="Decrease"
          className={[
            'w-14 h-14 rounded-full',
            'flex items-center justify-center',
            'text-2xl font-bold',
            'transition-all duration-100 select-none',
            'min-h-[48px] min-w-[48px]',
            canDecrement
              ? 'bg-golf-gray-100 text-golf-gray-500 border-b-4 border-golf-gray-200 hover:bg-golf-gray-200 active:border-b-0 active:mt-1 cursor-pointer'
              : 'bg-golf-gray-50 text-golf-gray-200 cursor-not-allowed',
          ].join(' ')}
        >
          &minus;
        </button>

        {/* Value display */}
        <span
          className="text-5xl font-extrabold text-golf-gray-500 tabular-nums min-w-[3ch] text-center select-none"
          aria-live="polite"
        >
          {value}
        </span>

        {/* Increment button */}
        <button
          type="button"
          onClick={() => canIncrement && onChange(value + step)}
          disabled={!canIncrement}
          aria-label="Increase"
          className={[
            'w-14 h-14 rounded-full',
            'flex items-center justify-center',
            'text-2xl font-bold',
            'transition-all duration-100 select-none',
            'min-h-[48px] min-w-[48px]',
            canIncrement
              ? 'bg-golf-green text-white border-b-4 border-golf-green-dark hover:brightness-105 active:border-b-0 active:mt-1 cursor-pointer'
              : 'bg-golf-gray-50 text-golf-gray-200 cursor-not-allowed',
          ].join(' ')}
        >
          +
        </button>
      </div>
    </div>
  );
}
