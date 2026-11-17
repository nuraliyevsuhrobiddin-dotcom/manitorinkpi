import React from 'react';

export const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'cyan' }> = ({ title, value, icon: Icon, color = 'indigo' }) => {
  const colorMap: Record<string, { bg: string; icon: string; ring: string; glow: string }> = {
    indigo: { bg: 'from-indigo-500 to-violet-600', icon: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400', ring: 'ring-indigo-500/20', glow: 'shadow-indigo-500/10' },
    emerald: { bg: 'from-emerald-500 to-teal-600', icon: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400', ring: 'ring-emerald-500/20', glow: 'shadow-emerald-500/10' },
    amber: { bg: 'from-amber-500 to-orange-500', icon: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400', ring: 'ring-amber-500/20', glow: 'shadow-amber-500/10' },
    rose: { bg: 'from-rose-500 to-pink-600', icon: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400', ring: 'ring-rose-500/20', glow: 'shadow-rose-500/10' },
    violet: { bg: 'from-violet-500 to-purple-600', icon: 'text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400', ring: 'ring-violet-500/20', glow: 'shadow-violet-500/10' },
    cyan: { bg: 'from-cyan-500 to-blue-600', icon: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30 dark:text-cyan-400', ring: 'ring-cyan-500/20', glow: 'shadow-cyan-500/10' },
  };
  const c = colorMap[color];
  return (
    <div className={`group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-md ${c.glow} hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 p-5 flex items-center gap-4 ring-1 ${c.ring}`}>
      <div className={`p-3.5 rounded-xl ${c.icon} shadow-sm flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">{title}</p>
        <p className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none tracking-tight">{value}</p>
      </div>
    </div>
  );
};
