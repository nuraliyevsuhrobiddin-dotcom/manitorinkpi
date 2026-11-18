import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { Building, GraduationCap, BookCopy, Briefcase, UserPlus, Rocket, Award, ClipboardList, UserCog, CheckCircle2, PlusCircle, Edit, Trash2, Edit3, XCircle, Clock, Upload, FileSpreadsheet } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import type { User, Faculty, Department, Division, Professor, Achievement, Plan, Project, ScoringSystem, ScoringCategory, ThesisDefense } from '../types/kpi';
import { getProfessorName } from '../utils/format';
import { AuthService } from '../shared/services/authService';
import { DataService } from '../shared/services/dataService';
import { ROLE_DEFINITIONS, getRoleMeta } from '../utils/roles';

export const DataManagementPage: React.FC<{
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
}> = ({ user, faculties, setFaculties, departments, setDepartments, divisions, setDivisions, professors, setProfessors, positions, setPositions, employmentTypes, achievements, setAchievements, plans, setPlans, projects, setProjects, projectTypes, projectDirections, projectLeaderPositions, projectDurations, scoringSystem, setScoringSystem, users, setUsers, searchQuery, thesisDefenses, setThesisDefenses, defenseTypes }) => {

  const allTabs = useMemo(() => [
    { id: 'faculties', label: 'Fakultetlar', icon: Building },
    { id: 'departments', label: 'Kafedralar', icon: GraduationCap },
    { id: 'divisions', label: 'Bo\'limlar', icon: BookCopy },
    { id: 'positions', label: 'Lavozimlar', icon: Briefcase },
    { id: 'professors', label: 'Professorlar', icon: UserPlus },
    { id: 'projects', label: 'Loyiha va Startaplar', icon: Rocket },
    { id: 'defenses', label: 'Dissertatsiya himoyalari', icon: Award },
    { id: 'criteria', label: 'Mezonlar', icon: ClipboardList },
    { id: 'users', label: 'Foydalanuvchilar', icon: UserCog },
    { id: 'approvals', label: 'Tasdiqlash', icon: CheckCircle2 },
  ], []);

  const tabs = useMemo(() => {
    const role = (user?.role || 'guest').toLowerCase();
    if (role === 'superadmin') return allTabs;
    if (role === 'ilmiy_bolim') {
      return allTabs.filter(t => ['approvals', 'projects', 'defenses', 'criteria'].includes(t.id));
    }
    if (role === 'kadrlar') {
      return allTabs.filter(t => ['professors', 'positions', 'divisions', 'departments'].includes(t.id));
    }
    if (role === 'kafedra_mudiri' || role === 'admin') {
      return allTabs.filter(t => ['professors'].includes(t.id));
    }
    return allTabs.filter(t => ['professors'].includes(t.id));
  }, [user?.role, allTabs]);

  const [activeTab, setActiveTab] = useState(tabs[0]?.id || 'professors');

  React.useEffect(() => {
    if (!tabs.some(t => t.id === activeTab)) {
      setActiveTab(tabs[0]?.id || 'professors');
    }
  }, [tabs, activeTab]);

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
    lastName: '', firstName: '', patronymic: '', facultyId: '' as any, departmentId: '' as any, specialty: '',
    type: 'PhD', fieldOfScience: '', thesisTopic: '', rushnay: '',
    councilNumber: '', defenseDate: ''
  });
  const [criterionForm, setCriterionForm] = useState({ type: '', subType: '', score: '', description: '' });
  const [userForm, setUserForm] = useState({ username: '', fullName: '', email: '', password: '', role: 'kafedra_mudiri', departmentId: '', facultyId: '' });

  // Form validation errors
  const [facultyErrors, setFacultyErrors] = useState<{ name?: string }>({});
  const [deptErrors, setDeptErrors] = useState<{ name?: string; facultyId?: string }>({});
  const [divisionErrors, setDivisionErrors] = useState<{ name?: string }>({});
  const [positionErrors, setPositionErrors] = useState<{ name?: string }>({});
  const [profErrors, setProfErrors] = useState<{ lastName?: string; firstName?: string; departmentId?: string; birthDate?: string; position?: string }>({});
  const [projErrors, setProjErrors] = useState<{ name?: string; leaderName?: string; facultyId?: string; departmentId?: string; totalFunding?: string }>({});
  const [defenseErrors, setDefenseErrors] = useState<{ lastName?: string; firstName?: string; facultyId?: string; departmentId?: string; thesisTopic?: string }>({});
  const [criterionErrors, setCriterionErrors] = useState<{ type?: string; subType?: string; score?: string }>({});
  const [userErrors, setUserErrors] = useState<{ username?: string; email?: string; password?: string; departmentId?: string; facultyId?: string; general?: string }>({});

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

  const [editUserModal, setEditUserModal] = useState<{ open: boolean; user: any; role?: string; departmentId?: number | null; facultyId?: number | null }>({ open: false, user: null });
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
  const handleAddFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { name?: string } = {};
    if (!facultyName.trim()) errs.name = 'Fakultet nomi kiritilishi shart';
    if (Object.keys(errs).length) { setFacultyErrors(errs); return; }
    setFacultyErrors({});
    setFaculties(p => [...p, { id: Date.now(), name: facultyName.trim() }]);
    setFacultyName('');
  };
  const handleEditFaculty = () => { setFaculties(p => p.map(f => f.id === editFacultyModal.faculty.id ? { ...f, name: editFacultyName } : f)); setEditFacultyModal({ open: false, faculty: null }); };
  const handleDeleteFaculty = () => {
    if (!deleteFacultyModal.faculty) return;
    const facId = deleteFacultyModal.faculty.id;
    const deptIdsToDelete = new Set(departments.filter(d => d.facultyId === facId).map(d => d.id));
    setFaculties(p => p.filter(f => f.id !== facId));
    setDepartments(p => p.filter(d => !deptIdsToDelete.has(d.id)));
    setProfessors(p => p.filter(prof => !deptIdsToDelete.has(prof.departmentId)));
    setProjects(p => p.filter(pr => pr.facultyId !== facId && !deptIdsToDelete.has(pr.departmentId)));
    setThesisDefenses(p => p.filter(td => td.facultyId !== facId && !deptIdsToDelete.has(td.departmentId)));
    setDeleteFacultyModal({ open: false, faculty: null });
  };

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { name?: string; facultyId?: string } = {};
    if (!deptName.trim()) errs.name = 'Kafedra nomi kiritilishi shart';
    if (!deptFacultyId) errs.facultyId = 'Fakultetni tanlang';
    if (Object.keys(errs).length) { setDeptErrors(errs); return; }
    setDeptErrors({});
    setDepartments(p => [...p, { id: Date.now(), name: deptName.trim(), facultyId: Number(deptFacultyId) }]);
    setDeptName('');
    setDeptFacultyId(faculties[0]?.id || '');
  };
  const handleEditDept = () => { setDepartments(p => p.map(d => d.id === editDeptModal.dept.id ? { ...d, name: editDeptName, facultyId: Number(editDeptFacultyId) } : d)); setEditDeptModal({ open: false, dept: null }); };
  const handleDeleteDept = () => {
    if (!deleteDeptModal.dept) return;
    const deptId = deleteDeptModal.dept.id;
    setDepartments(p => p.filter(d => d.id !== deptId));
    setProfessors(p => p.filter(prof => prof.departmentId !== deptId));
    setProjects(p => p.filter(pr => pr.departmentId !== deptId));
    setThesisDefenses(p => p.filter(td => td.departmentId !== deptId));
    setDeleteDeptModal({ open: false, dept: null });
  };

  const handleAddDivision = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { name?: string } = {};
    if (!divisionName.trim()) errs.name = 'Bo‘lim nomi kiritilishi shart';
    if (Object.keys(errs).length) { setDivisionErrors(errs); return; }
    setDivisionErrors({});
    setDivisions(p => [...p, { id: Date.now(), name: divisionName.trim() }]);
    setDivisionName('');
  };
  const handleEditDivision = () => { setDivisions(p => p.map(d => d.id === editDivisionModal.division.id ? { ...d, name: editDivisionName } : d)); setEditDivisionModal({ open: false, division: null }); };
  const handleDeleteDivision = () => { setDivisions(p => p.filter(d => d.id !== deleteDivisionModal.division.id)); setDeleteDivisionModal({ open: false, division: null }); };

  const handleAddPosition = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { name?: string } = {};
    if (!positionName.trim()) { errs.name = 'Lavozim nomi kiritilishi shart'; }
    else if (positions.includes(positionName.trim())) { errs.name = 'Bu lavozim allaqachon mavjud'; }
    if (Object.keys(errs).length) { setPositionErrors(errs); return; }
    setPositionErrors({});
    setPositions(p => [...p, positionName.trim()]);
    setPositionName('');
  };
  const handleEditPosition = () => { const { oldName } = editPositionModal; setPositions(p => p.map(pos => pos === oldName ? editPositionName : pos)); setProfessors(profs => profs.map(prof => prof.position === oldName ? { ...prof, position: editPositionName } : prof)); setEditPositionModal({ open: false, oldName: '' }); };
  const handleDeletePosition = () => { setPositions(p => p.filter(pos => pos !== deletePositionModal.name)); setDeletePositionModal({ open: false, name: '' }); };

  const handleAddProfessor = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { lastName?: string; firstName?: string; departmentId?: string; birthDate?: string; position?: string } = {};
    if (!profForm.lastName.trim()) errs.lastName = 'Familiya kiritilishi shart';
    if (!profForm.firstName.trim()) errs.firstName = 'Ism kiritilishi shart';
    if (!profForm.departmentId) errs.departmentId = 'Kafedrani tanlang';
    if (!profForm.birthDate) errs.birthDate = 'Tug‘ilgan sana kiritilishi shart';
    if (!profForm.position) errs.position = 'Lavozimni tanlang';
    if (Object.keys(errs).length) { setProfErrors(errs); return; }
    setProfErrors({});
    const newProfessor: any = { id: Date.now(), ...profForm, departmentId: Number(profForm.departmentId), staffUnit: Number(profForm.staffUnit) };
    setProfessors(p => [...p, newProfessor]);
    setProfForm({ lastName: '', firstName: '', patronymic: '', departmentId: departments[0]?.id || '', position: positions[0] || '', degree: 'Yo’q', title: 'Yo’q', phone: '', staffUnit: 1.0, gender: 'erkak', birthDate: '', employmentType: employmentTypes[0] || 'Asosiy' });
  };
  const handleProfFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { const { name, value } = e.target; setProfForm(p => ({ ...p, [name]: value })); setProfErrors(p => ({ ...p, [name]: undefined })); };

  const [importStatus, setImportStatus] = useState<string>('');

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Familiya': 'Aliyev',
        'Ism': 'Vali',
        'Otasining ismi': 'Karimovich',
        'Kafedra': departments[0]?.name || 'Pedagogika',
        'Lavozim': positions[0] || 'Katta o‘qituvchi',
        'Ilmiy daraja': 'PhD',
        'Ilmiy unvon': 'Dotsent',
        'Jinsi': 'erkak',
        'Tug‘ilgan sana (YYYY-MM-DD)': '1985-05-15',
        'Shtat birligi': 1.0,
        'Bandlik turi': 'Asosiy',
        'Telefon': '+998901234567',
      },
      {
        'Familiya': 'Karimova',
        'Ism': 'Zilola',
        'Otasining ismi': 'Rustam qizi',
        'Kafedra': departments[0]?.name || 'Pedagogika',
        'Lavozim': 'Assistent',
        'Ilmiy daraja': 'Yo‘q',
        'Ilmiy unvon': 'Yo‘q',
        'Jinsi': 'ayol',
        'Tug‘ilgan sana (YYYY-MM-DD)': '1992-08-20',
        'Shtat birligi': 1.0,
        'Bandlik turi': 'Asosiy',
        'Telefon': '+998909876543',
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Oqituvchilar_Shablon");
    XLSX.writeFile(wb, "Oqituvchilar_Import_Shablon_HEMIS.xlsx");
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws) as any[];

        if (!rawData || rawData.length === 0) {
          setImportStatus("Faylda ma'lumot topilmadi.");
          return;
        }

        let importedCount = 0;
        const newProfs: Professor[] = [];

        rawData.forEach((row, i) => {
          const lastName = String(row['Familiya'] || row['familiya'] || row['Last Name'] || '').trim();
          const firstName = String(row['Ism'] || row['ism'] || row['First Name'] || '').trim();
          if (!lastName || !firstName) return;

          const patronymic = String(row['Otasining ismi'] || row['otasining_ismi'] || row['Patronymic'] || '').trim();
          const deptNameRaw = String(row['Kafedra'] || row['kafedra'] || row['Department'] || '').trim().toLowerCase();
          
          const matchedDept = departments.find(d => d.name.toLowerCase() === deptNameRaw || d.name.toLowerCase().includes(deptNameRaw)) || departments[0];
          const deptId = matchedDept ? matchedDept.id : 1;

          const position = String(row['Lavozim'] || row['lavozim'] || row['Position'] || positions[0] || 'O‘qituvchi').trim();
          const degree = String(row['Ilmiy daraja'] || row['ilmiy_daraja'] || row['Degree'] || 'Yo‘q').trim();
          const title = String(row['Ilmiy unvon'] || row['ilmiy_unvon'] || row['Title'] || 'Yo‘q').trim();
          const genderRaw = String(row['Jinsi'] || row['jinsi'] || row['Gender'] || 'erkak').trim().toLowerCase();
          const gender = genderRaw.startsWith('a') ? 'ayol' : 'erkak';
          const birthDate = String(row['Tug‘ilgan sana (YYYY-MM-DD)'] || row['Tug‘ilgan sana'] || row['birthDate'] || '1990-01-01').trim();
          const staffUnit = Number(row['Shtat birligi'] || row['staffUnit'] || 1.0) || 1.0;
          const employmentType = String(row['Bandlik turi'] || row['employmentType'] || 'Asosiy').trim();
          const phone = String(row['Telefon'] || row['phone'] || '').trim();

          newProfs.push({
            id: Date.now() + i + Math.floor(Math.random() * 1000),
            lastName,
            firstName,
            patronymic,
            departmentId: deptId,
            position,
            degree,
            title,
            gender,
            birthDate,
            staffUnit,
            employmentType,
            phone,
          } as any);
          importedCount++;
        });

        if (importedCount > 0) {
          setProfessors(prev => [...prev, ...newProfs]);
          setImportStatus(`✅ ${importedCount} nafar professor-o'qituvchi muvaffaqiyatli import qilindi!`);
        } else {
          setImportStatus("Fayl ustunlari shablonga mos kelmadi. Iltimos, shablonni tekshiring.");
        }
      } catch (err: any) {
        setImportStatus(`Xatolik yuz berdi: ${err.message || 'Faylni o‘qib bo‘lmadi'}`);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { name?: string; leaderName?: string; facultyId?: string; departmentId?: string; totalFunding?: string } = {};
    if (!projForm.name.trim()) errs.name = 'Loyiha nomi kiritilishi shart';
    if (!projForm.leaderName.trim()) errs.leaderName = 'Rahbar kiritilishi shart';
    if (!projForm.facultyId) errs.facultyId = 'Fakultetni tanlang';
    if (!projForm.departmentId) errs.departmentId = 'Kafedrani tanlang';
    if (!projForm.totalFunding || Number(projForm.totalFunding) <= 0) errs.totalFunding = 'Summa 0 dan katta bo‘lishi shart';
    if (Object.keys(errs).length) { setProjErrors(errs); return; }
    setProjErrors({});
    const newProject: Project = { id: Date.now(), ...projForm, facultyId: Number(projForm.facultyId), departmentId: Number(projForm.departmentId), totalFunding: Number(projForm.totalFunding), duration: Number(projForm.duration) };
    setProjects(p => [...p, newProject]);
    setProjForm({ name: '', type: projectTypes[0], direction: projectDirections[0], leaderPosition: projectLeaderPositions[0], leaderName: '', facultyId: '', departmentId: '', totalFunding: 0, duration: projectDurations[0] });
  };
  const handleEditProject = () => { setProjects(p => p.map(proj => proj.id === editProjectModal.project.id ? { ...proj, ...editProjForm, facultyId: Number(editProjForm.facultyId), departmentId: Number(editProjForm.departmentId), totalFunding: Number(editProjForm.totalFunding), duration: Number(editProjForm.duration) } : proj)); setEditProjectModal({ open: false, project: null }); };
  const handleDeleteProject = () => { setProjects(p => p.filter(proj => proj.id !== deleteProjectModal.project.id)); setDeleteProjectModal({ open: false, project: null }); };
  const handleProjFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { const { name, value } = e.target; setProjForm(p => { const newState = { ...p, [name]: value }; if (name === 'facultyId') { newState.departmentId = ''; } if (name === 'leaderPosition' && value !== 'Professor-o’qituvchi') { newState.leaderName = ''; } return newState; }); setProjErrors(p => ({ ...p, [name]: undefined })); };
  const handleEditProjFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { const { name, value } = e.target; setEditProjForm((p: any) => { const newState = { ...p, [name]: value }; if (name === 'facultyId') { newState.departmentId = ''; } if (name === 'leaderPosition' && value !== 'Professor-o’qituvchi') { newState.leaderName = ''; } return newState; }); };
  const filteredDeptsForForm = useMemo(() => { if (!projForm.facultyId) return []; return departments.filter(d => d.facultyId === Number(projForm.facultyId)); }, [projForm.facultyId, departments]);
  const filteredDeptsForEditForm = useMemo(() => { if (!editProjForm.facultyId) return []; return departments.filter(d => d.facultyId === Number(editProjForm.facultyId)); }, [editProjForm.facultyId, departments]);

  const handleAddCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    const { type, subType, score, description } = criterionForm;
    const errs: { type?: string; subType?: string; score?: string } = {};
    if (!type.trim()) errs.type = 'Tur kiritilishi shart';
    if (!subType.trim()) errs.subType = 'Nom kiritilishi shart';
    if (!score || Number(score) <= 0) errs.score = 'Ball 0 dan katta bo‘lishi shart';
    if (Object.keys(errs).length) { setCriterionErrors(errs); return; }
    setCriterionErrors({});
    setScoringSystem((p: ScoringSystem) => { const n = JSON.parse(JSON.stringify(p)); if (!n[type]) n[type] = {}; n[type][subType] = { score: Number(score), description }; return n; });
    setCriterionForm({ type: '', subType: '', score: '', description: '' });
  };
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

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { username?: string; email?: string; password?: string; departmentId?: string; facultyId?: string } = {};
    if (!userForm.username.trim() && !userForm.fullName.trim()) errs.username = 'Foydalanuvchi nomi kiritilishi shart';
    if ((userForm.role === 'admin' || userForm.role === 'kafedra_mudiri' || userForm.role === 'oqituvchi') && !userForm.departmentId) {
      errs.departmentId = 'Kafedrani tanlang';
    }
    if (userForm.role === 'dekan' && !userForm.facultyId) {
      errs.facultyId = 'Fakultetni tanlang';
    }
    if (Object.keys(errs).length) { setUserErrors(errs); return; }
    setUserErrors({});

    const deptIdNum = userForm.departmentId ? Number(userForm.departmentId) : null;
    const facIdNum = userForm.facultyId ? Number(userForm.facultyId) : null;
    const deptObj = departments.find(d => d.id === deptIdNum);
    const facObj = faculties.find(f => f.id === facIdNum);

    const baseUser: any = {
      username: userForm.username.trim() || userForm.fullName.trim(),
      fullName: userForm.fullName.trim() || userForm.username.trim(),
      email: userForm.email.trim(),
      role: userForm.role,
      departmentId: deptIdNum,
      facultyId: facIdNum,
      departmentName: deptObj?.name,
      facultyName: facObj?.name,
    };

    if (userForm.email.trim() && userForm.password.trim()) {
      const { user: registered, error } = await AuthService.register({
        username: baseUser.username,
        fullName: baseUser.fullName,
        email: userForm.email.trim(),
        password: userForm.password.trim(),
        role: baseUser.role,
        departmentId: deptIdNum,
        facultyId: facIdNum,
      });

      if (!registered) {
        setUserErrors({ general: error || "Foydalanuvchi yaratishda xatolik yuz berdi." });
        return;
      }

      // registered.id is the real Supabase Auth UUID — use it, not a client-generated one,
      // and persist the role/department to app_users so RLS actually grants access.
      const newUser = { ...baseUser, id: registered.id };
      try {
        await DataService.appUsers.save(newUser, AuthService.getAccessToken());
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setUserErrors({ general: `Foydalanuvchi tizimga qo'shildi, lekin ruxsatlar saqlanmadi: ${message}` });
        return;
      }
      setUsers((p: User[]) => [...p, newUser]);
    } else {
      // No email/password — a login-less placeholder entry only (existing behavior).
      setUsers((p: User[]) => [...p, { ...baseUser, id: Date.now() }]);
    }

    setUserForm({ username: '', fullName: '', email: '', password: '', role: 'kafedra_mudiri', departmentId: '', facultyId: '' });
  };

  const handleEditUser = async () => {
    if (!editUserModal.user) return;
    const targetUser = editUserModal.user;
    const updatedDeptId = editUserModal.departmentId !== undefined ? editUserModal.departmentId : targetUser.departmentId;
    const updatedFacultyId = editUserModal.facultyId !== undefined ? editUserModal.facultyId : targetUser.facultyId;
    const updatedRole = editUserModal.role || targetUser.role;
    const deptObj = departments.find(d => d.id === updatedDeptId);
    const facObj = faculties.find(f => f.id === updatedFacultyId);

    const updatedUser = {
      ...targetUser,
      role: updatedRole as any,
      departmentId: updatedDeptId,
      facultyId: updatedFacultyId,
      departmentName: deptObj?.name,
      facultyName: facObj?.name,
    };

    // Only real auth-backed accounts (string UUID id) have an app_users row to sync.
    if (typeof targetUser.id === 'string') {
      try {
        await DataService.appUsers.save(updatedUser, AuthService.getAccessToken());
      } catch (err) {
        console.error('[App] Failed to sync app_users row on edit:', err instanceof Error ? err.message : err);
      }
    }

    setUsers((p: User[]) => p.map(u => u.id === targetUser.id ? updatedUser : u));
    setEditUserModal({ open: false, user: null });
  };

  const handleDeleteUser = async () => {
    const targetUser = deleteUserModal.user;
    if (typeof targetUser.id === 'string') {
      try {
        await DataService.appUsers.delete(targetUser.id, AuthService.getAccessToken());
      } catch (err) {
        console.error('[App] Failed to delete app_users row:', err instanceof Error ? err.message : err);
      }
    }
    setUsers(p => p.filter(u => u.id !== targetUser.id));
    setDeleteUserModal({ open: false, user: null });
  };

  const handleDefenseFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDefenseForm(p => {
      const newState = { ...p, [name]: value };
      if (name === 'facultyId') {
        newState.departmentId = '' as any;
      }
      return newState;
    });
    setDefenseErrors(p => ({ ...p, [name]: undefined }));
  };
  const handleAddDefense = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { lastName?: string; firstName?: string; facultyId?: string; departmentId?: string; thesisTopic?: string } = {};
    if (!defenseForm.lastName.trim()) errs.lastName = 'Familiya kiritilishi shart';
    if (!defenseForm.firstName.trim()) errs.firstName = 'Ism kiritilishi shart';
    if (!defenseForm.facultyId) errs.facultyId = 'Fakultetni tanlang';
    if (!defenseForm.departmentId) errs.departmentId = 'Kafedrani tanlang';
    if (!defenseForm.thesisTopic.trim()) errs.thesisTopic = 'Dissertatsiya mavzusi kiritilishi shart';
    if (Object.keys(errs).length) { setDefenseErrors(errs); return; }
    setDefenseErrors({});
    const newDefense = { ...defenseForm, id: Date.now(), facultyId: Number(defenseForm.facultyId), departmentId: Number(defenseForm.departmentId) };
    setThesisDefenses(p => [...p, newDefense]);
    setDefenseForm({
      lastName: '', firstName: '', patronymic: '', facultyId: '' as any, departmentId: '' as any, specialty: '',
      type: 'PhD', fieldOfScience: '', thesisTopic: '', rushnay: '',
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
              <form onSubmit={handleAddFaculty} className="space-y-4" noValidate>
                <div>
                  <input type="text" placeholder="Fakultet nomi" value={facultyName} onChange={e => { setFacultyName(e.target.value); setFacultyErrors({}); }} className={`w-full p-2 border rounded ${facultyErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                  {facultyErrors.name && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{facultyErrors.name}</p>}
                </div>
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
              <form onSubmit={handleAddDepartment} className="space-y-4" noValidate>
                <div>
                  <input type="text" placeholder="Kafedra nomi" value={deptName} onChange={e => { setDeptName(e.target.value); setDeptErrors(p => ({ ...p, name: undefined })); }} className={`w-full p-2 border rounded ${deptErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                  {deptErrors.name && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{deptErrors.name}</p>}
                </div>
                <div>
                  <select value={deptFacultyId} onChange={e => { setDeptFacultyId(e.target.value); setDeptErrors(p => ({ ...p, facultyId: undefined })); }} className={`w-full p-2 bg-white border rounded ${deptErrors.facultyId ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                    <option value="" disabled>Fakultetni tanlang</option>
                    {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  {deptErrors.facultyId && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{deptErrors.facultyId}</p>}
                </div>
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
              <form onSubmit={handleAddDivision} className="space-y-4" noValidate>
                <div>
                  <input type="text" placeholder="Bo'lim nomi" value={divisionName} onChange={e => { setDivisionName(e.target.value); setDivisionErrors({}); }} className={`w-full p-2 border rounded ${divisionErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                  {divisionErrors.name && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{divisionErrors.name}</p>}
                </div>
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
              <form onSubmit={handleAddPosition} className="space-y-4" noValidate>
                <div>
                  <input type="text" placeholder="Lavozim nomi" value={positionName} onChange={e => { setPositionName(e.target.value); setPositionErrors({}); }} className={`w-full p-2 border rounded ${positionErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                  {positionErrors.name && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{positionErrors.name}</p>}
                </div>
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
        <div className="space-y-6">
          {/* Excel / HEMIS Bulk Import Card */}
          <Card className="border border-indigo-200 dark:border-indigo-900 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 dark:from-slate-900 dark:to-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="text-indigo-600" size={20} />
                  Excel / HEMIS tizimidan ommaviy yuklash (Bulk Import)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  100+ o'qituvchini bir zumda Excel jadvali orqali tizimga avtomatik kiritish
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <FileSpreadsheet size={15} className="text-emerald-600" />
                  Namuna shablonni yuklab olish
                </button>

                <label className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer active:scale-95">
                  <Upload size={15} />
                  Excel faylni tanlash (.xlsx)
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleExcelImport}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {importStatus && (
              <div className="mt-3 p-2.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                {importStatus}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-4">Yangi professor-o'qituvchi qo'shish</h3>
            <form onSubmit={handleAddProfessor} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <input type="text" name="lastName" placeholder="Familiyasi" value={profForm.lastName} onChange={handleProfFormChange} className={`w-full p-2 border rounded ${profErrors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                  {profErrors.lastName && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{profErrors.lastName}</p>}
                </div>
                <div>
                  <input type="text" name="firstName" placeholder="Ismi" value={profForm.firstName} onChange={handleProfFormChange} className={`w-full p-2 border rounded ${profErrors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                  {profErrors.firstName && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{profErrors.firstName}</p>}
                </div>
                <div>
                  <input type="text" name="patronymic" placeholder="Otasining ismi" value={profForm.patronymic} onChange={handleProfFormChange} className="w-full p-2 border border-gray-300 rounded" />
                </div>
                <div>
                  <input type="date" name="birthDate" value={profForm.birthDate} onChange={handleProfFormChange} className={`w-full p-2 border rounded ${profErrors.birthDate ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                  {profErrors.birthDate && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{profErrors.birthDate}</p>}
                </div>
                <div>
                  <select name="gender" value={profForm.gender} onChange={handleProfFormChange} className="w-full p-2 bg-white border border-gray-300 rounded"><option value="erkak">Erkak</option><option value="ayol">Ayol</option></select>
                </div>
                <div>
                  <select name="departmentId" value={profForm.departmentId} onChange={handleProfFormChange} className={`w-full p-2 bg-white border rounded ${profErrors.departmentId ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}><option value="" disabled>Kafedrani tanlang</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
                  {profErrors.departmentId && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{profErrors.departmentId}</p>}
                </div>
                <div>
                  <select name="position" value={profForm.position} onChange={handleProfFormChange} className={`w-full p-2 bg-white border rounded ${profErrors.position ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}><option value="" disabled>Lavozimni tanlang</option>{positions.map(p => <option key={p} value={p}>{p}</option>)}</select>
                  {profErrors.position && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{profErrors.position}</p>}
                </div>
                <div>
                  <select name="employmentType" value={profForm.employmentType} onChange={handleProfFormChange} className="w-full p-2 bg-white border border-gray-300 rounded"><option value="" disabled>O'rindoshlik turini tanlang</option>{employmentTypes.map(p => <option key={p} value={p}>{p}</option>)}</select>
                </div>
                <div>
                  <select name="degree" value={profForm.degree} onChange={handleProfFormChange} className="w-full p-2 bg-white border border-gray-300 rounded"><option>Yo'q</option><option>PhD</option><option>DSc</option></select>
                </div>
                <div>
                  <select name="title" value={profForm.title} onChange={handleProfFormChange} className="w-full p-2 bg-white border border-gray-300 rounded"><option>Yo'q</option><option>Dotsent</option><option>Professor</option></select>
                </div>
                <div>
                  <input type="text" name="phone" placeholder="Telefon" value={profForm.phone} onChange={handleProfFormChange} className="w-full p-2 border border-gray-300 rounded" />
                </div>
                <div>
                  <input type="number" name="staffUnit" placeholder="Stavka" value={profForm.staffUnit} onChange={handleProfFormChange} step="0.25" min="0" className="w-full p-2 border border-gray-300 rounded" />
                </div>
              </div>
              <button type="submit" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"><PlusCircle size={16} className="mr-2" /> Qo'shish</button>
            </form>
          </Card>
        </div>
      );
      case 'projects': return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Yangi loyiha/startap qo'shish</h3>
            <form onSubmit={handleAddProject} className="space-y-4" noValidate>
              <div>
                <input type="text" name="name" placeholder="Loyiha / Startap nomi" value={projForm.name} onChange={handleProjFormChange} className={`w-full p-2 border rounded ${projErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                {projErrors.name && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{projErrors.name}</p>}
              </div>
              <select name="type" value={projForm.type} onChange={handleProjFormChange} className="w-full p-2 bg-white border border-gray-300 rounded">{projectTypes.map(t => <option key={t} value={t}>{t}</option>)}</select>
              <select name="direction" value={projForm.direction} onChange={handleProjFormChange} className="w-full p-2 bg-white border border-gray-300 rounded">{projectDirections.map(d => <option key={d} value={d}>{d}</option>)}</select>
              <select name="leaderPosition" value={projForm.leaderPosition} onChange={handleProjFormChange} className="w-full p-2 bg-white border border-gray-300 rounded">{projectLeaderPositions.map(p => <option key={p} value={p}>{p}</option>)}</select>
              <div>
                {projForm.leaderPosition === 'Professor-o’qituvchi' ? (
                  <select name="leaderName" value={projForm.leaderName} onChange={handleProjFormChange} className={`w-full p-2 bg-white border rounded ${projErrors.leaderName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                    <option value="" disabled>Rahbarni tanlang</option>
                    {professors.map(p => <option key={p.id} value={getProfessorName(p)}>{getProfessorName(p)}</option>)}
                  </select>
                ) : (
                  <input type="text" name="leaderName" placeholder="Rahbar F.I.Sh." value={projForm.leaderName} onChange={handleProjFormChange} className={`w-full p-2 border rounded ${projErrors.leaderName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                )}
                {projErrors.leaderName && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{projErrors.leaderName}</p>}
              </div>
              <div>
                <select name="facultyId" value={projForm.facultyId} onChange={handleProjFormChange} className={`w-full p-2 bg-white border rounded ${projErrors.facultyId ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}><option value="" disabled>Fakultetni tanlang</option>{faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
                {projErrors.facultyId && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{projErrors.facultyId}</p>}
              </div>
              <div>
                <select name="departmentId" value={projForm.departmentId} onChange={handleProjFormChange} className={`w-full p-2 bg-white border rounded ${projErrors.departmentId ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} disabled={!projForm.facultyId}><option value="" disabled>Kafedrani tanlang</option>{filteredDeptsForForm.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
                {projErrors.departmentId && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{projErrors.departmentId}</p>}
              </div>
              <div>
                <input type="number" name="totalFunding" placeholder="Umumiy summa (mln so'm)" value={projForm.totalFunding} onChange={handleProjFormChange} className={`w-full p-2 border rounded ${projErrors.totalFunding ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                {projErrors.totalFunding && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{projErrors.totalFunding}</p>}
              </div>
              <select name="duration" value={projForm.duration} onChange={handleProjFormChange} className="w-full p-2 bg-white border border-gray-300 rounded">{projectDurations.map(d => <option key={d} value={d}>{d} yillik</option>)}</select>
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
            <form onSubmit={handleAddDefense} className="space-y-3" noValidate>
              <div>
                <input type="text" name="lastName" placeholder="Familiyasi" value={defenseForm.lastName} onChange={handleDefenseFormChange} className={`w-full p-2 border rounded ${defenseErrors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                {defenseErrors.lastName && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{defenseErrors.lastName}</p>}
              </div>
              <div>
                <input type="text" name="firstName" placeholder="Ismi" value={defenseForm.firstName} onChange={handleDefenseFormChange} className={`w-full p-2 border rounded ${defenseErrors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                {defenseErrors.firstName && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{defenseErrors.firstName}</p>}
              </div>
              <input type="text" name="patronymic" placeholder="Otasining ismi" value={defenseForm.patronymic} onChange={handleDefenseFormChange} className="w-full p-2 border border-gray-300 rounded" />
              <div>
                <select name="facultyId" value={defenseForm.facultyId} onChange={handleDefenseFormChange} className={`w-full p-2 bg-white border rounded ${defenseErrors.facultyId ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}><option value="" disabled>Fakultetni tanlang</option>{faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
                {defenseErrors.facultyId && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{defenseErrors.facultyId}</p>}
              </div>
              <div>
                <select name="departmentId" value={defenseForm.departmentId} onChange={handleDefenseFormChange} className={`w-full p-2 bg-white border rounded ${defenseErrors.departmentId ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} disabled={!defenseForm.facultyId}><option value="" disabled>Kafedrani tanlang</option>{filteredDeptsForDefenseForm.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
                {defenseErrors.departmentId && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{defenseErrors.departmentId}</p>}
              </div>
              <input type="text" name="specialty" placeholder="Ixtisoslash" value={defenseForm.specialty} onChange={handleDefenseFormChange} className="w-full p-2 border border-gray-300 rounded" />
              <select name="type" value={defenseForm.type} onChange={handleDefenseFormChange} className="w-full p-2 bg-white border border-gray-300 rounded">{defenseTypes.map(t => <option key={t} value={t}>{t}</option>)}</select>
              <input type="text" name="fieldOfScience" placeholder="Fani" value={defenseForm.fieldOfScience} onChange={handleDefenseFormChange} className="w-full p-2 border border-gray-300 rounded" />
              <div>
                <input type="text" name="thesisTopic" placeholder="Dissertatsiya mavzusi" value={defenseForm.thesisTopic} onChange={handleDefenseFormChange} className={`w-full p-2 border rounded ${defenseErrors.thesisTopic ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                {defenseErrors.thesisTopic && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{defenseErrors.thesisTopic}</p>}
              </div>
              <input type="text" name="councilNumber" placeholder="Kengash raqami" value={defenseForm.councilNumber} onChange={handleDefenseFormChange} className="w-full p-2 border border-gray-300 rounded" />
              <input type="date" name="defenseDate" value={defenseForm.defenseDate} onChange={handleDefenseFormChange} className="w-full p-2 border border-gray-300 rounded" />
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
                <input type="text" name="specialty" placeholder="Ixtisoslash" value={editDefenseForm.specialty} onChange={handleEditDefenseFormChange} className="w-full p-2 border rounded" />
                <select name="type" value={editDefenseForm.type} onChange={handleEditDefenseFormChange} className="w-full p-2 bg-white border rounded">{defenseTypes.map(t => <option key={t} value={t}>{t}</option>)}</select>
              </div>
              <input type="text" name="fieldOfScience" placeholder="Fani" value={editDefenseForm.fieldOfScience} onChange={handleEditDefenseFormChange} className="w-full p-2 border rounded" />
              <input type="text" name="thesisTopic" placeholder="Dissertatsiya mavzusi" value={editDefenseForm.thesisTopic} onChange={handleEditDefenseFormChange} className="w-full p-2 border rounded" required />
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
              <form onSubmit={handleAddCriterion} className="space-y-4" noValidate>
                <div>
                  <input type="text" name="type" placeholder="Turi (masalan, publication)" value={criterionForm.type} onChange={e => { setCriterionForm(p => ({...p, type: e.target.value})); setCriterionErrors(p => ({...p, type: undefined})); }} className={`w-full p-2 border rounded ${criterionErrors.type ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                  {criterionErrors.type && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{criterionErrors.type}</p>}
                </div>
                <div>
                  <input type="text" name="subType" placeholder="Nomi (masalan, Scopus Q1)" value={criterionForm.subType} onChange={e => { setCriterionForm(p => ({...p, subType: e.target.value})); setCriterionErrors(p => ({...p, subType: undefined})); }} className={`w-full p-2 border rounded ${criterionErrors.subType ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                  {criterionErrors.subType && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{criterionErrors.subType}</p>}
                </div>
                <div>
                  <input type="number" name="score" placeholder="Ball" value={criterionForm.score} onChange={e => { setCriterionForm(p => ({...p, score: e.target.value})); setCriterionErrors(p => ({...p, score: undefined})); }} className={`w-full p-2 border rounded ${criterionErrors.score ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                  {criterionErrors.score && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{criterionErrors.score}</p>}
                </div>
                <input type="text" name="description" placeholder="Tavsifi" value={criterionForm.description} onChange={e => setCriterionForm(p => ({...p, description: e.target.value}))} className="w-full p-2 border border-gray-300 rounded" />
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Yangi foydalanuvchi va Bo'lim Admini qo'shish</h3>
              <form onSubmit={handleAddUser} className="space-y-4" noValidate>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Foydalanuvchi nomi / F.I.Sh</label>
                  <input
                    type="text"
                    placeholder="masalan: alivaliyev"
                    value={userForm.username}
                    onChange={e => { setUserForm(p => ({...p, username: e.target.value, fullName: e.target.value})); setUserErrors({}); }}
                    className={`w-full p-2 border rounded text-sm ${userErrors.username ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {userErrors.username && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{userErrors.username}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Email (ixtiyoriy, tizimga kirish uchun)</label>
                  <input
                    type="email"
                    placeholder="admin@kpi.uz"
                    value={userForm.email}
                    onChange={e => setUserForm(p => ({...p, email: e.target.value}))}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Parol (ixtiyoriy)</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={userForm.password}
                    onChange={e => setUserForm(p => ({...p, password: e.target.value}))}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Tizimdagi Rol</label>
                  <select
                    value={userForm.role}
                    onChange={e => setUserForm(p => ({...p, role: e.target.value}))}
                    className="w-full p-2 bg-white border border-gray-300 rounded text-sm cursor-pointer"
                  >
                    {Object.values(ROLE_DEFINITIONS).map(r => (
                      <option key={r.id} value={r.id}>
                        {r.icon} {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                {userForm.role === 'dekan' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Biriktiriladigan Fakultet</label>
                    <select
                      value={userForm.facultyId}
                      onChange={e => setUserForm(p => ({...p, facultyId: e.target.value}))}
                      className={`w-full p-2 bg-white border rounded text-sm ${userErrors.facultyId ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    >
                      <option value="">-- Fakultetni tanlang --</option>
                      {faculties.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                    {userErrors.facultyId && <p className="text-red-600 text-xs mt-1">⚠ {userErrors.facultyId}</p>}
                  </div>
                )}
                {(userForm.role === 'admin' || userForm.role === 'kafedra_mudiri' || userForm.role === 'oqituvchi') && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Biriktiriladigan Bo'lim (Kafedra)</label>
                    <select
                      value={userForm.departmentId}
                      onChange={e => setUserForm(p => ({...p, departmentId: e.target.value}))}
                      className={`w-full p-2 bg-white border rounded text-sm ${userErrors.departmentId ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    >
                      <option value="">-- Bo'limni tanlang --</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    {userErrors.departmentId && <p className="text-red-600 text-xs mt-1">⚠ {userErrors.departmentId}</p>}
                  </div>
                )}
                {userErrors.general && (
                  <p className="text-red-600 text-xs flex items-center gap-1 bg-red-50 border border-red-200 rounded p-2"><span>⚠</span>{userErrors.general}</p>
                )}
                <button type="submit" className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                  <UserPlus size={16} className="mr-2" /> Qo'shish / Tayinlash
                </button>
              </form>
            </Card>

            <Card className="lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Mavjud Foydalanuvchilar va Adminlar</h3>
              <ul className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredUsers.map((u: any) => {
                  const dept = departments.find(d => d.id === u.departmentId);
                  const fac = faculties.find(f => f.id === u.facultyId);
                  const roleMeta = getRoleMeta(u.role);
                  return (
                    <li key={u.id} className="p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-800 dark:text-gray-100">{u.fullName || u.username}</span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${roleMeta.badge}`}>
                            {roleMeta.icon} {roleMeta.label}
                          </span>
                        </div>
                        {u.email && <span className="text-xs text-gray-500 mt-0.5">{u.email}</span>}
                        {dept && (
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                            🏢 Kafedra: <strong>{dept.name}</strong>
                          </span>
                        )}
                        {fac && (
                          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1">
                            🏛️ Fakultet: <strong>{fac.name}</strong>
                          </span>
                        )}
                      </div>
                      {u.id !== user.id && (
                        <div className="flex items-center space-x-2 self-end sm:self-center">
                          <button
                            onClick={() => setEditUserModal({ open: true, user: u, role: u.role, departmentId: u.departmentId, facultyId: u.facultyId })}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors"
                            title="Tahrirlash va Rol Tayinlash"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteUserModal({ open: true, user: u })}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                            title="O'chirish"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>

            <Modal open={editUserModal.open} onClose={() => setEditUserModal({ open: false, user: null })}>
              <h2 className="text-lg font-bold mb-4 text-gray-800">
                {editUserModal.user?.fullName || editUserModal.user?.username} (Rol va Bo'limini O'zgartirish)
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Tizimdagi Rol</label>
                  <select
                    value={editUserModal.role || editUserModal.user?.role || 'kafedra_mudiri'}
                    onChange={e => setEditUserModal(p => ({ ...p, role: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded bg-white text-sm cursor-pointer"
                  >
                    {Object.values(ROLE_DEFINITIONS).map(r => (
                      <option key={r.id} value={r.id}>
                        {r.icon} {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                {(editUserModal.role || editUserModal.user?.role) === 'dekan' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Biriktirilgan Fakultet</label>
                    <select
                      value={editUserModal.facultyId !== undefined ? (editUserModal.facultyId || '') : (editUserModal.user?.facultyId || '')}
                      onChange={e => setEditUserModal(p => ({ ...p, facultyId: e.target.value ? Number(e.target.value) : null }))}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-sm"
                    >
                      <option value="">-- Fakultetni tanlang --</option>
                      {faculties.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {['admin', 'kafedra_mudiri', 'oqituvchi'].includes(editUserModal.role || editUserModal.user?.role) && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Biriktirilgan Bo'lim (Kafedra)</label>
                    <select
                      value={editUserModal.departmentId !== undefined ? (editUserModal.departmentId || '') : (editUserModal.user?.departmentId || '')}
                      onChange={e => setEditUserModal(p => ({ ...p, departmentId: e.target.value ? Number(e.target.value) : null }))}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-sm"
                    >
                      <option value="">-- Bo'limni tanlang --</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-6 space-x-2">
                <button
                  onClick={() => setEditUserModal({ open: false, user: null })}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleEditUser}
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
                >
                  Saqlash
                </button>
              </div>
            </Modal>

            <Modal open={deleteUserModal.open} onClose={() => setDeleteUserModal({ open: false, user: null })}>
              <h2 className="text-lg font-bold mb-2 text-gray-800">O'chirishni tasdiqlang</h2>
              <p className="text-sm text-gray-600">
                <b>{deleteUserModal.user?.fullName || deleteUserModal.user?.username}</b> foydalanuvchisini o'chirishga ishonchingiz komilmi?
              </p>
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  onClick={() => setDeleteUserModal({ open: false, user: null })}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm"
                >
                  Bekor
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
                >
                  O'chirish
                </button>
              </div>
            </Modal>
          </div>
      );
      case 'approvals': {
        const pendingAchievements = achievements.filter(a => a.status === 'pending');
        const pendingPlans = plans.filter(p => p.status === 'pending');
        const hasPending = pendingAchievements.length > 0 || pendingPlans.length > 0;

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tasdiqlash kutilayotgan ma'lumotlar</h2>
                <p className="text-xs text-slate-500 mt-0.5">Bo'lim adminlari tomonidan kiritilgan va tasdiqlash kutilayotgan KPI yutuqlar va yillik rejalar</p>
              </div>
              <div className="flex gap-2">
                <span className="px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center gap-1.5">
                  <Clock size={14} /> Kutilmoqda: {pendingAchievements.length + pendingPlans.length} ta
                </span>
              </div>
            </div>

            {!hasPending ? (
              <Card className="text-center py-12">
                <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-3" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Barcha ma'lumotlar ko'rib chiqilgan</h3>
                <p className="text-sm text-slate-500 mt-1">Hozirda tasdiqlash kutilayotgan yangi yozuvlar yo'q.</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {pendingAchievements.length > 0 && (
                  <Card>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      KPI Yutuqlari ({pendingAchievements.length} ta)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                        <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="px-4 py-3">Professor</th>
                            <th className="px-4 py-3">Davr</th>
                            <th className="px-4 py-3">Mezon / Tur</th>
                            <th className="px-4 py-3 text-center">Soni</th>
                            <th className="px-4 py-3 text-right">Ball</th>
                            <th className="px-4 py-3">Asoslovchi hujjat / Izoh</th>
                            <th className="px-4 py-3 text-center">Amallar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {pendingAchievements.map(ach => {
                            const prof = professors.find(p => p.id === ach.professorId);
                            const score = scoringSystem[ach.type]?.[ach.subType]?.score || 0;
                            const total = score * ach.count;
                            return (
                              <tr key={ach.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                                  {prof ? getProfessorName(prof) : `Prof #${ach.professorId}`}
                                </td>
                                <td className="px-4 py-3">{ach.year}-yil, {ach.quarter}-chorak</td>
                                <td className="px-4 py-3">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{ach.type}</span>
                                  <br />
                                  <span className="text-xs text-slate-400">{ach.subType}</span>
                                </td>
                                <td className="px-4 py-3 text-center font-bold">{ach.count}</td>
                                <td className="px-4 py-3 text-right font-extrabold text-indigo-600 dark:text-indigo-400">
                                  +{total.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 max-w-xs">
                                  {ach.documentUrl ? (
                                    <a
                                      href={ach.documentUrl.startsWith('http') ? ach.documentUrl : `https://${ach.documentUrl}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                                    >
                                      🔗 Hujjatni ochish ↗
                                    </a>
                                  ) : (
                                    <span className="text-xs text-slate-400 italic">Havola yo‘q</span>
                                  )}
                                  {ach.notes && (
                                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 truncate" title={ach.notes}>
                                      📝 {ach.notes}
                                    </p>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex justify-center gap-2">
                                    <button
                                      onClick={() => {
                                        setAchievements(prev => prev.map(a => a.id === ach.id ? { ...a, status: 'approved' } : a));
                                      }}
                                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-all active:scale-95"
                                    >
                                      <CheckCircle2 size={14} /> Tasdiqlash
                                    </button>
                                    <button
                                      onClick={() => {
                                        const note = prompt("Rad etish sababini kiriting (ixtiyoriy):");
                                        setAchievements(prev => prev.map(a => a.id === ach.id ? { ...a, status: 'rejected', rejectionNote: note || 'Rad etildi' } : a));
                                      }}
                                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-all active:scale-95"
                                    >
                                      <XCircle size={14} /> Rad etish
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {pendingPlans.length > 0 && (
                  <Card>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      Yillik Rejalar ({pendingPlans.length} ta)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                        <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="px-4 py-3">Professor</th>
                            <th className="px-4 py-3">Yil</th>
                            <th className="px-4 py-3">Reja mezonlari soni</th>
                            <th className="px-4 py-3 text-center">Amallar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {pendingPlans.map(plan => {
                            const prof = professors.find(p => p.id === plan.professorId);
                            return (
                              <tr key={plan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                                  {prof ? getProfessorName(prof) : `Prof #${plan.professorId}`}
                                </td>
                                <td className="px-4 py-3">{plan.year}-yil</td>
                                <td className="px-4 py-3 font-semibold">{plan.planItems?.length || 0} ta mezon</td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex justify-center gap-2">
                                    <button
                                      onClick={() => {
                                        setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, status: 'approved' } : p));
                                      }}
                                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-all active:scale-95"
                                    >
                                      <CheckCircle2 size={14} /> Tasdiqlash
                                    </button>
                                    <button
                                      onClick={() => {
                                        const note = prompt("Rad etish sababini kiriting (ixtiyoriy):");
                                        setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, status: 'rejected', rejectionNote: note || 'Rad etildi' } : p));
                                      }}
                                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-all active:scale-95"
                                    >
                                      <XCircle size={14} /> Rad etish
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        );
      }
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
