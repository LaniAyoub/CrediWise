import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

/**
 * Button Component
 *
 * Design System:
 * - 8px grid-based sizing (sm: 32px, md: 40px, lg: 44px heights)
 * - 150ms transitions for snappy, responsive feel
 * - Focus rings with 2px width for WCAG AA accessibility
 * - Semantic color variants with proper contrast ratios (≥4.5:1)
 * - Shadow elevation on hover for depth feedback
 * - Dark mode support via Tailwind's dark: variants
 */
const Button = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  disabled,
  ...props
}: ButtonProps) => {
  // Base: 8px grid sizing, smooth transitions, focus rings
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-smooth disabled:opacity-50 disabled:cursor-not-allowed focus-ring';

  // Semantic color variants with WCAG AA contrast (4.5:1 minimum)
  const variantClasses: Record<string, string> = {
    primary:
      'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm hover:shadow-md dark:bg-brand-600 dark:hover:bg-brand-700',
    secondary:
      'bg-surface-100 text-surface-700 hover:bg-surface-200 active:bg-surface-300 border border-surface-200 dark:bg-surface-800 dark:text-surface-200 dark:border-surface-700 dark:hover:bg-surface-700',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm hover:shadow-md dark:bg-rose-600 dark:hover:bg-rose-700',
    ghost:
      'text-surface-600 hover:bg-surface-100 active:bg-surface-200 dark:text-surface-400 dark:hover:bg-surface-800 dark:active:bg-surface-700',
    outline:
      'border border-surface-300 text-surface-700 hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50 active:bg-brand-100 dark:border-surface-700 dark:text-surface-300 dark:hover:border-brand-500 dark:hover:bg-brand-900/20',
  };

  // 8px grid-based sizing
  const sizeClasses: Record<string, string> = {
    sm: 'text-xs px-3 py-1.5 h-8',      // 32px height
    md: 'text-sm px-4 py-2 h-10',       // 40px height (standard)
    lg: 'text-base px-6 py-2.5 h-11',   // 44px height (touch-friendly)
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : icon ? (
        <span className="w-4 h-4 flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
};

export default Button;
