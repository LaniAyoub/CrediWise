import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

const Badge = ({ children, variant = 'neutral', size = 'sm' }: BadgeProps) => {
  /**
   * Semantic color variants with dark mode support
   * - success: emerald palette for positive/completed states
   * - warning: amber palette for caution/pending states
   * - danger: rose palette for error/critical states
   * - info: brand palette for informational states
   * - neutral: surface palette for default states
   */
  const variantClasses: Record<string, string> = {
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    danger: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    info: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300',
    neutral: 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300',
  };

  const sizeClasses: Record<string, string> = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-500 rounded-md transition-smooth ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  );
};

export default Badge;
