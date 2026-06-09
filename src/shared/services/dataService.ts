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
          this.data = JSON.parse(stored);
          console.log('Loaded KPI data from LocalStorage');
          resolve(this.data!);
          return;
        } catch (e) {
          console.error('Error parsing stored LocalStorage data', e);
        }
      }

      // 2. Otherwise load from data.json
      const cacheBuster = timestamp ? `?t=${timestamp}` : `?t=${Date.now()}`;
      try {
        const response = await fetch(`data.json${cacheBuster}`);
        if (response.ok) {
          const jsonData = await response.json();
          if (jsonData && jsonData.CONSTANTS) {
            // Merge loaded data with DEFAULT_DATA to ensure all keys exist
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

      // 3. Fallback to DEFAULT_DATA
      this.data = { ...DEFAULT_DATA };
      this.saveToStorage();
      resolve(this.data!);
    });

    return this.initializedPromise;
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
  // Service wrapper for easy backend API switching in the future
  init: (timestamp: string | null = null) => dataRepository.init(timestamp),
  reset: () => dataRepository.resetData(),

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
