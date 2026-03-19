'use client';

import { type ReactNode } from 'react';

interface ToggleOption {
  label: string;
  value: string;
  icon?: ReactNode;
}

interface SingleToggleGroupProps {
  options: ToggleOption[];
  value: string | null;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  multiple?: false;
}

interface MultiToggleGroupProps {
  options: ToggleOption[];
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  className?: string;
  multiple: true;
  max?: number;
}

type ToggleGroupProps = SingleToggleGroupProps | MultiToggleGroupProps;

export function ToggleGroup(props: ToggleGroupProps) {
  const { options, label, className = '' } = props;

  function handleClick(optionValue: string) {
    if (props.multiple) {
      const current = props.value;
      if (current.includes(optionValue)) {
        props.onChange(current.filter((v) => v !== optionValue));
      } else {
        if (props.max && current.length >= props.max) return;
        props.onChange([...current, optionValue]);
      }
    } else {
      props.onChange(optionValue);
    }
  }

  function isSelected(optionValue: string) {
    if (props.multiple) {
      return props.value.includes(optionValue);
    }
    return optionValue === props.value;
  }

  return (
    <div className={['flex flex-col gap-2', className].join(' ')}>
      {label && (
        <span className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide">
          {label}
        </span>
      )}
      <div
        className="flex gap-2 flex-wrap"
        role={props.multiple ? 'group' : 'radiogroup'}
        aria-label={label}
      >
        {options.map((option) => {
          const selected = isSelected(option.value);
          return (
            <button
              key={option.value}
              type="button"
              role={props.multiple ? 'checkbox' : 'radio'}
              aria-checked={selected}
              onClick={() => handleClick(option.value)}
              className={[
                'inline-flex items-center justify-center gap-2',
                'rounded-full px-5 py-2.5',
                'text-sm font-bold',
                'min-h-[44px]',
                'transition-all duration-150 select-none cursor-pointer',
                selected
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
