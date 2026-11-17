import React, { useState, useMemo, useCallback } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Card } from '../components/ui/Card';
import type { Achievement, Faculty, Department, ScoringSystem, Plan, User } from '../types/kpi';

export const EnhancedCriteriaStatistics: React.FC<{
  achievements: Achievement[];
  professors: any[];
  faculties: Faculty[];
  departments: Department[];
  scoringSystem: ScoringSystem;
  selectedYear: number;
  plans: Plan[];
  user?: User;
}> = ({ achievements, professors, faculties, departments, scoringSystem, selectedYear, plans, user }) => {
  const [section, setSection] = useState<'general' | 'faculty' | 'department'>('general');
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | ''>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | ''>('');

  const professorsById = useMemo(() => {
    return professors.reduce<Record<number, typeof professors[number]>>((acc, prof) => {
      if (prof?.id != null) acc[prof.id] = prof;
      return acc;
    }, {});
  }, [professors]);

  const createEmptyStats = useCallback(() => {
    const stats: { [type: string]: { [subType: string]: { plan: number; actual: number } } } = {};
    Object.keys(scoringSystem).forEach(type => {
      stats[type] = {};
      Object.keys(scoringSystem[type]).forEach(subType => {
        stats[type][subType] = { plan: 0, actual: 0 };
      });
    });
    return stats;
  }, [scoringSystem]);

  const aggregatedStats = useMemo(() => {
    const generalStats = createEmptyStats();
    const facultyStats: Record<number, { [type: string]: { [subType: string]: { plan: number; actual: number } } }> = {};
    const departmentStats: Record<number, { [type: string]: { [subType: string]: { plan: number; actual: number } } }> = {};

    faculties.forEach(faculty => {
      facultyStats[faculty.id] = createEmptyStats();
    });
    departments.forEach(department => {
      departmentStats[department.id] = createEmptyStats();
    });

    const yearPlans = plans.filter(plan => plan.year === selectedYear);
    yearPlans.forEach(plan => {
      const prof = professorsById[plan.professorId];
      if (!prof) return;
      const facultyId = prof.faculty?.id;
      const departmentId = prof.department?.id;

      plan.planItems.forEach(item => {
        if (generalStats[item.type]?.[item.subType]) {
          generalStats[item.type][item.subType].plan += item.count;
        }
        if (facultyId && facultyStats[facultyId]?.[item.type]?.[item.subType]) {
          facultyStats[facultyId][item.type][item.subType].plan += item.count;
        }
        if (departmentId && departmentStats[departmentId]?.[item.type]?.[item.subType]) {
          departmentStats[departmentId][item.type][item.subType].plan += item.count;
        }
      });
    });

    const yearAchievements = achievements.filter(ach => ach.year === selectedYear);
    yearAchievements.forEach(ach => {
      const prof = professorsById[ach.professorId];
      if (!prof) return;
      const facultyId = prof.faculty?.id;
      const departmentId = prof.department?.id;

      if (generalStats[ach.type]?.[ach.subType]) {
        generalStats[ach.type][ach.subType].actual += ach.count;
      }
      if (facultyId && facultyStats[facultyId]?.[ach.type]?.[ach.subType]) {
        facultyStats[facultyId][ach.type][ach.subType].actual += ach.count;
      }
      if (departmentId && departmentStats[departmentId]?.[ach.type]?.[ach.subType]) {
        departmentStats[departmentId][ach.type][ach.subType].actual += ach.count;
      }
    });

    return {
      general: generalStats,
      faculties: facultyStats,
      departments: departmentStats,
    };
  }, [achievements, plans, professorsById, faculties, departments, selectedYear, createEmptyStats]);

  const selectedFaculty = faculties.find(faculty => faculty.id === selectedFacultyId);
  const selectedDepartment = departments.find(department => department.id === selectedDepartmentId);

  const currentStats = useMemo(() => {
    if (section === 'general') return aggregatedStats.general;
    if (section === 'faculty') return selectedFacultyId ? aggregatedStats.faculties[selectedFacultyId] : null;
    if (section === 'department') return selectedDepartmentId ? aggregatedStats.departments[selectedDepartmentId] : null;
    return null;
  }, [section, selectedFacultyId, selectedDepartmentId, aggregatedStats]);

  const getCompletionPercent = (actual: number, plan: number) => {
    if (plan === 0) return actual > 0 ? 100 : 0;
    return (actual / plan) * 100;
  };

  const getPerformanceColorClass = (actual: number, plan: number) => {
    const percent = getCompletionPercent(actual, plan);
    if (plan === 0) {
      return actual > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
    }
    if (percent >= 100) return 'bg-green-100 text-green-800';
    if (percent >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const handleExportCriteria = () => {
    if (!user || user.role !== 'superadmin') {
      alert('Faqat admin foydalanuvchilar ma\'lumotlarni eksport qila oladi');
      return;
    }
    if (!currentStats) return;

    const rows = Object.entries(currentStats).flatMap(([type, subTypes]) =>
      Object.entries(subTypes).map(([subType, values]) => ({
        '№': 0,
        'Mezon guruhi': type.replace(/_/g, ' '),
        'Mezon nomi': subType.replace(/_/g, ' '),
        'Reja': values.plan,
        'Amalda': values.actual,
        'Bajarilish %': +getCompletionPercent(values.actual, values.plan).toFixed(1),
      }))
    );

    const numberedRows = rows.map((row, index) => ({ ...row, '№': index + 1 }));
    const ws = XLSX.utils.json_to_sheet(numberedRows, { header: ['№', 'Mezon guruhi', 'Mezon nomi', 'Reja', 'Amalda', 'Bajarilish %'] });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mezonlar');
    const targetName =
      section === 'general'
        ? 'Institut'
        : section === 'faculty'
        ? selectedFaculty?.name || 'Fakultet'
        : selectedDepartment?.name || 'Kafedra';
    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Mezonlar_${section}_${targetName}_${today}.xlsx`);
  };

  const renderCriteriaCards = () => {
    if (!currentStats) {
      const prompt = section === 'faculty'
        ? 'Iltimos, statistikani ko‘rish uchun bir fakultet tanlang.'
        : section === 'department'
        ? 'Iltimos, statistikani ko‘rish uchun bir kafedra tanlang.'
        : 'Maʼlumotlar mavjud emas.';
      return <p className="text-center py-10 text-gray-500">{prompt}</p>;
    }

    return (
      <div className="space-y-8">
        {Object.entries(currentStats).map(([type, subTypes]) => (
          <div key={type}>
            <h4 className="text-base font-semibold text-gray-800 mb-4">{type.replace(/_/g, ' ')}</h4>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Object.entries(subTypes).map(([subType, values]) => (
                <div key={subType} className="border rounded-2xl p-4 bg-white shadow-sm">
                  <div className="text-sm font-semibold text-gray-700 mb-4">{subType.replace(/_/g, ' ')}</div>
                  <div className="flex justify-between text-sm text-gray-600 mb-3">
                    <span>Reja:</span>
                    <span>{values.plan}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-3">
                    <span>Amalda:</span>
                    <span>{values.actual}</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    Bajarilish: <span className={getPerformanceColorClass(values.actual, values.plan)}>{getCompletionPercent(values.actual, values.plan).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="mt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-[0.2em]">Mezonlar bo‘yicha tahlil</p>
          <h3 className="text-lg font-semibold text-gray-800">{selectedYear}-yil</h3>
        </div>
        {user && user.role === 'superadmin' && (
          <button
            type="button"
            onClick={handleExportCriteria}
            disabled={!currentStats}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <FileSpreadsheet size={16} className="mr-2" /> Excelga yuklab olish
          </button>
        )}
      </div>

      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-2" aria-label="Sections">
          {[
            { id: 'general', label: 'UMUMIY' },
            { id: 'faculty', label: 'FAKULTET' },
            { id: 'department', label: 'KAFEDRA' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSection(tab.id as typeof section);
                setSelectedFacultyId('');
                setSelectedDepartmentId('');
              }}
              className={`${section === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'} whitespace-nowrap rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {(section === 'faculty' || section === 'department') && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          {section === 'faculty' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fakultetni tanlang</label>
              <select
                value={selectedFacultyId}
                onChange={e => setSelectedFacultyId(e.target.value ? Number(e.target.value) : '')}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Barcha fakultetlar</option>
                {faculties.map(faculty => (
                  <option key={faculty.id} value={faculty.id}>{faculty.name}</option>
                ))}
              </select>
            </div>
          )}
          {section === 'department' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kafedrani tanlang</label>
              <select
                value={selectedDepartmentId}
                onChange={e => setSelectedDepartmentId(e.target.value ? Number(e.target.value) : '')}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Barcha kafedralar</option>
                {departments.map(department => (
                  <option key={department.id} value={department.id}>{department.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {renderCriteriaCards()}
    </Card>
  );
};
