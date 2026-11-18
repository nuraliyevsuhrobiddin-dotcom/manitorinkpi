import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { ChevronDown, ChevronRight, Filter, ChevronUp, Search, FileSpreadsheet } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Pagination } from '../components/ui/Pagination';
import { ProfessorFilterControls } from '../components/ProfessorFilterControls';
import type { User, Faculty, Department, ThesisDefense, Filters } from '../types/kpi';
import { getProfessorName, getAge } from '../utils/format';

export const ScientificPotentialPage: React.FC<{
  user: User;
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
  isSuperAdmin?: boolean;
  specialties: string[];
  defenseTypes: string[];
}> = ({ user, facultyRatings, departmentRatings, professorsWithDetails, thesisDefenses, faculties, departments, positions, searchQuery, setSearchQuery, filters, setFilters, specialties, defenseTypes }) => {
  const isKafedraAdmin = (user?.role === 'kafedra_mudiri' || user?.role === 'admin') && Boolean(user?.departmentId);
  const isDekan = user?.role === 'dekan' && Boolean(user?.facultyId);

  const [activeTab, setActiveTab] = useState(() => isKafedraAdmin ? 'departments' : 'faculties');
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

  const tabs = useMemo(() => {
    if (isKafedraAdmin) {
      return [
        { id: 'departments', label: 'Kafedra salohiyati' },
        { id: 'academics', label: 'Ilmiy darajalilar' },
        { id: 'defenses', label: 'Dissertatsiya himoyalari' },
      ];
    }
    return [
      { id: 'faculties', label: 'Fakultetlar' },
      { id: 'departments', label: 'Kafedralar' },
      { id: 'academics', label: 'Ilmiy darajalilar' },
      { id: 'defenses', label: 'Dissertatsiya himoyalari' },
    ];
  }, [isKafedraAdmin]);

  const scopedDepartmentRatings = useMemo(() => {
    if (isKafedraAdmin && user.departmentId) {
      return departmentRatings.filter(d => d.id === user.departmentId);
    }
    if (isDekan && user.facultyId) {
      return departmentRatings.filter(d => d.facultyId === user.facultyId);
    }
    return departmentRatings;
  }, [departmentRatings, isKafedraAdmin, isDekan, user?.departmentId, user?.facultyId]);

  const scopedFacultyRatings = useMemo(() => {
    if (isDekan && user.facultyId) {
      return facultyRatings.filter(f => f.id === user.facultyId);
    }
    return facultyRatings;
  }, [facultyRatings, isDekan, user?.facultyId]);

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
                            {getProfessorName(prof)} - <span className="font-medium">{prof.position}, {prof.degree !== 'YoвЂq' ? prof.degree : ''} {prof.title !== 'YoвЂq' ? prof.title : ''}</span>
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

  const academics = useMemo(() => {
    let list = professorsWithDetails.filter(p => p.degree === 'PhD' || p.degree === 'DSc');
    if (isKafedraAdmin && user.departmentId) {
      list = list.filter(p => p.departmentId === user.departmentId);
    } else if (isDekan && user.facultyId) {
      const facDeptIds = departments.filter(d => d.facultyId === user.facultyId).map(d => d.id);
      list = list.filter(p => facDeptIds.includes(p.departmentId));
    }
    return list;
  }, [professorsWithDetails, isKafedraAdmin, isDekan, user?.departmentId, user?.facultyId, departments]);

  const filteredAcademics = useMemo(() => {
    let filtered = academics;
    // Multi-select filters
    if (filters.gender.length > 0) {
      filtered = filtered.filter((p: any) => filters.gender.includes(p.gender));
    }
    if (filters.degree.length > 0) {
      filtered = filtered.filter((p: any) => {
        const d = (p.degree || '').trim().toLowerCase();
        return filters.degree.some(val => {
          if (val === 'DSc') return d.includes('dsc') || d.includes('fan doktori');
          if (val === 'PhD') return d.includes('phd') || d.includes('nomzod');
          if (val === 'none') return !d || d === 'none' || d === 'yo\'q' || d === '-' || d === 'mavjud emas';
          return d === val.toLowerCase();
        });
      });
    }
    if (filters.title.length > 0) {
      filtered = filtered.filter((p: any) => {
        const t = (p.title || '').trim().toLowerCase();
        return filters.title.some(val => {
          if (val === 'Professor') return t.includes('prof');
          if (val === 'Dotsent') return t.includes('dots') || t.includes('doc');
          if (val === 'none') return !t || t === 'none' || t === 'yo\'q' || t === '-' || t === 'mavjud emas';
          return t === val.toLowerCase();
        });
      });
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

  const handleExportAcademics = () => {
    if (user.role !== 'superadmin') {
      alert('Faqat admin foydalanuvchilar ma\'lumotlarni eksport qila oladi');
      return;
    }
    const dataToExport = filteredAcademics.map((prof, index) => ({
      'в„–': (currentPage - 1) * pageSize + index + 1,
      'F.I.Sh.': getProfessorName(prof),
      'Jinsi': prof.gender,
      'TugвЂilgan sana': prof.birthDate,
      'Yoshi': getAge(prof.birthDate),
      'Fakultet': prof.faculty?.name || 'вЂ”',
      'Kafedra': prof.department?.name || 'вЂ”',
      'Lavozimi': prof.position,
      'OвЂrindoshlik turi': prof.employmentType,
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
          {user && user.role !== 'guest' && (
            <button
              type="button"
              onClick={handleExportAcademics}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              <FileSpreadsheet size={16} className="mr-2" /> Excelga yuklash
            </button>
          )}
        </div>
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3">в„–</th>
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
                  <td className="px-4 py-2">{prof.faculty?.name || 'вЂ”'}</td>
                  <td className="px-4 py-2">{prof.department?.name || 'вЂ”'}</td>
                  <td className="px-4 py-2">{prof.position}</td>
                  <td className="px-4 py-2">{prof.employmentType}</td>
                  <td className="px-4 py-2">{prof.staffUnit.toFixed(2)}</td>
                  <td className="px-4 py-2 font-semibold text-blue-600">{prof.degree !== 'YoвЂq' ? prof.degree : '-'}</td>
                  <td className="px-4 py-2 font-semibold text-blue-600">{prof.title !== 'YoвЂq' ? prof.title : '-'}</td>
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

    const sortedDefenses = [...filteredDefenses].sort((a, b) => {
      const nameA = getProfessorName(a).toLowerCase();
      const nameB = getProfessorName(b).toLowerCase();
      return nameA.localeCompare(nameB, 'uz');
    });

    const handleExportDefenses = () => {
      if (!user || user.role === 'guest') {
        alert('Mehmon foydalanuvchilar ma\'lumotlarni eksport qila olmaydi');
        return;
      }
      const dataToExport = sortedDefenses.map((d, index) => {
        const dept = departments.find(dep => dep.id === d.departmentId);
        const faculty = faculties.find(f => f.id === d.facultyId);
        return {
          'в„–': index + 1,
          'F.I.Sh.': getProfessorName(d),
          'Turi': d.type,
          'Mavzu': d.thesisTopic,
          'Ilmiy rahbar': d.supervisor,
          'Fakultet': faculty?.name || 'N/A',
          'Kafedra': dept?.name || 'N/A',
          'Himoya sanasi': d.defenseDate,
        };
      });

      const ws = XLSX.utils.json_to_sheet(dataToExport, {
        header: ['в„–', 'F.I.Sh.', 'Turi', 'Mavzu', 'Ilmiy rahbar', 'Fakultet', 'Kafedra', 'Himoya sanasi'],
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Himoyalar');
      const today = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Dissertatsiya_himoyalari_${today}.xlsx`);
    };

    return (
      <>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
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
          {user && user.role !== 'guest' && (
            <button
              type="button"
              onClick={handleExportDefenses}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <FileSpreadsheet size={16} className="mr-2" /> Excelga yuklash
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3">в„–</th>
                <th className="px-4 py-3">F.I.Sh.</th>
                <th className="px-4 py-3">Turi</th>
                <th className="px-4 py-3">Mavzu</th>
                <th className="px-4 py-3">Rushnay</th>
                <th className="px-4 py-3">Kafedra</th>
                <th className="px-4 py-3">Himoya sanasi</th>
              </tr>
            </thead>
            <tbody>
              {sortedDefenses.map((d, index) => {
                const dept = departments.find(dep => dep.id === d.departmentId);
                return (
                  <tr key={d.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-700">{index + 1}</td>
                    <th className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">{getProfessorName(d)}</th>
                    <td className="px-4 py-2">{d.type}</td>
                    <td className="px-4 py-2">{d.thesisTopic}</td>
                    <td className="px-4 py-2">{d.rushnay}</td>
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
        {activeTab === 'faculties' && renderTable(scopedFacultyRatings)}
        {activeTab === 'departments' && renderTable(scopedDepartmentRatings)}
        {activeTab === 'academics' && renderAcademicsTable()}
        {activeTab === 'defenses' && renderDefensesTable()}
      </Card>
    </motion.div>
  );
};
