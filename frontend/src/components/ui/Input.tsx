import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, name, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="mb-4">
        <label
          htmlFor={name}
          className="block text-sm font-medium text-surface-600 mb-1.5"
        >
          {label}
        </label>
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
              {icon}
            </div>
          )}
          <input
            id={name}
            name={name}
            ref={ref}
            className={`
              block w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-surface-800
              placeholder:text-surface-400
              transition-all duration-200
              focus-ring
              ${icon ? 'pl-10' : ''}
              ${
                error
                  ? 'border-red-400 focus:ring-red-500/40'
                  : 'border-surface-200 hover:border-surface-300 focus:border-brand-500'
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
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
