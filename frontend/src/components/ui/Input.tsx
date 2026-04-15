import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

/**
 * Input Component
 *
 * Design System:
 * - 8px grid spacing (mb-6 = 24px below label)
 * - 1px borders with surface-300 color for subtle appearance
 * - 8px border-radius (rounded-lg) for modern look
 * - 2px focus ring with brand-500 for accessibility
 * - Error state: rose-500 border + rose-500 text
 * - Dark mode support via Tailwind dark: variants
 * - ARIA attributes for screen readers
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, name, error, icon, className = '', ...props }, ref) => {
    const inputId = name || props.id;

    return (
      <div className="mb-6">
        <label
          htmlFor={inputId}
          className="text-label mb-2 block"
        >
          {label}
        </label>
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-surface-400 dark:text-surface-500">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            name={name}
            ref={ref}
            className={`
              block w-full rounded-lg border bg-white dark:bg-surface-800
              px-4 py-2.5 text-sm text-surface-900 dark:text-surface-50
              placeholder:text-surface-400 dark:placeholder:text-surface-500
              transition-smooth
              focus-ring
              ${icon ? 'pl-10' : ''}
              ${
                error
                  ? 'border-rose-500 dark:border-rose-500 focus:ring-rose-500/20 dark:focus:ring-rose-500/20'
                  : 'border-surface-300 dark:border-surface-700 hover:border-surface-400 dark:hover:border-surface-600 focus:border-brand-500 dark:focus:border-brand-500 focus:ring-brand-500/20 dark:focus:ring-brand-500/20'
              }
              disabled:bg-surface-100 dark:disabled:bg-surface-900 disabled:text-surface-400 dark:disabled:text-surface-600 disabled:cursor-not-allowed
              ${className}
            `}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400"
            role="alert"
          >
            <svg
              className="h-4 w-4 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
