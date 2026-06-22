import { DEFAULT_DATA } from '../constants/defaultData';
import {
  Faculty,
  Department,
  Division,
  Professor,
  Plan,
  Achievement,
  Project,
  ThesisDefense,
  User,
  ScoringSystem,
  ConstantsData,
} from '../types';

const STORAGE_KEY = 'kpi_system_data';
const SUPABASE_REST_PATHS = {
  faculties: 'faculties',
  departments: 'departments',
  professors: 'professors',
  plans: 'plans',
  planItems: 'plan_items',
  achievements: 'achievements',
  projects: 'projects',
  thesisDefenses: 'thesis_defenses',
  users: 'app_users',
} as const;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const buildRestHeaders = (token?: string | null) => ({
  apikey: supabaseAnonKey || '',
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const fetchSupabaseData = async <T>(
  path: string,
  token?: string | null,
  query?: string
): Promise<T[]> => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration is missing');
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/${path}${query ? `?${query}` : ''}`,
    {
      headers: {
        ...buildRestHeaders(token),
        'Cache-Control': 'no-cache, no-store',
        'Pragma': 'no-cache',
      },
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    let detail = '';
    try { detail = JSON.stringify(await response.clone().json()); } catch { detail = await response.text().catch(() => ''); }
    const msg = `[DataService] ${path} → HTTP ${response.status} ${response.statusText}: ${detail}`;
    if (response.status === 401 || response.status === 403) {
      console.error(`⚠ [DataService] RLS/Auth error on '${path}' (${response.status}). Check:
  1. Supabase RLS policies allow anon SELECT on '${path}'
  2. Or use an auth token: VITE_SUPABASE_ANON_KEY has read access
  3. Run supabase_migration_final.sql to fix policies\n`, detail);
    } else if (response.status === 402) {
      console.error(`⚠ [DataService] Supabase quota/billing limit reached for '${path}' (${response.status}).`);
    } else {
      console.error(msg);
    }
    throw new Error(msg);
  }

  return (await response.json()) as T[];
};

const mutateSupabaseData = async <T>(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  payload: unknown,
  token?: string | null,
  query?: string
): Promise<T[]> => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration is missing');
  }

  const isUpsert = method === 'POST' && query?.includes('on_conflict');
  const headers: Record<string, string> = {
    ...buildRestHeaders(token),
    ...(isUpsert ? { Prefer: 'resolution=merge-duplicates' } : {}),
  };

  const response = await fetch(
    `${supabaseUrl}/rest/v1/${path}${query ? `?${query}` : ''}`,
    {
      method,
      headers,
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Supabase mutation failed for ${path}: ${response.status} ${response.statusText}`
    );
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T[]) : ([] as T[]);
};

const normalizeString = (value: unknown) =>
  typeof value === 'string' ? value : '';

const toFaculty = (row: Record<string, unknown>): Faculty => ({
  id: Number(row.id ?? 0),
  name: normalizeString(row.name),
});

const toDepartment = (row: Record<string, unknown>): Department => ({
  id: Number(row.id ?? 0),
  name: normalizeString(row.name),
  facultyId: Number(row.faculty_id ?? row.facultyId ?? 0),
});

const toProfessor = (row: Record<string, unknown>): Professor => ({
  id: Number(row.id ?? 0),
  firstName: normalizeString(row.first_name ?? row.firstName),
  lastName: normalizeString(row.last_name ?? row.lastName),
  patronymic: normalizeString(row.patronymic),
  birthDate: normalizeString(row.birth_date ?? row.birthDate),
  gender: row.gender === 'ayol' ? 'ayol' : 'erkak',
  departmentId: Number(row.department_id ?? row.departmentId ?? 0),
  degree: normalizeString(row.degree),
  title: normalizeString(row.title),
  position: normalizeString(row.position),
  staffUnit: Number(row.staff_unit ?? row.staffUnit ?? 0),
  employmentType: normalizeString(row.employment_type ?? row.employmentType),
  phone: normalizeString(row.phone),
});

