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
      headers: buildRestHeaders(token),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Supabase request failed for ${path}: ${response.status} ${response.statusText}`
    );
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

  const response = await fetch(
    `${supabaseUrl}/rest/v1/${path}${query ? `?${query}` : ''}`,
    {
      method,
      headers: buildRestHeaders(token),
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

  init(timestamp: string | null = null): Promise<ConstantsData> {
    if (this.initializedPromise) {
      return this.initializedPromise;
    }

    this.initializedPromise = new Promise(async (resolve) => {
      // 1. Try to load from LocalStorage first to preserve CRUD edits
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          this.data = JSON.parse(stored) as ConstantsData;
          console.log('Loaded KPI data from LocalStorage');
          resolve(this.data!);
          return;
        } catch (e) {
          console.error('Error parsing stored LocalStorage data', e);
        }
      }

      // 2. Try to load from Supabase if configuration exists
      try {
        const remoteData = await this.loadFromSupabase();
        if (remoteData) {
          this.data = remoteData;
          this.saveToStorage();
          console.log('Loaded KPI data from Supabase');
          resolve(this.data!);
          return;
        }
      } catch (error) {
        console.warn('Supabase data load skipped or failed:', error);
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

    const [facultiesResponse, departmentsResponse, professorsResponse, plansResponse, planItemsResponse, achievementsResponse, projectsResponse, thesisDefensesResponse] =
      await Promise.all([
        fetchSupabaseData<Record<string, unknown>>(
          SUPABASE_REST_PATHS.faculties,
          null,
          'select=*'
        ),
        fetchSupabaseData<Record<string, unknown>>(
          SUPABASE_REST_PATHS.departments,
          null,
          'select=*'
        ),
        fetchSupabaseData<Record<string, unknown>>(
          SUPABASE_REST_PATHS.professors,
          null,
          'select=*'
        ),
        fetchSupabaseData<Record<string, unknown>>(
          SUPABASE_REST_PATHS.plans,
          null,
          'select=*'
        ),
        fetchSupabaseData<Record<string, unknown>>(
          SUPABASE_REST_PATHS.planItems,
          null,
          'select=*'
        ),
        fetchSupabaseData<Record<string, unknown>>(
          SUPABASE_REST_PATHS.achievements,
          null,
          'select=*'
        ),
        fetchSupabaseData<Record<string, unknown>>(
          SUPABASE_REST_PATHS.projects,
          null,
          'select=*'
        ),
        fetchSupabaseData<Record<string, unknown>>(
          SUPABASE_REST_PATHS.thesisDefenses,
          null,
          'select=*'
        ),
      ]);

    const facultyList = facultiesResponse.map(toFaculty);
    const departmentList = departmentsResponse.map(toDepartment);
    const professorList = professorsResponse.map(toProfessor);
    const planList = toPlan(plansResponse, planItemsResponse);
    const achievementList = achievementsResponse.map(toAchievement);
    const projectList = projectsResponse.map(toProject);
    const thesisDefenseList = thesisDefensesResponse.map(toThesisDefense);

    return {
      ...DEFAULT_DATA,
      FACULTIES: facultyList,
      DEPARTMENTS: departmentList,
      PROFESSORS: professorList,
      PLANS: planList,
      ACHIEVEMENTS: achievementList,
      PROJECTS: projectList,
      THESIS_DEFENSES: thesisDefenseList,
      USERS: DEFAULT_DATA.USERS,
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

  async syncToSupabase(): Promise<void> {
    if (!supabaseUrl || !supabaseAnonKey || !this.data) {
      return;
    }

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

  // --- Reset to initial ---
  async resetData(): Promise<ConstantsData> {
    localStorage.removeItem(STORAGE_KEY);
    this.data = null;
    this.initializedPromise = null;
    return this.init();
  }
}

export const dataRepository = new LocalDataRepository();

export const DataService = {
  init: (timestamp: string | null = null) => dataRepository.init(timestamp),
  reset: () => dataRepository.resetData(),
  syncToSupabase: () => dataRepository.syncToSupabase(),

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
