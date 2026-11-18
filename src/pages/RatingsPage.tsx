import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Building2, Layers, Search, TrendingUp, Award, Users, Star } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { getProfessorName } from '../utils/format';

type RatingsPageProps = {
  data: any;
  type: 'faculty' | 'department';
};

export const RatingsPage: React.FC<RatingsPageProps> = ({ data, type }) => {
  const isFaculty = type === 'faculty';
  const rawItems = isFaculty ? (data.facultyRatings || []) : (data.departmentRatings || []);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'potential' | 'completion'>('score');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedSubDept, setExpandedSubDept] = useState<number | null>(null);

  // Statistics summaries
  const totalCount = rawItems.length;
  const avgPotential = totalCount > 0
    ? (rawItems.reduce((acc: number, item: any) => acc + (item.scientificPotential || 0), 0) / totalCount).toFixed(1)
    : '0.0';
  const avgCompletion = totalCount > 0
    ? (rawItems.reduce((acc: number, item: any) => acc + (item.completionPercent || 0), 0) / totalCount).toFixed(1)
    : '0.0';
  const totalProfessors = rawItems.reduce((acc: number, item: any) => acc + (item.professors?.length || 0), 0);

  // Filtered and sorted items
  const displayItems = useMemo(() => {
    let list = [...rawItems];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item: any) =>
        item.name.toLowerCase().includes(q) ||
        (item.facultyName && item.facultyName.toLowerCase().includes(q))
      );
    }

    list.sort((a: any, b: any) => {
      if (sortBy === 'potential') return (b.scientificPotential || 0) - (a.scientificPotential || 0);
      if (sortBy === 'completion') return (b.completionPercent || 0) - (a.completionPercent || 0);
      return (b.totalScore || 0) - (a.totalScore || 0);
    });

    return list;
  }, [rawItems, searchQuery, sortBy]);

  const renderProfessorList = (professors: any[]) => (
    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5 mt-2">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
        <span>Professor-o'qituvchilar ({professors.length} nafar)</span>
        <span>Amalda to'plangan ball</span>
      </div>
      {professors.map((prof: any) => (
        <div
          key={prof.id}
          className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700/40 hover:border-indigo-300 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="font-semibold">{getProfessorName(prof)}</span>
            <span className="text-slate-400">({prof.position || 'O\'qituvchi'})</span>
            {prof.degree && prof.degree !== 'none' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold">
                {prof.degree}
              </span>
            )}
          </div>
          <span className="font-bold text-indigo-600 dark:text-indigo-400">
            {(prof.totalScore || 0).toFixed(2)} ball
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Page Header Banner */}
      <div className={`p-6 rounded-3xl border shadow-sm ${
        isFaculty
          ? 'bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white border-indigo-700/50'
          : 'bg-gradient-to-r from-emerald-900 via-teal-800 to-slate-900 text-white border-teal-700/50'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
              isFaculty ? 'bg-indigo-500/30 border border-indigo-400/40 text-indigo-200' : 'bg-emerald-500/30 border border-emerald-400/40 text-emerald-200'
            }`}>
              {isFaculty ? <Building2 size={32} /> : <Layers size={32} />}
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-indigo-300">
                {isFaculty ? 'Tuzilma monitoringi' : 'Kafedralar faoliyati'}
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {isFaculty ? 'Fakultetlar Reytingi & Monitoringi' : 'Kafedralar Reytingi & Salohiyati'}
              </h1>
              <p className="text-xs md:text-sm text-slate-300 mt-0.5">
                {isFaculty
                  ? 'Fakultetlarning ilmiy salohiyati, umumiy rejasi va KPI bajarilish ko\'rsatkichlari'
                  : 'Barcha kafedralar bo\'yicha o\'qituvchilar reytingi, ilmiy natijalari va samaradorligi'}
              </p>
            </div>
          </div>
        </div>

        {/* 4 Summary Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center space-x-2 text-slate-300 text-xs font-semibold">
              <Users size={16} />
              <span>{isFaculty ? 'Jami fakultetlar' : 'Jami kafedralar'}</span>
            </div>
            <div className="text-2xl font-black text-white mt-1">{totalCount} ta</div>
            <div className="text-[11px] text-slate-300 mt-0.5">{totalProfessors} nafar o'qituvchi</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center space-x-2 text-slate-300 text-xs font-semibold">
              <Star size={16} className="text-amber-300" />
              <span>O'rtacha ilmiy salohiyat</span>
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1">{avgPotential}%</div>
            <div className="text-[11px] text-slate-300 mt-0.5">DSc va PhD ulushi</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center space-x-2 text-slate-300 text-xs font-semibold">
              <TrendingUp size={16} className="text-emerald-300" />
              <span>O'rtacha KPI bajarilish</span>
            </div>
            <div className="text-2xl font-black text-emerald-300 mt-1">{avgCompletion}%</div>
            <div className="text-[11px] text-slate-300 mt-0.5">Yillik rejaga nisbatan</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center space-x-2 text-slate-300 text-xs font-semibold">
              <Award size={16} className="text-cyan-300" />
              <span>Yetakchi {isFaculty ? 'fakultet' : 'kafedra'}</span>
            </div>
            <div className="text-sm font-bold text-white mt-1.5 truncate">
              {displayItems[0]?.name || 'Mavjud emas'}
            </div>
            <div className="text-[11px] text-cyan-200 mt-0.5">
              {displayItems[0] ? `${(displayItems[0].totalScore || 0).toFixed(1)} ball` : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isFaculty ? 'Fakultet nomi bo\'yicha qidirish...' : 'Kafedra yoki fakultet nomi bo\'yicha...'}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Sort Buttons */}
        <div className="flex items-center space-x-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setSortBy('score')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              sortBy === 'score'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Ball bo'yicha
          </button>
          <button
            type="button"
            onClick={() => setSortBy('potential')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              sortBy === 'potential'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Salohiyat bo'yicha
          </button>
          <button
            type="button"
            onClick={() => setSortBy('completion')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              sortBy === 'completion'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Bajarilish %
          </button>
        </div>
      </div>

      {/* Main Ranking Table Card */}
      <Card>
        <div className="space-y-3">
          {displayItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              Hech qanday ma'lumot topilmadi.
            </div>
          ) : (
            displayItems.map((item: any, index: number) => {
              const isExpanded = expandedId === item.id;
              const rankColor =
                index === 0 ? 'bg-amber-500 text-white' :
                index === 1 ? 'bg-slate-400 text-white' :
                index === 2 ? 'bg-amber-700 text-white' :
                'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-md'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  {/* Item Row Header */}
                  <div
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm ${rankColor}`}>
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-bold text-sm md:text-base text-slate-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium flex-shrink-0">
                            {item.professors?.length || 0} nafar
                          </span>
                        </div>
                        {item.facultyName && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            Fakultet: {item.facultyName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stats metrics */}
                    <div className="flex items-center justify-between md:justify-end space-x-4 md:space-x-6">
                      <div className="text-right">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Ilmiy salohiyat
                        </span>
                        <span className="text-base font-black text-purple-600 dark:text-purple-400">
                          {(item.scientificPotential || 0).toFixed(1)}%
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Reja
                        </span>
                        <span className="text-base font-bold text-slate-700 dark:text-slate-300">
                          {(item.totalPlan || 0).toFixed(1)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Amalda
                        </span>
                        <span className="text-base font-black text-blue-600 dark:text-blue-400">
                          {(item.totalScore || 0).toFixed(1)}
                        </span>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Bajarilish
                        </span>
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                          {(item.completionPercent || 0).toFixed(1)}%
                        </span>
                      </div>

                      <div className="text-slate-400 flex items-center justify-center w-6">
                        {isExpanded ? <ChevronDown size={20} className="text-indigo-600" /> : <ChevronRight size={20} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-200/80 dark:border-slate-800/80 p-4 bg-slate-50/50 dark:bg-slate-900/50"
                      >
                        {isFaculty ? (
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Layers size={14} className="text-indigo-500" />
                              <span>Fakultet tarkibidagi kafedralar:</span>
                            </h4>

                            {item.departments && item.departments.length > 0 ? (
                              <div className="space-y-2">
                                {item.departments.map((dept: any) => {
                                  const isDeptExpanded = expandedSubDept === dept.id;
                                  return (
                                    <div
                                      key={dept.id}
                                      className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-3"
                                    >
                                      <div
                                        className="flex items-center justify-between cursor-pointer"
                                        onClick={() => setExpandedSubDept(isDeptExpanded ? null : dept.id)}
                                      >
                                        <div className="flex items-center space-x-2">
                                          <span className="font-semibold text-xs md:text-sm text-slate-800 dark:text-slate-200">
                                            {dept.name}
                                          </span>
                                          <span className="text-[11px] text-slate-400">
                                            ({dept.professors?.length || 0} nafar)
                                          </span>
                                        </div>
                                        <div className="flex items-center space-x-4 text-xs font-semibold">
                                          <span className="text-blue-600 dark:text-blue-400">
                                            Amalda: {(dept.totalScore || 0).toFixed(1)}
                                          </span>
                                          <span className="text-emerald-600 dark:text-emerald-400">
                                            Bajarilish: {(dept.completionPercent || 0).toFixed(1)}%
                                          </span>
                                          {isDeptExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                                        </div>
                                      </div>

                                      <AnimatePresence>
                                        {isDeptExpanded && dept.professors && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                          >
                                            {renderProfessorList(dept.professors)}
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400">Ushbu fakultetda kafedralar biriktirilmagan.</p>
                            )}
                          </div>
                        ) : (
                          renderProfessorList(item.professors || [])
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </motion.div>
  );
};