const toPlan = (
  plans: Record<string, unknown>[],
  planItems: Record<string, unknown>[]
): Plan[] => {
  const itemsByPlan = new Map<number, Record<string, unknown>[]>();

  for (const item of planItems) {
    const planId = Number(item.plan_id ?? item.planId ?? 0);
    if (!Number.isFinite(planId)) {
      continue;
    }

    const existing = itemsByPlan.get(planId) || [];
    existing.push(item);
    itemsByPlan.set(planId, existing);
  }

  return plans.map((plan) => {
    const planId = Number(plan.id ?? 0);
    return {
      id: planId,
      professorId: Number(plan.professor_id ?? plan.professorId ?? 0),
      year: Number(plan.year ?? 0),
      planItems: (itemsByPlan.get(planId) || []).map((item) => ({
        type: normalizeString(item.type),
        subType: normalizeString(item.sub_type ?? item.subType),
        count: Number(item.count ?? 0),
      })),
    };
  });
};

const toAchievement = (row: Record<string, unknown>): Achievement => ({
  id: Number(row.id ?? 0),
  professorId: Number(row.professor_id ?? row.professorId ?? 0),
  year: Number(row.year ?? 0),
  quarter: Number(row.quarter ?? 0),
  type: normalizeString(row.type),
  subType: normalizeString(row.sub_type ?? row.subType),
  count: Number(row.count ?? 0),
});

const toProject = (row: Record<string, unknown>): Project => ({
  id: Number(row.id ?? 0),
  name: normalizeString(row.name),
  type: normalizeString(row.type),
  direction: normalizeString(row.direction),
  leaderName: normalizeString(row.leader_name ?? row.leaderName),
  leaderPosition: normalizeString(row.leader_position ?? row.leaderPosition),
  departmentId: Number(row.department_id ?? row.departmentId ?? 0),
  facultyId: Number(row.faculty_id ?? row.facultyId ?? 0),
  totalFunding: Number(row.total_funding ?? row.totalFunding ?? 0),
  duration: Number(row.duration ?? 0),
});

const toThesisDefense = (row: Record<string, unknown>): ThesisDefense => ({
  id: Number(row.id ?? 0),
  lastName: normalizeString(row.last_name ?? row.lastName),
  firstName: normalizeString(row.first_name ?? row.firstName),
  patronymic: normalizeString(row.patronymic),
  departmentId: Number(row.department_id ?? row.departmentId ?? 0),
  facultyId: Number(row.faculty_id ?? row.facultyId ?? 0),
  specialty: normalizeString(row.specialty),
  type: normalizeString(row.type),
  fieldOfScience: normalizeString(row.field_of_science ?? row.fieldOfScience),
  thesisTopic: normalizeString(row.thesis_topic ?? row.thesisTopic),
  supervisor: normalizeString(row.supervisor),
  defenseOrganization: normalizeString(row.defense_organization ?? row.defenseOrganization),
  councilNumber: normalizeString(row.council_number ?? row.councilNumber),
  defenseDate: normalizeString(row.defense_date ?? row.defenseDate),
});

class LocalDataRepository {
  private data: ConstantsData | null = null;
  private initializedPromise: Promise<ConstantsData> | null = null;
  /** Set to true so the next init() call always re-fetches from Supabase */
  private forceRefresh = false;

