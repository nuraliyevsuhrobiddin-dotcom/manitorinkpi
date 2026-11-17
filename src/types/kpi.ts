import { CONSTANTS } from '../data.js';

// Ma'lumotlar tiplari
export type User = typeof CONSTANTS.USERS[0] & { departmentId?: number };
export type Professor = typeof CONSTANTS.PROFESSORS[0];

// Approval status tipi
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

// Achievement tipini kengaytirish — status + submitter + rejection
export type Achievement = typeof CONSTANTS.ACHIEVEMENTS[0] & {
  status?: ApprovalStatus;
  submittedBy?: number;   // user.id
  submittedAt?: string;   // ISO string
  rejectionNote?: string;
};

export type PlanItem = { type: string; subType: string; count: number };
export type Plan = {
  id?: number;
  professorId: number;
  year: number;
  planItems: PlanItem[];
  status?: ApprovalStatus;
  submittedBy?: number;
  submittedAt?: string;
  rejectionNote?: string;
};

export type Department = typeof CONSTANTS.DEPARTMENTS[0];
export type Faculty = typeof CONSTANTS.FACULTIES[0];
export type Division = { id: number, name: string };
export type Project = typeof CONSTANTS.PROJECTS[0];
export type ScoringSystem = typeof CONSTANTS.SCORING_SYSTEM;
export type ScoringCriterion = { score: number; description: string };
export type ScoringCategory = { [subType: string]: ScoringCriterion };
export type ThesisDefense = typeof CONSTANTS.THESIS_DEFENSES[0];
export type Filters = {
  gender: string[];
  degree: string[];
  title: string[];
  ageRange: string[];
  position: string[];
};
