import React from 'react';
import { Calendar, LogIn, LogOut, Menu } from 'lucide-react';

type HeaderProps = {
  availableReportYears: number[];
  onLoginClick: () => void;
  onLogout: () => void;
  onMenuClick: () => void;
  onYearChange: (year: number) => void;
  selectedYear: number;
  user: { role?: string; username?: string } | null;
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
  const isAdmin = user?.role === 'superadmin';

  return (
    <header className="h-20 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center space-x-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex items-center justify-center h-10 w-10 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors"
          aria-label="Menyuni ochish"
        >
          <Menu size={22} />
        </button>
      </div>

      <div className="flex items-center space-x-3 md:space-x-4 pl-4">
        <div className="flex items-center space-x-2">
          <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
          <label htmlFor="report-year-select" className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-200">
            Hisobot yili:
          </label>
          <select
            id="report-year-select"
            value={selectedYear}
            onChange={event => onYearChange(Number(event.target.value))}
            className="text-sm font-medium text-gray-700 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 bg-white dark:bg-gray-900 focus:border-blue-500 focus:ring-blue-500"
          >
            {availableReportYears.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {isAdmin ? (
          <div className="flex items-center space-x-3 border-l border-gray-200 dark:border-gray-800 pl-3 md:pl-4">
            <span className="hidden sm:inline font-medium text-sm text-gray-700 dark:text-gray-200">{user.username}</span>
            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
              title="Chiqish"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="border-l border-gray-200 dark:border-gray-800 pl-3 md:pl-4">
            <button
              type="button"
              onClick={onLoginClick}
              className="inline-flex items-center px-3 md:px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <LogIn size={16} className="mr-2" /> Kirish
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
