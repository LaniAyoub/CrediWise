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
   */
  const variantClasses: Record<string, string> = {
    success: 'bg-[#dcfce7] text-[#166534] dark:bg-[#14532d] dark:text-[#bbf7d0]',
    warning: 'bg-[#fef9c3] text-[#854d0e] dark:bg-[#422006] dark:text-[#fde68a]',
    danger: 'bg-[#fee2e2] text-[#991b1b] dark:bg-[#450a0a] dark:text-[#fca5a5]',
    info: 'bg-[#dbeafe] text-[#1e40af] dark:bg-[#1e3a5f] dark:text-[#bfdbfe]',
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
