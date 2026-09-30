import React from 'react';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  highlight = false,
}) {
  const colorStyles = {
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      bgGlow: 'from-blue-600/10 to-transparent',
      iconBg: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
      valueColor: 'text-white',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      bgGlow: 'from-emerald-600/10 to-transparent',
      iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      valueColor: 'text-white',
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      bgGlow: 'from-rose-600/10 to-transparent',
      iconBg: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
      valueColor: 'text-white',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      bgGlow: 'from-amber-600/10 to-transparent',
      iconBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      valueColor: 'text-white',
    },
  }[color] || {
    border: 'border-white/10 hover:border-white/20',
    bgGlow: 'from-white/5 to-transparent',
    iconBg: 'bg-white/10 text-white border border-white/20',
    valueColor: 'text-white',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#0D192A]/90 p-5 md:p-6 transition-all duration-300 border ${
        colorStyles.border
      } ${highlight ? 'ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/10' : ''}`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${colorStyles.bgGlow} rounded-bl-full pointer-events-none`} />

      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorStyles.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${colorStyles.valueColor}`}>
          {value}
        </span>
        {trend && (
          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            {trend}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}
