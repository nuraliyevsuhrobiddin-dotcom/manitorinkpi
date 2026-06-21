import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { CONSTANTS } from './data.js';
import { ASSETS } from './assetManifest.js';
import { Header } from './components/Header';
import { MobileMenu } from './components/MobileMenu';
import type { SidebarNavItem } from './components/Sidebar';
import { SupabaseState } from './supabaseState';
import { AuthService } from '../../src/shared/services/authService';
import { DataService } from '../../src/shared/services/dataService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BarChart3, Building, Users, GraduationCap, ChevronDown, ChevronRight,
  BookOpen, Award, FileText, Lightbulb, Briefcase, Languages, Trophy, UserCheck, Star, Filter,
  Settings, PlusCircle, Edit, Trash2, Eye, TrendingUp, FileSpreadsheet, Edit3, LogIn, Search, TrendingDown, UserCog, ClipboardList, ChevronUp, UserPlus,
  Rocket, Target, Handshake, BookCopy, DollarSign
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Ma'lumotlar tiplari
type User = typeof CONSTANTS.USERS[0] & { departmentId?: number };
type Professor = typeof CONSTANTS.PROFESSORS[0];
type Achievement = typeof CONSTANTS.ACHIEVEMENTS[0];
type Department = typeof CONSTANTS.DEPARTMENTS[0];
type Faculty = typeof CONSTANTS.FACULTIES[0];
type Division = { id: number, name: string };
type PlanItem = { type: string, subType: string, count: number };
type Plan = { professorId: number, year: number, planItems: PlanItem[] };
type Project = typeof CONSTANTS.PROJECTS[0];
type ScoringSystem = typeof CONSTANTS.SCORING_SYSTEM;
type ScoringCriterion = { score: number; description: string };
type ScoringCategory = { [subType: string]: ScoringCriterion };
type ThesisDefense = typeof CONSTANTS.THESIS_DEFENSES[0];
type Filters = {
  gender: string[];
  degree: string[];
  title: string[];
  ageRange: string[];
  position: string[];
};

const stripUserSecrets = (items: User[] = []) => items.map(({ password, ...user }) => user);
const REPORT_YEAR_STORAGE_KEY = 'kpi_selected_report_year';

// Ikonkalarni yutuq turlariga moslash
const achievementIcons: { [key: string]: React.ElementType } = {
  publication: BookOpen,
  intellectual_property: Lightbulb,
  methodological_work: FileText,
  project: Briefcase,
  international_activity: Languages,
  student_achievement: Trophy,
  supervision: UserCheck,
  thesis_defense: BookCopy,
};

// Yordamchi funksiyalar
const getProfessorName = (prof: Professor | { lastName: string, firstName: string, patronymic: string }) => `${prof.lastName} ${prof.firstName} ${prof.patronymic}`;
const getAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};
const renderGrowthIndicator = (growth: number | null) => {
    if (growth === null || !isFinite(growth)) return <span className="text-gray-500">-</span>;
    if (growth === 0) return <span className="text-gray-500">0%</span>;
    const isPositive = growth > 0;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const icon = isPositive ? <TrendingUp size={16} className="inline mr-1" /> : <TrendingDown size={16} className="inline mr-1" />;
    return <span className={`${color} font-semibold`}>{icon}{growth.toFixed(1)}%</span>;
};
const formatFundingCompact = (valueInMillions: number) => {
    if (valueInMillions >= 1000) {
        return `${(valueInMillions / 1000).toFixed(2)} mlrd`;
    }
    return `${valueInMillions.toLocaleString('uz-UZ')} mln`;
};

const formatFundingTooltip = (valueInMillions: number) => {
    return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', minimumFractionDigits: 0 }).format(valueInMillions * 1000000);
};

// Asosiy komponentlar
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
    {children}
  </div>
);

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
  <Card className="flex items-center">
    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg mr-4">
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </Card>
);

