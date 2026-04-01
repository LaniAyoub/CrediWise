import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

const Badge = ({ children, variant = 'neutral', size = 'sm' }: BadgeProps) => {
  const variantClasses: Record<string, string> = {
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    danger:  'bg-rose-50 text-rose-700 ring-rose-600/20',
    info:    'bg-brand-50 text-brand-700 ring-brand-600/20',
    neutral: 'bg-surface-100 text-surface-600 ring-surface-500/20',
  };

  const sizeClasses: Record<string, string> = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ring-1 ring-inset ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  );
};

export default Badge;