  init(timestamp: string | null = null): Promise<ConstantsData> {
    if (this.initializedPromise && !this.forceRefresh) {
      return this.initializedPromise;
    }
    // Clear cache so a fresh Supabase fetch is triggered
    this.forceRefresh = false;
    this.initializedPromise = null;

    this.initializedPromise = new Promise(async (resolve) => {
      // 1. Try Supabase FIRST so all browsers share the same data source
      try {
        const remoteData = await this.loadFromSupabase();
        // Accept Supabase data if ANY of the main tables have rows
        const hasAnyData = remoteData && (
          (remoteData.FACULTIES?.length ?? 0) > 0 ||
          (remoteData.DEPARTMENTS?.length ?? 0) > 0 ||
          (remoteData.PROFESSORS?.length ?? 0) > 0 ||
          (remoteData.ACHIEVEMENTS?.length ?? 0) > 0
        );
        if (hasAnyData) {
          this.data = remoteData;
          this.saveToStorage();
          console.log(
            `[DataService] Loaded from Supabase — ` +
            `faculties:${remoteData!.FACULTIES?.length ?? 0} ` +
            `departments:${remoteData!.DEPARTMENTS?.length ?? 0} ` +
            `professors:${remoteData!.PROFESSORS?.length ?? 0} ` +
            `achievements:${remoteData!.ACHIEVEMENTS?.length ?? 0}`
          );
          resolve(this.data!);
          return;
        } else {
          console.warn('[DataService] Supabase returned 0 rows for ALL main tables. Trying localStorage...');
        }
      } catch (error) {
        console.warn('[DataService] Supabase data load failed:', error);
      }

      // 2. Try to load from LocalStorage (offline cache) — check all known keys
      const storageKeys = ['kpi_system_data', 'kpi_app_state_backup'];
      for (const key of storageKeys) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const localData = JSON.parse(stored) as any;
            // kpi_app_state_backup wraps data in PROFESSORS/FACULTIES keys directly
            const normalized: ConstantsData = {
              ...DEFAULT_DATA,
              FACULTIES:    localData.FACULTIES    || localData.faculties    || DEFAULT_DATA.FACULTIES,
              DEPARTMENTS:  localData.DEPARTMENTS  || localData.departments  || DEFAULT_DATA.DEPARTMENTS,
              PROFESSORS:   localData.PROFESSORS   || localData.professors   || DEFAULT_DATA.PROFESSORS,
              ACHIEVEMENTS: localData.ACHIEVEMENTS || localData.achievements || DEFAULT_DATA.ACHIEVEMENTS,
              PLANS:        localData.PLANS        || localData.plans        || DEFAULT_DATA.PLANS,
              PROJECTS:     localData.PROJECTS     || localData.projects     || DEFAULT_DATA.PROJECTS,
              THESIS_DEFENSES: localData.THESIS_DEFENSES || localData.thesisDefenses || DEFAULT_DATA.THESIS_DEFENSES,
              SCORING_SYSTEM: localData.SCORING_SYSTEM || localData.scoringSystem || DEFAULT_DATA.SCORING_SYSTEM,
              USERS:        localData.USERS        || localData.users        || DEFAULT_DATA.USERS,
              DIVISIONS:    localData.DIVISIONS    || localData.divisions    || DEFAULT_DATA.DIVISIONS,
              POSITIONS:    localData.POSITIONS    || localData.positions    || DEFAULT_DATA.POSITIONS,
            };
            if ((normalized.PROFESSORS?.length ?? 0) > 0 || (normalized.FACULTIES?.length ?? 0) > 0) {
              this.data = normalized;
              console.log(
                `[DataService] Loaded from localStorage[${key}] — ` +
                `professors:${normalized.PROFESSORS?.length ?? 0} ` +
                `faculties:${normalized.FACULTIES?.length ?? 0}`
              );
              // Auto-sync to Supabase if it was empty but localStorage has data
              if ((normalized.PROFESSORS?.length ?? 0) > 0) {
                console.log('[DataService] Auto-syncing localStorage data to Supabase...');
                this.syncRelationalToSupabase().catch((err) =>
                  console.warn('[DataService] Auto-sync to Supabase failed:', err)
                );
              }
              resolve(this.data!);
              return;
            }
          } catch (e) {
            console.error(`[DataService] Error parsing localStorage[${key}]`, e);
          }
        }
      }

      // 3. Otherwise load from data.json
      const cacheBuster = timestamp ? `?t=${timestamp}` : `?t=${Date.now()}`;
      try {
        const response = await fetch(`data.json${cacheBuster}`);
        if (response.ok) {
          const jsonData = await response.json();
          if (jsonData && jsonData.CONSTANTS) {
            this.data = {
              ...DEFAULT_DATA,
              ...jsonData.CONSTANTS,
            };
            this.saveToStorage();
            console.log('Loaded KPI data from data.json');
            resolve(this.data!);
            return;
          }
        }
      } catch {
        console.log(
          'No data.json found or invalid JSON, using default constants'
        );
      }

