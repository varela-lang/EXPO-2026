import React from 'react';
import { DollarSign, Heart, X, Sparkles } from 'lucide-react';

export function RealtimeNotification({ notification, onClose }) {
  if (!notification) return null;

  const isInvestment = notification.type === 'investment';

  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-300 max-w-sm w-full">
      <div
        className={`relative overflow-hidden rounded-2xl p-4 shadow-2xl backdrop-blur-xl border ${
          isInvestment
            ? 'bg-[#0D192A]/95 border-emerald-500/40 shadow-emerald-950/40 text-white'
            : 'bg-[#0D192A]/95 border-rose-500/40 shadow-rose-950/40 text-white'
        }`}
      >
        {/* Glow accent */}
        <div
          className={`absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-40 ${
            isInvestment ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        />

        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
              isInvestment
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
            }`}
          >
            {isInvestment ? (
              <DollarSign className="w-6 h-6 stroke-[2.5]" />
            ) : (
              <Heart className="w-6 h-6 fill-rose-500 text-rose-400" />
            )}
          </div>

          <div className="flex-1 pr-6">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              <span
                className={`text-[10px] font-extrabold uppercase tracking-widest ${
                  isInvestment ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {notification.title}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold font-mono tracking-tight text-white">
                {isInvestment ? `+$${Number(notification.amount).toLocaleString()}` : '+1 Token'}
              </span>
            </div>

            <p className="text-xs font-semibold text-slate-300 mt-0.5 truncate">
              {notification.projectName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
