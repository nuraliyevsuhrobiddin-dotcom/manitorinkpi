import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { Filter, ChevronUp, ChevronDown, Search, ClipboardList, Eye, Edit, Trash2, FileSpreadsheet } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { ProfessorFilterControls } from '../components/ProfessorFilterControls';
import { ProfessorPlanModal } from '../components/modals/ProfessorPlanModal';
import { ProfessorEvaluationModal } from '../components/modals/ProfessorEvaluationModal';
import type { User, Achievement, Professor, Plan, ScoringSystem, Faculty, Department, Filters } from '../types/kpi';
import { getAge, getProfessorName } from '../utils/format';

export const ProfessorOqituvchilarPage: React.FC<{ user: User, data: any, achievements: Achievement[], setAchievements: any, professors: Professor[], setProfessors: any, plans: Plan[], setPlans: any, selectedYear: number, canEdit: boolean, scoringSystem: ScoringSystem, getScore: (type: string, subType: string) => number, faculties: Faculty[], departments: Department[], positions: string[], employmentTypes: string[], searchQuery: string, setSearchQuery: (s: string) => void, filters: Filters, setFilters: (f: Filters) => void, saveStatus: 'idle' | 'saving' | 'saved' | 'error', saveErrorMessage: string }> = ({ user, data, achievements, setAchievements, setProfessors, plans, setPlans, selectedYear, canEdit, scoringSystem, getScore, faculties, departments, positions, employmentTypes, searchQuery, setSearchQuery, filters, setFilters, saveStatus, saveErrorMessage }) => {
  const [selectedFaculty, setSelectedFaculty] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const pageSize = 10;

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

  const professorsToDisplay = useMemo(() => {
    let filtered = data.professorsWithDetails;

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
        (p.department?.name && p.department.name.toLowerCase().includes(lowercasedQuery))
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
    if (user.role !== 'superadmin') {
      alert('Faqat admin foydalanuvchilar ma\'lumotlarni eksport qila oladi');
      return;
    }
    const dataToExport = professorsToDisplay.map((prof: any, index: number) => ({
      '№': (currentPage - 1) * pageSize + index + 1,
      'F.I.Sh.': getProfessorName(prof),
      'Jinsi': prof.gender,
      'Tug‘ilgan sana': prof.birthDate,
      'Yoshi': getAge(prof.birthDate),
      'Fakultet': prof.faculty?.name || '—',
      'Kafedra': prof.department?.name || '—',
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
        {user && canEdit && (
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white border disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    disabled={isKafedraAdmin || isDekan}
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white border disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    disabled={isKafedraAdmin || (!selectedFaculty && filteredDepartments.length !== departments.length)}
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
                  <td className="px-4 py-2">{prof.faculty?.name || '—'}</td>
                  <td className="px-4 py-2">{prof.department?.name || '—'}</td>
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
                      {user?.role === 'superadmin' && (
                        <>
                          <button className="inline-flex items-center text-green-600 hover:text-green-800 mr-2" title="Tahrirlash" onClick={() => openEditModal(prof)}>
                            <Edit size={18} />
                          </button>
                          <button className="inline-flex items-center text-red-600 hover:text-red-800" title="O'chirish" onClick={() => { setActiveProfessor(prof); setDeleteModalOpen(true); }}>
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
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
            isAdminMode={user?.role === 'admin'}
            submittedBy={user?.id}
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
            isAdminMode={user?.role === 'admin'}
            submittedBy={user?.id}
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
