import React from 'react';
import { Calendar, LogIn, LogOut, Menu, Shield, User as UserIcon, Sparkles } from 'lucide-react';

type HeaderProps = {
  availableReportYears: number[];
  onLoginClick: () => void;
  onLogout: () => void;
  onMenuClick: () => void;
  onYearChange: (year: number) => void;
  selectedYear: number;
  user: { role?: string; username?: string; fullName?: string; departmentName?: string } | null;
};

export const Header: React.FC<HeaderProps> = ({
  availableReportYears,
  onLoginClick,
  onLogout,
  onMenuClick,
  onYearChange,
  selectedYear,
  user,
}) => {
  const isSuperAdmin = user?.role === 'superadmin';
  const isDeptAdmin = user?.role === 'admin';
  const isLoggedIn = isSuperAdmin || isDeptAdmin;

  return (
    <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 transition-all">
      <div className="flex items-center space-x-4 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors shadow-sm"
          aria-label="Menyuni ochish"
        >
          <Menu size={20} />
        </button>

        <div className="hidden lg:flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Sparkles size={14} className="text-indigo-500" />
          <span>O'zbekiston KPI Reyting & Samaradorlik Portali</span>
        </div>
      </div>

      <div className="flex items-center space-x-3 md:space-x-5">
        {/* Report Year Selector */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-inner">
          <div className="flex items-center space-x-1.5 px-2.5 text-xs font-bold text-slate-600 dark:text-slate-300">
            <Calendar size={15} className="text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Hisobot Yili:</span>
          </div>
          <select
            id="report-year-select"
            value={selectedYear}
            onChange={event => onYearChange(Number(event.target.value))}
            className="text-xs font-bold text-slate-900 dark:text-white border-0 rounded-lg px-3 py-1 bg-white dark:bg-slate-900 shadow-sm focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {availableReportYears.map(year => (
              <option key={year} value={year}>
                {year}-yil
              </option>
            ))}
          </select>
        </div>

        {/* User Account / Auth Section */}
        {isLoggedIn ? (
          <div className="flex items-center space-x-3 border-l border-slate-200 dark:border-slate-800 pl-4">
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="font-bold text-xs md:text-sm text-slate-900 dark:text-slate-100">
                  {user.fullName || user.username}
                </span>
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center justify-end gap-1">
                  {isSuperAdmin ? (
                    <>👑 Super Admin</>
                  ) : (
                    <>🏢 {user.departmentName || "Bo'lim Admini"}</>
                  )}
                </span>
              </div>

              <div className={`p-2 rounded-xl text-white shadow-md ${
                isSuperAdmin
                  ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-500/20'
                  : 'bg-gradient-to-tr from-blue-600 to-cyan-600 shadow-blue-500/20'
              }`}>
                {isSuperAdmin ? <Shield size={18} /> : <UserIcon size={18} />}
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
              title="Chiqish"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
            <button
              type="button"
              onClick={onLoginClick}
              className="inline-flex items-center px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogIn size={16} className="mr-2" /> Kirish / Ro'yxatdan o'tish
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
