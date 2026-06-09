export interface Faculty {
  id: number;
  name: string;
}

export interface Department {
  id: number;
  name: string;
  facultyId: number;
}

export interface Division {
  id: number;
  name: string;
}

export interface Professor {
  id: number;
  firstName: string;
  lastName: string;
  patronymic: string;
  birthDate: string;
  gender: 'erkak' | 'ayol';
  departmentId: number;
  degree: string;
  title: string;
  position: string;
  staffUnit: number;
  employmentType: string;
  phone: string;
}

export interface PlanItem {
  type: string;
  subType: string;
  count: number;
}

export interface Plan {
  id?: number;
  professorId: number;
  year: number;
  planItems: PlanItem[];
}

export interface Achievement {
  id: number;
  professorId: number;
  year: number;
  quarter: number;
  type: string;
  subType: string;
  count: number;
}

export interface Project {
  id: number;
  name: string;
  type: 'Loyiha' | 'Startap' | 'Grant' | 'Spinoff' | string;
  direction: 'Fundamental' | 'Amaliy' | 'Innovatsion' | string;
  leaderName: string;
  leaderPosition: string;
  departmentId: number;
  facultyId: number;
  totalFunding: number;
  duration: number;
}

export interface ThesisDefense {
  id: number;
  lastName: string;
  firstName: string;
  patronymic: string;
  departmentId: number;
  facultyId: number;
  specialty: string;
  type: 'PhD' | 'DSc' | string;
  fieldOfScience: string;
  thesisTopic: string;
  supervisor: string;
  defenseOrganization: string;
  councilNumber: string;
  defenseDate: string;
}

export interface User {
  id: number;
  username: string;
  role: 'superadmin' | 'guest';
}

export interface ScoringCriterion {
  score: number;
  description: string;
}

export interface ScoringCategory {
  [subType: string]: ScoringCriterion;
}

export interface ScoringSystem {
  [category: string]: ScoringCategory;
}

export interface ConstantsData {
  FACULTIES: Faculty[];
  DEPARTMENTS: Department[];
  DIVISIONS: Division[];
  POSITIONS: string[];
  EMPLOYMENT_TYPES: string[];
  PROJECT_TYPES: string[];
  PROJECT_DIRECTIONS: string[];
  PROJECT_LEADER_POSITIONS: string[];
  PROJECT_DURATIONS: number[];
  PROJECTS: Project[];
  PROFESSORS: Professor[];
  PLANS: Plan[];
  ACHIEVEMENTS: Achievement[];
  SCORING_SYSTEM: ScoringSystem;
  USERS: User[];
  THESIS_DEFENSES: ThesisDefense[];
  SPECIALTIES: string[];
  FIELDS_OF_SCIENCE: string[];
  DEFENSE_TYPES: string[];
}
