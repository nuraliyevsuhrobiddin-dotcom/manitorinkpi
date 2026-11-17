import React, { useMemo } from 'react';
import { Card } from '../components/ui/Card';
import type { Professor, Faculty, Department } from '../types/kpi';

export const DegreeAndTitleStats: React.FC<{ professors: Professor[], faculties: Faculty[], departments: Department[] }> = ({ professors, faculties, departments }) => {
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
