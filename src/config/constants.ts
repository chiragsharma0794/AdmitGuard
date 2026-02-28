import { Rule, RuleCategory } from '../types';

/**
 * ADMITGUARD RULE CONFIGURATION
 * Edit these rules to change validation logic.
 */
export const RULE_CONFIG: Rule[] = [
  {
    id: 'R1',
    field: 'fullName',
    label: 'Full Name',
    category: RuleCategory.STRICT,
    condition: 'value.trim().length >= 2 && !/\\d/.test(value)',
    errorMessage: 'Name must be at least 2 chars and contain no numbers.'
  },
  {
    id: 'R2',
    field: 'email',
    label: 'Email Address',
    category: RuleCategory.STRICT,
    condition: '/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)',
    errorMessage: 'Please enter a valid email address.'
  },
  {
    id: 'R3',
    field: 'phone',
    label: 'Phone Number',
    category: RuleCategory.STRICT,
    condition: '/^[6-9]\\d{9}$/.test(value)',
    errorMessage: 'Must be a 10-digit Indian mobile starting with 6, 7, 8, or 9.'
  },
  {
    id: 'R4',
    field: 'dob',
    label: 'Date of Birth',
    category: RuleCategory.SOFT,
    condition: `(() => {
      const birth = new Date(value);
      const start = new Date('2026-07-01'); // Program start date
      let age = start.getFullYear() - birth.getFullYear();
      const m = start.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && start.getDate() < birth.getDate())) age--;
      return age >= 18 && age <= 35;
    })()`,
    errorMessage: 'Age must be between 18 and 35 on July 1, 2026.'
  },
  {
    id: 'R5',
    field: 'highestQualification',
    label: 'Highest Qualification',
    category: RuleCategory.STRICT,
    condition: '["B.Tech","B.E.","B.Sc","BCA","M.Tech","M.Sc","MCA","MBA"].includes(value)',
    errorMessage: 'Qualification must be from the approved list.'
  },
  {
    id: 'R6',
    field: 'graduationYear',
    label: 'Graduation Year',
    category: RuleCategory.SOFT,
    condition: 'value >= 2015 && value <= 2025',
    errorMessage: 'Graduation year should be between 2015 and 2025.'
  },
  {
    id: 'R7',
    field: 'score',
    label: 'Percentage/CGPA',
    category: RuleCategory.SOFT,
    condition: 'value >= 60 || (value <= 10 && value >= 6.0)',
    errorMessage: 'Minimum 60% or 6.0 CGPA required.'
  },
  {
    id: 'R8',
    field: 'screeningScore',
    label: 'Screening Score',
    category: RuleCategory.SOFT,
    condition: 'value >= 40',
    errorMessage: 'Minimum screening score is 40/100.'
  },
  {
    id: 'R9',
    field: 'interviewStatus',
    label: 'Interview Status',
    category: RuleCategory.STRICT,
    condition: 'value !== "Rejected"',
    errorMessage: 'Rejected candidates cannot be submitted.'
  },
  {
    id: 'R10',
    field: 'aadhaar',
    label: 'Aadhaar Number',
    category: RuleCategory.STRICT,
    condition: '/^\\d{12}$/.test(value)',
    errorMessage: 'Aadhaar must be exactly 12 digits.'
  },
  {
    id: 'R11',
    field: 'offerLetterSent',
    label: 'Offer Letter Sent',
    category: RuleCategory.STRICT,
    condition: 'value === "No" || ["Cleared", "Waitlisted"].includes(candidate.interviewStatus)',
    errorMessage: 'Offer letter can only be sent if Interview is Cleared or Waitlisted.'
  }
];

export const RATIONALE_KEYWORDS = ["approved by", "special case", "documentation pending", "waiver granted"];