      // 4. Fallback to DEFAULT_DATA
      this.data = { ...DEFAULT_DATA };
      this.saveToStorage();
      resolve(this.data!);
    });

    return this.initializedPromise;
  }

  private async loadFromSupabase(): Promise<ConstantsData | null> {
    if (!supabaseUrl || !supabaseAnonKey) {
      return null;
    }

    // Fetch all tables in parallel — each failure is caught individually
    const settled = await Promise.allSettled([
      fetchSupabaseData<Record<string, unknown>>(SUPABASE_REST_PATHS.faculties,      null, 'select=*'),
      fetchSupabaseData<Record<string, unknown>>(SUPABASE_REST_PATHS.departments,    null, 'select=*'),
      fetchSupabaseData<Record<string, unknown>>(SUPABASE_REST_PATHS.professors,     null, 'select=*'),
      fetchSupabaseData<Record<string, unknown>>(SUPABASE_REST_PATHS.plans,          null, 'select=*'),
      fetchSupabaseData<Record<string, unknown>>(SUPABASE_REST_PATHS.planItems,      null, 'select=*'),
      fetchSupabaseData<Record<string, unknown>>(SUPABASE_REST_PATHS.achievements,   null, 'select=*'),
      fetchSupabaseData<Record<string, unknown>>(SUPABASE_REST_PATHS.projects,       null, 'select=*'),
      fetchSupabaseData<Record<string, unknown>>(SUPABASE_REST_PATHS.thesisDefenses, null, 'select=*'),
    ]);

    const [fRes, dRes, pRes, plRes, piRes, aRes, prRes, tdRes] = settled;

    // Helper: unwrap or warn and return cached/default
    const unwrap = <T>(result: PromiseSettledResult<T[]>, name: string, fallback: T[]): T[] => {
      if (result.status === 'fulfilled') {
        if (result.value.length === 0) {
          console.warn(`[DataService] '${name}' returned 0 rows from Supabase. This may indicate an RLS policy issue or empty table.`);
        }
        return result.value;
      }
      console.warn(`[DataService] '${name}' fetch failed — keeping previous data:`, result.reason?.message || result.reason);
      return fallback;
    };

    // Get existing data as fallback so we never wipe rows on a bad response
    const existing = this.data;

    const facultiesRaw    = unwrap(fRes,  'faculties',       (existing?.FACULTIES        as any[]) || []);
    const departmentsRaw  = unwrap(dRes,  'departments',     (existing?.DEPARTMENTS      as any[]) || []);
    const professorsRaw   = unwrap(pRes,  'professors',      (existing?.PROFESSORS       as any[]) || []);
    const plansRaw        = unwrap(plRes, 'plans',           []);
    const planItemsRaw    = unwrap(piRes, 'plan_items',      []);
    const achievementsRaw = unwrap(aRes,  'achievements',    (existing?.ACHIEVEMENTS     as any[]) || []);
    const projectsRaw     = unwrap(prRes, 'projects',        (existing?.PROJECTS         as any[]) || []);
    const thesisRaw       = unwrap(tdRes, 'thesis_defenses', (existing?.THESIS_DEFENSES  as any[]) || []);

    const facultyList    = facultiesRaw.map(toFaculty);
    const departmentList = departmentsRaw.map(toDepartment);
    const professorList  = professorsRaw.map(toProfessor);
    const planList       = toPlan(plansRaw, planItemsRaw);
    const achievementList= achievementsRaw.map(toAchievement);
    const projectList    = projectsRaw.map(toProject);
    const thesisDefenseList = thesisRaw.map(toThesisDefense);

    // ⚠ CRITICAL: never replace with empty arrays — keep existing data as fallback
    const guardArr = <T>(fresh: T[], prev: T[]): T[] =>
      fresh.length > 0 ? fresh : prev;

    return {
      ...DEFAULT_DATA,
      ...(existing || {}),
      FACULTIES:       guardArr(facultyList,      (existing?.FACULTIES       as any[]) || []),
      DEPARTMENTS:     guardArr(departmentList,   (existing?.DEPARTMENTS     as any[]) || []),
      PROFESSORS:      guardArr(professorList,    (existing?.PROFESSORS      as any[]) || []),
      PLANS:           planList.length > 0 ? planList : ((existing?.PLANS as any[]) || []),
      ACHIEVEMENTS:    guardArr(achievementList,  (existing?.ACHIEVEMENTS    as any[]) || []),
      PROJECTS:        guardArr(projectList,      (existing?.PROJECTS        as any[]) || []),
      THESIS_DEFENSES: guardArr(thesisDefenseList,(existing?.THESIS_DEFENSES as any[]) || []),
      USERS: existing?.USERS || DEFAULT_DATA.USERS,
    };
  }

  private ensureInitialized(): ConstantsData {
    if (!this.data) {
      throw new Error('DataRepository is not initialized. Call init() first.');
    }
    return this.data;
  }

  private saveToStorage() {
    if (this.data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }
  }

  // --- Readers ---
  async getFaculties(): Promise<Faculty[]> {
    return this.ensureInitialized().FACULTIES;
  }

  async getDepartments(): Promise<Department[]> {
    return this.ensureInitialized().DEPARTMENTS;
  }

  async getDivisions(): Promise<Division[]> {
    return this.ensureInitialized().DIVISIONS;
  }

  async getProfessors(): Promise<Professor[]> {
    return this.ensureInitialized().PROFESSORS;
  }

  async getPlans(): Promise<Plan[]> {
    return this.ensureInitialized().PLANS;
  }

  async getAchievements(): Promise<Achievement[]> {
    return this.ensureInitialized().ACHIEVEMENTS;
  }

  async getProjects(): Promise<Project[]> {
    return this.ensureInitialized().PROJECTS;
  }

  async getThesisDefenses(): Promise<ThesisDefense[]> {
    return this.ensureInitialized().THESIS_DEFENSES;
  }

  async getUsers(): Promise<User[]> {
    return this.ensureInitialized().USERS;
  }

  async getScoringSystem(): Promise<ScoringSystem> {
    return this.ensureInitialized().SCORING_SYSTEM;
  }

  // --- Mutators (CRUD) ---
  async saveFaculties(faculties: Faculty[]): Promise<Faculty[]> {
    const d = this.ensureInitialized();
    d.FACULTIES = faculties;
    this.saveToStorage();
    return d.FACULTIES;
  }

  async saveDepartments(departments: Department[]): Promise<Department[]> {
    const d = this.ensureInitialized();
    d.DEPARTMENTS = departments;
    this.saveToStorage();
    return d.DEPARTMENTS;
  }

  async saveDivisions(divisions: Division[]): Promise<Division[]> {
    const d = this.ensureInitialized();
    d.DIVISIONS = divisions;
    this.saveToStorage();
    return d.DIVISIONS;
  }

  async saveProfessors(professors: Professor[]): Promise<Professor[]> {
    const d = this.ensureInitialized();
    d.PROFESSORS = professors;
    this.saveToStorage();
    return d.PROFESSORS;
  }

  async savePlans(plans: Plan[]): Promise<Plan[]> {
    const d = this.ensureInitialized();
    d.PLANS = plans;
    this.saveToStorage();
    return d.PLANS;
  }

  async saveAchievements(achievements: Achievement[]): Promise<Achievement[]> {
    const d = this.ensureInitialized();
    d.ACHIEVEMENTS = achievements;
    this.saveToStorage();
    return d.ACHIEVEMENTS;
  }

  async saveProjects(projects: Project[]): Promise<Project[]> {
    const d = this.ensureInitialized();
    d.PROJECTS = projects;
    this.saveToStorage();
    return d.PROJECTS;
  }

  async saveThesisDefenses(
    defenses: ThesisDefense[]
  ): Promise<ThesisDefense[]> {
    const d = this.ensureInitialized();
    d.THESIS_DEFENSES = defenses;
    this.saveToStorage();
    return d.THESIS_DEFENSES;
  }

  async saveUsers(users: User[]): Promise<User[]> {
    const d = this.ensureInitialized();
    d.USERS = users;
    this.saveToStorage();
    return d.USERS;
  }

  async saveScoringSystem(
    scoringSystem: ScoringSystem
  ): Promise<ScoringSystem> {
    const d = this.ensureInitialized();
    d.SCORING_SYSTEM = scoringSystem;
    this.saveToStorage();
    return d.SCORING_SYSTEM;
  }


  async syncToSupabase(newData?: ConstantsData): Promise<void> {
    if (!supabaseUrl || !supabaseAnonKey) return;
    if (newData) {
      this.data = newData;
      this.saveToStorage();
    }
    if (!this.data) return;

    const payload = {
      FACULTIES: this.data.FACULTIES,
      DEPARTMENTS: this.data.DEPARTMENTS,
      PROFESSORS: this.data.PROFESSORS,
      PLANS: this.data.PLANS,
      ACHIEVEMENTS: this.data.ACHIEVEMENTS,
      PROJECTS: this.data.PROJECTS,
      THESIS_DEFENSES: this.data.THESIS_DEFENSES,
      SCORING_SYSTEM: this.data.SCORING_SYSTEM,
      USERS: this.data.USERS,
    };

    await mutateSupabaseData(
      'app_state',
      'POST',
      {
        id: import.meta.env.VITE_SUPABASE_STATE_ID || 'kpi_constants',
        data: payload,
      },
      null,
      'on_conflict=id'
    );
  }

  /**
   * Sync all local data into the proper relational Supabase tables.
   * Pass an admin JWT token so RLS allows the write operations.
   * Called automatically when Supabase tables are empty but localStorage has data.
   */
  async syncRelationalToSupabase(token?: string | null, newData?: ConstantsData): Promise<void> {
    if (!supabaseUrl || !supabaseAnonKey) return;
    if (newData) {
      this.data = newData;
      this.saveToStorage();
    }
    if (!this.data) return;

    const d = this.data;

    // 1. Faculties
    if (d.FACULTIES.length > 0) {
      await mutateSupabaseData(
        SUPABASE_REST_PATHS.faculties,
        'POST',
        d.FACULTIES.map((f) => ({ id: f.id, name: f.name })),
        token,
        'on_conflict=id'
      );
    }

    // 2. Departments
    if (d.DEPARTMENTS.length > 0) {
      await mutateSupabaseData(
        SUPABASE_REST_PATHS.departments,
        'POST',
        d.DEPARTMENTS.map((dep) => ({
          id: dep.id,
          name: dep.name,
          faculty_id: dep.facultyId,
        })),
        token,
        'on_conflict=id'
      );
    }

    // 3. Professors
    if (d.PROFESSORS.length > 0) {
      await mutateSupabaseData(
        SUPABASE_REST_PATHS.professors,
        'POST',
        d.PROFESSORS.map((p) => ({
          id: p.id,
          department_id: p.departmentId,
          first_name: p.firstName,
          last_name: p.lastName,
          patronymic: p.patronymic || null,
          birth_date: p.birthDate || null,
          gender: p.gender,
          degree: p.degree || null,
          title: p.title || null,
          position: p.position || null,
          employment_type: p.employmentType || null,
          phone: p.phone || null,
          staff_unit: p.staffUnit ?? 0,
        })),
        token,
        'on_conflict=id'
      );
    }

    // 4. Plans + plan_items
    if (d.PLANS.length > 0) {
      await mutateSupabaseData(
        SUPABASE_REST_PATHS.plans,
        'POST',
        d.PLANS.map((pl) => ({
          id: pl.id,
          professor_id: pl.professorId,
          year: pl.year,
        })),
        token,
        'on_conflict=professor_id,year'
      );

      const allPlanItems = d.PLANS.flatMap((pl) =>
        (pl.planItems || []).map((item) => ({
          plan_id: pl.id,
          type: item.type,
          sub_type: item.subType,
          count: item.count,
        }))
      );
      if (allPlanItems.length > 0) {
        await mutateSupabaseData(
          SUPABASE_REST_PATHS.planItems,
          'POST',
          allPlanItems,
          token,
          'on_conflict=plan_id,type,sub_type'
        );
      }
    }

    // 5. Achievements
    if (d.ACHIEVEMENTS.length > 0) {
      await mutateSupabaseData(
        SUPABASE_REST_PATHS.achievements,
        'POST',
        d.ACHIEVEMENTS.map((a) => ({
          id: a.id,
          professor_id: a.professorId,
          year: a.year,
          quarter: a.quarter,
          type: a.type,
          sub_type: a.subType,
          count: a.count,
        })),
        token,
        'on_conflict=professor_id,year,quarter,type,sub_type'
      );
    }

    // 6. Projects
    if (d.PROJECTS.length > 0) {
      await mutateSupabaseData(
        SUPABASE_REST_PATHS.projects,
        'POST',
        d.PROJECTS.map((pr) => ({
          id: pr.id,
          department_id: pr.departmentId,
          faculty_id: pr.facultyId,
          name: pr.name,
          type: pr.type,
          direction: pr.direction,
          leader_name: pr.leaderName,
          leader_position: pr.leaderPosition,
          total_funding: pr.totalFunding,
          duration: pr.duration,
        })),
        token,
        'on_conflict=id'
      );
    }

    // 7. Thesis defenses
    if (d.THESIS_DEFENSES.length > 0) {
      await mutateSupabaseData(
        SUPABASE_REST_PATHS.thesisDefenses,
        'POST',
        d.THESIS_DEFENSES.map((td) => ({
          id: td.id,
          department_id: td.departmentId,
          faculty_id: td.facultyId,
          last_name: td.lastName,
          first_name: td.firstName,
          patronymic: td.patronymic || null,
          specialty: td.specialty || null,
          type: td.type,
          field_of_science: td.fieldOfScience || null,
          thesis_topic: td.thesisTopic,
          supervisor: td.supervisor || null,
          defense_organization: td.defenseOrganization || null,
          council_number: td.councilNumber || null,
          defense_date: td.defenseDate || null,
        })),
        token,
        'on_conflict=id'
      );
    }

    console.log('All data synced to Supabase relational tables.');
  }

  // --- Reset to initial ---
  async resetData(): Promise<ConstantsData> {
    localStorage.removeItem(STORAGE_KEY);
    this.data = null;
    this.initializedPromise = null;
    this.forceRefresh = true;  // ensure next init() re-fetches from Supabase
    return this.init();
  }

  /** Force a fresh re-fetch from Supabase on next init() call */
  invalidateCache(): void {
    this.forceRefresh = true;
    this.initializedPromise = null;
  }
}

