import React, { useMemo } from 'react';
import { Printer } from 'lucide-react';
import { Card } from '../ui/Card';
import { DonutChart } from '../ui/DonutChart';
import { Modal } from '../ui/Modal';
import type { Achievement, ScoringSystem } from '../../types/kpi';

export const ProfessorKPIDetailModal: React.FC<{
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
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{professor.name}</h2>
          <p className="text-sm text-gray-500">{professor.position}, {professor.department?.name || '—'}</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition-all print:hidden"
        >
          <Printer size={15} /> Portfolioni chop etish / PDF
        </button>
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
                  <td className="px-4 py-2">
                    <span className="font-medium">{ach.subType}</span>
                    {ach.documentUrl && (
                      <a
                        href={ach.documentUrl.startsWith('http') ? ach.documentUrl : `https://${ach.documentUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-indigo-600 hover:underline mt-0.5 print:hidden"
                      >
                        🔗 Asoslovchi havola ↗
                      </a>
                    )}
                    {ach.notes && <p className="text-[11px] text-gray-500 italic mt-0.5">📝 {ach.notes}</p>}
                  </td>
                  <td className="px-4 py-2 text-center">{ach.count}</td>
                  <td className="px-4 py-2 text-center">{ach.quarter}-chorak</td>
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

      {/* Signature block for formal university printing */}
      <div className="hidden print:flex justify-between items-end mt-12 pt-6 border-t border-gray-400 text-xs">
        <div>
          <p className="font-bold">Professor-o'qituvchi:</p>
          <p className="mt-4">_________________ ({professor.name})</p>
        </div>
        <div>
          <p className="font-bold">Kafedra mudiri:</p>
          <p className="mt-4">_________________</p>
        </div>
        <div>
          <p className="font-bold">Sana:</p>
          <p className="mt-4">"____" ____________ {new Date().getFullYear()}-yil</p>
        </div>
      </div>
    </Modal>
  );
};
