/**
 * AdmitGuard Types & Interfaces
 */

export enum RuleCategory {
  STRICT = 'STRICT',
  SOFT = 'SOFT',
  SYSTEM = 'SYSTEM'
}

export interface Rule {
  id: string;
  field: string;
  label: string;
  category: RuleCategory;
  condition: string; // JS expression string
  errorMessage: string;
  description?: string;
}

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  highestQualification: string;
  graduationYear: number;
  score: number; // Percentage or CGPA
  screeningScore: number;
  interviewStatus: 'Cleared' | 'Waitlisted' | 'Rejected' | 'Pending';
  aadhaar: string;
  offerLetterSent: 'Yes' | 'No';
  overrides: Record<string, string>; // ruleId -> rationale
  submittedAt?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  exceptionCount: number;
}

export interface ValidationError {
  ruleId: string;
  field: string;
  message: string;
  category: RuleCategory;
  isOverridden: boolean;
  rationaleError?: string;
}

export interface AuditRecord extends Candidate {
  exceptionCount: number;
  isFlagged: boolean;
}
