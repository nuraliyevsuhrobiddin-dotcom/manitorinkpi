import React from 'react';
import { Filter, X, Award, GraduationCap, Users, Calendar, Briefcase, Check } from 'lucide-react';
import type { Filters } from '../types/kpi';

type FilterControlsProps = {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  positions: string[];
};

export const ProfessorFilterControls: React.FC<FilterControlsProps> = ({
  filters,
  onFilterChange,
  positions = [],
}) => {
  const currentFilters = {
    gender: filters?.gender || [],
    degree: filters?.degree || [],
    title: filters?.title || [],
    ageRange: filters?.ageRange || [],
    position: filters?.position || [],
  };

  const handleToggle = (category: keyof Filters, value: string) => {
    const current = currentFilters[category] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onFilterChange({ ...currentFilters, [category]: updated });
  };

  const handleReset = () => {
    onFilterChange({
      gender: [],
      degree: [],
      title: [],
      ageRange: [],
      position: [],
    });
  };

  const totalActiveFilters =
    currentFilters.gender.length +
    currentFilters.degree.length +
    currentFilters.title.length +
    currentFilters.ageRange.length +
    currentFilters.position.length;

  const degreeOptions = [
    { value: 'DSc', label: 'DSc (Fan doktori)' },
    { value: 'PhD', label: 'PhD (Falsafa doktori / Fan nomzodi)' },
    { value: 'none', label: 'Darajasiz (yo\'q)' },
  ];

  const titleOptions = [
    { value: 'Professor', label: 'Professor' },
    { value: 'Dotsent', label: 'Dotsent' },
    { value: 'none', label: 'Unvonsiz (yo\'q)' },
  ];

  const genderOptions = [
    { value: 'erkak', label: 'Erkak' },
    { value: 'ayol', label: 'Ayol' },
  ];

  const ageOptions = [
    { value: '<30', label: '30 yoshgacha' },
    { value: '30-39', label: '30–39 yosh' },
    { value: '40-49', label: '40–49 yosh' },
    { value: '50-59', label: '50–59 yosh' },
    { value: '60+', label: '60 yosh va undan katta' },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-900/90 rounded-2xl p-4 md:p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
      {/* Top Header & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-100">
          <Filter size={18} className="text-indigo-600 dark:text-indigo-400" />
          <span className="font-bold text-sm">O'qituvchilar bo'yicha kengaytirilgan filtrlar</span>
          {totalActiveFilters > 0 && (
            <span className="bg-indigo-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
              {totalActiveFilters} ta faol
            </span>
          )}
        </div>

        {totalActiveFilters > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors px-2.5 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <X size={14} />
            <span>Filtrlarni tozalash</span>
          </button>
        )}
      </div>

      {/* Filter Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Ilmiy daraja */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            <GraduationCap size={15} className="text-indigo-500" />
            <span>Ilmiy daraja</span>
          </div>
          <div className="space-y-1.5">
            {degreeOptions.map(opt => {
              const checked = currentFilters.degree.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleToggle('degree', opt.value)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between border ${checked
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20 font-semibold'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {checked && <Check size={14} className="flex-shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Ilmiy unvon */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            <Award size={15} className="text-amber-500" />
            <span>Ilmiy unvon</span>
          </div>
          <div className="space-y-1.5">
            {titleOptions.map(opt => {
              const checked = currentFilters.title.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleToggle('title', opt.value)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between border ${checked
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-600/20 font-semibold'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-300'
                    }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {checked && <Check size={14} className="flex-shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Jinsi va Yoshi */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
              <Users size={14} className="text-blue-500" />
              <span>Jinsi</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {genderOptions.map(opt => {
                const checked = currentFilters.gender.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleToggle('gender', opt.value)}
                    className={`text-center px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${checked
                      ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
              <Calendar size={14} className="text-emerald-500" />
              <span>Yoshi</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {ageOptions.map(opt => {
                const checked = currentFilters.ageRange.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleToggle('ageRange', opt.value)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border ${checked
                      ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. Lavozimi */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            <Briefcase size={15} className="text-purple-500" />
            <span>Lavozimi</span>
          </div>
          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {positions && positions.length > 0 ? (
              positions.map(pos => {
                const checked = currentFilters.position.includes(pos);
                return (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => handleToggle('position', pos)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between border ${
                      checked
                        ? 'bg-purple-600 text-white border-purple-600 font-semibold'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                    }`}
                  >
                    <span className="truncate">{pos}</span>
                    {checked && <Check size={13} className="flex-shrink-0 ml-1" />}
                  </button>
                );
              })
            ) : (
              <span className="text-xs text-slate-400">Lavozimlar mavjud emas</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
