import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { CONSTANTS } from './data.js';
import { ASSETS } from './assetManifest.js';
import { Header } from './components/Header';
import { MobileMenu } from './components/MobileMenu';
import type { SidebarNavItem } from './components/Sidebar';
import { SupabaseState } from './supabaseState';
import { AuthService } from './shared/services/authService';
import { DataService } from './shared/services/dataService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BarChart3, Building, Users, Star, Rocket, Target, TrendingUp, TrendingDown, Settings,
} from 'lucide-react';

import type { User, Professor, Faculty, Department, Division, Project, ScoringSystem, ScoringCategory, ThesisDefense, Achievement, Plan, Filters } from './types/kpi';
import { stripUserSecrets, getProfessorName } from './utils/format';

import { GeneralStatisticsPage } from './pages/GeneralStatisticsPage';
import { RatingsPage } from './pages/RatingsPage';
import { ProfessorOqituvchilarPage } from './pages/ProfessorOqituvchilarPage';
import { KPIPage } from './pages/KPIPage';
import { ScientificPotentialPage } from './pages/ScientificPotentialPage';
import { ScientificProjectsPage } from './pages/ScientificProjectsPage';
import { PerformanceMonitoringPage } from './pages/PerformanceMonitoringPage';
import { EfficiencyPage } from './pages/EfficiencyPage';
import { DataManagementPage } from './pages/DataManagementPage';
import { LoginModal } from './components/modals/LoginModal';

const REPORT_YEAR_STORAGE_KEY = 'kpi_selected_report_year';

