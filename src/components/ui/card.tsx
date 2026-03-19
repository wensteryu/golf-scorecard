import { type ReactNode, type HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={[
        'bg-surface rounded-2xl shadow-sm',
        'border border-golf-gray-100',
        'overflow-hidden',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }: CardSectionProps) {
  return (
    <div
      className={[
        'px-5 py-4',
        'border-b border-golf-gray-100',
        'font-bold text-golf-gray-500',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({ children, className = '', ...props }: CardSectionProps) {
  return (
    <div
      className={['px-5 py-4', className].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }: CardSectionProps) {
  return (
    <div
      className={[
        'px-5 py-4',
        'border-t border-golf-gray-100',
        'bg-golf-gray-50',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