const BarChart: React.FC<{ data: { label: string; value: number }[]; title: string; unit?: string }> = ({ data, title, unit = '' }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="group">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center">
                <span className="text-sm font-semibold text-gray-500 w-8">{index + 1}.</span>
                <p className="text-sm text-gray-600 truncate pr-2">{item.label}</p>
              </div>
              <p className="text-sm font-semibold text-blue-600">{item.value.toFixed(2)}{unit}</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <motion.div
                className="bg-blue-500 h-2.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(item.value / maxValue) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const DonutChart: React.FC<{ data: { label: string; value: number; color: string }[]; title: string; }> = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-8">Ma'lumotlar mavjud emas</p>
      </Card>
    );
  }

  let cumulative = 0;
  const segments = data.map(item => {
    const percentage = (item.value / total) * 100;
    const segment = { ...item, percentage, offset: cumulative };
    cumulative += percentage;
    return segment;
  });

  const conicGradient = segments.map(s => `${s.color} ${s.offset}% ${s.offset + s.percentage}%`).join(', ');

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div
          className="relative w-40 h-40 rounded-full flex items-center justify-center"
          style={{ background: `conic-gradient(${conicGradient})` }}
        >
          <div className="absolute w-28 h-28 bg-white rounded-full"></div>
        </div>
        <div className="flex-1 space-y-2 w-full">
          {segments.map(item => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                <span>{item.label}</span>
              </div>
              <span className="font-semibold">{item.value} ({item.percentage.toFixed(1)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

// Modal helpers
const Modal: React.FC<{ open: boolean, onClose: () => void, children: React.ReactNode, className?: string }> = ({ open, onClose, children, className }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className={`bg-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-full relative ${className}`}>
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={onClose}>
          <svg width="24" height="24"><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/><line x1="6" y1="18" x2="18" y2="6" stroke="currentColor" strokeWidth="2"/></svg>
        </button>
        {children}
      </div>
    </div>
  );
};

const Pagination: React.FC<{ currentPage: number; totalPages: number; onPageChange: (page: number) => void; }> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav className="flex justify-center mt-4">
      <ul className="inline-flex items-center -space-x-px">
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            Oldingi
          </button>
        </li>
        {pageNumbers.map(number => (
          <li key={number}>
            <button
              onClick={() => onPageChange(number)}
              className={`px-3 py-2 leading-tight border ${currentPage === number ? 'bg-blue-50 text-blue-600 border-blue-300' : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-100'}`}
            >
              {number}
            </button>
          </li>
        ))}
        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            Keyingi
          </button>
        </li>
      </ul>
    </nav>
  );
};


// Sahifalar
const EnhancedCriteriaStatistics: React.FC<{
  achievements: Achievement[];
  professors: any[];
  faculties: Faculty[];
  departments: Department[];
  scoringSystem: ScoringSystem;
  selectedYear: number;
  plans: Plan[];
}> = ({ achievements, professors, faculties, departments, scoringSystem, selectedYear, plans }) => {
  const [view, setView] = useState<'faculties' | 'departments' | 'professors'>('faculties');

  const analysisData = useMemo(() => {
    const data: { [view: string]: { [id: string]: { [type: string]: { [subType: string]: { plan: number, actual: number } } } } } = {
      faculties: {},
      departments: {},
      professors: {},
    };

    const entityMap: { [key: string]: { items: any[], prefix: string } } = {
      faculties: { items: faculties, prefix: 'f_' },
      departments: { items: departments, prefix: 'd_' },
      professors: { items: professors, prefix: 'p_' },
    };

    // Initialize data structure
    for (const view of ['faculties', 'departments', 'professors']) {
      entityMap[view].items.forEach(item => {
        const entityId = `${entityMap[view].prefix}${item.id}`;
        data[view][entityId] = {};
        Object.keys(scoringSystem).forEach(type => {
          data[view][entityId][type] = {};
          // @ts-ignore
          Object.keys(scoringSystem[type]).forEach(subType => {
            data[view][entityId][type][subType] = { plan: 0, actual: 0 };
          });
        });
      });
    }

    // Populate plans
    const yearPlans = plans.filter(p => p.year === selectedYear);
    yearPlans.forEach(plan => {
      const prof = professors.find(p => p.id === plan.professorId);
      if (!prof) return;

      const profId = `p_${prof.id}`;
      const deptId = prof.department?.id ? `d_${prof.department.id}` : null;
      const facId = prof.faculty?.id ? `f_${prof.faculty.id}` : null;
      
      plan.planItems.forEach(item => {
        if (data.professors[profId]?.[item.type]?.[item.subType]) {
          data.professors[profId][item.type][item.subType].plan += item.count;
        }
        if (deptId && data.departments[deptId]?.[item.type]?.[item.subType]) {
          data.departments[deptId][item.type][item.subType].plan += item.count;
        }
        if (facId && data.faculties[facId]?.[item.type]?.[item.subType]) {
          data.faculties[facId][item.type][item.subType].plan += item.count;
        }
      });
    });

    // Populate actuals (Soni/Amaldasi)
    const yearAchievements = achievements.filter(a => a.year === selectedYear);
    yearAchievements.forEach(ach => {
      const prof = professors.find(p => p.id === ach.professorId);
      if (!prof) return;

      const profId = `p_${prof.id}`;
      const deptId = prof.department?.id ? `d_${prof.department.id}` : null;
      const facId = prof.faculty?.id ? `f_${prof.faculty.id}` : null;

      if (data.professors[profId]?.[ach.type]?.[ach.subType]) {
        data.professors[profId][ach.type][ach.subType].actual += ach.count;
      }
      if (deptId && data.departments[deptId]?.[ach.type]?.[ach.subType]) {
        data.departments[deptId][ach.type][ach.subType].actual += ach.count;
      }
      if (facId && data.faculties[facId]?.[ach.type]?.[ach.subType]) {
        data.faculties[facId][ach.type][ach.subType].actual += ach.count;
      }
    });

    return data;
  }, [achievements, plans, professors, departments, faculties, scoringSystem, selectedYear]);

  const getPerformanceColorClass = (actual: number, plan: number) => {
    if (plan === 0) {
      return actual > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
    }
    const ratio = actual / plan;
    if (ratio >= 1) return 'bg-green-100 text-green-800';
    if (ratio >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const renderTable = () => {
    let items: any[] = [];
    let idPrefix = '';
    if (view === 'faculties') { items = faculties; idPrefix = 'f_'; }
    if (view === 'departments') { items = departments; idPrefix = 'd_'; }
    if (view === 'professors') { items = professors.map(p => ({...p, name: getProfessorName(p)})); idPrefix = 'p_'; }

    const dataForView = analysisData[view];
    if (!dataForView || Object.keys(dataForView).length === 0) return <p className="text-center py-4">Ma'lumotlar mavjud emas.</p>;

    const totals = items.map(item => {
        const entityId = `${idPrefix}${item.id}`;
        let totalSoni = 0;
        let totalRejasi = 0;
        let totalAmaldasi = 0;

        if (dataForView[entityId]) {
            Object.values(dataForView[entityId]).forEach((subTypes: { [subType: string]: { plan: number; actual: number } }) => {
                Object.values(subTypes).forEach((values) => {
                    totalSoni += values.actual;
                    totalRejasi += values.plan;
                    totalAmaldasi += values.actual;
                });
            });
        }
        return { totalSoni, totalRejasi, totalAmaldasi };
    });

    return (
      <div className="overflow-x-auto relative">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-30">
            <tr>
              <th rowSpan={2} className="px-4 py-3 align-bottom sticky left-0 bg-gray-50 z-40">Mezon</th>
              {items.map(item => (
                <th key={item.id} colSpan={3} className="px-4 py-3 text-center border-l bg-gray-50">{item.name}</th>
              ))}
            </tr>
            <tr>
              {items.map(item => (
                <React.Fragment key={item.id}>
                  <th className="px-2 py-2 text-center font-medium border-l bg-gray-50">Soni</th>
                  <th className="px-2 py-2 text-center font-medium bg-gray-50">Rejasi</th>
                  <th className="px-2 py-2 text-center font-medium bg-gray-50">Amaldasi</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(scoringSystem as ScoringSystem).map(([type, subTypes]) => (
              <React.Fragment key={type}>
                <tr className="bg-gray-100 font-bold"><td colSpan={1 + items.length * 3} className="px-4 py-2 capitalize sticky left-0 bg-gray-100 z-10">{type.replace(/_/g, ' ')}</td></tr>
                {Object.keys(subTypes as ScoringCategory).map(subType => {
                  return (
                    <tr key={subType} className="bg-white border-b">
                      <td className="px-4 py-2 font-medium sticky left-0 bg-white z-10">{subType}</td>
                      {items.map(item => {
                        const entityId = `${idPrefix}${item.id}`;
                        const values = dataForView[entityId]?.[type]?.[subType] || { plan: 0, actual: 0 };
                        
                        return (
                          <React.Fragment key={item.id}>
                            <td className="px-2 py-2 text-center border-l">{values.actual > 0 ? values.actual : '-'}</td>
                            <td className="px-2 py-2 text-center">{values.plan > 0 ? values.plan : '-'}</td>
                            <td className="px-2 py-2 text-center">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPerformanceColorClass(values.actual, values.plan)}`}>
                                    {values.actual > 0 ? values.actual : '-'}
                                </span>
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot className="bg-gray-200 font-bold text-gray-800">
            <tr className="border-t-2 border-gray-400">
                <td className="px-4 py-3 sticky left-0 bg-gray-200 z-10">Barcha mezonlar bo'yicha umumiy statistika</td>
                {totals.map((t, i) => (
                    <React.Fragment key={i}>
                        <td className="px-2 py-3 text-center border-l">{t.totalSoni > 0 ? t.totalSoni : '-'}</td>
                        <td className="px-2 py-3 text-center">{t.totalRejasi > 0 ? t.totalRejasi : '-'}</td>
                        <td className="px-2 py-3 text-center">
                            <span className={`px-2 py-1 text-sm font-semibold rounded-full ${getPerformanceColorClass(t.totalAmaldasi, t.totalRejasi)}`}>
                                {t.totalAmaldasi > 0 ? t.totalAmaldasi : '-'}
                            </span>
                        </td>
                    </React.Fragment>
                ))}
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Mezonlar bo'yicha tahlil ({selectedYear}-yil)</h3>
      </div>
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => setView('faculties')} className={`${view === 'faculties' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}>Fakultetlar</button>
          <button onClick={() => setView('departments')} className={`${view === 'departments' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}>Kafedralar</button>
          <button onClick={() => setView('professors')} className={`${view === 'professors' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}>Professor-o'qituvchilar</button>
        </nav>
      </div>
      {renderTable()}
    </Card>
  );
};

const DegreeAndTitleStats: React.FC<{ professors: Professor[], faculties: Faculty[], departments: Department[] }> = ({ professors, faculties, departments }) => {
  const stats = useMemo(() => {
    const data: { [key: string]: { total: number, byFaculty: { [key: string]: number } } } = {
      'PhD': { total: 0, byFaculty: {} },
      'DSc': { total: 0, byFaculty: {} },
      'Dotsent': { total: 0, byFaculty: {} },
      'Professor': { total: 0, byFaculty: {} },
    };

    faculties.forEach(f => {
      data.PhD.byFaculty[f.name] = 0;
      data.DSc.byFaculty[f.name] = 0;
      data.Dotsent.byFaculty[f.name] = 0;
      data.Professor.byFaculty[f.name] = 0;
    });

    professors.forEach(p => {
      const department = departments.find(d => d.id === p.departmentId);
      const faculty = faculties.find(f => f.id === department?.facultyId);
      const facultyName = faculty?.name || 'Noma\'lum';

      if (p.degree === 'PhD') data.PhD.total++;
      if (p.degree === 'DSc') data.DSc.total++;
      if (p.title === 'Dotsent') data.Dotsent.total++;
      if (p.title === 'Professor') data.Professor.total++;
      
      if (facultyName !== 'Noma\'lum') {
        if (p.degree === 'PhD') data.PhD.byFaculty[facultyName]++;
        if (p.degree === 'DSc') data.DSc.byFaculty[facultyName]++;
        if (p.title === 'Dotsent') data.Dotsent.byFaculty[facultyName]++;
        if (p.title === 'Professor') data.Professor.byFaculty[facultyName]++;
      }
    });
    return data;
  }, [professors, faculties, departments]);

  const totalDegreeHoldersData = useMemo(() => {
    const total = stats.DSc.total + stats.PhD.total;
    const byFaculty: { [key: string]: number } = {};
    faculties.forEach(f => {
        byFaculty[f.name] = (stats.DSc.byFaculty[f.name] || 0) + (stats.PhD.byFaculty[f.name] || 0);
    });
    return { total, byFaculty };
  }, [stats, faculties]);

  const statItems = [
    { label: 'Jami ilmiy darajalilar', data: totalDegreeHoldersData, isBold: true },
    { label: 'Fan doktorlari (DSc)', data: stats.DSc },
    { label: 'Falsafa doktorlari (PhD)', data: stats.PhD },
    { label: 'Professorlar', data: stats.Professor },
    { label: 'Dotsentlar', data: stats.Dotsent },
  ];

  const totalProfessors = professors.length;

  const summaryItems = [
    { label: 'DSc', count: stats.DSc.total },
    { label: 'PhD', count: stats.PhD.total },
    { label: 'Professor', count: stats.Professor.total },
    { label: 'Dotsent', count: stats.Dotsent.total },
  ];

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Ilmiy salohiyat statistikasi</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-4 py-3">Ko'rsatkich</th>
              <th className="px-4 py-3 text-center">Jami</th>
              {faculties.map(f => <th key={f.id} className="px-4 py-3 text-center">{f.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {statItems.map(item => (
              <tr key={item.label} className={`bg-white border-b ${item.isBold ? 'font-bold bg-gray-50' : ''}`}>
                <td className="px-4 py-2 font-medium">{item.label}</td>
                <td className="px-4 py-2 text-center font-bold">{item.data.total}</td>
                {faculties.map(f => (
                  <td key={f.id} className="px-4 py-2 text-center">{item.data.byFaculty[f.name] || 0}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryItems.map(item => (
            <div key={item.label} className="text-center p-3 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="text-2xl font-bold text-gray-800">{item.count}</p>
              <p className="text-sm font-semibold text-blue-600">
                {totalProfessors > 0 ? ((item.count / totalProfessors) * 100).toFixed(1) : 0}%
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};


const GeneralStatisticsPage: React.FC<{ data: any, faculties: Faculty[], departments: Department[], professors: Professor[], achievements: Achievement[], scoringSystem: ScoringSystem, selectedYear: number, plans: Plan[], thesisDefenses: ThesisDefense[] }> = ({ data, faculties, departments, professors, achievements, scoringSystem, selectedYear, plans, thesisDefenses }) => {
  const { facultyRatings, departmentRatings, professorsWithDetails, universityScientificPotential, projectTypeCounts } = data;

  const topFaculties = facultyRatings.slice(0, 5).map((f: any) => ({
    label: f.name,
    value: f.completionPercent
  }));

  const topDepartments = departmentRatings.slice(0, 5).map((d: any) => ({
    label: d.name,
    value: d.completionPercent
  }));
  
  const topProfessors = professorsWithDetails.slice(0, 5).map((p: any) => ({
    label: p.name,
    value: p.completionPercent
  }));

  const totalStaffUnits = professors.reduce((sum, p) => sum + p.staffUnit, 0);

  const defenseCounts = useMemo(() => {
    return thesisDefenses.reduce((acc, defense) => {
      if (defense.type === 'PhD') acc.phd++;
      if (defense.type === 'DSc') acc.dsc++;
      if (defense.type === 'dotsent') acc.dotsent++;
      if (defense.type === 'professor') acc.professor++;
      return acc;
    }, { phd: 0, dsc: 0, dotsent: 0, professor: 0 });
  }, [thesisDefenses]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard title="Jami professor-o'qituvchilar" value={professors.length} icon={Users} />
        <StatCard title="Ilmiy salohiyat" value={`${universityScientificPotential.toFixed(1)}%`} icon={Star} />
        <StatCard title="Jami shtat birligi" value={totalStaffUnits.toFixed(2)} icon={FileText} />
        <StatCard title="Jami fakultetlar" value={faculties.length} icon={Building} />
        <StatCard title="Jami kafedralar" value={departments.length} icon={GraduationCap} />
        <StatCard title="Startaplar soni" value={projectTypeCounts?.['Startap'] || 0} icon={Lightbulb} />
        <StatCard title="Loyihalar soni" value={projectTypeCounts?.['Loyiha'] || 0} icon={Rocket} />
        <StatCard title="Grantlar soni" value={projectTypeCounts?.['Grant'] || 0} icon={Award} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard title="PhD himoyalari" value={defenseCounts.phd} icon={GraduationCap} />
        <StatCard title="DSc himoyalari" value={defenseCounts.dsc} icon={GraduationCap} />
        <StatCard title="Dotsentlik unvonlari" value={defenseCounts.dotsent} icon={Award} />
        <StatCard title="Professorlik unvonlari" value={defenseCounts.professor} icon={Award} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <BarChart title="Fakultetlar reytingi (reja bajarilishi %)" data={topFaculties} unit="%" />
        <BarChart title="Kafedralar reytingi (reja bajarilishi %)" data={topDepartments} unit="%" />
        <BarChart title="Professorlar reytingi (reja bajarilishi %)" data={topProfessors} unit="%" />
      </div>

      <div className="mb-6">
        <DegreeAndTitleStats professors={professors} faculties={faculties} departments={departments} />
      </div>

      <EnhancedCriteriaStatistics 
        achievements={achievements}
        professors={professorsWithDetails}
        faculties={faculties}
        departments={departments}
        scoringSystem={scoringSystem}
        selectedYear={selectedYear}
        plans={plans}
      />
    </motion.div>
  );
};

const RatingsPage: React.FC<{ data: any; type: 'faculty' | 'department' }> = ({ data, type }) => {
  const title = type === 'faculty' ? 'Fakultetlar Reytingi' : 'Kafedralar Reytingi';
  const items = type === 'faculty' ? data.facultyRatings : data.departmentRatings;

  const [expandedFaculty, setExpandedFaculty] = useState<number | null>(null);
  const [expandedDepartment, setExpandedDepartment] = useState<number | null>(null);

  const renderProfessorList = (professors: any[]) => (
    <ul className="space-y-1 text-sm text-gray-700">
      {professors.map((prof: any) => (
        <li key={prof.id} className="flex justify-between p-2 rounded hover:bg-gray-200">
          <span>{getProfessorName(prof)} ({prof.position})</span>
          <span className="font-semibold">{prof.totalScore.toFixed(2)} ball</span>
        </li>
      ))}
    </ul>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">{title}</h1>
      <Card>
        <div className="space-y-2">
          {items.map((item: any, index: number) => (
            <div key={item.id} className="border-b last:border-b-0 py-2">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedFaculty(expandedFaculty === item.id ? null : item.id)}>
                <div className="flex items-center">
                  <span className="text-lg font-bold text-gray-500 w-8">{index + 1}</span>
                  <p className="font-semibold text-gray-800">{item.name} <span className="text-gray-500 font-normal">({item.professors.length} nafar)</span></p>
                </div>
                <div className="flex items-center space-x-4 text-right">
                  <div className="w-28">
                    <p className="text-xs text-gray-500">Ilmiy salohiyat</p>
                    <p className="font-bold text-lg text-purple-600">{item.scientificPotential.toFixed(1)}%</p>
                  </div>
                  <div className="w-20">
                    <p className="text-xs text-gray-500">Reja</p>
                    <p className="font-bold text-lg text-gray-800">{item.totalPlan.toFixed(1)}</p>
                  </div>
                  <div className="w-20">
                    <p className="text-xs text-gray-500">Amalda</p>
                    <p className="font-bold text-lg text-blue-600">{item.totalScore.toFixed(1)}</p>
                  </div>
                   <div className="w-24">
                    <p className="text-xs text-gray-500">Bajarilish</p>
                    <p className="font-bold text-lg text-green-600">{item.completionPercent.toFixed(1)}%</p>
                  </div>
                  {item.departments || item.professors ? (expandedFaculty === item.id ? <ChevronDown /> : <ChevronRight />) : <div className="w-6"/>}
                </div>
              </div>
              <AnimatePresence>
                {expandedFaculty === item.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pl-10 pt-2"
                  >
                    {type === 'faculty' ? (
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm mb-2 text-gray-600">Kafedralar:</h4>
                        {item.departments.map((dept: any) => (
                          <div key={dept.id} className="border-l-2 pl-3 py-1">
                            <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedDepartment(expandedDepartment === dept.id ? null : dept.id)}>
                                <p className="font-semibold text-sm text-gray-700">{dept.name} <span className="text-gray-500 font-normal">({dept.professors.length} nafar)</span></p>
                                <div className="flex items-center space-x-3 text-right">
                                    <div className="w-20"><p className="text-xs text-gray-500">Amalda</p><p className="font-bold text-sm text-blue-600">{dept.totalScore.toFixed(1)}</p></div>
                                    <div className="w-24"><p className="text-xs text-gray-500">Bajarilish</p><p className="font-bold text-sm text-green-600">{dept.completionPercent.toFixed(1)}%</p></div>
                                    {dept.professors && (expandedDepartment === dept.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                                </div>
                            </div>
                            <AnimatePresence>
                              {expandedDepartment === dept.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden pl-4 pt-2"
                                >
                                  {renderProfessorList(dept.professors)}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    ) : (
                      renderProfessorList(item.professors)
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};

const ProfessorEvaluationModal: React.FC<{
  open: boolean;
  onClose: () => void;
  professor: any;
  achievements: Achievement[];
  onSave: (updatedAchievements: Achievement[], target: { year: number, quarter: number }) => void;
  year: number;
  scoringSystem: ScoringSystem;
  getScore: (type: string, subType: string) => number;
}> = ({ open, onClose, professor, achievements, onSave, year, scoringSystem, getScore }) => {
  const [quarter, setQuarter] = useState(1);
  
  const profAchievementsForQuarter = useMemo(() => {
    return achievements.filter(a => a.professorId === professor.id && a.year === year && a.quarter === quarter);
  }, [achievements, professor.id, year, quarter]);

  const [localAchievements, setLocalAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (open) {
      setLocalAchievements(profAchievementsForQuarter.map(a => ({ ...a })));
    }
  }, [profAchievementsForQuarter, open]);

  const allTypes = Object.keys(scoringSystem);
  const allSubTypes: { [type: string]: string[] } = {};
  allTypes.forEach(type => {
    // @ts-ignore
    allSubTypes[type] = Object.keys(scoringSystem[type]);
  });

  function getCount(type: string, subType: string) {
    const found = localAchievements.find(a => a.type === type && a.subType === subType);
    return found ? found.count : 0;
  }

  function setCount(type: string, subType: string, count: number) {
    setLocalAchievements(prev => {
      const idx = prev.findIndex(a => a.type === type && a.subType === subType);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], count };
        return updated;
      } else {
        return [...prev, { id: Date.now() + Math.random(), professorId: professor.id, year, quarter, type, subType, count }];
      }
    });
  }

  function handleSave() {
    const filtered = localAchievements.filter(a => a.count > 0);
    onSave(filtered, { year, quarter });
    onClose();
  }

  let totalScore = 0;
  localAchievements.forEach(ach => {
    totalScore += getScore(ach.type, ach.subType) * ach.count;
  });

  return (
    <Modal open={open} onClose={onClose} className="max-w-3xl">
      <h2 className="text-xl font-bold mb-2">{getProfessorName(professor)} - {year}, {quarter}-chorak baholash</h2>
      <div className="mb-2">
        <span className="font-semibold">Chorak bo'yicha jami ball: </span>
        <span className="text-blue-600 font-bold">{totalScore.toFixed(2)}</span>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium">Chorakni tanlang</label>
        <select className="w-full border rounded p-1" value={quarter} onChange={e => setQuarter(Number(e.target.value))}>
          <option value={1}>1-chorak</option>
          <option value={2}>2-chorak</option>
          <option value={3}>3-chorak</option>
          <option value={4}>4-chorak</option>
        </select>
      </div>
      
      <div className="max-h-96 overflow-y-auto mt-2">
        {allTypes.map(type => (
          <div key={type} className="mb-2">
            <div className="font-semibold mb-1 flex items-center">
              {achievementIcons[type] && React.createElement(achievementIcons[type], { size: 18, className: "mr-1" })}
              {type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {allSubTypes[type].map(subType => (
                <div key={subType} className="flex items-center">
                  <span className="text-xs w-36 truncate" title={subType}>{subType}</span>
                  <input
                    type="number"
                    min={0}
                    className="border rounded w-16 p-1 ml-2"
                    value={getCount(type, subType)}
                    onChange={e => setCount(type, subType, Math.max(0, Number(e.target.value)))}
                  />
                  <span className="ml-2 text-xs text-gray-400">({getScore(type, subType)} ball)</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end space-x-2">
        <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={onClose}>Bekor qilish</button>
        <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={handleSave}>Saqlash</button>
      </div>
    </Modal>
  );
};

const ProfessorPlanModal: React.FC<{
  open: boolean;
  onClose: () => void;
  professor: any;
  plans: Plan[];
  onSave: (updatedPlan: Plan) => void;
  year: number;
  scoringSystem: ScoringSystem;
  getScore: (type: string, subType: string) => number;
}> = ({ open, onClose, professor, plans, onSave, year, scoringSystem, getScore }) => {
  
  const profPlan = useMemo(() => {
    return plans.find(p => p.professorId === professor.id && p.year === year);
  }, [plans, professor.id, year]);

  const [localPlanItems, setLocalPlanItems] = useState<PlanItem[]>([]);

  useEffect(() => {
    if (open) {
      setLocalPlanItems(profPlan ? profPlan.planItems.map(p => ({ ...p })) : []);
    }
  }, [profPlan, open]);

  const allTypes = Object.keys(scoringSystem);
  const allSubTypes: { [type: string]: string[] } = {};
  allTypes.forEach(type => {
    // @ts-ignore
    allSubTypes[type] = Object.keys(scoringSystem[type]);
  });

  function getCount(type: string, subType: string) {
    const found = localPlanItems.find(p => p.type === type && p.subType === subType);
    return found ? found.count : 0;
  }

  function setCount(type: string, subType: string, count: number) {
    setLocalPlanItems(prev => {
      const idx = prev.findIndex(p => p.type === type && p.subType === subType);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], count };
        return updated;
      } else {
        return [...prev, { type, subType, count }];
      }
    });
  }

  function handleSave() {
    const filteredItems = localPlanItems.filter(p => p.count > 0);
    const updatedPlan: Plan = {
      professorId: professor.id,
      year: year,
      planItems: filteredItems
    };
    onSave(updatedPlan);
    onClose();
  }

  let totalPlanScore = 0;
  localPlanItems.forEach(item => {
    totalPlanScore += getScore(item.type, item.subType) * item.count;
  });

  return (
    <Modal open={open} onClose={onClose} className="max-w-3xl">
      <h2 className="text-xl font-bold mb-2">{getProfessorName(professor)} - {year} Yillik Reja Kiritish</h2>
      <div className="mb-4">
        <span className="font-semibold">Yillik reja bo'yicha jami ball: </span>
        <span className="text-blue-600 font-bold">{totalPlanScore.toFixed(2)}</span>
      </div>
      
      <div className="max-h-96 overflow-y-auto mt-2">
        {allTypes.map(type => (
          <div key={type} className="mb-2">
            <div className="font-semibold mb-1 flex items-center">
              {achievementIcons[type] && React.createElement(achievementIcons[type], { size: 18, className: "mr-1" })}
              {type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {allSubTypes[type].map(subType => (
                <div key={subType} className="flex items-center">
                  <span className="text-xs w-36 truncate" title={subType}>{subType}</span>
                  <input
                    type="number"
                    min={0}
                    className="border rounded w-16 p-1 ml-2"
                    value={getCount(type, subType)}
                    onChange={e => setCount(type, subType, Math.max(0, Number(e.target.value)))}
                  />
                  <span className="ml-2 text-xs text-gray-400">({getScore(type, subType)} ball)</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end space-x-2">
        <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={onClose}>Bekor qilish</button>
        <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={handleSave}>Saqlash</button>
      </div>
    </Modal>
  );
};

const ProfessorFilterControls: React.FC<{ filters: Filters, onFilterChange: (filters: Filters) => void, positions: string[] }> = ({ filters, onFilterChange, positions }) => {
  const handleCheckboxChange = (category: keyof Filters, value: string) => {
    const newValues = filters[category].includes(value)
      ? filters[category].filter(v => v !== value)
      : [...filters[category], value];
    onFilterChange({ ...filters, [category]: newValues });
  };

  const filterGroups = [
    {
      title: 'Jinsi', category: 'gender', options: { 'erkak': 'Erkak', 'ayol': 'Ayol' }
    },
    {
      title: 'Ilmiy daraja', category: 'degree', options: { 'DSc': 'DSc', 'PhD': 'PhD' }
    },
    {
      title: 'Ilmiy unvon', category: 'title', options: { 'Professor': 'Professor', 'Dotsent': 'Dotsent' }
    },
    {
      title: 'Yosh bo\'yicha', category: 'ageRange', options: {
        '<30': '30 yoshgacha', '30-39': '30-39 yosh', '40-49': '40-49 yosh', '50-59': '50-59 yosh', '60+': '60+ yosh'
      }
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4">
      {filterGroups.map(group => (
        <div key={group.title}>
          <label className="block text-sm font-medium text-gray-700 mb-2">{group.title}</label>
          <div className="space-y-2">
            {Object.entries(group.options).map(([value, label]) => (
              <div key={value} className="flex items-center">
                <input
                  id={`${group.category}-${value}`}
                  type="checkbox"
                  value={value}
                  checked={filters[group.category as keyof Filters].includes(value)}
                  onChange={() => handleCheckboxChange(group.category as keyof Filters, value)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`${group.category}-${value}`} className="ml-2 block text-sm text-gray-900">{label}</label>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Lavozimi</label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {positions.map(position => (
            <div key={position} className="flex items-center">
              <input
                id={`position-${position}`}
                type="checkbox"
                value={position}
                checked={filters.position.includes(position)}
                onChange={() => handleCheckboxChange('position', position)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`position-${position}`} className="ml-2 block text-sm text-gray-900">{position}</label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProfessorOqituvchilarPage: React.FC<{ user: User, data: any, achievements: Achievement[], setAchievements: any, professors: Professor[], setProfessors: any, plans: Plan[], setPlans: any, selectedYear: number, canEdit: boolean, scoringSystem: ScoringSystem, getScore: (type: string, subType: string) => number, faculties: Faculty[], departments: Department[], positions: string[], employmentTypes: string[], searchQuery: string, setSearchQuery: (s: string) => void, filters: Filters, setFilters: (f: Filters) => void, saveStatus: 'idle' | 'saving' | 'saved' | 'error', saveErrorMessage: string }> = ({ data, achievements, setAchievements, setProfessors, plans, setPlans, selectedYear, canEdit, scoringSystem, getScore, faculties, departments, positions, employmentTypes, searchQuery, setSearchQuery, filters, setFilters, saveStatus, saveErrorMessage }) => {
  const [selectedFaculty, setSelectedFaculty] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const pageSize = 10;

  const filteredDepartments = useMemo(() => {
    if (!selectedFaculty) return departments;
    return departments.filter(d => d.facultyId === Number(selectedFaculty));
  }, [selectedFaculty, departments]);

  const professorsToDisplay = useMemo(() => {
    let filtered = data.professorsWithDetails;

    // Multi-select filters
    if (filters.gender.length > 0) {
      filtered = filtered.filter((p: any) => filters.gender.includes(p.gender));
    }
    if (filters.degree.length > 0) {
      filtered = filtered.filter((p: any) => filters.degree.includes(p.degree));
    }
    if (filters.title.length > 0) {
      filtered = filtered.filter((p: any) => filters.title.includes(p.title));
    }
    if (filters.position.length > 0) {
      filtered = filtered.filter((p: any) => filters.position.includes(p.position));
    }
    if (filters.ageRange.length > 0) {
      filtered = filtered.filter((p: any) => {
        const age = getAge(p.birthDate);
        if (age === null) return false;
        return filters.ageRange.some(range => {
          if (range === '<30') return age < 30;
          if (range === '30-39') return age >= 30 && age <= 39;
          if (range === '40-49') return age >= 40 && age <= 49;
          if (range === '50-59') return age >= 50 && age <= 59;
          if (range === '60+') return age >= 60;
          return false;
        });
      });
    }

    // Dropdown filters
    if (selectedDepartment) {
      filtered = filtered.filter((p: any) => p.departmentId === Number(selectedDepartment));
    } else if (selectedFaculty) {
      const deptIds = departments.filter(d => d.facultyId === Number(selectedFaculty)).map(d => d.id);
      filtered = filtered.filter((p: any) => deptIds.includes(p.departmentId));
    }

    // Search query
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((p: any) => 
        getProfessorName(p).toLowerCase().includes(lowercasedQuery) ||
        p.department.name.toLowerCase().includes(lowercasedQuery)
      );
    }
    return filtered;
  }, [data.professorsWithDetails, selectedFaculty, selectedDepartment, departments, searchQuery, filters]);

  const paginatedProfessors = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return professorsToDisplay.slice(startIndex, startIndex + pageSize);
  }, [professorsToDisplay, currentPage, pageSize]);

  const totalPages = Math.ceil(professorsToDisplay.length / pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFaculty, selectedDepartment, filters]);

  // Modals state
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const [activeProfessor, setActiveProfessor] = useState<any>(null);

  // Edit form state
  const [editForm, setEditForm] = useState<any>({});

  // Handlers
  function openEditModal(prof: any) {
    setActiveProfessor(prof);
    setEditForm({
      lastName: prof.lastName,
      firstName: prof.firstName,
      patronymic: prof.patronymic,
      departmentId: prof.departmentId,
      position: prof.position,
      degree: prof.degree,
      title: prof.title,
      phone: prof.phone,
      staffUnit: prof.staffUnit,
      gender: prof.gender,
      birthDate: prof.birthDate,
      employmentType: prof.employmentType,
    });
    setEditModalOpen(true);
  }
  function handleEditChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setEditForm((prev: any) => ({ ...prev, [name]: value }));
  }
  function handleEditSave() {
    setProfessors((prev: any[]) => prev.map(p => p.id === activeProfessor.id ? { ...p, ...editForm, departmentId: Number(editForm.departmentId), staffUnit: Number(editForm.staffUnit) } : p));
    setEditModalOpen(false);
  }
  function handleDelete() {
    setProfessors((prev: any[]) => prev.filter(p => p.id !== activeProfessor.id));
    setAchievements((prev: any[]) => prev.filter(a => a.professorId !== activeProfessor.id));
    setPlans((prev: any[]) => prev.filter(p => p.professorId !== activeProfessor.id));
    setDeleteModalOpen(false);
  }
  function handleEvalSave(updatedAchievements: Achievement[], target: { year: number, quarter: number }) {
    if (!activeProfessor) return;
    const { id: profId } = activeProfessor;
    const { year, quarter } = target;
    const updatedAchievementsForProfessor = updatedAchievements
      .filter(a => a.professorId === profId)
      .map(a => ({ ...a, professorId: profId, year, quarter }));

    setAchievements((prev: any[]) => [
      ...prev.filter(a => !(a.professorId === profId && a.year === year && a.quarter === quarter)),
      ...updatedAchievementsForProfessor
    ]);
  }
  function handlePlanSave(updatedPlan: Plan) {
    setPlans((prev: Plan[]) => {
        const index = prev.findIndex(p => p.professorId === updatedPlan.professorId && p.year === updatedPlan.year);
        if (index !== -1) {
            const newPlans = [...prev];
            newPlans[index] = updatedPlan;
            return newPlans;
        }
        return [...prev, updatedPlan];
    });
  }

  const handleExport = () => {
    const dataToExport = professorsToDisplay.map((prof: any, index: number) => ({
      '№': (currentPage - 1) * pageSize + index + 1,
      'F.I.Sh.': getProfessorName(prof),
      'Jinsi': prof.gender,
      'Tug‘ilgan sana': prof.birthDate,
      'Yoshi': getAge(prof.birthDate),
      'Fakultet': prof.faculty.name,
      'Kafedra': prof.department.name,
      'Lavozimi': prof.position,
      'O‘rindoshlik turi': prof.employmentType,
      'Shtat birligi': prof.staffUnit,
      'Ilmiy darajasi': prof.degree,
      'Ilmiy unvoni': prof.title,
      [`Reja (${selectedYear})`]: prof.annualPlan.toFixed(2),
      [`Amalda (${selectedYear})`]: prof.totalScore.toFixed(2),
      'Bajarilish %': prof.completionPercent.toFixed(1),
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Professor-o'qituvchilar");
    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Professor-o'qituvchilar_${today}.xlsx`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Professor-o'qituvchilar</h1>
          {canEdit && (
            <div className="mt-2 flex items-center gap-2">
              {saveStatus === 'saving' && (
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                  <span className="mr-1 h-2 w-2 animate-pulse rounded-full bg-yellow-600" /> Saqlanmoqda...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                  <span className="mr-1 h-2 w-2 rounded-full bg-green-600" /> Saqlandi
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                  <span className="mr-1 h-2 w-2 rounded-full bg-red-600" /> Saqlashda xato
                </span>
              )}
              {saveErrorMessage && (
                <span className="text-xs text-red-600">{saveErrorMessage}</span>
              )}
            </div>
          )}
        </div>
        {canEdit && (
          <button onClick={handleExport} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
            <FileSpreadsheet size={16} className="mr-2" /> Excelga yuklash
          </button>
        )}
      </div>
      
      <Card className="mb-6">
        <button
          onClick={() => setFiltersVisible(!filtersVisible)}
          className="w-full flex justify-between items-center text-left font-semibold text-gray-700"
        >
          <span className="flex items-center">
            <Filter size={18} className="mr-2" />
            Filtrlar va Qidiruv
          </span>
          {filtersVisible ? <ChevronUp /> : <ChevronDown />}
        </button>
        <AnimatePresence>
          {filtersVisible && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: '16px' }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="F.I.Sh. yoki kafedra bo'yicha qidiruv..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fakultetni tanlang</label>
                  <select
                    value={selectedFaculty}
                    onChange={e => { setSelectedFaculty(e.target.value); setSelectedDepartment(''); }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white border"
                  >
                    <option value="">Barcha fakultetlar</option>
                    {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kafedrani tanlang</label>
                  <select
                    value={selectedDepartment}
                    onChange={e => setSelectedDepartment(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white border"
                    disabled={!selectedFaculty && filteredDepartments.length !== departments.length}
                  >
                    <option value="">Barcha kafedralar</option>
                    {filteredDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <ProfessorFilterControls filters={filters} onFilterChange={setFilters} positions={positions} />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3">№</th>
                <th className="px-4 py-3">F.I.Sh.</th>
                <th className="px-4 py-3">Jinsi</th>
                <th className="px-4 py-3">Tug'ilgan sana</th>
                <th className="px-4 py-3">Yoshi</th>
                <th className="px-4 py-3">Fakultet</th>
                <th className="px-4 py-3">Kafedra</th>
                <th className="px-4 py-3">Lavozimi</th>
                <th className="px-4 py-3">O'rindoshlik</th>
                <th className="px-4 py-3">Shtat</th>
                <th className="px-4 py-3">Ilmiy Daraja</th>
                <th className="px-4 py-3">Ilmiy Unvon</th>
                <th className="px-4 py-3 text-right">Reja ({selectedYear})</th>
                <th className="px-4 py-3 text-right">Amalda ({selectedYear})</th>
                <th className="px-4 py-3 text-right">Bajarilish %</th>
                {canEdit && <th className="px-4 py-3 text-right">Amallar</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedProfessors.map((prof: any, index: number) => (
                <tr key={prof.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-700">{(currentPage - 1) * pageSize + index + 1}</td>
                  <th className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">{getProfessorName(prof)}</th>
                  <td className="px-4 py-2 capitalize">{prof.gender}</td>
                  <td className="px-4 py-2">{prof.birthDate}</td>
                  <td className="px-4 py-2">{getAge(prof.birthDate)}</td>
                  <td className="px-4 py-2">{prof.faculty.name}</td>
                  <td className="px-4 py-2">{prof.department.name}</td>
                  <td className="px-4 py-2">{prof.position}</td>
                  <td className="px-4 py-2">{prof.employmentType}</td>
                  <td className="px-4 py-2">{prof.staffUnit.toFixed(2)}</td>
                  <td className="px-4 py-2">{prof.degree !== 'Yo‘q' ? prof.degree : '-'}</td>
                  <td className="px-4 py-2">{prof.title !== 'Yo‘q' ? prof.title : '-'}</td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-700">{prof.annualPlan.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right font-bold text-blue-600">{prof.totalScore.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right font-bold text-green-600">{prof.completionPercent.toFixed(1)}%</td>
                  {canEdit && (
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button className="inline-flex items-center text-orange-600 hover:text-orange-800 mr-2" title="Rejalashtirish" onClick={() => { setActiveProfessor(prof); setPlanModalOpen(true); }}>
                        <ClipboardList size={18} />
                      </button>
                      <button className="inline-flex items-center text-blue-600 hover:text-blue-800 mr-2" title="Baholash" onClick={() => { setActiveProfessor(prof); setEvalModalOpen(true); }}>
                        <Eye size={18} />
                      </button>
                      <button className="inline-flex items-center text-green-600 hover:text-green-800 mr-2" title="Tahrirlash" onClick={() => openEditModal(prof)}>
                        <Edit size={18} />
                      </button>
                      <button className="inline-flex items-center text-red-600 hover:text-red-800" title="O'chirish" onClick={() => { setActiveProfessor(prof); setDeleteModalOpen(true); }}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </Card>
      {/* Modals */}
      {canEdit && activeProfessor && (
        <>
          <ProfessorPlanModal
            open={planModalOpen}
            onClose={() => setPlanModalOpen(false)}
            professor={activeProfessor}
            plans={plans}
            onSave={handlePlanSave}
            year={selectedYear}
            scoringSystem={scoringSystem}
            getScore={getScore}
          />
          <ProfessorEvaluationModal
            open={evalModalOpen}
            onClose={() => setEvalModalOpen(false)}
            professor={activeProfessor}
            achievements={achievements}
            onSave={handleEvalSave}
            year={selectedYear}
            scoringSystem={scoringSystem}
            getScore={getScore}
          />
          <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} className="max-w-4xl">
            <h2 className="text-lg font-bold mb-2">Professorni tahrirlash</h2>
            <form className="space-y-2" onSubmit={e => { e.preventDefault(); handleEditSave(); }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-sm">Familiyasi</label><input type="text" name="lastName" value={editForm.lastName} onChange={handleEditChange} className="w-full border rounded p-1" required /></div>
                <div><label className="block text-sm">Ismi</label><input type="text" name="firstName" value={editForm.firstName} onChange={handleEditChange} className="w-full border rounded p-1" required /></div>
                <div><label className="block text-sm">Otasining ismi</label><input type="text" name="patronymic" value={editForm.patronymic} onChange={handleEditChange} className="w-full border rounded p-1" /></div>
                <div><label className="block text-sm">Tug'ilgan sana</label><input type="date" name="birthDate" value={editForm.birthDate} onChange={handleEditChange} className="w-full border rounded p-1" /></div>
                <div><label className="block text-sm">Jinsi</label><select name="gender" value={editForm.gender} onChange={handleEditChange} className="w-full border rounded p-1 bg-white"><option value="erkak">Erkak</option><option value="ayol">Ayol</option></select></div>
                <div><label className="block text-sm">Kafedra</label><select name="departmentId" value={editForm.departmentId} onChange={handleEditChange} className="w-full border rounded p-1 bg-white" required>{departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                <div><label className="block text-sm">Lavozimi</label><select name="position" value={editForm.position} onChange={handleEditChange} className="w-full border rounded p-1 bg-white">{positions.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                <div><label className="block text-sm">O'rindoshlik</label><select name="employmentType" value={editForm.employmentType} onChange={handleEditChange} className="w-full border rounded p-1 bg-white">{employmentTypes.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                <div><label className="block text-sm">Ilmiy darajasi</label><select name="degree" value={editForm.degree} onChange={handleEditChange} className="w-full border rounded p-1 bg-white"><option>Yo‘q</option><option>PhD</option><option>DSc</option></select></div>
                <div><label className="block text-sm">Ilmiy unvoni</label><select name="title" value={editForm.title} onChange={handleEditChange} className="w-full border rounded p-1 bg-white"><option>Yo‘q</option><option>Dotsent</option><option>Professor</option></select></div>
                <div><label className="block text-sm">Telefon</label><input type="text" name="phone" value={editForm.phone} onChange={handleEditChange} className="w-full border rounded p-1" /></div>
                <div><label className="block text-sm">Stavka</label><input type="number" name="staffUnit" value={editForm.staffUnit} onChange={handleEditChange} step="0.25" min="0" className="w-full border rounded p-1" /></div>
              </div>
              <div className="flex justify-end mt-4 space-x-2">
                <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setEditModalOpen(false)}>Bekor qilish</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Saqlash</button>
              </div>
            </form>
          </Modal>
          <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
            <h2 className="text-lg font-bold mb-2">O'chirishni tasdiqlang</h2>
            <p>Haqiqatan ham <b>{activeProfessor && getProfessorName(activeProfessor)}</b> ni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.</p>
            <div className="flex justify-end mt-4 space-x-2">
              <button className="px-4 py-2 rounded bg-gray-200" onClick={() => setDeleteModalOpen(false)}>Bekor qilish</button>
              <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={handleDelete}>O'chirish</button>
            </div>
          </Modal>
        </>
      )}
    </motion.div>
  );
};

const DataManagementPage: React.FC<{
  user: User;
  faculties: Faculty[];
  setFaculties: React.Dispatch<React.SetStateAction<Faculty[]>>;
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  divisions: Division[];
  setDivisions: React.Dispatch<React.SetStateAction<Division[]>>;
  professors: Professor[];
  setProfessors: React.Dispatch<React.SetStateAction<Professor[]>>;
  positions: string[];
  setPositions: React.Dispatch<React.SetStateAction<string[]>>;
  employmentTypes: string[];
  achievements: Achievement[];
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>;
  plans: Plan[];
  setPlans: React.Dispatch<React.SetStateAction<Plan[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  projectTypes: string[];
  projectDirections: string[];
  projectLeaderPositions: string[];
  projectDurations: number[];
  scoringSystem: ScoringSystem;
  setScoringSystem: React.Dispatch<React.SetStateAction<ScoringSystem>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  searchQuery: string;
  thesisDefenses: ThesisDefense[];
  setThesisDefenses: React.Dispatch<React.SetStateAction<ThesisDefense[]>>;
  specialties: string[];
  fieldsOfScience: string[];
  defenseTypes: string[];
}> = ({ user, faculties, setFaculties, departments, setDepartments, divisions, setDivisions, professors, setProfessors, positions, setPositions, employmentTypes, setAchievements, setPlans, projects, setProjects, projectTypes, projectDirections, projectLeaderPositions, projectDurations, scoringSystem, setScoringSystem, users, setUsers, searchQuery, thesisDefenses, setThesisDefenses, specialties, fieldsOfScience, defenseTypes }) => {

  const tabs = [
    { id: 'faculties', label: 'Fakultetlar', icon: Building },
    { id: 'departments', label: 'Kafedralar', icon: GraduationCap },
    { id: 'divisions', label: 'Bo\'limlar', icon: BookCopy },
    { id: 'positions', label: 'Lavozimlar', icon: Briefcase },
    { id: 'professors', label: 'Professorlar', icon: UserPlus },
    { id: 'projects', label: 'Loyiha va Startaplar', icon: Rocket },
    { id: 'defenses', label: 'Dissertatsiya himoyalari', icon: Award },
    { id: 'criteria', label: 'Mezonlar', icon: ClipboardList },
    { id: 'users', label: 'Foydalanuvchilar', icon: UserCog },
  ];

  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');

  // Form states
  const [facultyName, setFacultyName] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptFacultyId, setDeptFacultyId] = useState<number | string>(faculties[0]?.id || '');
  const [divisionName, setDivisionName] = useState('');
  const [positionName, setPositionName] = useState('');
  const [profForm, setProfForm] = useState({
    lastName: '', firstName: '', patronymic: '', departmentId: departments[0]?.id || '' as number | string,
    position: positions[0] || '', degree: 'Yo‘q', title: 'Yo‘q', phone: '', staffUnit: 1.0, gender: 'erkak', birthDate: '', employmentType: employmentTypes[0] || 'Asosiy'
  });
  const [projForm, setProjForm] = useState({
    name: '', type: projectTypes[0], direction: projectDirections[0], leaderPosition: projectLeaderPositions[0], leaderName: '',
    facultyId: '' as number | string, departmentId: '' as number | string,
    totalFunding: 0, duration: projectDurations[0]
  });
  const [defenseForm, setDefenseForm] = useState<Omit<ThesisDefense, 'id'>>({
    lastName: '', firstName: '', patronymic: '', facultyId: '' as any, departmentId: '' as any, specialty: specialties[0],
    type: 'PhD', fieldOfScience: fieldsOfScience[0], thesisTopic: '', supervisor: '', defenseOrganization: '',
    councilNumber: '', defenseDate: ''
  });
  const [criterionForm, setCriterionForm] = useState({ type: '', subType: '', score: '', description: '' });
  const [userForm, setUserForm] = useState({ username: '', role: 'guest' });

  // Edit/Delete modals
  const [editFacultyModal, setEditFacultyModal] = useState<{ open: boolean, faculty: any }>({ open: false, faculty: null });
  const [editFacultyName, setEditFacultyName] = useState('');
  const [deleteFacultyModal, setDeleteFacultyModal] = useState<{ open: boolean, faculty: any }>({ open: false, faculty: null });

  const [editDeptModal, setEditDeptModal] = useState<{ open: boolean, dept: any }>({ open: false, dept: null });
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptFacultyId, setEditDeptFacultyId] = useState<any>('');
  const [deleteDeptModal, setDeleteDeptModal] = useState<{ open: boolean, dept: any }>({ open: false, dept: null });

  const [editDivisionModal, setEditDivisionModal] = useState<{ open: boolean, division: any }>({ open: false, division: null });
  const [editDivisionName, setEditDivisionName] = useState('');
  const [deleteDivisionModal, setDeleteDivisionModal] = useState<{ open: boolean, division: any }>({ open: false, division: null });

  const [editPositionModal, setEditPositionModal] = useState<{ open: boolean, oldName: string }>({ open: false, oldName: '' });
  const [editPositionName, setEditPositionName] = useState('');
  const [deletePositionModal, setDeletePositionModal] = useState<{ open: boolean, name: string }>({ open: false, name: '' });

  const [editProjectModal, setEditProjectModal] = useState<{ open: boolean, project: any }>({ open: false, project: null });
  const [editProjForm, setEditProjForm] = useState<any>({});
  const [deleteProjectModal, setDeleteProjectModal] = useState<{ open: boolean, project: any }>({ open: false, project: null });

  const [editDefenseModal, setEditDefenseModal] = useState<{ open: boolean, defense: ThesisDefense | null }>({ open: false, defense: null });
  const [editDefenseForm, setEditDefenseForm] = useState<any>({});
  const [deleteDefenseModal, setDeleteDefenseModal] = useState<{ open: boolean, defense: ThesisDefense | null }>({ open: false, defense: null });

  const [editCriterionModal, setEditCriterionModal] = useState<{ open: boolean, type: string, subType: string, data: any }>({ open: false, type: '', subType: '', data: null });
  const [deleteCriterionModal, setDeleteCriterionModal] = useState<{ open: boolean, type: string, subType: string }>({ open: false, type: '', subType: '' });
  const [editCriterionTypeModal, setEditCriterionTypeModal] = useState<{ open: boolean, oldType: string, newType: string }>({ open: false, oldType: '', newType: '' });

  const [editUserModal, setEditUserModal] = useState<{ open: boolean, user: any }>({ open: false, user: null });
  const [deleteUserModal, setDeleteUserModal] = useState<{ open: boolean, user: any }>({ open: false, user: null });

  const filteredFaculties = useMemo(() => faculties.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())), [faculties, searchQuery]);
  const filteredDepartments = useMemo(() => departments.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())), [departments, searchQuery]);
  const filteredDivisions = useMemo(() => divisions.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())), [divisions, searchQuery]);
  const filteredPositions = useMemo(() => positions.filter(p => p.toLowerCase().includes(searchQuery.toLowerCase())), [positions, searchQuery]);
  const filteredProjects = useMemo(() => projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())), [projects, searchQuery]);
  const filteredDefenses = useMemo(() => thesisDefenses.filter(d => getProfessorName(d).toLowerCase().includes(searchQuery.toLowerCase())), [thesisDefenses, searchQuery]);
  const filteredCriteria = useMemo(() => {
      if (!searchQuery) return scoringSystem;
      const lowerQuery = searchQuery.toLowerCase();
      const filtered: ScoringSystem = {};
      for (const type in scoringSystem) {
          if (type.replace(/_/g, ' ').toLowerCase().includes(lowerQuery)) {
              // @ts-ignore
              filtered[type] = scoringSystem[type];
              continue;
          }
          // @ts-ignore
          const subTypes = scoringSystem[type];
          const matchingSubTypes: { [key: string]: any } = {};
          for (const subType in subTypes) {
              if (subType.toLowerCase().includes(lowerQuery) || subTypes[subType].description.toLowerCase().includes(lowerQuery)) {
                  matchingSubTypes[subType] = subTypes[subType];
              }
          }
          if (Object.keys(matchingSubTypes).length > 0) {
              // @ts-ignore
              if (!filtered[type]) filtered[type] = {};
              // @ts-ignore
              Object.assign(filtered[type], matchingSubTypes);
          }
      }
      return filtered;
  }, [scoringSystem, searchQuery]);
  const filteredUsers = useMemo(() => users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase())), [users, searchQuery]);

  // CRUD Handlers
  const handleAddFaculty = (e: React.FormEvent) => { e.preventDefault(); if (!facultyName) return; setFaculties(p => [...p, { id: Date.now(), name: facultyName }]); setFacultyName(''); };
  const handleEditFaculty = () => { setFaculties(p => p.map(f => f.id === editFacultyModal.faculty.id ? { ...f, name: editFacultyName } : f)); setEditFacultyModal({ open: false, faculty: null }); };
  const handleDeleteFaculty = () => { setFaculties(p => p.filter(f => f.id !== deleteFacultyModal.faculty.id)); setDepartments(p => p.filter(d => d.facultyId !== deleteFacultyModal.faculty.id)); setDeleteFacultyModal({ open: false, faculty: null }); };

  const handleAddDepartment = (e: React.FormEvent) => { e.preventDefault(); if (!deptName || !deptFacultyId) return; setDepartments(p => [...p, { id: Date.now(), name: deptName, facultyId: Number(deptFacultyId) }]); setDeptName(''); setDeptFacultyId(faculties[0]?.id || ''); };
  const handleEditDept = () => { setDepartments(p => p.map(d => d.id === editDeptModal.dept.id ? { ...d, name: editDeptName, facultyId: Number(editDeptFacultyId) } : d)); setEditDeptModal({ open: false, dept: null }); };
  const handleDeleteDept = () => { setDepartments(p => p.filter(d => d.id !== deleteDeptModal.dept.id)); setProfessors(p => p.filter(prof => prof.departmentId !== deleteDeptModal.dept.id)); setDeleteDeptModal({ open: false, dept: null }); };

  const handleAddDivision = (e: React.FormEvent) => { e.preventDefault(); if (!divisionName) return; setDivisions(p => [...p, { id: Date.now(), name: divisionName }]); setDivisionName(''); };
  const handleEditDivision = () => { setDivisions(p => p.map(d => d.id === editDivisionModal.division.id ? { ...d, name: editDivisionName } : d)); setEditDivisionModal({ open: false, division: null }); };
  const handleDeleteDivision = () => { setDivisions(p => p.filter(d => d.id !== deleteDivisionModal.division.id)); setDeleteDivisionModal({ open: false, division: null }); };

  const handleAddPosition = (e: React.FormEvent) => { e.preventDefault(); if (!positionName || positions.includes(positionName)) return; setPositions(p => [...p, positionName]); setPositionName(''); };
  const handleEditPosition = () => { const { oldName } = editPositionModal; setPositions(p => p.map(pos => pos === oldName ? editPositionName : pos)); setProfessors(profs => profs.map(prof => prof.position === oldName ? { ...prof, position: editPositionName } : prof)); setEditPositionModal({ open: false, oldName: '' }); };
  const handleDeletePosition = () => { setPositions(p => p.filter(pos => pos !== deletePositionModal.name)); setDeletePositionModal({ open: false, name: '' }); };

  const handleAddProfessor = (e: React.FormEvent) => { e.preventDefault(); if (!profForm.lastName || !profForm.firstName || !profForm.departmentId) return; const newProfessor: any = { id: Date.now(), ...profForm, departmentId: Number(profForm.departmentId), staffUnit: Number(profForm.staffUnit) }; setProfessors(p => [...p, newProfessor]); setProfForm({ lastName: '', firstName: '', patronymic: '', departmentId: departments[0]?.id || '', position: positions[0] || '', degree: 'Yo‘q', title: 'Yo‘q', phone: '', staffUnit: 1.0, gender: 'erkak', birthDate: '', employmentType: employmentTypes[0] || 'Asosiy' }); };
  const handleProfFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { const { name, value } = e.target; setProfForm(p => ({ ...p, [name]: value })); };

  const handleAddProject = (e: React.FormEvent) => { e.preventDefault(); if (!projForm.name || !projForm.leaderName || !projForm.departmentId || !projForm.facultyId) return; const newProject: Project = { id: Date.now(), ...projForm, facultyId: Number(projForm.facultyId), departmentId: Number(projForm.departmentId), totalFunding: Number(projForm.totalFunding), duration: Number(projForm.duration) }; setProjects(p => [...p, newProject]); setProjForm({ name: '', type: projectTypes[0], direction: projectDirections[0], leaderPosition: projectLeaderPositions[0], leaderName: '', facultyId: '', departmentId: '', totalFunding: 0, duration: projectDurations[0] }); };
  const handleEditProject = () => { setProjects(p => p.map(proj => proj.id === editProjectModal.project.id ? { ...proj, ...editProjForm, facultyId: Number(editProjForm.facultyId), departmentId: Number(editProjForm.departmentId), totalFunding: Number(editProjForm.totalFunding), duration: Number(editProjForm.duration) } : proj)); setEditProjectModal({ open: false, project: null }); };
  const handleDeleteProject = () => { setProjects(p => p.filter(proj => proj.id !== deleteProjectModal.project.id)); setDeleteProjectModal({ open: false, project: null }); };
  const handleProjFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { const { name, value } = e.target; setProjForm(p => { const newState = { ...p, [name]: value }; if (name === 'facultyId') { newState.departmentId = ''; } if (name === 'leaderPosition' && value !== 'Professor-o‘qituvchi') { newState.leaderName = ''; } return newState; }); };
  const handleEditProjFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { const { name, value } = e.target; setEditProjForm((p: any) => { const newState = { ...p, [name]: value }; if (name === 'facultyId') { newState.departmentId = ''; } if (name === 'leaderPosition' && value !== 'Professor-o‘qituvchi') { newState.leaderName = ''; } return newState; }); };
  const filteredDeptsForForm = useMemo(() => { if (!projForm.facultyId) return []; return departments.filter(d => d.facultyId === Number(projForm.facultyId)); }, [projForm.facultyId, departments]);
  const filteredDeptsForEditForm = useMemo(() => { if (!editProjForm.facultyId) return []; return departments.filter(d => d.facultyId === Number(editProjForm.facultyId)); }, [editProjForm.facultyId, departments]);

  const handleAddCriterion = (e: React.FormEvent) => { e.preventDefault(); const { type, subType, score, description } = criterionForm; if (!type || !subType || !score) return; setScoringSystem((p: ScoringSystem) => { const n = JSON.parse(JSON.stringify(p)); if (!n[type]) n[type] = {}; n[type][subType] = { score: Number(score), description }; return n; }); setCriterionForm({ type: '', subType: '', score: '', description: '' }); };
  const handleEditCriterion = () => { const { type, subType, data } = editCriterionModal; setScoringSystem((p: ScoringSystem) => { const n = JSON.parse(JSON.stringify(p)); n[type][subType] = { score: Number(data.score), description: data.description }; return n; }); setEditCriterionModal({ open: false, type: '', subType: '', data: null }); };
  const handleDeleteCriterion = () => { const { type, subType } = deleteCriterionModal; setScoringSystem((p: ScoringSystem) => { const n = JSON.parse(JSON.stringify(p)); delete n[type][subType]; if (Object.keys(n[type]).length === 0) delete n[type]; return n; }); setDeleteCriterionModal({ open: false, type: '', subType: '' }); };
  const handleEditCriterionType = () => {
    const { oldType, newType } = editCriterionTypeModal;
    if (!newType || oldType === newType) {
      setEditCriterionTypeModal({ open: false, oldType: '', newType: '' });
      return;
    }

    setScoringSystem((prev: ScoringSystem) => {
      const newSystem = { ...prev };
      if (newSystem[oldType]) {
        newSystem[newType] = newSystem[oldType];
        delete newSystem[oldType];
      }
      return newSystem;
    });

    setAchievements(prev => prev.map(ach => 
      ach.type === oldType ? { ...ach, type: newType } : ach
    ));

    setPlans(prev => prev.map(plan => ({
      ...plan,
      planItems: plan.planItems.map(item => 
        item.type === oldType ? { ...item, type: newType } : item
      )
    })));
    
    setEditCriterionTypeModal({ open: false, oldType: '', newType: '' });
  };

  const handleAddUser = (e: React.FormEvent) => { e.preventDefault(); if (!userForm.username) return; const newUser: any = { id: Date.now(), username: userForm.username, role: userForm.role }; setUsers((p: User[]) => [...p, newUser]); setUserForm({ username: '', role: 'guest' }); };
  const handleEditUser = () => { setEditUserModal({ open: false, user: null }); };
  const handleDeleteUser = () => { setUsers(p => p.filter(u => u.id !== deleteUserModal.user.id)); setDeleteUserModal({ open: false, user: null }); };

  const handleDefenseFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDefenseForm(p => {
      const newState = { ...p, [name]: value };
      if (name === 'facultyId') {
        newState.departmentId = '' as any;
      }
      return newState;
    });
  };
  const handleAddDefense = (e: React.FormEvent) => {
    e.preventDefault();
    const newDefense = { ...defenseForm, id: Date.now(), facultyId: Number(defenseForm.facultyId), departmentId: Number(defenseForm.departmentId) };
    setThesisDefenses(p => [...p, newDefense]);
    setDefenseForm({
      lastName: '', firstName: '', patronymic: '', facultyId: '' as any, departmentId: '' as any, specialty: specialties[0],
      type: 'PhD', fieldOfScience: fieldsOfScience[0], thesisTopic: '', supervisor: '', defenseOrganization: '',
      councilNumber: '', defenseDate: ''
    });
  };
  const handleEditDefenseFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditDefenseForm((p: any) => {
      const newState = { ...p, [name]: value };
      if (name === 'facultyId') {
        newState.departmentId = '' as any;
      }
      return newState;
    });
  };
  const handleEditDefense = () => {
    if (!editDefenseModal.defense) return;
    setThesisDefenses(p => p.map(d => d.id === editDefenseModal.defense!.id ? { ...editDefenseForm, facultyId: Number(editDefenseForm.facultyId), departmentId: Number(editDefenseForm.departmentId) } : d));
    setEditDefenseModal({ open: false, defense: null });
  };
  const handleDeleteDefense = () => {
    if (!deleteDefenseModal.defense) return;
    setThesisDefenses(p => p.filter(d => d.id !== deleteDefenseModal.defense!.id));
    setDeleteDefenseModal({ open: false, defense: null });
  };
  const filteredDeptsForDefenseForm = useMemo(() => {
    if (!defenseForm.facultyId) return [];
    return departments.filter(d => d.facultyId === Number(defenseForm.facultyId));
  }, [defenseForm.facultyId, departments]);
  const filteredDeptsForEditDefenseForm = useMemo(() => {
    if (!editDefenseForm.facultyId) return [];
    return departments.filter(d => d.facultyId === Number(editDefenseForm.facultyId));
  }, [editDefenseForm.facultyId, departments]);

  const renderContent = () => {
    switch(activeTab) {
      case 'faculties': return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4">Yangi fakultet qo'shish</h3>
              <form onSubmit={handleAddFaculty} className="space-y-4">
                <input type="text" placeholder="Fakultet nomi" value={facultyName} onChange={e => setFacultyName(e.target.value)} className="w-full p-2 border rounded" required />
                <button type="submit" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"><PlusCircle size={16} className="mr-2" /> Qo'shish</button>
              </form>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold mb-4">Mavjud fakultetlar</h3>
              <ul className="space-y-2 max-h-96 overflow-y-auto">{filteredFaculties.map(f => (
                <li key={f.id} className="p-3 bg-gray-50 rounded-md flex justify-between items-center"><span>{f.name}</span>
                  <span>
                    <button onClick={() => { setEditFacultyModal({ open: true, faculty: f }); setEditFacultyName(f.name); }} className="text-green-600 mr-2"><Edit size={16} /></button>
                    <button onClick={() => setDeleteFacultyModal({ open: true, faculty: f })} className="text-red-600"><Trash2 size={16} /></button>
                  </span>
                </li>))}
              </ul>
            </Card>
            <Modal open={editFacultyModal.open} onClose={() => setEditFacultyModal({ open: false, faculty: null })}>
              <h2 className="text-lg font-bold mb-2">Fakultetni tahrirlash</h2>
              <input type="text" className="w-full border rounded p-2 mb-2" value={editFacultyName} onChange={e => setEditFacultyName(e.target.value)} />
              <div className="flex justify-end"><button onClick={() => setEditFacultyModal({ open: false, faculty: null })} className="px-4 py-2 rounded bg-gray-200 mr-2">Bekor</button><button onClick={handleEditFaculty} className="px-4 py-2 rounded bg-blue-600 text-white">Saqlash</button></div>
            </Modal>
            <Modal open={deleteFacultyModal.open} onClose={() => setDeleteFacultyModal({ open: false, faculty: null })}>
              <h2 className="text-lg font-bold mb-2">O'chirishni tasdiqlang</h2>
              <p><b>{deleteFacultyModal.faculty?.name}</b> fakultetini o'chirishga ishonchingiz komilmi? Bu fakultetga tegishli barcha kafedralar ham o'chiriladi.</p>
              <div className="flex justify-end mt-4"><button onClick={() => setDeleteFacultyModal({ open: false, faculty: null })} className="px-4 py-2 rounded bg-gray-200 mr-2">Bekor</button><button onClick={handleDeleteFaculty} className="px-4 py-2 rounded bg-red-600 text-white">O'chirish</button></div>
            </Modal>
          </div>
      );
      case 'departments': return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4">Yangi kafedra qo'shish</h3>
              <form onSubmit={handleAddDepartment} className="space-y-4">
                <input type="text" placeholder="Kafedra nomi" value={deptName} onChange={e => setDeptName(e.target.value)} className="w-full p-2 border rounded" required />
                <select value={deptFacultyId} onChange={e => setDeptFacultyId(e.target.value)} className="w-full p-2 bg-white border rounded" required>
                  <option value="" disabled>Fakultetni tanlang</option>
                  {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                <button type="submit" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"><PlusCircle size={16} className="mr-2" /> Qo'shish</button>
              </form>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold mb-4">Mavjud kafedralar</h3>
              <ul className="space-y-2 max-h-96 overflow-y-auto">{filteredDepartments.map(d => (
                <li key={d.id} className="p-3 bg-gray-50 rounded-md flex justify-between items-center">
                  <span><span className="font-semibold">{d.name}</span><span className="text-xs text-gray-500 ml-2">{faculties.find(f => f.id === d.facultyId)?.name}</span></span>
                  <span>
                    <button onClick={() => { setEditDeptModal({ open: true, dept: d }); setEditDeptName(d.name); setEditDeptFacultyId(d.facultyId); }} className="text-green-600 mr-2"><Edit size={16} /></button>
                    <button onClick={() => setDeleteDeptModal({ open: true, dept: d })} className="text-red-600"><Trash2 size={16} /></button>
                  </span>
                </li>))}
              </ul>
            </Card>
            <Modal open={editDeptModal.open} onClose={() => setEditDeptModal({ open: false, dept: null })}>
              <h2 className="text-lg font-bold mb-2">Kafedrani tahrirlash</h2>
              <input type="text" className="w-full border rounded p-2 mb-2" value={editDeptName} onChange={e => setEditDeptName(e.target.value)} />
              <select className="w-full border rounded p-2 mb-2 bg-white" value={editDeptFacultyId} onChange={e => setEditDeptFacultyId(e.target.value)}>{faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
              <div className="flex justify-end"><button onClick={() => setEditDeptModal({ open: false, dept: null })} className="px-4 py-2 rounded bg-gray-200 mr-2">Bekor</button><button onClick={handleEditDept} className="px-4 py-2 rounded bg-blue-600 text-white">Saqlash</button></div>
            </Modal>
            <Modal open={deleteDeptModal.open} onClose={() => setDeleteDeptModal({ open: false, dept: null })}>
              <h2 className="text-lg font-bold mb-2">O'chirishni tasdiqlang</h2>
              <p><b>{deleteDeptModal.dept?.name}</b> kafedrasini o'chirishga ishonchingiz komilmi? Bu kafedraga tegishli professorlar ham o'chiriladi.</p>
              <div className="flex justify-end mt-4"><button onClick={() => setDeleteDeptModal({ open: false, dept: null })} className="px-4 py-2 rounded bg-gray-200 mr-2">Bekor</button><button onClick={handleDeleteDept} className="px-4 py-2 rounded bg-red-600 text-white">O'chirish</button></div>
            </Modal>
          </div>
      );
      case 'divisions': return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4">Yangi bo'lim qo'shish</h3>
              <form onSubmit={handleAddDivision} className="space-y-4">
                <input type="text" placeholder="Bo'lim nomi" value={divisionName} onChange={e => setDivisionName(e.target.value)} className="w-full p-2 border rounded" required />
                <button type="submit" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"><PlusCircle size={16} className="mr-2" /> Qo'shish</button>
              </form>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold mb-4">Mavjud bo'limlar</h3>
              <ul className="space-y-2 max-h-96 overflow-y-auto">{filteredDivisions.map(d => (
                <li key={d.id} className="p-3 bg-gray-50 rounded-md flex justify-between items-center"><span>{d.name}</span>
                  <span>
                    <button onClick={() => { setEditDivisionModal({ open: true, division: d }); setEditDivisionName(d.name); }} className="text-green-600 mr-2"><Edit size={16} /></button>
                    <button onClick={() => setDeleteDivisionModal({ open: true, division: d })} className="text-red-600"><Trash2 size={16} /></button>
                  </span>
                </li>))}
              </ul>
            </Card>
            <Modal open={editDivisionModal.open} onClose={() => setEditDivisionModal({ open: false, division: null })}>
              <h2 className="text-lg font-bold mb-2">Bo'limni tahrirlash</h2>
              <input type="text" className="w-full border rounded p-2 mb-2" value={editDivisionName} onChange={e => setEditDivisionName(e.target.value)} />
              <div className="flex justify-end"><button onClick={() => setEditDivisionModal({ open: false, division: null })} className="px-4 py-2 rounded bg-gray-200 mr-2">Bekor</button><button onClick={handleEditDivision} className="px-4 py-2 rounded bg-blue-600 text-white">Saqlash</button></div>
            </Modal>
            <Modal open={deleteDivisionModal.open} onClose={() => setDeleteDivisionModal({ open: false, division: null })}>
              <h2 className="text-lg font-bold mb-2">O'chirishni tasdiqlang</h2>
              <p><b>{deleteDivisionModal.division?.name}</b> bo'limini o'chirishga ishonchingiz komilmi?</p>
              <div className="flex justify-end mt-4"><button onClick={() => setDeleteDivisionModal({ open: false, division: null })} className="px-4 py-2 rounded bg-gray-200 mr-2">Bekor</button><button onClick={handleDeleteDivision} className="px-4 py-2 rounded bg-red-600 text-white">O'chirish</button></div>
            </Modal>
          </div>
      );
      case 'positions': return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4">Yangi lavozim qo'shish</h3>
              <form onSubmit={handleAddPosition} className="space-y-4">
                <input type="text" placeholder="Lavozim nomi" value={positionName} onChange={e => setPositionName(e.target.value)} className="w-full p-2 border rounded" required />
                <button type="submit" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"><PlusCircle size={16} className="mr-2" /> Qo'shish</button>
              </form>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold mb-4">Mavjud lavozimlar</h3>
              <ul className="space-y-2 max-h-96 overflow-y-auto">{filteredPositions.map(p => (
                <li key={p} className="p-3 bg-gray-50 rounded-md flex justify-between items-center"><span>{p}</span>
                  <span>
                    <button onClick={() => { setEditPositionModal({ open: true, oldName: p }); setEditPositionName(p); }} className="text-green-600 mr-2"><Edit size={16} /></button>
                    <button onClick={() => setDeletePositionModal({ open: true, name: p })} className="text-red-600"><Trash2 size={16} /></button>
                  </span>
                </li>))}
              </ul>
            </Card>
            <Modal open={editPositionModal.open} onClose={() => setEditPositionModal({ open: false, oldName: '' })}>
              <h2 className="text-lg font-bold mb-2">Lavozimni tahrirlash</h2>
              <input type="text" className="w-full border rounded p-2 mb-2" value={editPositionName} onChange={e => setEditPositionName(e.target.value)} />
              <div className="flex justify-end"><button onClick={() => setEditPositionModal({ open: false, oldName: '' })} className="px-4 py-2 rounded bg-gray-200 mr-2">Bekor</button><button onClick={handleEditPosition} className="px-4 py-2 rounded bg-blue-600 text-white">Saqlash</button></div>
            </Modal>
            <Modal open={deletePositionModal.open} onClose={() => setDeletePositionModal({ open: false, name: '' })}>
              <h2 className="text-lg font-bold mb-2">O'chirishni tasdiqlang</h2>
              <p><b>{deletePositionModal.name}</b> lavozimini o'chirishga ishonchingiz komilmi? Bu lavozimdagi professorlar ma'lumotiga ta'sir qilishi mumkin.</p>
              <div className="flex justify-end mt-4"><button onClick={() => setDeletePositionModal({ open: false, name: '' })} className="px-4 py-2 rounded bg-gray-200 mr-2">Bekor</button><button onClick={handleDeletePosition} className="px-4 py-2 rounded bg-red-600 text-white">O'chirish</button></div>
            </Modal>
          </div>
      );
      case 'professors': return (
          <Card>
            <h3 className="text-lg font-semibold mb-4">Yangi professor-o'qituvchi qo'shish</h3>
            <form onSubmit={handleAddProfessor} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input type="text" name="lastName" placeholder="Familiyasi" value={profForm.lastName} onChange={handleProfFormChange} className="p-2 border rounded" required />
                <input type="text" name="firstName" placeholder="Ismi" value={profForm.firstName} onChange={handleProfFormChange} className="p-2 border rounded" required />
                <input type="text" name="patronymic" placeholder="Otasining ismi" value={profForm.patronymic} onChange={handleProfFormChange} className="p-2 border rounded" />
                <input type="date" name="birthDate" value={profForm.birthDate} onChange={handleProfFormChange} className="p-2 border rounded" required />
                <select name="gender" value={profForm.gender} onChange={handleProfFormChange} className="p-2 bg-white border rounded"><option value="erkak">Erkak</option><option value="ayol">Ayol</option></select>
                <select name="departmentId" value={profForm.departmentId} onChange={handleProfFormChange} className="p-2 bg-white border rounded" required><option value="" disabled>Kafedrani tanlang</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
                <select name="position" value={profForm.position} onChange={handleProfFormChange} className="p-2 bg-white border rounded" required><option value="" disabled>Lavozimni tanlang</option>{positions.map(p => <option key={p} value={p}>{p}</option>)}</select>
                <select name="employmentType" value={profForm.employmentType} onChange={handleProfFormChange} className="p-2 bg-white border rounded" required><option value="" disabled>O'rindoshlik turini tanlang</option>{employmentTypes.map(p => <option key={p} value={p}>{p}</option>)}</select>
                <select name="degree" value={profForm.degree} onChange={handleProfFormChange} className="p-2 bg-white border rounded"><option>Yo‘q</option><option>PhD</option><option>DSc</option></select>
                <select name="title" value={profForm.title} onChange={handleProfFormChange} className="p-2 bg-white border rounded"><option>Yo‘q</option><option>Dotsent</option><option>Professor</option></select>
                <input type="text" name="phone" placeholder="Telefon" value={profForm.phone} onChange={handleProfFormChange} className="p-2 border rounded" />
                <input type="number" name="staffUnit" placeholder="Stavka" value={profForm.staffUnit} onChange={handleProfFormChange} step="0.25" min="0" className="p-2 border rounded" />
              </div>
              <button type="submit" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"><PlusCircle size={16} className="mr-2" /> Qo'shish</button>
            </form>
          </Card>
      );
      case 'projects': return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Yangi loyiha/startap qo'shish</h3>
            <form onSubmit={handleAddProject} className="space-y-4">
              <input type="text" name="name" placeholder="Loyiha / Startap nomi" value={projForm.name} onChange={handleProjFormChange} className="w-full p-2 border rounded" required />
              <select name="type" value={projForm.type} onChange={handleProjFormChange} className="w-full p-2 bg-white border rounded">{projectTypes.map(t => <option key={t} value={t}>{t}</option>)}</select>
              <select name="direction" value={projForm.direction} onChange={handleProjFormChange} className="w-full p-2 bg-white border rounded">{projectDirections.map(d => <option key={d} value={d}>{d}</option>)}</select>
              <select name="leaderPosition" value={projForm.leaderPosition} onChange={handleProjFormChange} className="w-full p-2 bg-white border rounded">{projectLeaderPositions.map(p => <option key={p} value={p}>{p}</option>)}</select>
              {projForm.leaderPosition === 'Professor-o‘qituvchi' ? (
                <select name="leaderName" value={projForm.leaderName} onChange={handleProjFormChange} className="w-full p-2 bg-white border rounded" required>
                  <option value="" disabled>Rahbarni tanlang</option>
                  {professors.map(p => <option key={p.id} value={getProfessorName(p)}>{getProfessorName(p)}</option>)}
                </select>
              ) : (
                <input type="text" name="leaderName" placeholder="Rahbar F.I.Sh." value={projForm.leaderName} onChange={handleProjFormChange} className="w-full p-2 border rounded" required />
              )}
              <select name="facultyId" value={projForm.facultyId} onChange={handleProjFormChange} className="w-full p-2 bg-white border rounded" required><option value="" disabled>Fakultetni tanlang</option>{faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
              <select name="departmentId" value={projForm.departmentId} onChange={handleProjFormChange} className="w-full p-2 bg-white border rounded" required disabled={!projForm.facultyId}><option value="" disabled>Kafedrani tanlang</option>{filteredDeptsForForm.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
              <input type="number" name="totalFunding" placeholder="Umumiy summa (mln so'm)" value={projForm.totalFunding} onChange={handleProjFormChange} className="w-full p-2 border rounded" required />
              <select name="duration" value={projForm.duration} onChange={handleProjFormChange} className="w-full p-2 bg-white border rounded">{projectDurations.map(d => <option key={d} value={d}>{d} yillik</option>)}</select>
              <button type="submit" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"><PlusCircle size={16} className="mr-2" /> Qo'shish</button>
            </form>
          </Card>
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Mavjud loyiha va startaplar</h3>
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0"><tr><th className="p-2">Nomi</th><th className="p-2">Rahbari</th><th className="p-2">Lavozimi</th><th className="p-2">Summasi</th><th className="p-2">Amallar</th></tr></thead>
                <tbody>{filteredProjects.map(p => (
                  <tr key={p.id} className="border-b">
                    <td className="p-2 font-medium">{p.name}</td>
                    <td className="p-2 text-xs">{p.leaderName}</td>
                    <td className="p-2 text-xs">{p.leaderPosition}</td>
                    <td className="p-2 text-xs">{p.totalFunding} mln</td>
                    <td className="p-2 whitespace-nowrap">
                      <button onClick={() => { setEditProjectModal({ open: true, project: p }); setEditProjForm({...p}); }} className="text-green-600 mr-2"><Edit size={16} /></button>
                      <button onClick={() => setDeleteProjectModal({ open: true, project: p })} className="text-red-600"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Card>
          <Modal open={editProjectModal.open} onClose={() => setEditProjectModal({ open: false, project: null })}>
            <h2 className="text-lg font-bold mb-2">Loyiha/startapni tahrirlash</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleEditProject(); }} className="space-y-2">
              <input type="text" name="name" placeholder="Loyiha / Startap nomi" value={editProjForm.name} onChange={handleEditProjFormChange} className="w-full p-2 border rounded" required />
              <select name="type" value={editProjForm.type} onChange={handleEditProjFormChange} className="w-full p-2 bg-white border rounded">{projectTypes.map(t => <option key={t} value={t}>{t}</option>)}</select>
              <select name="direction" value={editProjForm.direction} onChange={handleEditProjFormChange} className="w-full p-2 bg-white border rounded">{projectDirections.map(d => <option key={d} value={d}>{d}</option>)}</select>
              <select name="leaderPosition" value={editProjForm.leaderPosition} onChange={handleEditProjFormChange} className="w-full p-2 bg-white border rounded">{projectLeaderPositions.map(p => <option key={p} value={p}>{p}</option>)}</select>
              {editProjForm.leaderPosition === 'Professor-o‘qituvchi' ? (
                <select name="leaderName" value={editProjForm.leaderName} onChange={handleEditProjFormChange} className="w-full p-2 bg-white border rounded" required>
                  <option value="" disabled>Rahbarni tanlang</option>
                  {professors.map(p => <option key={p.id} value={getProfessorName(p)}>{getProfessorName(p)}</option>)}
                </select>
              ) : (
                <input type="text" name="leaderName" placeholder="Rahbar F.I.Sh." value={editProjForm.leaderName} onChange={handleEditProjFormChange} className="w-full p-2 border rounded" required />
              )}
              <select name="facultyId" value={editProjForm.facultyId} onChange={handleEditProjFormChange} className="w-full p-2 bg-white border rounded" required><option value="" disabled>Fakultetni tanlang</option>{faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
              <select name="departmentId" value={editProjForm.departmentId} onChange={handleEditProjFormChange} className="w-full p-2 bg-white border rounded" required disabled={!editProjForm.facultyId}><option value="" disabled>Kafedrani tanlang</option>{filteredDeptsForEditForm.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
              <input type="number" name="totalFunding" placeholder="Umumiy summa (mln so'm)" value={editProjForm.totalFunding} onChange={handleEditProjFormChange} className="w-full p-2 border rounded" required />
              <select name="duration" value={editProjForm.duration} onChange={handleEditProjFormChange} className="w-full p-2 bg-white border rounded">{projectDurations.map(d => <option key={d} value={d}>{d} yillik</option>)}</select>
              <div className="flex justify-end mt-4"><button type="button" onClick={() => setEditProjectModal({ open: false, project: null })} className="px-4 py-2 rounded bg-gray-200 mr-2">Bekor</button><button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Saqlash</button></div>
            </form>
          </Modal>
          <Modal open={deleteProjectModal.open} onClose={() => setDeleteProjectModal({ open: false, project: null })}>
            <h2 className="text-lg font-bold mb-2">O'chirishni tasdiqlang</h2>
            <p><b>{deleteProjectModal.project?.name}</b> loyihasini o'chirishga ishonchingiz komilmi?</p>
            <div className="flex justify-end mt-4"><button onClick={() => setDeleteProjectModal({ open: false, project: null })} className="px-4 py-2 rounded bg-gray-200 mr-2">Bekor</button><button onClick={handleDeleteProject} className="px-4 py-2 rounded bg-red-600 text-white">O'chirish</button></div>
          </Modal>
        </div>
      );
      case 'defenses': return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Yangi himoya qo'shish</h3>
            <form onSubmit={handleAddDefense} className="space-y-3">
              <input type="text" name="lastName" placeholder="Familiyasi" value={defenseForm.lastName} onChange={handleDefenseFormChange} className="w-full p-2 border rounded" required />
              <input type="text" name="firstName" placeholder="Ismi" value={defenseForm.firstName} onChange={handleDefenseFormChange} className="w-full p-2 border rounded" required />
              <input type="text" name="patronymic" placeholder="Otasining ismi" value={defenseForm.patronymic} onChange={handleDefenseFormChange} className="w-full p-2 border rounded" />
              <select name="facultyId" value={defenseForm.facultyId} onChange={handleDefenseFormChange} className="w-full p-2 bg-white border rounded" required><option value="" disabled>Fakultetni tanlang</option>{faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
              <select name="departmentId" value={defenseForm.departmentId} onChange={handleDefenseFormChange} className="w-full p-2 bg-white border rounded" required disabled={!defenseForm.facultyId}><option value="" disabled>Kafedrani tanlang</option>{filteredDeptsForDefenseForm.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
              <select name="specialty" value={defenseForm.specialty} onChange={handleDefenseFormChange} className="w-full p-2 bg-white border rounded">{specialties.map(s => <option key={s} value={s}>{s}</option>)}</select>
              <select name="type" value={defenseForm.type} onChange={handleDefenseFormChange} className="w-full p-2 bg-white border rounded">{defenseTypes.map(t => <option key={t} value={t}>{t}</option>)}</select>
              <select name="fieldOfScience" value={defenseForm.fieldOfScience} onChange={handleDefenseFormChange} className="w-full p-2 bg-white border rounded">{fieldsOfScience.map(f => <option key={f} value={f}>{f}</option>)}</select>
              <input type="text" name="thesisTopic" placeholder="Dissertatsiya mavzusi" value={defenseForm.thesisTopic} onChange={handleDefenseFormChange} className="w-full p-2 border rounded" required />
              <input type="text" name="supervisor" placeholder="Ilmiy rahbar" value={defenseForm.supervisor} onChange={handleDefenseFormChange} className="w-full p-2 border rounded" />
              <input type="text" name="defenseOrganization" placeholder="Himoya qilgan tashkilot" value={defenseForm.defenseOrganization} onChange={handleDefenseFormChange} className="w-full p-2 border rounded" />
              <input type="text" name="councilNumber" placeholder="Kengash raqami" value={defenseForm.councilNumber} onChange={handleDefenseFormChange} className="w-full p-2 border rounded" />
              <input type="date" name="defenseDate" value={defenseForm.defenseDate} onChange={handleDefenseFormChange} className="w-full p-2 border rounded" />
              <button type="submit" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"><PlusCircle size={16} className="mr-2" /> Qo'shish</button>
            </form>
          </Card>
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Mavjud himoyalar</h3>
            <div className="overflow-x-auto max-h-[70vh]">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0"><tr><th className="p-2">F.I.Sh</th><th className="p-2">Turi</th><th className="p-2">Mavzu</th><th className="p-2">Sana</th><th className="p-2">Amallar</th></tr></thead>
                <tbody>{filteredDefenses.map(d => (
                  <tr key={d.id} className="border-b">
                    <td className="p-2 font-medium">{getProfessorName(d)}</td>
                    <td className="p-2 text-xs">{d.type}</td>
                    <td className="p-2 text-xs truncate max-w-xs">{d.thesisTopic}</td>
                    <td className="p-2 text-xs">{d.defenseDate}</td>
                    <td className="p-2 whitespace-nowrap">
                      <button onClick={() => { setEditDefenseModal({ open: true, defense: d }); setEditDefenseForm({...d}); }} className="text-green-600 mr-2"><Edit size={16} /></button>
                      <button onClick={() => setDeleteDefenseModal({ open: true, defense: d })} className="text-red-600"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Card>
          <Modal open={editDefenseModal.open} onClose={() => setEditDefenseModal({ open: false, defense: null })} className="max-w-2xl">
            <h2 className="text-lg font-bold mb-4">Himoyani tahrirlash</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleEditDefense(); }} className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input type="text" name="lastName" placeholder="Familiyasi" value={editDefenseForm.lastName} onChange={handleEditDefenseFormChange} className="w-full p-2 border rounded" required />
                <input type="text" name="firstName" placeholder="Ismi" value={editDefenseForm.firstName} onChange={handleEditDefenseFormChange} className="w-full p-2 border rounded" required />
                <input type="text" name="patronymic" placeholder="Otasining ismi" value={editDefenseForm.patronymic} onChange={handleEditDefenseFormChange} className="w-full p-2 border rounded" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <select name="facultyId" value={editDefenseForm.facultyId} onChange={handleEditDefenseFormChange} className="w-full p-2 bg-white border rounded" required><option value="" disabled>Fakultet</option>{faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
                <select name="departmentId" value={editDefenseForm.departmentId} onChange={handleEditDefenseFormChange} className="w-full p-2 bg-white border rounded" required disabled={!editDefenseForm.facultyId}><option value="" disabled>Kafedra</option>{filteredDeptsForEditDefenseForm.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
                <select name="specialty" value={editDefenseForm.specialty} onChange={handleEditDefenseFormChange} className="w-full p-2 bg-white border rounded">{specialties.map(s => <option key={s} value={s}>{s}</option>)}</select>
                <select name="type" value={editDefenseForm.type} onChange={handleEditDefenseFormChange} className="w-full p-2 bg-white border rounded">{defenseTypes.map(t => <option key={t} value={t}>{t}</option>)}</select>
              </div>
              <select name="fieldOfScience" value={editDefenseForm.fieldOfScience} onChange={handleEditDefenseFormChange} className="w-full p-2 bg-white border rounded">{fieldsOfScience.map(f => <option key={f} value={f}>{f}</option>)}</select>
              <input type="text" name="thesisTopic" placeholder="Dissertatsiya mavzusi" value={editDefenseForm.thesisTopic} onChange={handleEditDefenseFormChange} className="w-full p-2 border rounded" required />
              <input type="text" name="supervisor" placeholder="Ilmiy rahbar" value={editDefenseForm.supervisor} onChange={handleEditDefenseFormChange} className="w-full p-2 border rounded" />
              <input type="text" name="defenseOrganization" placeholder="Himoya qilgan tashkilot" value={editDefenseForm.defenseOrganization} onChange={handleEditDefenseFormChange} className="w-full p-2 border rounded" />
              <input type="text" name="councilNumber" placeholder="Kengash raqami" value={editDefenseForm.councilNumber} onChange={handleEditDefenseFormChange} className="w-full p-2 border rounded" />
              <input type="date" name="defenseDate" value={editDefenseForm.defenseDate} onChange={handleEditDefenseFormChange} className="w-full p-2 border rounded" />
              <div className="flex justify-end mt-4 pt-4 border-t"><button type="button" onClick={() => setEditDefenseModal({ open: false, defense: null })} className="px-4 py-2 rounded bg-gray-200 mr-2">Bekor</button><button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Saqlash</button></div>
            </form>
          </Modal>
          <Modal open={deleteDefenseModal.open} onClose={() => setDeleteDefenseModal({ open: false, defense: null })}>
            <h2 className="text-lg font-bold mb-2">O'chirishni tasdiqlang</h2>
            <p><b>{deleteDefenseModal.defense && getProfessorName(deleteDefenseModal.defense)}</b>ning himoya ma'lumotini o'chirishga ishonchingiz komilmi?</p>
            <div className="flex justify-end mt-4"><button onClick={() => setDeleteDefenseModal({ open: false, defense: null })} className="px-4 py-2 rounded bg-gray-200 mr-2">Bekor</button><button onClick={handleDeleteDefense} className="px-4 py-2 rounded bg-red-600 text-white">O'chirish</button></div>
          </Modal>
        </div>
      );
      case 'criteria': return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4">Yangi mezon qo'shish</h3>
              <form onSubmit={handleAddCriterion} className="space-y-4">
                <input type="text" name="type" placeholder="Turi (masalan, publication)" value={criterionForm.type} onChange={e => setCriterionForm(p => ({...p, type: e.target.value}))} className="w-full p-2 border rounded" required />
                <input type="text" name="subType" placeholder="Nomi (masalan, Scopus Q1)" value={criterionForm.subType} onChange={e => setCriterionForm(p => ({...p, subType: e.target.value}))} className="w-full p-2 border rounded" required />
                <input type="number" name="score" placeholder="Ball" value={criterionForm.score} onChange={e => setCriterionForm(p => ({...p, score: e.target.value}))} className="w-full p-2 border rounded" required />
                <input type="text" name="description" placeholder="Tavsifi" value={criterionForm.description} onChange={e => setCriterionForm(p => ({...p, description: e.target.value}))} className="w-full p-2 border rounded" />
                <button type="submit" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"><PlusCircle size={16} className="mr-2" /> Qo'shish</button>
              </form>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold mb-4">Mavjud mezonlar</h3>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">{Object.entries(filteredCriteria as ScoringSystem).map(([type, subTypes]) => (
                <div key={type}>
                  <h4 className="font-bold text-md capitalize mb-2 flex items-center">
                    {type.replace(/_/g, ' ')}
                    <button onClick={() => setEditCriterionTypeModal({ open: true, oldType: type, newType: type })} className="ml-2 text-blue-600 hover:text-blue-800">
                      <Edit3 size={14} />
                    </button>
                  </h4>
                  <ul className="space-y-1 pl-4">{Object.entries(subTypes as ScoringCategory).map(([subType, data]) => (
                    <li key={subType} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 rounded">
                      <div><span>{subType}</span><p className="text-xs text-gray-500">{data.description}</p></div>
                      <div className="flex items-center flex-shrink-0 pl-4">
                        <span className="font-semibold text-blue-600 mr-4">{data.score} ball</span>
                        <button onClick={() => setEditCriterionModal({ open: true, type, subType, data })} className="text-green-600 mr-2"><Edit size={16} /></button>
                        <button onClick={() => setDeleteCriterionModal({ open: true, type, subType })} className="text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </li>))}
                  </ul>
                </div>))}
              </div>
            </Card>
            <Modal open={editCriterionTypeModal.open} onClose={() => setEditCriterionTypeModal({ open: false, oldType: '', newType: '' })}>
              <h2 className="text-lg font-bold mb-2">Mezon turini tahrirlash</h2>
              <p className="text-sm mb-2">Eski nom: <span className="font-mono bg-gray-100 p-1 rounded">{editCriterionTypeModal.oldType}</span></p>
              <input type="text" placeholder="Yangi nom (masalan, new_publication)" className="w-full border rounded p-2 mb-2" value={editCriterionTypeModal.newType} onChange={e => setEditCriterionTypeModal(p => ({...p, newType: e.target.value.replace(/\s/g, '_').toLowerCase()}))} />
              <div className="flex justify-end mt-4">
                <button onClick={() => setEditCriterionTypeModal({ open: false, oldType: '', newType: '' })} className="px-4 py-2 rounded bg-gray-200 mr-2">Bekor</button>
                <button onClick={handleEditCriterionType} className="px-4 py-2 rounded bg-blue-600 text-white">Saqlash</button>
              </div>
            </Modal>
            <Modal open={editCriterionModal.open} onClose={() => setEditCriterionModal({ open: false, type: '', subType: '', data: null })}>
              <h2 className="text-lg font-bold mb-2">Mezonni tahrirlash</h2>
              <div className="space-y-2">
                <input type="number" placeholder="Ball" className="w-full border rounded p-2" value={editCriterionModal.data?.score || ''} onChange={e => setEditCriterionModal(p => ({...p, data: {...p.data, score: e.target.value}}))} />
                <input type="text" placeholder="Tavsifi" className="w-full border rounded p-2" value={editCriterionModal.data?.description || ''} onChange={e => setEditCriterionModal(p => ({...p, data: {...p.data, description: e.target.value}}))} />
              </div>
              <div className="flex justify-end mt-4"><button onClick={() => setEditCriterionModal({ open: false, type: '', subType: '', data: null })} className="px-4 py-2 rounded bg-gray-200 mr-2">Bekor</button><button onClick={handleEditCriterion} className="px-4 py-2 rounded bg-blue-600 text-white">Saqlash</button></div>
            </Modal>
            <Modal open={deleteCriterionModal.open} onClose={() => setDeleteCriterionModal({ open: false, type: '', subType: '' })}>
              <h2 className="text-lg font-bold mb-2">O'chirishni tasdiqlang</h2>
              <p><b>{deleteCriterionModal.subType}</b> mezonini o'chirishga ishonchingiz komilmi?</p>
              <div className="flex justify-end mt-4"><button onClick={() => setDeleteCriterionModal({ open: false, type: '', subType: '' })} className="px-4 py-2 rounded bg-gray-200 mr-2">Bekor</button><button onClick={handleDeleteCriterion} className="px-4 py-2 rounded bg-red-600 text-white">O'chirish</button></div>
            </Modal>
          </div>
      );
      case 'users': return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4">Yangi foydalanuvchi qo'shish</h3>
              <form onSubmit={handleAddUser} className="space-y-4">
                <input type="text" placeholder="Login" value={userForm.username} onChange={e => setUserForm(p => ({...p, username: e.target.value}))} className="w-full p-2 border rounded" required />
                <select value={userForm.role} onChange={e => setUserForm(p => ({...p, role: e.target.value}))} className="w-full p-2 bg-white border rounded">
                  <option value="superadmin">Super Admin</option>
                  <option value="guest">Mehmon</option>
                </select>
                <button type="submit" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"><PlusCircle size={16} className="mr-2" /> Qo'shish</button>
              </form>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold mb-4">Mavjud foydalanuvchilar</h3>
              <ul className="space-y-2 max-h-96 overflow-y-auto">{filteredUsers.map(u => (
                <li key={u.id} className="p-3 bg-gray-50 rounded-md flex justify-between items-center">
                  <span><span className="font-semibold">{u.username}</span><span className="text-xs text-gray-500 ml-2">{u.role}</span></span>
                  {u.id !== user.id && <span>
                    <button onClick={() => setEditUserModal({ open: true, user: u })} className="text-green-600 mr-2"><Edit size={16} /></button>
                    <button onClick={() => setDeleteUserModal({ open: true, user: u })} className="text-red-600"><Trash2 size={16} /></button>
                  </span>}
                </li>))}
              </ul>
            </Card>
            <Modal open={editUserModal.open} onClose={() => setEditUserModal({ open: false, user: null })}>
              <h2 className="text-lg font-bold mb-2">{editUserModal.user?.username} parolini o'zgartirish</h2>
              <div className="flex justify-end"><button onClick={() => setEditUserModal({ open: false, user: null })} className="px-4 py-2 rounded bg-gray-200 mr-2">Bekor</button><button onClick={handleEditUser} className="px-4 py-2 rounded bg-blue-600 text-white">Saqlash</button></div>
            </Modal>
            <Modal open={deleteUserModal.open} onClose={() => setDeleteUserModal({ open: false, user: null })}>
              <h2 className="text-lg font-bold mb-2">O'chirishni tasdiqlang</h2>
              <p><b>{deleteUserModal.user?.username}</b> foydalanuvchisini o'chirishga ishonchingiz komilmi?</p>
              <div className="flex justify-end mt-4"><button onClick={() => setDeleteUserModal({ open: false, user: null })} className="px-4 py-2 rounded bg-gray-200 mr-2">Bekor</button><button onClick={handleDeleteUser} className="px-4 py-2 rounded bg-red-600 text-white">O'chirish</button></div>
            </Modal>
          </div>
      );
      default:
        return null;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Ma'lumotlarni boshqarish</h1>
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <tab.icon size={18} className="mr-2" /> {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div>
        {renderContent()}
      </div>
    </motion.div>
  );
};

const PerformanceMonitoringPage: React.FC<{
  professors: Professor[];
  achievements: Achievement[];
  plans: Plan[];
  getScore: (type: string, subType: string) => number;
  selectedYear: number;
  faculties: Faculty[];
  departments: Department[];
  searchQuery: string;
  isSuperAdmin: boolean;
}> = ({ professors, achievements, plans, getScore, selectedYear, faculties, departments, searchQuery, isSuperAdmin }) => {
  const [expandedId, setExpandedId] = useState<number | string | null>(null);
  const [activeTab, setActiveTab] = useState('professors');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const performanceData = useMemo(() => {
    const calculatePerformance = (items: any[], idField: string, nameField: string, getSubItems: (item: any) => any[]) => {
      return items.map(item => {
        const subItems = getSubItems(item);
        const subItemIds = subItems.map(p => p.id);

        const annualPlan = subItems.reduce((sum, p) => {
            const profPlan = plans.find(plan => plan.professorId === p.id && plan.year === selectedYear);
            const planScore = profPlan ? profPlan.planItems.reduce((planSum, item) => planSum + getScore(item.type, item.subType) * item.count, 0) : 0;
            return sum + planScore;
        }, 0);

        const quarterlyResults = [1, 2, 3, 4].map(q => {
          return achievements
            .filter(a => subItemIds.includes(a.professorId) && a.year === selectedYear && a.quarter === q)
            .reduce((sum, a) => sum + getScore(a.type, a.subType) * a.count, 0);
        });

        const totalResult = quarterlyResults.reduce((sum, r) => sum + r, 0);
        const completionPercent = annualPlan > 0 ? (totalResult / annualPlan) * 100 : 0;

        const quarterlyGrowth = [0, 0, 0, 0];
        for (let i = 1; i < 4; i++) {
          const current = quarterlyResults[i];
          const prev = quarterlyResults[i - 1];
          if (prev > 0) {
            quarterlyGrowth[i] = ((current - prev) / prev) * 100;
          } else if (current > 0) {
            quarterlyGrowth[i] = 100;
          }
        }

        return {
          id: item[idField],
          name: item[nameField],
          annualPlan,
          quarterlyResults,
          totalResult,
          completionPercent,
          quarterlyGrowth,
        };
      });
    };

    const professorData = calculatePerformance(professors, 'id', 'name', (prof) => [prof]).map(p => ({...p, name: getProfessorName(professors.find(pr => pr.id === p.id)!)}));
    
    const departmentData = calculatePerformance(departments, 'id', 'name', (dept) => professors.filter(p => p.departmentId === dept.id));

    const facultyData = calculatePerformance(faculties, 'id', 'name', (fac) => {
        const facDeptIds = departments.filter(d => d.facultyId === fac.id).map(d => d.id);
        return professors.filter(p => facDeptIds.includes(p.departmentId));
    });

    return { professors: professorData, departments: departmentData, faculties: facultyData };
  }, [professors, achievements, plans, getScore, selectedYear, departments, faculties]);

  const dataForTab = useMemo(() => {
      let data;
      if (activeTab === 'professors') data = performanceData.professors;
      else if (activeTab === 'departments') data = performanceData.departments;
      else data = performanceData.faculties;

      if(searchQuery) {
          data = data.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      return [...data].sort((a, b) => b.completionPercent - a.completionPercent);
  }, [activeTab, performanceData, searchQuery]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return dataForTab.slice(startIndex, startIndex + pageSize);
  }, [dataForTab, currentPage, pageSize]);

  const totalPages = Math.ceil(dataForTab.length / pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  const getCompletionStyle = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-100 text-green-800';
    if (percentage >= 75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const handleExport = () => {
    const dataToExport = dataForTab.map((p) => ({
      'Nomi': p.name,
      'Yillik Reja': p.annualPlan,
      '1-chorak': p.quarterlyResults[0],
      '2-chorak': p.quarterlyResults[1],
      '3-chorak': p.quarterlyResults[2],
      '4-chorak': p.quarterlyResults[3],
      'Yillik Jami': p.totalResult,
      'Bajarilish (%)': p.completionPercent,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Monitoring_${activeTab}`);
    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Monitoring_${activeTab}_${today}.xlsx`);
  };

  const tabs = [
      {id: 'professors', label: 'Professor-o\'qituvchilar'},
      {id: 'departments', label: 'Kafedralar'},
      {id: 'faculties', label: 'Fakultetlar'},
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Ishlash Monitoringi ({selectedYear})</h1>
        {isSuperAdmin && (
          <button onClick={handleExport} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
            <FileSpreadsheet size={16} className="mr-2" /> Excelga yuklash
          </button>
        )}
      </div>
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Nomi</th>
                <th className="px-4 py-3">Yillik Reja</th>
                <th className="px-4 py-3">1-ch</th>
                <th className="px-4 py-3">2-ch</th>
                <th className="px-4 py-3">3-ch</th>
                <th className="px-4 py-3">4-ch</th>
                <th className="px-4 py-3">Jami</th>
                <th className="px-4 py-3">Bajarilish</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((p, index) => (
                <React.Fragment key={p.id}>
                  <tr className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                    <td className="px-4 py-2">{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="px-4 py-2 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-2 font-semibold">{p.annualPlan.toFixed(1)}</td>
                    {p.quarterlyResults.map((r, i) => <td key={i} className="px-4 py-2">{r.toFixed(1)}</td>)}
                    <td className="px-4 py-2 font-bold">{p.totalResult.toFixed(1)}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full font-semibold text-xs ${getCompletionStyle(p.completionPercent)}`}>
                        {p.completionPercent.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                  <AnimatePresence>
                    {expandedId === p.id && (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-gray-50"
                      >
                        <td colSpan={9} className="p-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <BarChart title="Choraklik natijalar" data={[
                              { label: "1-chorak", value: p.quarterlyResults[0] },
                              { label: "2-chorak", value: p.quarterlyResults[1] },
                              { label: "3-chorak", value: p.quarterlyResults[2] },
                              { label: "4-chorak", value: p.quarterlyResults[3] },
                            ]} />
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 p-6 pb-0">Choraklik o'sish</h3>
                                <div className="p-6 pt-2 space-y-4">
                                    <div className="flex justify-between items-center"><span>1-ch → 2-ch</span> {renderGrowthIndicator(p.quarterlyGrowth[1])}</div>
                                    <div className="flex justify-between items-center"><span>2-ch → 3-ch</span> {renderGrowthIndicator(p.quarterlyGrowth[2])}</div>
                                    <div className="flex justify-between items-center"><span>3-ch → 4-ch</span> {renderGrowthIndicator(p.quarterlyGrowth[3])}</div>
                                </div>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </Card>
    </motion.div>
  );
};

const ScientificPotentialPage: React.FC<{
  facultyRatings: any[];
  departmentRatings: any[];
  professorsWithDetails: any[];
  thesisDefenses: ThesisDefense[];
  faculties: Faculty[];
  departments: Department[];
  positions: string[];
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  isSuperAdmin: boolean;
  specialties: string[];
  defenseTypes: string[];
}> = ({ facultyRatings, departmentRatings, professorsWithDetails, thesisDefenses, faculties, departments, positions, searchQuery, setSearchQuery, filters, setFilters, isSuperAdmin, specialties, defenseTypes }) => {
  const [activeTab, setActiveTab] = useState('faculties');
  const [expandedDept, setExpandedDept] = useState<number | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [defenseFilters, setDefenseFilters] = useState({
    facultyId: '',
    departmentId: '',
    specialty: '',
    type: '',
  });

  const tabs = [
    { id: 'faculties', label: 'Fakultetlar' },
    { id: 'departments', label: 'Kafedralar' },
    { id: 'academics', label: 'Ilmiy darajalilar' },
    { id: 'defenses', label: 'Dissertatsiya himoyalari' },
  ];

  useEffect(() => {
    // Reset filters when tab changes to ensure clean state
    setFilters({ gender: [], degree: [], title: [], ageRange: [], position: [] });
    setDefenseFilters({
      facultyId: '',
      departmentId: '',
      specialty: '',
      type: '',
    });
  }, [activeTab, setFilters]);

  const renderTable = (items: any[]) => {
    const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const sortedItems = [...filteredItems].sort((a, b) => b.scientificPotential - a.scientificPotential);

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">Reyting</th>
              <th className="px-6 py-3">Nomi</th>
              <th className="px-6 py-3">Jami Xodimlar</th>
              <th className="px-6 py-3">Shtat birligi</th>
              <th className="px-6 py-3">Ilmiy Darajalilar (PhD+DSc)</th>
              <th className="px-6 py-3">Ilmiy Salohiyat (%)</th>
              {activeTab === 'departments' && <th className="px-6 py-3"></th>}
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <tr className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => activeTab === 'departments' && setExpandedDept(expandedDept === item.id ? null : item.id)}>
                  <td className="px-6 py-4 font-bold">{index + 1}</td>
                  <th className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{item.name}</th>
                  <td className="px-6 py-4">{item.professors.length}</td>
                  <td className="px-6 py-4">{item.totalStaffUnits.toFixed(2)}</td>
                  <td className="px-6 py-4">{item.degreeHolders}</td>
                  <td className="px-6 py-4 font-bold text-blue-600">{item.scientificPotential.toFixed(1)}%</td>
                  {activeTab === 'departments' && <td className="px-6 py-4">{expandedDept === item.id ? <ChevronDown /> : <ChevronRight />}</td>}
                </tr>
                {activeTab === 'departments' && expandedDept === item.id && (
                  <tr className="bg-gray-50">
                    <td colSpan={7} className="p-4">
                      <h4 className="font-semibold mb-2">Kafedra professor-o'qituvchilari:</h4>
                      <ul className="space-y-1 pl-4">
                        {item.professors.map((prof: any) => (
                          <li key={prof.id} className="text-sm">
                            {getProfessorName(prof)} - <span className="font-medium">{prof.position}, {prof.degree !== 'Yo‘q' ? prof.degree : ''} {prof.title !== 'Yo‘q' ? prof.title : ''}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const academics = useMemo(() => professorsWithDetails.filter(p => p.degree === 'PhD' || p.degree === 'DSc'), [professorsWithDetails]);
    
  const filteredAcademics = useMemo(() => {
    let filtered = academics;
    // Multi-select filters
    if (filters.gender.length > 0) {
      filtered = filtered.filter((p: any) => filters.gender.includes(p.gender));
    }
    if (filters.degree.length > 0) {
      filtered = filtered.filter((p: any) => filters.degree.includes(p.degree));
    }
    if (filters.title.length > 0) {
      filtered = filtered.filter((p: any) => filters.title.includes(p.title));
    }
    if (filters.position.length > 0) {
      filtered = filtered.filter((p: any) => filters.position.includes(p.position));
    }
    if (filters.ageRange.length > 0) {
      filtered = filtered.filter((p: any) => {
        const age = getAge(p.birthDate);
        if (age === null) return false;
        return filters.ageRange.some(range => {
          if (range === '<30') return age < 30;
          if (range === '30-39') return age >= 30 && age <= 39;
          if (range === '40-49') return age >= 40 && age <= 49;
          if (range === '50-59') return age >= 50 && age <= 59;
          if (range === '60+') return age >= 60;
          return false;
        });
      });
    }
    // Search query
    if (searchQuery) {
      filtered = filtered.filter(p => getProfessorName(p).toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered;
  }, [academics, filters, searchQuery]);

  const paginatedAcademics = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAcademics.slice(startIndex, startIndex + pageSize);
  }, [filteredAcademics, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAcademics.length / pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, activeTab]);

  const handleExport = () => {
    const dataToExport = filteredAcademics.map((prof, index) => ({
      '№': (currentPage - 1) * pageSize + index + 1,
      'F.I.Sh.': getProfessorName(prof),
      'Jinsi': prof.gender,
      'Tug‘ilgan sana': prof.birthDate,
      'Yoshi': getAge(prof.birthDate),
      'Fakultet': prof.faculty.name,
      'Kafedra': prof.department.name,
      'Lavozimi': prof.position,
      'O‘rindoshlik turi': prof.employmentType,
      'Shtat birligi': prof.staffUnit,
      'Ilmiy darajasi': prof.degree,
      'Ilmiy unvoni': prof.title,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ilmiy darajalilar");
    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Ilmiy_darajalilar_${today}.xlsx`);
  };

  const renderAcademicsTable = () => {
    return (
      <>
        <button
          onClick={() => setFiltersVisible(!filtersVisible)}
          className="w-full flex justify-between items-center text-left font-semibold text-gray-700 p-4 border rounded-lg mb-4"
        >
          <span className="flex items-center">
            <Filter size={18} className="mr-2" />
            Filtrlar va Qidiruv
          </span>
          {filtersVisible ? <ChevronUp /> : <ChevronDown />}
        </button>
        <AnimatePresence>
          {filtersVisible && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="F.I.Sh. bo'yicha qidiruv..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <ProfessorFilterControls filters={filters} onFilterChange={setFilters} positions={positions} />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex justify-end mb-4">
          {isSuperAdmin && (
            <button onClick={handleExport} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
              <FileSpreadsheet size={16} className="mr-2" /> Excelga yuklash
            </button>
          )}
        </div>
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3">№</th>
                <th className="px-4 py-3">F.I.Sh.</th>
                <th className="px-4 py-3">Jinsi</th>
                <th className="px-4 py-3">Tug'ilgan sana</th>
                <th className="px-4 py-3">Yoshi</th>
                <th className="px-4 py-3">Fakultet</th>
                <th className="px-4 py-3">Kafedra</th>
                <th className="px-4 py-3">Lavozimi</th>
                <th className="px-4 py-3">O'rindoshlik</th>
                <th className="px-4 py-3">Shtat</th>
                <th className="px-4 py-3">Ilmiy Daraja</th>
                <th className="px-4 py-3">Ilmiy Unvon</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAcademics.map((prof, index) => (
                <tr key={prof.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-700">{(currentPage - 1) * pageSize + index + 1}</td>
                  <th className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">{getProfessorName(prof)}</th>
                  <td className="px-4 py-2 capitalize">{prof.gender}</td>
                  <td className="px-4 py-2">{prof.birthDate}</td>
                  <td className="px-4 py-2">{getAge(prof.birthDate)}</td>
                  <td className="px-4 py-2">{prof.faculty.name}</td>
                  <td className="px-4 py-2">{prof.department.name}</td>
                  <td className="px-4 py-2">{prof.position}</td>
                  <td className="px-4 py-2">{prof.employmentType}</td>
                  <td className="px-4 py-2">{prof.staffUnit.toFixed(2)}</td>
                  <td className="px-4 py-2 font-semibold text-blue-600">{prof.degree !== 'Yo‘q' ? prof.degree : '-'}</td>
                  <td className="px-4 py-2 font-semibold text-blue-600">{prof.title !== 'Yo‘q' ? prof.title : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </>
    );
  };

  const handleDefenseFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDefenseFilters(prev => {
      const newFilters = { ...prev, [name]: value };
      if (name === 'facultyId') {
        newFilters.departmentId = '';
      }
      return newFilters;
    });
  };

  const filteredDepartmentsForFilter = useMemo(() => {
    if (!defenseFilters.facultyId) return [];
    return departments.filter(d => d.facultyId === Number(defenseFilters.facultyId));
  }, [defenseFilters.facultyId, departments]);

  const renderDefensesTable = () => {
    const filteredDefenses = thesisDefenses.filter(d => {
      const searchMatch =
        getProfessorName(d).toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.thesisTopic.toLowerCase().includes(searchQuery.toLowerCase());

      const facultyMatch = defenseFilters.facultyId ? d.facultyId === Number(defenseFilters.facultyId) : true;
      const departmentMatch = defenseFilters.departmentId ? d.departmentId === Number(defenseFilters.departmentId) : true;
      const specialtyMatch = defenseFilters.specialty ? d.specialty === defenseFilters.specialty : true;
      const typeMatch = defenseFilters.type ? d.type === defenseFilters.type : true;

      return searchMatch && facultyMatch && departmentMatch && specialtyMatch && typeMatch;
    });
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2 lg:col-span-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="F.I.Sh. yoki mavzu bo'yicha qidiruv..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>
            <select name="facultyId" value={defenseFilters.facultyId} onChange={handleDefenseFilterChange} className="w-full p-2 bg-white border rounded text-sm">
                <option value="">Barcha fakultetlar</option>
                {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <select name="departmentId" value={defenseFilters.departmentId} onChange={handleDefenseFilterChange} className="w-full p-2 bg-white border rounded text-sm" disabled={!defenseFilters.facultyId}>
                <option value="">Barcha kafedralar</option>
                {filteredDepartmentsForFilter.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select name="specialty" value={defenseFilters.specialty} onChange={handleDefenseFilterChange} className="w-full p-2 bg-white border rounded text-sm">
                <option value="">Barcha ixtisosliklar</option>
                {specialties.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select name="type" value={defenseFilters.type} onChange={handleDefenseFilterChange} className="w-full p-2 bg-white border rounded text-sm">
                <option value="">Barcha turlar</option>
                {defenseTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3">F.I.Sh.</th>
                <th className="px-4 py-3">Turi</th>
                <th className="px-4 py-3">Mavzu</th>
                <th className="px-4 py-3">Ilmiy rahbar</th>
                <th className="px-4 py-3">Kafedra</th>
                <th className="px-4 py-3">Himoya sanasi</th>
              </tr>
            </thead>
            <tbody>
              {filteredDefenses.map(d => {
                const dept = departments.find(dep => dep.id === d.departmentId);
                return (
                  <tr key={d.id} className="bg-white border-b hover:bg-gray-50">
                    <th className="px-4 py-2 font-medium text-gray-900">{getProfessorName(d)}</th>
                    <td className="px-4 py-2">{d.type}</td>
                    <td className="px-4 py-2">{d.thesisTopic}</td>
                    <td className="px-4 py-2">{d.supervisor}</td>
                    <td className="px-4 py-2">{dept?.name || 'N/A'}</td>
                    <td className="px-4 py-2">{d.defenseDate}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Ilmiy Salohiyat Tahlili</h1>
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <Card>
        {activeTab !== 'academics' && activeTab !== 'defenses' && (
            <div className="relative mb-4 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Nomi bo'yicha qidiruv..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
        )}
        {activeTab === 'faculties' && renderTable(facultyRatings)}
        {activeTab === 'departments' && renderTable(departmentRatings)}
        {activeTab === 'academics' && renderAcademicsTable()}
        {activeTab === 'defenses' && renderDefensesTable()}
      </Card>
    </motion.div>
  );
};

const ProjectBreakdownTable: React.FC<{ title: string, data: any[], projectTypes: string[] }> = ({ title, data, projectTypes }) => (
  <Card>
    <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th className="px-4 py-3">Nomi</th>
            <th className="px-4 py-3 text-center">Jami</th>
            {projectTypes.map(type => <th key={type} className="px-4 py-3 text-center">{type}</th>)}
            <th className="px-4 py-3 text-right">Mablag'</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.label} className="bg-white border-b">
              <td className="px-4 py-2 font-medium">{item.label}</td>
              <td className="px-4 py-2 text-center font-bold">{item.value.count}</td>
              {projectTypes.map(type => <td key={type} className="px-4 py-2 text-center">{item.value.types[type] || 0}</td>)}
              <td className="px-4 py-2 text-right font-semibold" title={formatFundingTooltip(item.value.funding)}>
                {formatFundingCompact(item.value.funding)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);

const ScientificProjectsPage: React.FC<{
  projects: Project[];
  professors: Professor[];
  faculties: Faculty[];
  departments: Department[];
  projectTypes: string[];
  projectDirections: string[];
  projectLeaderPositions: string[];
  projectDurations: number[];
  projectTypeCounts: { [key: string]: number };
}> = ({ projects, faculties, departments, projectTypes, projectLeaderPositions, projectDurations, projectTypeCounts }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    facultyId: '',
    departmentId: '',
    leaderPosition: '',
    duration: '',
  });
  const [sortBy, setSortBy] = useState({ field: 'totalFunding', order: 'desc' });

  const projectStats = useMemo(() => {
    const totalProjects = projects.length;
    if (totalProjects === 0) {
      return {
        totalFunding: 0,
        byFaculty: [],
        byDepartment: [],
      };
    }

    const totalFunding = projects.reduce((sum, p) => sum + p.totalFunding, 0);

    const byFaculty = projects.reduce((acc, p) => {
      const faculty = faculties.find(f => f.id === p.facultyId);
      if (faculty) {
        if (!acc[faculty.name]) {
          acc[faculty.name] = { count: 0, funding: 0, types: {} };
          projectTypes.forEach(t => acc[faculty.name].types[t] = 0);
        }
        acc[faculty.name].count++;
        acc[faculty.name].funding += p.totalFunding;
        acc[faculty.name].types[p.type] = (acc[faculty.name].types[p.type] || 0) + 1;
      }
      return acc;
    }, {} as { [key: string]: { count: number, funding: number, types: { [key: string]: number } } });

    const byDepartment = projects.reduce((acc, p) => {
      const department = departments.find(d => d.id === p.departmentId);
      if (department) {
        if (!acc[department.name]) {
          acc[department.name] = { count: 0, funding: 0, types: {} };
          projectTypes.forEach(t => acc[department.name].types[t] = 0);
        }
        acc[department.name].count++;
        acc[department.name].funding += p.totalFunding;
        acc[department.name].types[p.type] = (acc[department.name].types[p.type] || 0) + 1;
      }
      return acc;
    }, {} as { [key: string]: { count: number, funding: number, types: { [key: string]: number } } });

    return {
      totalFunding,
      byFaculty: Object.entries(byFaculty).map(([label, value]) => ({ label, value })).sort((a: any, b: any) => b.value.count - a.value.count),
      byDepartment: Object.entries(byDepartment).map(([label, value]) => ({ label, value })).sort((a: any, b: any) => b.value.count - a.value.count),
    };
  }, [projects, faculties, departments, projectTypes]);

  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.leaderName.toLowerCase().includes(lowerQuery)
      );
    }

    if (filters.type) {
      filtered = filtered.filter(p => p.type === filters.type);
    }
    if (filters.facultyId) {
      filtered = filtered.filter(p => p.facultyId === Number(filters.facultyId));
    }
    if (filters.departmentId) {
      filtered = filtered.filter(p => p.departmentId === Number(filters.departmentId));
    }
    if (filters.leaderPosition) {
      filtered = filtered.filter(p => p.leaderPosition === filters.leaderPosition);
    }
    if (filters.duration) {
      filtered = filtered.filter(p => p.duration === Number(filters.duration));
    }

    filtered.sort((a, b) => {
      const field = sortBy.field as keyof Project;
      const order = sortBy.order === 'asc' ? 1 : -1;
      // @ts-ignore
      if (a[field] < b[field]) return -1 * order;
      // @ts-ignore
      if (a[field] > b[field]) return 1 * order;
      return 0;
    });

    return filtered;
  }, [projects, searchQuery, filters, sortBy]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => {
      const newFilters = { ...prev, [name]: value };
      if (name === 'facultyId') {
        newFilters.departmentId = '';
      }
      return newFilters;
    });
  };

  const donutData = [
    { label: 'Loyiha', value: projectTypeCounts['Loyiha'] || 0, color: '#3b82f6' },
    { label: 'Startap', value: projectTypeCounts['Startap'] || 0, color: '#10b981' },
    { label: 'Grant', value: projectTypeCounts['Grant'] || 0, color: '#f97316' },
    { label: 'Spinoff', value: projectTypeCounts['Spinoff'] || 0, color: '#8b5cf6' },
  ];

  const filteredDepartmentsForFilter = useMemo(() => {
    if (!filters.facultyId) return departments;
    return departments.filter(d => d.facultyId === Number(filters.facultyId));
  }, [filters.facultyId, departments]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Loyiha va Startaplar</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard title="Startaplar soni" value={projectTypeCounts['Startap'] || 0} icon={Lightbulb} />
        <StatCard title="Loyihalar soni" value={projectTypeCounts['Loyiha'] || 0} icon={Rocket} />
        <StatCard title="Grantlar soni" value={projectTypeCounts['Grant'] || 0} icon={Award} />
        <StatCard title="Spinofflar soni" value={projectTypeCounts['Spinoff'] || 0} icon={Handshake} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <StatCard title="Jami mablag'" value={formatFundingCompact(projectStats.totalFunding)} icon={DollarSign} />
          <DonutChart title="Turlar bo'yicha taqsimot" data={donutData} />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-6">
          <ProjectBreakdownTable title="Fakultetlar kesimida" data={projectStats.byFaculty} projectTypes={projectTypes} />
          <ProjectBreakdownTable title="Kafedralar kesimida" data={projectStats.byDepartment} projectTypes={projectTypes} />
        </div>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Loyiha va Startaplar ro'yxati</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div className="lg:col-span-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Nomi yoki rahbar bo'yicha qidiruv..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select name="type" value={filters.type} onChange={handleFilterChange} className="w-full p-2 bg-white border rounded text-sm">
            <option value="">Barcha turlar</option>
            {projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select name="facultyId" value={filters.facultyId} onChange={handleFilterChange} className="w-full p-2 bg-white border rounded text-sm">
            <option value="">Barcha fakultetlar</option>
            {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select name="departmentId" value={filters.departmentId} onChange={handleFilterChange} className="w-full p-2 bg-white border rounded text-sm" disabled={!filters.facultyId && departments.length !== filteredDepartmentsForFilter.length}>
            <option value="">Barcha kafedralar</option>
            {filteredDepartmentsForFilter.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select name="leaderPosition" value={filters.leaderPosition} onChange={handleFilterChange} className="w-full p-2 bg-white border rounded text-sm">
            <option value="">Barcha rahbarlar</option>
            {projectLeaderPositions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select name="duration" value={filters.duration} onChange={handleFilterChange} className="w-full p-2 bg-white border rounded text-sm">
            <option value="">Barcha muddatlar</option>
            {projectDurations.map(d => <option key={d} value={d}>{d} yillik</option>)}
          </select>
        </div>
        <div className="flex justify-end items-center text-sm mb-4">
          <span>Saralash:</span>
          <select 
            value={`${sortBy.field}-${sortBy.order}`}
            onChange={e => {
              const [field, order] = e.target.value.split('-');
              setSortBy({ field, order });
            }}
            className="ml-2 p-1 bg-white border rounded text-sm"
          >
            <option value="totalFunding-desc">Summasi bo'yicha (kamayish)</option>
            <option value="totalFunding-asc">Summasi bo'yicha (o'sish)</option>
            <option value="name-asc">Nomi bo'yicha (A-Z)</option>
            <option value="name-desc">Nomi bo'yicha (Z-A)</option>
            <option value="duration-desc">Muddati bo'yicha (kamayish)</option>
            <option value="duration-asc">Muddati bo'yicha (o'sish)</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3">№</th>
                <th className="px-4 py-3">Loyiha nomi</th>
                <th className="px-4 py-3">Turi</th>
                <th className="px-4 py-3">Yo'nalishi</th>
                <th className="px-4 py-3">Rahbari</th>
                <th className="px-4 py-3">Rahbar lavozimi</th>
                <th className="px-4 py-3">Kafedra</th>
                <th className="px-4 py-3">Fakultet</th>
                <th className="px-4 py-3 text-right">Mablag'</th>
                <th className="px-4 py-3 text-center">Muddati (yil)</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((proj, index) => {
                const department = departments.find(d => d.id === proj.departmentId);
                const faculty = faculties.find(f => f.id === proj.facultyId);
                return (
                  <tr key={proj.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-700">{index + 1}</td>
                    <th className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">{proj.name}</th>
                    <td className="px-4 py-2">{proj.type}</td>
                    <td className="px-4 py-2">{proj.direction}</td>
                    <td className="px-4 py-2">{proj.leaderName}</td>
                    <td className="px-4 py-2">{proj.leaderPosition}</td>
                    <td className="px-4 py-2">{department?.name || 'N/A'}</td>
                    <td className="px-4 py-2">{faculty?.name || 'N/A'}</td>
                    <td className="px-4 py-2 text-right font-semibold" title={formatFundingTooltip(proj.totalFunding)}>
                      {formatFundingCompact(proj.totalFunding)}
                    </td>
                    <td className="px-4 py-2 text-center">{proj.duration}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
};

const ProfessorKPIDetailModal: React.FC<{
  open: boolean;
  onClose: () => void;
  professor: any;
  department: any;
  faculty: any;
  achievements: Achievement[];
  getScore: (type: string, subType: string) => number;
  scoringSystem: ScoringSystem;
  selectedYear: number;
}> = ({ open, onClose, professor, department, faculty, achievements, getScore, scoringSystem, selectedYear }) => {
  
  const professorAchievements = useMemo(() => {
    return achievements.filter(a => a.professorId === professor.id && a.year === selectedYear);
  }, [achievements, professor.id, selectedYear]);

  const scoreBreakdown = useMemo(() => {
    const breakdown: { [key: string]: number } = {};
    Object.keys(scoringSystem).forEach(type => {
      breakdown[type] = 0;
    });

    professorAchievements.forEach(ach => {
      const score = getScore(ach.type, ach.subType) * ach.count;
      if (breakdown[ach.type] !== undefined) {
        breakdown[ach.type] += score;
      }
    });

    return Object.entries(breakdown)
      .filter(([, score]) => score > 0)
      .map(([type, score]) => ({
        label: type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' '),
        value: score,
      }));
  }, [professorAchievements, getScore, scoringSystem]);

  const colors = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#f59e0b', '#6366f1', '#14b8a6'];

  const donutData = scoreBreakdown.map((item, index) => ({
    ...item,
    color: colors[index % colors.length]
  }));

  return (
    <Modal open={open} onClose={onClose} className="max-w-4xl">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{professor.name}</h2>
        <p className="text-sm text-gray-500">{professor.position}, {professor.department.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-500">Yillik Reja</p>
          <p className="text-2xl font-bold text-gray-800">{professor.annualPlan.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-500">Amalda</p>
          <p className="text-2xl font-bold text-blue-600">{professor.totalScore.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-500">Bajarilish</p>
          <p className="text-2xl font-bold text-green-600">{professor.completionPercent.toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <div className="md:col-span-3">
          <DonutChart title="Ballar taqsimoti" data={donutData} />
        </div>
        <div className="md:col-span-2">
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Taqqoslash</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Shaxsiy</span>
                  <span className="font-semibold">{professor.completionPercent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, professor.completionPercent)}%` }}></div>
                </div>
              </div>
              {department && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Kafedra o'rtachasi</span>
                    <span className="font-semibold">{department.completionPercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, department.completionPercent)}%` }}></div>
                  </div>
                </div>
              )}
              {faculty && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Fakultet o'rtachasi</span>
                    <span className="font-semibold">{faculty.completionPercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, faculty.completionPercent)}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{selectedYear}-yil uchun yutuqlar ro'yxati</h3>
        <div className="max-h-60 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2">Turi</th>
                <th className="px-4 py-2">Nomi</th>
                <th className="px-4 py-2 text-center">Soni</th>
                <th className="px-4 py-2 text-center">Chorak</th>
                <th className="px-4 py-2 text-right">Ball</th>
              </tr>
            </thead>
            <tbody>
              {professorAchievements.length > 0 ? professorAchievements.map(ach => (
                <tr key={ach.id} className="border-b">
                  <td className="px-4 py-2 capitalize">{ach.type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-2">{ach.subType}</td>
                  <td className="px-4 py-2 text-center">{ach.count}</td>
                  <td className="px-4 py-2 text-center">{ach.quarter}</td>
                  <td className="px-4 py-2 text-right font-semibold">{(getScore(ach.type, ach.subType) * ach.count).toFixed(2)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">Yutuqlar mavjud emas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Modal>
  );
};

const KPIPage: React.FC<{
  professorsWithDetails: any[];
  departmentRatings: any[];
  facultyRatings: any[];
  achievements: Achievement[];
  getScore: (type: string, subType: string) => number;
  selectedYear: number;
  scoringSystem: ScoringSystem;
  faculties: Faculty[];
  departments: Department[];
  isSuperAdmin: boolean;
}> = ({ professorsWithDetails, departmentRatings, facultyRatings, achievements, getScore, selectedYear, scoringSystem, faculties, departments, isSuperAdmin }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedProfessor, setSelectedProfessor] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const filteredDepartments = useMemo(() => {
    if (!selectedFaculty) return departments;
    return departments.filter(d => d.facultyId === Number(selectedFaculty));
  }, [selectedFaculty, departments]);

  const filteredProfessors = useMemo(() => {
    let filtered = professorsWithDetails;
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) ||
        p.department.name.toLowerCase().includes(lowerQuery)
      );
    }

    if (selectedDepartment) {
      filtered = filtered.filter(p => p.departmentId === Number(selectedDepartment));
    } else if (selectedFaculty) {
      const deptIds = departments.filter(d => d.facultyId === Number(selectedFaculty)).map(d => d.id);
      filtered = filtered.filter(p => deptIds.includes(p.departmentId));
    }

    return filtered;
  }, [professorsWithDetails, searchQuery, selectedFaculty, selectedDepartment, departments]);

  const paginatedProfessors = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProfessors.slice(startIndex, startIndex + pageSize);
  }, [filteredProfessors, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredProfessors.length / pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFaculty, selectedDepartment]);

  const handleProfessorClick = (prof: any) => {
    setSelectedProfessor(prof);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProfessor(null);
  };

  const selectedProfessorDepartment = useMemo(() => {
    if (!selectedProfessor) return null;
    return departmentRatings.find(d => d.id === selectedProfessor.departmentId);
  }, [selectedProfessor, departmentRatings]);

  const selectedProfessorFaculty = useMemo(() => {
    if (!selectedProfessor) return null;
    return facultyRatings.find(f => f.id === selectedProfessor.faculty.id);
  }, [selectedProfessor, facultyRatings]);

  const handleExport = () => {
    const dataToExport = filteredProfessors.map((prof, index) => ({
      '№': index + 1,
      'F.I.Sh.': prof.name,
      'Kafedra': prof.department.name,
      'Reja': prof.annualPlan.toFixed(2),
      'Amalda': prof.totalScore.toFixed(2),
      'Bajarilish %': prof.completionPercent.toFixed(1),
      'KPI (%)': prof.kpiPercent.toFixed(1),
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KPI Ko'rsatkichlari");
    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `KPI_ko'rsatkichlari_${today}.xlsx`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Professor-o'qituvchilarning KPI ko'rsatkichlari</h1>
        {isSuperAdmin && (
          <button onClick={handleExport} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
            <FileSpreadsheet size={16} className="mr-2" /> Excelga yuklash
          </button>
        )}
      </div>
      
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="F.I.Sh. yoki kafedra bo'yicha qidiruv..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fakultet</label>
            <select
              value={selectedFaculty}
              onChange={e => { setSelectedFaculty(e.target.value); setSelectedDepartment(''); }}
              className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm"
            >
              <option value="">Barcha fakultetlar</option>
              {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kafedra</label>
            <select
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm"
              disabled={!selectedFaculty && filteredDepartments.length !== departments.length}
            >
              <option value="">Barcha kafedralar</option>
              {filteredDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3">№</th>
                <th className="px-4 py-3">F.I.Sh.</th>
                <th className="px-4 py-3">Kafedra</th>
                <th className="px-4 py-3 text-right">Reja</th>
                <th className="px-4 py-3 text-right">Amalda</th>
                <th className="px-4 py-3 text-right">Bajarilish %</th>
                <th className="px-4 py-3 text-right">KPI (%)</th>
                <th className="px-4 py-3 text-center">Tafsilotlar</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProfessors.map((prof, index) => (
                <tr key={prof.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-700">{(currentPage - 1) * pageSize + index + 1}</td>
                  <th className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">{prof.name}</th>
                  <td className="px-4 py-2">{prof.department.name}</td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-700">{prof.annualPlan.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right font-bold text-blue-600">{prof.totalScore.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right font-bold text-green-600">{prof.completionPercent.toFixed(1)}%</td>
                  <td className="px-4 py-2 text-right font-bold text-purple-600">{prof.kpiPercent.toFixed(1)}%</td>
                  <td className="px-4 py-2 text-center">
                    <button onClick={() => handleProfessorClick(prof)} className="text-blue-600 hover:underline text-sm font-medium">
                      Ko'rish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </Card>

      {selectedProfessor && (
        <ProfessorKPIDetailModal
          open={isModalOpen}
          onClose={handleCloseModal}
          professor={selectedProfessor}
          department={selectedProfessorDepartment}
          faculty={selectedProfessorFaculty}
          achievements={achievements}
          getScore={getScore}
          scoringSystem={scoringSystem}
          selectedYear={selectedYear}
        />
      )}
    </motion.div>
  );
};

const EfficiencyPage: React.FC<{
  facultyRatings: any[];
  departmentRatings: any[];
  professorsWithDetails: any[];
  searchQuery: string;
}> = ({ facultyRatings, departmentRatings, professorsWithDetails, searchQuery }) => {
  const [activeTab, setActiveTab] = useState('professors');
  const tabs = [
    { id: 'professors', label: 'Professor-o\'qituvchilar' },
    { id: 'departments', label: 'Kafedralar' },
    { id: 'faculties', label: 'Fakultetlar' },
  ];

  const failedMinThreshold = 0;
  const lowThreshold = 30;
  const midThreshold = 50;

  const renderLists = (items: any[]) => {
    const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const lowPerformers = filteredItems.filter(item => item.annualPlan > 0 && item.completionPercent >= lowThreshold && item.completionPercent < midThreshold);
    const failedPerformers = filteredItems.filter(item => item.annualPlan > 0 && item.completionPercent >= failedMinThreshold && item.completionPercent < lowThreshold);

    const ListComponent: React.FC<{ title: string, items: any[], color: 'yellow' | 'red' }> = ({ title, items, color }) => (
      <Card className={`border-l-4 ${color === 'yellow' ? 'border-yellow-500' : 'border-red-500'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${color === 'yellow' ? 'text-yellow-700' : 'text-red-700'}`}>{title}</h3>
        {items.length > 0 ? (
          <ul className="space-y-2 max-h-96 overflow-y-auto">
            {items.map(item => (
              <li key={item.id} className={`p-3 rounded-md flex justify-between items-center ${color === 'yellow' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                <span className="font-medium">{item.name}</span>
                <span className={`font-bold text-lg ${color === 'yellow' ? 'text-yellow-600' : 'text-red-600'}`}>{item.completionPercent.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">Ushbu toifada subyektlar mavjud emas.</p>
        )}
      </Card>
    );

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ListComponent title={`Samaradorligi past (bajarilish ${lowThreshold}% - ${midThreshold}%)`} items={lowPerformers} color="yellow" />
        <ListComponent title={`Rejani bajarmagan (bajarilish ${failedMinThreshold}% - ${lowThreshold}%)`} items={failedPerformers} color="red" />
      </div>
    );
  };

  const dataForTab = useMemo(() => {
    if (activeTab === 'professors') return professorsWithDetails;
    if (activeTab === 'departments') return departmentRatings;
    return facultyRatings;
  }, [activeTab, professorsWithDetails, departmentRatings, facultyRatings]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Samaradorlik va Nazorat</h1>
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      {renderLists(dataForTab)}
    </motion.div>
  );
};

const LoginModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onLogin: (username: string, password: string) => void;
  error: string;
}> = ({ open, onClose, onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  useEffect(() => {
    if (open) {
      setUsername('');
      setPassword('');
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose}>
        <div className="flex flex-col items-center mb-6">
          <img src={ASSETS.logos.university.path} alt="Logo" className="h-12 w-12 mb-3" />
          <h1 className="text-xl font-bold text-gray-800">Admin Panelga Kirish</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username-modal" className="block text-sm font-medium text-gray-700">Login</label>
            <input
              type="text"
              id="username-modal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              required
            />
          </div>
          <div>
            <label htmlFor="password-modal" className="block text-sm font-medium text-gray-700">Parol</label>
            <input
              type="password"
              id="password-modal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <LogIn size={16} className="mr-2" /> Kirish
          </button>
        </form>
    </Modal>
  );
};


// Asosiy ilova
function App() {
  const guestUser = useMemo(() => CONSTANTS.USERS.find((u: User) => u.role === 'guest') || {id: 0, username: 'guest', role: 'guest'}, []);
  
  const [user, setUser] = useState<User | null>(() => (AuthService.getCurrentUser() as User | null) || guestUser);
  const [loginError, setLoginError] = useState('');
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({ gender: [], degree: [], title: [], ageRange: [], position: [] });
  const [selectedYear, setSelectedYear] = useState(() => {
    const savedYear = Number(window.localStorage.getItem(REPORT_YEAR_STORAGE_KEY));
    return Number.isFinite(savedYear) && savedYear > 0 ? savedYear : 2026;
  });

  // Permissions
  const isSuperAdmin = user?.role === 'superadmin';
  const canManageProfessors = isSuperAdmin;

  // Ma'lumotlarni state'ga ko'chirish
  const [users, setUsers] = useState<User[]>(CONSTANTS.USERS);
  const [faculties, setFaculties] = useState<Faculty[]>(CONSTANTS.FACULTIES);
  const [departments, setDepartments] = useState<Department[]>(CONSTANTS.DEPARTMENTS);
  const [divisions, setDivisions] = useState<Division[]>(CONSTANTS.DIVISIONS);
  const [positions, setPositions] = useState<string[]>(CONSTANTS.POSITIONS);
  const [professors, setProfessors] = useState<Professor[]>(CONSTANTS.PROFESSORS);
  const [achievements, setAchievements] = useState<Achievement[]>(CONSTANTS.ACHIEVEMENTS);
  const [plans, setPlans] = useState<Plan[]>(CONSTANTS.PLANS);
  const [projects, setProjects] = useState<Project[]>(CONSTANTS.PROJECTS);
  const [scoringSystem, setScoringSystem] = useState<ScoringSystem>(CONSTANTS.SCORING_SYSTEM);
  const [thesisDefenses, setThesisDefenses] = useState<ThesisDefense[]>(CONSTANTS.THESIS_DEFENSES);
  const [remoteStateReady, setRemoteStateReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveErrorMessage, setSaveErrorMessage] = useState('');
  const skipInitialRemoteSave = useRef(true);
  const forceNextRemoteSave = useRef(false);
  const lastSavedStateRef = useRef<string>('');
  const saveDebounceRef = useRef<number | null>(null);

  const serializeState = useCallback((
    facultiesList: Faculty[],
    departmentsList: Department[],
    divisionsList: Division[],
    positionsList: string[],
    projectsList: Project[],
    professorsList: Professor[],
    plansList: Plan[],
    achievementsList: Achievement[],
    scoringSystemObj: ScoringSystem,
    usersList: User[],
    thesisDefensesList: ThesisDefense[]
  ) => {
    return JSON.stringify({
      FACULTIES: facultiesList,
      DEPARTMENTS: departmentsList,
      DIVISIONS: divisionsList,
      POSITIONS: positionsList,
      PROJECTS: projectsList,
      PROFESSORS: professorsList,
      PLANS: plansList,
      ACHIEVEMENTS: achievementsList,
      SCORING_SYSTEM: scoringSystemObj,
      USERS: stripUserSecrets(usersList),
      THESIS_DEFENSES: thesisDefensesList,
    });
  }, []);

  const availableReportYears = useMemo(() => {
    const years = new Set<number>([selectedYear, 2026]);
    achievements.forEach(item => {
      if (Number.isFinite(item.year)) years.add(item.year);
    });
    plans.forEach(item => {
      if (Number.isFinite(item.year)) years.add(item.year);
    });
    thesisDefenses.forEach(item => {
      if (Number.isFinite(item.year)) years.add(item.year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [achievements, plans, selectedYear, thesisDefenses]);

  useEffect(() => {
    window.localStorage.setItem(REPORT_YEAR_STORAGE_KEY, String(selectedYear));
  }, [selectedYear]);

  useEffect(() => {
    let cancelled = false;

    const loadBaseData = async () => {
      try {
        const data = await DataService.init();
        if (cancelled) return;

        setUsers(stripUserSecrets((data.USERS as User[]) || CONSTANTS.USERS) as User[]);
        setFaculties((data.FACULTIES as Faculty[]) || CONSTANTS.FACULTIES);
        setDepartments((data.DEPARTMENTS as Department[]) || CONSTANTS.DEPARTMENTS);
        setDivisions((data.DIVISIONS as Division[]) || CONSTANTS.DIVISIONS);
        setPositions((data.POSITIONS as string[]) || CONSTANTS.POSITIONS);
        setProfessors((data.PROFESSORS as Professor[]) || CONSTANTS.PROFESSORS);
        setAchievements((data.ACHIEVEMENTS as Achievement[]) || CONSTANTS.ACHIEVEMENTS);
        setPlans((data.PLANS as Plan[]) || CONSTANTS.PLANS);
        setProjects((data.PROJECTS as Project[]) || CONSTANTS.PROJECTS);
        setScoringSystem((data.SCORING_SYSTEM as ScoringSystem) || CONSTANTS.SCORING_SYSTEM);
        setThesisDefenses((data.THESIS_DEFENSES as ThesisDefense[]) || CONSTANTS.THESIS_DEFENSES);
      } catch (error) {
        console.warn('DataService init failed, keeping default constants:', error);
      }
    };

    loadBaseData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadRemoteState = async () => {
      try {
        const remoteState = await SupabaseState.load();
        const fallbackState = SupabaseState.loadLocal();
        
        // Use chooseNewest() to compare __savedAt timestamps.
        // If the admin just added data (saved to localStorage immediately)
        // but the page refreshed before Supabase synced, the local copy
        // will be newer and must win — otherwise changes are silently lost.
        const { state: appState, source } = SupabaseState.chooseNewest(remoteState, fallbackState);

        if (cancelled || !appState) return;
        skipInitialRemoteSave.current = source !== 'local';
        forceNextRemoteSave.current = source === 'local';

        setUsers(stripUserSecrets((appState.USERS as User[]) || CONSTANTS.USERS) as User[]);
        setFaculties((appState.FACULTIES as Faculty[]) || CONSTANTS.FACULTIES);
        setDepartments((appState.DEPARTMENTS as Department[]) || CONSTANTS.DEPARTMENTS);
        setDivisions((appState.DIVISIONS as Division[]) || CONSTANTS.DIVISIONS);
        setPositions((appState.POSITIONS as string[]) || CONSTANTS.POSITIONS);
        setProfessors((appState.PROFESSORS as Professor[]) || CONSTANTS.PROFESSORS);
        setAchievements((appState.ACHIEVEMENTS as Achievement[]) || CONSTANTS.ACHIEVEMENTS);
        setPlans((appState.PLANS as Plan[]) || CONSTANTS.PLANS);
        setProjects((appState.PROJECTS as Project[]) || CONSTANTS.PROJECTS);
        setScoringSystem((appState.SCORING_SYSTEM as ScoringSystem) || CONSTANTS.SCORING_SYSTEM);
        setThesisDefenses((appState.THESIS_DEFENSES as ThesisDefense[]) || CONSTANTS.THESIS_DEFENSES);

        lastSavedStateRef.current = serializeState(
          (appState.FACULTIES as Faculty[]) || CONSTANTS.FACULTIES,
          (appState.DEPARTMENTS as Department[]) || CONSTANTS.DEPARTMENTS,
          (appState.DIVISIONS as Division[]) || CONSTANTS.DIVISIONS,
          (appState.POSITIONS as string[]) || CONSTANTS.POSITIONS,
          (appState.PROJECTS as Project[]) || CONSTANTS.PROJECTS,
          (appState.PROFESSORS as Professor[]) || CONSTANTS.PROFESSORS,
          (appState.PLANS as Plan[]) || CONSTANTS.PLANS,
          (appState.ACHIEVEMENTS as Achievement[]) || CONSTANTS.ACHIEVEMENTS,
          (appState.SCORING_SYSTEM as ScoringSystem) || CONSTANTS.SCORING_SYSTEM,
          (appState.USERS as User[]) || CONSTANTS.USERS,
          (appState.THESIS_DEFENSES as ThesisDefense[]) || CONSTANTS.THESIS_DEFENSES
        );
      } catch (error) {
        console.error('Supabase state load error:', error);
        const fallbackState = SupabaseState.loadLocal();
        if (cancelled || !fallbackState) return;
        skipInitialRemoteSave.current = false;
        forceNextRemoteSave.current = true;

        setUsers(stripUserSecrets((fallbackState.USERS as User[]) || CONSTANTS.USERS) as User[]);
        setFaculties((fallbackState.FACULTIES as Faculty[]) || CONSTANTS.FACULTIES);
        setDepartments((fallbackState.DEPARTMENTS as Department[]) || CONSTANTS.DEPARTMENTS);
        setDivisions((fallbackState.DIVISIONS as Division[]) || CONSTANTS.DIVISIONS);
        setPositions((fallbackState.POSITIONS as string[]) || CONSTANTS.POSITIONS);
        setProfessors((fallbackState.PROFESSORS as Professor[]) || CONSTANTS.PROFESSORS);
        setAchievements((fallbackState.ACHIEVEMENTS as Achievement[]) || CONSTANTS.ACHIEVEMENTS);
        setPlans((fallbackState.PLANS as Plan[]) || CONSTANTS.PLANS);
        setProjects((fallbackState.PROJECTS as Project[]) || CONSTANTS.PROJECTS);
        setScoringSystem((fallbackState.SCORING_SYSTEM as ScoringSystem) || CONSTANTS.SCORING_SYSTEM);
        setThesisDefenses((fallbackState.THESIS_DEFENSES as ThesisDefense[]) || CONSTANTS.THESIS_DEFENSES);

        lastSavedStateRef.current = serializeState(
          (fallbackState.FACULTIES as Faculty[]) || CONSTANTS.FACULTIES,
          (fallbackState.DEPARTMENTS as Department[]) || CONSTANTS.DEPARTMENTS,
          (fallbackState.DIVISIONS as Division[]) || CONSTANTS.DIVISIONS,
          (fallbackState.POSITIONS as string[]) || CONSTANTS.POSITIONS,
          (fallbackState.PROJECTS as Project[]) || CONSTANTS.PROJECTS,
          (fallbackState.PROFESSORS as Professor[]) || CONSTANTS.PROFESSORS,
          (fallbackState.PLANS as Plan[]) || CONSTANTS.PLANS,
          (fallbackState.ACHIEVEMENTS as Achievement[]) || CONSTANTS.ACHIEVEMENTS,
          (fallbackState.SCORING_SYSTEM as ScoringSystem) || CONSTANTS.SCORING_SYSTEM,
          (fallbackState.USERS as User[]) || CONSTANTS.USERS,
          (fallbackState.THESIS_DEFENSES as ThesisDefense[]) || CONSTANTS.THESIS_DEFENSES
        );
      } finally {
        if (!cancelled) setRemoteStateReady(true);
      }
    };

    loadRemoteState();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!remoteStateReady) return;
    if (!isSuperAdmin) return; // ONLY admin can save state to Supabase/LocalStorage
    if (skipInitialRemoteSave.current) {
      skipInitialRemoteSave.current = false;
      return;
    }

    const currentSerialized = serializeState(
      faculties,
      departments,
      divisions,
      positions,
      projects,
      professors,
      plans,
      achievements,
      scoringSystem,
      users,
      thesisDefenses
    );

    const forceSave = forceNextRemoteSave.current;
    forceNextRemoteSave.current = false;

    if (!forceSave && currentSerialized === lastSavedStateRef.current) {
      return;
    }

    lastSavedStateRef.current = currentSerialized;
    setSaveStatus('saving');
    setSaveErrorMessage('');

    const stateToSave = {
      FACULTIES: faculties,
      DEPARTMENTS: departments,
      DIVISIONS: divisions,
      POSITIONS: positions,
      EMPLOYMENT_TYPES: CONSTANTS.EMPLOYMENT_TYPES,
      PROJECT_TYPES: CONSTANTS.PROJECT_TYPES,
      PROJECT_DIRECTIONS: CONSTANTS.PROJECT_DIRECTIONS,
      PROJECT_LEADER_POSITIONS: CONSTANTS.PROJECT_LEADER_POSITIONS,
      PROJECT_DURATIONS: CONSTANTS.PROJECT_DURATIONS,
      PROJECTS: projects,
      PROFESSORS: professors,
      PLANS: plans,
      ACHIEVEMENTS: achievements,
      SCORING_SYSTEM: scoringSystem,
      USERS: stripUserSecrets(users),
      THESIS_DEFENSES: thesisDefenses,
      SPECIALTIES: CONSTANTS.SPECIALTIES,
      FIELDS_OF_SCIENCE: CONSTANTS.FIELDS_OF_SCIENCE,
      DEFENSE_TYPES: CONSTANTS.DEFENSE_TYPES,
      [SupabaseState.savedAtKey]: new Date().toISOString(),
    };

    // Save to localStorage immediately so data is never lost
    SupabaseState.saveLocal(stateToSave);

    // Use a ref-based debounce so the timer is NOT cancelled by React's
    // useEffect cleanup when dependencies change. This prevents saves from
    // being dropped when the admin navigates or interacts with the UI.
    if (saveDebounceRef.current !== null) {
      window.clearTimeout(saveDebounceRef.current);
    }
    saveDebounceRef.current = window.setTimeout(() => {
      saveDebounceRef.current = null;
      SupabaseState.save(stateToSave, AuthService.getAccessToken())
        .then(async () => {
          try {
            await DataService.syncToSupabase();
          } catch (syncError) {
            console.warn('DataService sync warning:', syncError);
          }
          setSaveStatus('saved');
        })
        .catch((error) => {
          console.error('Supabase state save error:', error);
          setSaveStatus('error');
          setSaveErrorMessage(error instanceof Error ? error.message : 'Saqlash vaqtida xato yuz berdi');
        });
    }, 1500);
  }, [remoteStateReady, isSuperAdmin, users, faculties, departments, divisions, positions, professors, achievements, plans, projects, scoringSystem, thesisDefenses, serializeState]);

  const getScore = useCallback((type: string, subType: string): number => {
    // @ts-ignore
    return scoringSystem[type]?.[subType]?.score || 0;
  }, [scoringSystem]);

  // Processed data for selected year
  const processedData = useMemo(() => {
    const totalCriteriaCount = (Object.values(scoringSystem as Record<string, ScoringCategory>) as ScoringCategory[]).reduce(
      (sum: number, type: ScoringCategory) => sum + Object.keys(type).length,
      0
    );

    const professorsWithDetails = professors.map(prof => {
      let totalScore = 0;
      const profAchievements = achievements.filter(a => a.professorId === prof.id && a.year === selectedYear);
      
      profAchievements.forEach(ach => {
        totalScore += getScore(ach.type, ach.subType) * ach.count;
      });

      const fulfilledCriteria = new Set(profAchievements.map(a => `${a.type}-${a.subType}`));
      const fulfilledCriteriaCount = fulfilledCriteria.size;
      const kpiPercent = totalCriteriaCount > 0 ? (fulfilledCriteriaCount / totalCriteriaCount) * 100 : 0;

      const department = departments.find(d => d.id === prof.departmentId);
      const faculty = department ? faculties.find(f => f.id === department.facultyId) : undefined;
      
      const profPlan = plans.find(p => p.professorId === prof.id && p.year === selectedYear);
      const annualPlan = profPlan ? profPlan.planItems.reduce((sum, item) => sum + getScore(item.type, item.subType) * item.count, 0) : 0;

      const completionPercent = annualPlan > 0 ? (totalScore / annualPlan) * 100 : 0;
      return { ...prof, name: getProfessorName(prof), totalScore, department, faculty, annualPlan, completionPercent, kpiPercent };
    }).sort((a, b) => b.completionPercent - a.completionPercent);

    const departmentRatings = departments.map(dep => {
      const professorsInDept = professorsWithDetails.filter(p => p.departmentId === dep.id);
      const totalScore = professorsInDept.reduce((sum, p) => sum + p.totalScore, 0);
      const totalPlan = professorsInDept.reduce((sum, p) => sum + p.annualPlan, 0);
      const totalStaffUnits = professorsInDept.reduce((sum, p) => sum + p.staffUnit, 0);
      const completionPercent = totalPlan > 0 ? (totalScore / totalPlan) * 100 : 0;
      
      const degreeHolders = professorsInDept.filter(p => p.degree === 'PhD' || p.degree === 'DSc').length;
      const scientificPotential = professorsInDept.length > 0 ? (degreeHolders / professorsInDept.length) * 100 : 0;

      return { ...dep, professors: professorsInDept, totalScore, totalPlan, completionPercent, degreeHolders, scientificPotential, totalStaffUnits };
    }).sort((a, b) => b.completionPercent - a.completionPercent);

    const facultyRatings = faculties.map(fac => {
      const departmentsInFaculty = departmentRatings.filter(d => d.facultyId === fac.id);
      const professorsInFaculty = professorsWithDetails.filter(p => p.faculty?.id === fac.id);
      const totalScore = departmentsInFaculty.reduce((sum, d) => sum + d.totalScore, 0);
      const totalPlan = departmentsInFaculty.reduce((sum, d) => sum + d.totalPlan, 0);
      const totalStaffUnits = professorsInFaculty.reduce((sum, p) => sum + p.staffUnit, 0);
      const completionPercent = totalPlan > 0 ? (totalScore / totalPlan) * 100 : 0;

      const degreeHolders = professorsInFaculty.filter(p => p.degree === 'PhD' || p.degree === 'DSc').length;
      const scientificPotential = professorsInFaculty.length > 0 ? (degreeHolders / professorsInFaculty.length) * 100 : 0;

      return { ...fac, departments: departmentsInFaculty, professors: professorsInFaculty, totalScore, totalPlan, completionPercent, degreeHolders, scientificPotential, totalStaffUnits };
    }).sort((a, b) => b.completionPercent - a.completionPercent);

    const achievementsForYear = achievements.filter(a => a.year === selectedYear);

    const totalProfessors = professors.length;
    const totalDSc = professors.filter(p => p.degree === 'DSc').length;
    const totalPhD = professors.filter(p => p.degree === 'PhD').length;
    const totalDegreeHolders = totalDSc + totalPhD;
    const universityScientificPotential = totalProfessors > 0 ? (totalDegreeHolders / totalProfessors) * 100 : 0;
    
    const projectTypeCounts = projects.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return { professorsWithDetails, departmentRatings, facultyRatings, achievements: achievementsForYear, getScore, selectedYear, universityScientificPotential, allProfessors: professors, totalDegreeHolders, totalDSc, totalPhD, projectTypeCounts };
  }, [selectedYear, faculties, departments, professors, achievements, plans, projects, getScore, scoringSystem]);

  const handleLogin = async (username: string, password: string) => {
    const authenticatedUser = await AuthService.login({ username, password });
    if (authenticatedUser?.role === 'superadmin') {
      setUser(authenticatedUser as User);
      setActiveView('dashboard');
      setLoginError('');
      setLoginModalOpen(false);
      // Auto-sync localStorage data to Supabase so all browsers see the same data
      const token = AuthService.getAccessToken();
      if (token) {
        DataService.syncRelationalToSupabase(token).then(() => {
          console.log('Data synced to Supabase after admin login.');
        }).catch((err) => {
          console.warn('Supabase sync after login failed:', err);
        });
      }
    } else {
      setLoginError('Login yoki parol noto‘g‘ri. Yoki sizda admin huquqi yo\'q.');
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setUser(guestUser);
    setActiveView('dashboard');
    setLoginError('');
  };

  useEffect(() => {
    // Reset search and filters when view changes
    setSearchQuery('');
    setFilters({ gender: [], degree: [], title: [], ageRange: [], position: [] });
  }, [activeView]);

  if (!user) {
    // This should not happen with default guest user, but as a fallback
    return <div>Loading...</div>;
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <GeneralStatisticsPage data={processedData} faculties={faculties} departments={departments} professors={processedData.allProfessors} achievements={achievements} scoringSystem={scoringSystem} selectedYear={selectedYear} plans={plans} thesisDefenses={thesisDefenses} />;
      case 'faculties':
        return <RatingsPage data={processedData} type="faculty" />;
      case 'departments':
        return <RatingsPage data={processedData} type="department" />;
      case 'professors':
        return <ProfessorOqituvchilarPage user={user} data={processedData} achievements={achievements} setAchievements={setAchievements} professors={professors} setProfessors={setProfessors} plans={plans} setPlans={setPlans} selectedYear={selectedYear} canEdit={canManageProfessors} scoringSystem={scoringSystem} getScore={getScore} faculties={faculties} departments={departments} positions={positions} employmentTypes={CONSTANTS.EMPLOYMENT_TYPES} searchQuery={searchQuery} setSearchQuery={setSearchQuery} filters={filters} setFilters={setFilters} saveStatus={saveStatus} saveErrorMessage={saveErrorMessage} />;
      case 'kpi':
        return <KPIPage
                  isSuperAdmin={isSuperAdmin}
                  professorsWithDetails={processedData.professorsWithDetails}
                  departmentRatings={processedData.departmentRatings}
                  facultyRatings={processedData.facultyRatings}
                  achievements={achievements}
                  getScore={getScore}
                  selectedYear={selectedYear}
                  scoringSystem={scoringSystem}
                  faculties={faculties}
                  departments={departments}
                />;
      case 'potential':
        return <ScientificPotentialPage isSuperAdmin={isSuperAdmin} facultyRatings={processedData.facultyRatings} departmentRatings={processedData.departmentRatings} professorsWithDetails={processedData.professorsWithDetails} thesisDefenses={thesisDefenses} faculties={faculties} departments={departments} positions={positions} searchQuery={searchQuery} setSearchQuery={setSearchQuery} filters={filters} setFilters={setFilters} specialties={CONSTANTS.SPECIALTIES} defenseTypes={CONSTANTS.DEFENSE_TYPES} />;
      case 'projects':
        return <ScientificProjectsPage
                  projects={projects}
                  professors={processedData.allProfessors}
                  faculties={faculties}
                  departments={departments}
                  projectTypes={CONSTANTS.PROJECT_TYPES}
                  projectDirections={CONSTANTS.PROJECT_DIRECTIONS}
                  projectLeaderPositions={CONSTANTS.PROJECT_LEADER_POSITIONS}
                  projectDurations={CONSTANTS.PROJECT_DURATIONS}
                  projectTypeCounts={processedData.projectTypeCounts}
                />;
      case 'performance':
        return <PerformanceMonitoringPage 
                  isSuperAdmin={isSuperAdmin}
                  professors={processedData.allProfessors}
                  achievements={achievements}
                  plans={plans}
                  getScore={getScore}
                  selectedYear={selectedYear}
                  faculties={faculties}
                  departments={departments}
                  searchQuery={searchQuery}
                />;
      case 'efficiency':
        return <EfficiencyPage
                  facultyRatings={processedData.facultyRatings}
                  departmentRatings={processedData.departmentRatings}
                  professorsWithDetails={processedData.professorsWithDetails}
                  searchQuery={searchQuery}
                />;
      case 'management':
        return <DataManagementPage 
                  user={user}
                  faculties={faculties} setFaculties={setFaculties}
                  departments={departments} setDepartments={setDepartments}
                  divisions={divisions} setDivisions={setDivisions}
                  professors={professors} setProfessors={setProfessors}
                  positions={positions} setPositions={setPositions}
                  employmentTypes={CONSTANTS.EMPLOYMENT_TYPES}
                  achievements={achievements} setAchievements={setAchievements}
                  plans={plans} setPlans={setPlans}
                  projects={projects} setProjects={setProjects}
                  projectTypes={CONSTANTS.PROJECT_TYPES}
                  projectDirections={CONSTANTS.PROJECT_DIRECTIONS}
                  projectLeaderPositions={CONSTANTS.PROJECT_LEADER_POSITIONS}
                  projectDurations={CONSTANTS.PROJECT_DURATIONS}
                  scoringSystem={scoringSystem} setScoringSystem={setScoringSystem}
                  users={users} setUsers={setUsers}
                  searchQuery={searchQuery}
                  thesisDefenses={thesisDefenses} setThesisDefenses={setThesisDefenses}
                  specialties={CONSTANTS.SPECIALTIES}
                  fieldsOfScience={CONSTANTS.FIELDS_OF_SCIENCE}
                  defenseTypes={CONSTANTS.DEFENSE_TYPES}
                />;
      default:
        return <GeneralStatisticsPage data={processedData} faculties={faculties} departments={departments} professors={processedData.allProfessors} achievements={achievements} scoringSystem={scoringSystem} selectedYear={selectedYear} plans={plans} thesisDefenses={thesisDefenses} />;
    }
  };

  const appTitle = 'SHDPI';

  let navItems: SidebarNavItem[] = [
    { id: 'dashboard', label: 'Umumiy statistika', icon: LayoutDashboard },
    { id: 'faculties', label: 'Fakultetlar', icon: Building },
    { id: 'departments', label: 'Kafedralar', icon: BarChart3 },
    { id: 'professors', label: 'Professor-o\'qituvchilar', icon: Users },
    { id: 'kpi', label: 'KPI', icon: Target },
    { id: 'potential', label: 'Ilmiy salohiyat', icon: Star },
    { id: 'projects', label: 'Loyiha va Startaplar', icon: Rocket },
    { id: 'performance', label: 'Monitoring', icon: TrendingUp },
    { id: 'efficiency', label: 'Samaradorlik', icon: TrendingDown },
  ];

  if (isSuperAdmin) {
    navItems.push({ id: 'management', label: 'Boshqarish', icon: Settings });
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <MobileMenu
        activeView={activeView}
        isOpen={sidebarOpen}
        logoPath={ASSETS.logos.university.path}
        navItems={navItems}
        onClose={() => setSidebarOpen(false)}
        onNavigate={setActiveView}
        title={appTitle}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header
          availableReportYears={availableReportYears}
          onLoginClick={() => setLoginModalOpen(true)}
          onLogout={handleLogout}
          onMenuClick={() => setSidebarOpen(true)}
          onYearChange={setSelectedYear}
          selectedYear={selectedYear}
          user={user}
        />
        {isSuperAdmin && (
          <div className="px-6 pt-3">
            {saveStatus === 'saving' && (
              <div className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                <span className="mr-1 h-2 w-2 animate-pulse rounded-full bg-yellow-600" /> Saqlanmoqda...
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                <span className="mr-1 h-2 w-2 rounded-full bg-green-600" /> Saqlandi
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                <span className="mr-1 h-2 w-2 rounded-full bg-red-600" /> Saqlashda xato
              </div>
            )}
            {saveErrorMessage && (
              <span className="ml-2 text-xs text-red-600">{saveErrorMessage}</span>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <LoginModal 
        open={loginModalOpen}
        onClose={() => { setLoginModalOpen(false); setLoginError(''); }}
        onLogin={handleLogin}
        error={loginError}
      />
    </div>
  );
}

export default App;
