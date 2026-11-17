import React from 'react';

export const Pagination: React.FC<{ currentPage: number; totalPages: number; onPageChange: (page: number) => void; }> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  return (
    <nav className="flex justify-center mt-6">
      <div className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3.5 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
        >‹ Oldingi</button>
        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`min-w-[36px] h-9 text-sm font-semibold rounded-lg transition-all duration-150 ${
              currentPage === number
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm'
            }`}
          >{number}</button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3.5 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
        >Keyingi ›</button>
      </div>
    </nav>
  );
};
