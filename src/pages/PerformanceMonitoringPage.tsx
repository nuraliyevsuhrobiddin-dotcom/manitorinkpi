import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { FileSpreadsheet } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { BarChart } from '../components/ui/BarChart';
import { Pagination } from '../components/ui/Pagination';
import type { User, Professor, Achievement, Plan, Faculty, Department } from '../types/kpi';
import { renderGrowthIndicator, getProfessorName } from '../utils/format';

export const PerformanceMonitoringPage: React.FC<{
  user: User;
  professors: Professor[];
  achievements: Achievement[];
  plans: Plan[];
  getScore: (type: string, subType: string) => number;
  selectedYear: number;
  faculties: Faculty[];
  departments: Department[];
  searchQuery: string;
  isSuperAdmin: boolean;
}> = ({ user, professors, achievements, plans, getScore, selectedYear, faculties, departments, searchQuery, isSuperAdmin }) => {
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

  const handleExportMonitoring = () => {
    if (user.role !== 'superadmin') {
      alert('Faqat admin foydalanuvchilar ma\'lumotlarni eksport qila oladi');
      return;
    }
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
        {user && isSuperAdmin && (
          <button
            type="button"
            onClick={handleExportMonitoring}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
          >
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
