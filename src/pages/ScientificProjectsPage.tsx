import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Lightbulb, Rocket, Award, Handshake, DollarSign } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { DonutChart } from '../components/ui/DonutChart';
import type { Project, Professor, Faculty, Department } from '../types/kpi';
import { formatFundingCompact, formatFundingTooltip } from '../utils/format';
import { ProjectBreakdownTable } from './ProjectBreakdownTable';

export const ScientificProjectsPage: React.FC<{
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
