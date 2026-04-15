import React from 'react';

interface CardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  color?: 'brand' | 'emerald' | 'amber' | 'rose' | 'violet';
}

/**
 * Color variants with 4px left border, icon background, and dark mode support
 * - brand: primary blue palette
 * - emerald: success/positive palette
 * - amber: warning/caution palette
 * - rose: danger/critical palette
 * - violet: secondary/accent palette
 */
const colorMap: Record<string, { border: string; bg: string; icon: string; text: string; darkBg: string; darkIcon: string; trendPositive: string; trendNegative: string }> = {
  brand: {
    border: 'border-l-brand-500',
    bg: 'bg-brand-50',
    darkBg: 'dark:bg-brand-900/20',
    icon: 'text-brand-600',
    darkIcon: 'dark:text-brand-400',
    text: 'text-brand-600',
    trendPositive: 'text-emerald-600 dark:text-emerald-400',
    trendNegative: 'text-rose-600 dark:text-rose-400',
  },
  emerald: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50',
    darkBg: 'dark:bg-emerald-900/20',
    icon: 'text-emerald-600',
    darkIcon: 'dark:text-emerald-400',
    text: 'text-emerald-600',
    trendPositive: 'text-emerald-600 dark:text-emerald-400',
    trendNegative: 'text-rose-600 dark:text-rose-400',
  },
  amber: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50',
    darkBg: 'dark:bg-amber-900/20',
    icon: 'text-amber-600',
    darkIcon: 'dark:text-amber-400',
    text: 'text-amber-600',
    trendPositive: 'text-emerald-600 dark:text-emerald-400',
    trendNegative: 'text-rose-600 dark:text-rose-400',
  },
  rose: {
    border: 'border-l-rose-500',
    bg: 'bg-rose-50',
    darkBg: 'dark:bg-rose-900/20',
    icon: 'text-rose-600',
    darkIcon: 'dark:text-rose-400',
    text: 'text-rose-600',
    trendPositive: 'text-emerald-600 dark:text-emerald-400',
    trendNegative: 'text-rose-600 dark:text-rose-400',
  },
  violet: {
    border: 'border-l-violet-500',
    bg: 'bg-violet-50',
    darkBg: 'dark:bg-violet-900/20',
    icon: 'text-violet-600',
    darkIcon: 'dark:text-violet-400',
    text: 'text-violet-600',
    trendPositive: 'text-emerald-600 dark:text-emerald-400',
    trendNegative: 'text-rose-600 dark:text-rose-400',
  },
};

const Card = ({ title, value, subtitle, icon, trend, color = 'brand' }: CardProps) => {
  const colors = colorMap[color];

  return (
    <div className={`stat-card group border-l-4 ${colors.border} ${colors.bg} ${colors.darkBg}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-label text-surface-600 dark:text-surface-400 mb-2">{title}</p>
          <p className="text-3xl font-bold text-surface-900 dark:text-surface-50 tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-caption text-surface-500 dark:text-surface-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-xs font-semibold ${
                  trend.positive ? colors.trendPositive : colors.trendNegative
                }`}
              >
                {trend.positive ? '↑' : '↓'} {trend.value}
              </span>
            </div>
          )}
        </div>
        <div
          className={`p-3 rounded-xl ${colors.bg} ${colors.darkBg} ${colors.icon} ${colors.darkIcon} transition-transform duration-300 group-hover:scale-110 flex-shrink-0`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default Card;