function App() {
  const guestUser = useMemo(() => CONSTANTS.USERS.find((u: User) => u.role === 'guest') || {id: 0, username: 'guest', role: 'guest'}, []);

  // Initialize from localStorage — validateSession() will verify server-side on mount
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

  const [isDataLoading, setIsDataLoading] = useState(true);

  // ── Helper: only apply if non-empty array ──────────────────────────────────
  // Note: <T,> trailing comma is required in .tsx to distinguish from JSX
  const applyIfPresent = <T,>(arr: T[] | undefined | null, setter: (v: T[]) => void): void => {
    if (Array.isArray(arr) && arr.length > 0) setter(arr);
  };

  useEffect(() => {
    let cancelled = false;

    const loadAllData = async () => {
      setIsDataLoading(true);

      // ── STEP 1: Load relational tables from Supabase (primary source) ───────
      // These tables are the canonical source of truth. Never overwrite with [].
      // Track PER TABLE so we know exactly which ones had data.
      let relationalLoaded: Record<string, boolean> = {
        faculties: false, departments: false, professors: false,
        achievements: false, plans: false, projects: false, thesisDefenses: false,
      };
      try {
        DataService.invalidateCache(); // force fresh fetch on every page load
        const data = await DataService.init();
        if (cancelled) return;

        const profCount = (data.PROFESSORS as any[])?.length ?? 0;
        const facCount  = (data.FACULTIES  as any[])?.length ?? 0;
        const deptCount = (data.DEPARTMENTS as any[])?.length ?? 0;
        const achCount  = (data.ACHIEVEMENTS as any[])?.length ?? 0;
        console.log(`[App] DataService loaded — professors:${profCount} faculties:${facCount} departments:${deptCount} achievements:${achCount}`);

        // Guard: only update state when data is actually present — never wipe with []
        applyIfPresent(data.FACULTIES    as Faculty[]     | undefined, setFaculties);
        applyIfPresent(data.DEPARTMENTS  as Department[]  | undefined, setDepartments);
        applyIfPresent(data.PROFESSORS   as Professor[]   | undefined, setProfessors);
        applyIfPresent(data.ACHIEVEMENTS as Achievement[] | undefined, setAchievements);
        applyIfPresent(data.PLANS        as Plan[]        | undefined, setPlans);
        applyIfPresent(data.PROJECTS     as Project[]     | undefined, setProjects);
        applyIfPresent(data.THESIS_DEFENSES as ThesisDefense[] | undefined, setThesisDefenses);
        if (data.DIVISIONS)     setDivisions((data.DIVISIONS    as Division[]) || CONSTANTS.DIVISIONS);
        if (data.POSITIONS)     setPositions((data.POSITIONS    as string[])   || CONSTANTS.POSITIONS);
        if (data.SCORING_SYSTEM) setScoringSystem((data.SCORING_SYSTEM as ScoringSystem) || CONSTANTS.SCORING_SYSTEM);
        if (data.USERS)         setUsers(stripUserSecrets((data.USERS as User[]) || CONSTANTS.USERS) as User[]);

        // ⚠ Track PER TABLE which ones have data — NOT a single global flag
        // This prevents the case where faculties loaded but professors didn't,
        // causing app_state professors to be wrongly skipped.
        relationalLoaded = {
          faculties:     facCount  > 0,
          departments:   deptCount > 0,
          professors:    profCount > 0,
          achievements:  achCount  > 0,
          plans:         ((data.PLANS as any[])?.length ?? 0) > 0,
          projects:      ((data.PROJECTS as any[])?.length ?? 0) > 0,
          thesisDefenses:((data.THESIS_DEFENSES as any[])?.length ?? 0) > 0,
        };
      } catch (error: any) {
        if (cancelled) return;
        // Log RLS/permission errors clearly
        if (error?.message?.includes('403') || error?.message?.includes('401')) {
          console.error('[App] ⚠ RLS/Permission error from Supabase. Check your RLS policies and is_app_admin() function.\n', error);
        } else {
          console.warn('[App] DataService.init() failed, keeping CONSTANTS defaults:', error);
        }
      }

      // ── STEP 2: Load app_state blob (fallback / supplementary) ─────────────
      // Only use app_state blob to SUPPLEMENT relational data, not overwrite it.
      // If relational tables already loaded data, skip overwriting arrays.
      try {
        const remoteState   = await SupabaseState.load();
        const fallbackState = SupabaseState.loadLocal();
        if (cancelled) return;

        const { state: appState, source } = SupabaseState.chooseNewest(remoteState, fallbackState);

        if (appState) {
          skipInitialRemoteSave.current = source !== 'local';
          forceNextRemoteSave.current   = source === 'local';

          // Apply app_state arrays ONLY for tables that Supabase returned 0 rows
          // This correctly handles: faculties loaded but professors didn't
          if (!relationalLoaded.faculties)     applyIfPresent(appState.FACULTIES      as Faculty[]      | undefined, setFaculties);
          if (!relationalLoaded.departments)   applyIfPresent(appState.DEPARTMENTS    as Department[]   | undefined, setDepartments);
          if (!relationalLoaded.professors)    applyIfPresent(appState.PROFESSORS     as Professor[]    | undefined, setProfessors);
          if (!relationalLoaded.achievements)  applyIfPresent(appState.ACHIEVEMENTS   as Achievement[]  | undefined, setAchievements);
          if (!relationalLoaded.plans)         applyIfPresent(appState.PLANS          as Plan[]         | undefined, setPlans);
          if (!relationalLoaded.projects)      applyIfPresent(appState.PROJECTS       as Project[]      | undefined, setProjects);
          if (!relationalLoaded.thesisDefenses)applyIfPresent(appState.THESIS_DEFENSES as ThesisDefense[] | undefined, setThesisDefenses);

          const missingTables = Object.entries(relationalLoaded)
            .filter(([, v]) => !v).map(([k]) => k);
          if (missingTables.length > 0) {
            console.info(`[App] app_state applied for missing tables: [${missingTables.join(', ')}] (source: ${source})`);
          } else {
            console.info(`[App] All tables loaded from Supabase relational — app_state used only for config`);
          }

          // Always apply config fields (not arrays) from app_state
          if (appState.DIVISIONS)      setDivisions((appState.DIVISIONS    as Division[]) || CONSTANTS.DIVISIONS);
          if (appState.POSITIONS)      setPositions((appState.POSITIONS    as string[])   || CONSTANTS.POSITIONS);
          if (appState.SCORING_SYSTEM) setScoringSystem((appState.SCORING_SYSTEM as ScoringSystem) || CONSTANTS.SCORING_SYSTEM);
          if (appState.USERS)          setUsers(stripUserSecrets((appState.USERS as User[]) || CONSTANTS.USERS) as User[]);

          lastSavedStateRef.current = serializeState(
            (appState.FACULTIES      as Faculty[])      || CONSTANTS.FACULTIES,
            (appState.DEPARTMENTS    as Department[])   || CONSTANTS.DEPARTMENTS,
            (appState.DIVISIONS      as Division[])     || CONSTANTS.DIVISIONS,
            (appState.POSITIONS      as string[])       || CONSTANTS.POSITIONS,
            (appState.PROJECTS       as Project[])      || CONSTANTS.PROJECTS,
            (appState.PROFESSORS     as Professor[])    || CONSTANTS.PROFESSORS,
            (appState.PLANS          as Plan[])         || CONSTANTS.PLANS,
            (appState.ACHIEVEMENTS   as Achievement[])  || CONSTANTS.ACHIEVEMENTS,
            (appState.SCORING_SYSTEM as ScoringSystem)  || CONSTANTS.SCORING_SYSTEM,
            (appState.USERS          as User[])         || CONSTANTS.USERS,
            (appState.THESIS_DEFENSES as ThesisDefense[]) || CONSTANTS.THESIS_DEFENSES
          );
        }
      } catch (error: any) {
        if (cancelled) return;
        console.error('[App] SupabaseState.load() failed:', error);

        // Fallback to localStorage if Supabase app_state call fails
        const anyRelationalLoaded = Object.values(relationalLoaded).some(Boolean);
        if (!anyRelationalLoaded) {
          const localFallback = SupabaseState.loadLocal();
          if (localFallback && !cancelled) {
            skipInitialRemoteSave.current = false;
            forceNextRemoteSave.current   = true;
            console.info('[App] Using localStorage as final fallback');
            applyIfPresent(localFallback.FACULTIES      as Faculty[]      | undefined, setFaculties);
            applyIfPresent(localFallback.DEPARTMENTS    as Department[]   | undefined, setDepartments);
            applyIfPresent(localFallback.PROFESSORS     as Professor[]    | undefined, setProfessors);
            applyIfPresent(localFallback.ACHIEVEMENTS   as Achievement[]  | undefined, setAchievements);
            applyIfPresent(localFallback.PLANS          as Plan[]         | undefined, setPlans);
            applyIfPresent(localFallback.PROJECTS       as Project[]      | undefined, setProjects);
            applyIfPresent(localFallback.THESIS_DEFENSES as ThesisDefense[] | undefined, setThesisDefenses);
          }
        }
      } finally {
        if (!cancelled) {
          setRemoteStateReady(true);
          setIsDataLoading(false);
        }
      }
    };

    loadAllData();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const token = AuthService.getAccessToken();
      SupabaseState.save(stateToSave, token)
        .then(async () => {
          // ✅ FIX: Also sync to RELATIONAL TABLES (professors, faculties, etc.)
          // Without this, Supabase professors table stays empty and data
          // disappears on page refresh (since relational tables are primary source).
          try {
            if (token) {
              await DataService.syncRelationalToSupabase(token, stateToSave as any);
              console.log('[App] Relational tables synced to Supabase ✓');
            } else {
              // Fallback: sync app_state blob only
              await DataService.syncToSupabase(stateToSave as any);
            }
          } catch (syncError) {
            console.warn('[App] Sync warning (data saved to localStorage as backup):', syncError);
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

  // Validate session on mount (catches expired tokens after Vercel redeploy)
  useEffect(() => {
    let cancelled = false;
    AuthService.validateSession().then((validUser) => {
      if (cancelled) return;
      if (!validUser) {
        // Session is invalid/expired — revert to guest
        setUser(guestUser);
      }
      // If validUser exists, state is already correct from useState initializer
    }).catch(() => {
      if (!cancelled) setUser(guestUser);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const handleLogin = async (username: string, password: string) => {
    const authenticatedUser = await AuthService.login({ username, password });
    if (authenticatedUser) {
      const deptObj = departments.find(d => d.id === authenticatedUser.departmentId);
      const userWithDept = {
        ...authenticatedUser,
        departmentName: deptObj?.name,
      };

      setUser(userWithDept as User);
      setActiveView('dashboard');
      setLoginError('');
      setLoginModalOpen(false);

      const token = AuthService.getAccessToken();
      if (token) {
        DataService.syncRelationalToSupabase(token).then(() => {
          console.log('Data synced to Supabase after login.');
        }).catch((err) => {
          console.warn('Supabase sync after login failed:', err);
        });
      }
    } else {
      const cleanUser = username.trim().toLowerCase();
      const localFound = users.find(
        u => (u.username.toLowerCase() === cleanUser || u.email?.toLowerCase() === cleanUser)
      );
      if (localFound) {
        const deptObj = departments.find(d => d.id === localFound.departmentId);
        setUser({ ...localFound, departmentName: deptObj?.name });
        setActiveView('dashboard');
        setLoginError('');
        setLoginModalOpen(false);
      } else {
        setLoginError('Login yoki parol noto‘g‘ri. Yoki sizda tizimga kirish huquqi yo\'q.');
      }
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

  // ── Skeleton loading screen ─────────────────────────────────────────────────
  if (isDataLoading) {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Ma'lumotlar yuklanmoqda...</p>
          <p className="text-gray-400 text-sm mt-1">Supabase'dan ma'lumotlar olinmoqda</p>
        </div>
      </div>
    );
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
        return <ProfessorOqituvchilarPage user={user} data={processedData} achievements={achievements} setAchievements={setAchievements} professors={professors} setProfessors={setProfessors} plans={plans} setPlans={setPlans} selectedYear={selectedYear} canEdit={isSuperAdmin || user?.role === 'admin'} scoringSystem={scoringSystem} getScore={getScore} faculties={faculties} departments={departments} positions={positions} employmentTypes={CONSTANTS.EMPLOYMENT_TYPES} searchQuery={searchQuery} setSearchQuery={setSearchQuery} filters={filters} setFilters={setFilters} saveStatus={saveStatus} saveErrorMessage={saveErrorMessage} />;
      case 'kpi':
        return <KPIPage
                  user={user}
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
        return <ScientificPotentialPage user={user} isSuperAdmin={isSuperAdmin} facultyRatings={processedData.facultyRatings} departmentRatings={processedData.departmentRatings} professorsWithDetails={processedData.professorsWithDetails} thesisDefenses={thesisDefenses} faculties={faculties} departments={departments} positions={positions} searchQuery={searchQuery} setSearchQuery={setSearchQuery} filters={filters} setFilters={setFilters} specialties={CONSTANTS.SPECIALTIES} defenseTypes={CONSTANTS.DEFENSE_TYPES} />;
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
                  user={user}
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
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <MobileMenu
        activeView={activeView}
        isOpen={sidebarOpen}
        logoPath={ASSETS.logos.university.path}
        navItems={navItems}
        onClose={() => setSidebarOpen(false)}
        onNavigate={setActiveView}
        title={appTitle}
        user={user}
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
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" /> Saqlanmoqda...
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Saqlandi ✓
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 px-3 py-1 text-xs font-semibold text-red-700 dark:text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Saqlashda xato
              </div>
            )}
            {saveErrorMessage && (
              <span className="ml-2 text-xs text-red-500 dark:text-red-400">{saveErrorMessage}</span>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