export const dataRepository = new LocalDataRepository();

export const DataService = {
  init: (timestamp: string | null = null) => dataRepository.init(timestamp),
  reset: () => dataRepository.resetData(),
  invalidateCache: () => dataRepository.invalidateCache(),
  syncToSupabase: (data?: ConstantsData) => dataRepository.syncToSupabase(data),
  syncRelationalToSupabase: (token?: string | null, data?: ConstantsData) => dataRepository.syncRelationalToSupabase(token, data),

  faculties: {
    getAll: () => dataRepository.getFaculties(),
    save: (items: Faculty[]) => dataRepository.saveFaculties(items),
  },
  departments: {
    getAll: () => dataRepository.getDepartments(),
    save: (items: Department[]) => dataRepository.saveDepartments(items),
  },
  divisions: {
    getAll: () => dataRepository.getDivisions(),
    save: (items: Division[]) => dataRepository.saveDivisions(items),
  },
  professors: {
    getAll: () => dataRepository.getProfessors(),
    save: (items: Professor[]) => dataRepository.saveProfessors(items),
  },
  plans: {
    getAll: () => dataRepository.getPlans(),
    save: (items: Plan[]) => dataRepository.savePlans(items),
  },
  achievements: {
    getAll: () => dataRepository.getAchievements(),
    save: (items: Achievement[]) => dataRepository.saveAchievements(items),
  },
  projects: {
    getAll: () => dataRepository.getProjects(),
    save: (items: Project[]) => dataRepository.saveProjects(items),
  },
  thesisDefenses: {
    getAll: () => dataRepository.getThesisDefenses(),
    save: (items: ThesisDefense[]) => dataRepository.saveThesisDefenses(items),
  },
  users: {
    getAll: () => dataRepository.getUsers(),
    save: (items: User[]) => dataRepository.saveUsers(items),
  },
  scoringSystem: {
    get: () => dataRepository.getScoringSystem(),
    save: (system: ScoringSystem) => dataRepository.saveScoringSystem(system),
  },
};
