import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Search } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Pagination } from '../components/ui/Pagination';
import { ProfessorKPIDetailModal } from '../components/modals/ProfessorKPIDetailModal';
import type { User, Achievement, ScoringSystem, Faculty, Department } from '../types/kpi';

export const KPIPage: React.FC<{
  user: User;
  professorsWithDetails: any[];
  departmentRatings: any[];
  facultyRatings: any[];
  achievements: Achievement[];
  getScore: (type: string, subType: string) => number;
  selectedYear: number;
  scoringSystem: ScoringSystem;
  faculties: Faculty[];
  departments: Department[];
  isSuperAdmin?: boolean;
}> = ({ user, professorsWithDetails, departmentRatings, facultyRatings, achievements, getScore, selectedYear, scoringSystem, faculties, departments, isSuperAdmin: _isSuperAdmin }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedProfessor, setSelectedProfessor] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const isKafedraAdmin = (user?.role === 'kafedra_mudiri' || user?.role === 'admin') && Boolean(user?.departmentId);
  const isDekan = user?.role === 'dekan' && Boolean(user?.facultyId);

  useEffect(() => {
    if (isKafedraAdmin && user.departmentId) {
      setSelectedDepartment(String(user.departmentId));
      const parentDept = departments.find(d => d.id === user.departmentId);
      if (parentDept?.facultyId) {
        setSelectedFaculty(String(parentDept.facultyId));
      }
    } else if (isDekan && user.facultyId) {
      setSelectedFaculty(String(user.facultyId));
    }
  }, [isKafedraAdmin, isDekan, user?.departmentId, user?.facultyId, departments]);

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
        (p.department?.name && p.department.name.toLowerCase().includes(lowerQuery))
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
    if (!selectedProfessor || !selectedProfessor.faculty) return null;
    return facultyRatings.find(f => f.id === selectedProfessor.faculty?.id);
  }, [selectedProfessor, facultyRatings]);

  const handleExportKPI = () => {
    if (user.role !== 'superadmin') {
      alert('Faqat admin foydalanuvchilar ma\'lumotlarni eksport qila oladi');
      return;
    }
    const dataToExport = filteredProfessors.map((prof, index) => ({
      '№': index + 1,
      'F.I.Sh.': prof.name,
      'Kafedra': prof.department?.name || 'Biriktirilmagan',
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
        {user && user.role !== 'guest' && (
          <button
            type="button"
            onClick={handleExportKPI}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
          >
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
              className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              disabled={isKafedraAdmin || isDekan}
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
              className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              disabled={isKafedraAdmin || (!selectedFaculty && filteredDepartments.length !== departments.length)}
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
                  <td className="px-4 py-2">{prof.department?.name || '—'}</td>
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
