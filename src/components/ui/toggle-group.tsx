'use client';

import { type ReactNode } from 'react';

interface ToggleOption {
  label: string;
  value: string;
  icon?: ReactNode;
}

interface ToggleGroupProps {
  options: ToggleOption[];
  value: string | null;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function ToggleGroup({
  options,
  value,
  onChange,
  label,
  className = '',
}: ToggleGroupProps) {
  return (
    <div className={['flex flex-col gap-2', className].join(' ')}>
      {label && (
        <span className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide">
          {label}
        </span>
      )}
      <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option.value)}
              className={[
                'inline-flex items-center justify-center gap-2',
                'rounded-full px-5 py-2.5',
                'text-sm font-bold',
                'min-h-[44px]',
                'transition-all duration-150 select-none cursor-pointer',
                isSelected
                  ? 'bg-golf-green text-white border-2 border-golf-green-dark shadow-sm'
                  : 'bg-white text-golf-gray-400 border-2 border-golf-gray-200 hover:border-golf-gray-300 hover:text-golf-gray-500',
              ].join(' ')}
            >
              {option.icon && <span className="text-lg">{option.icon}</span>}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
