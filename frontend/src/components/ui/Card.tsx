import React from 'react';

interface CardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  color?: 'brand' | 'emerald' | 'amber' | 'rose' | 'violet';
}

const colorMap: Record<string, { bg: string; icon: string; text: string }> = {
  brand:   { bg: 'bg-brand-50',  icon: 'text-brand-600',  text: 'text-brand-600' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', text: 'text-emerald-600' },
  amber:   { bg: 'bg-amber-50',  icon: 'text-amber-600',  text: 'text-amber-600' },
  rose:    { bg: 'bg-rose-50',   icon: 'text-rose-600',   text: 'text-rose-600' },
  violet:  { bg: 'bg-violet-50', icon: 'text-violet-600', text: 'text-violet-600' },
};

const Card = ({ title, value, subtitle, icon, trend, color = 'brand' }: CardProps) => {
  const colors = colorMap[color];

  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-surface-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-surface-900 tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-surface-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-xs font-semibold ${
                  trend.positive ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {trend.positive ? '↑' : '↓'} {trend.value}
              </span>
            </div>
          )}
        </div>
        <div
          className={`p-3 rounded-xl ${colors.bg} ${colors.icon} transition-transform duration-300 group-hover:scale-110`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default Card;
