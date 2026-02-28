import { Candidate, Rule, RuleCategory, ValidationResult, ValidationError } from '../types';
import { RULE_CONFIG, RATIONALE_KEYWORDS } from '../config/constants';

/**
 * Pure validation function for a candidate against the rule configuration.
 * @param candidate - The candidate to validate
 * @param existingEmails - List of emails already in the system (for uniqueness check)
 * @param rules - Optional custom rule set (defaults to RULE_CONFIG)
 */
export const validateCandidate = (
  candidate: Candidate,
  existingEmails: string[] = [],
  rules: Rule[] = RULE_CONFIG
): ValidationResult => {
  const errors: ValidationError[] = [];
  let exceptionCount = 0;

  rules.forEach((rule) => {
    const value = (candidate as any)[rule.field];
    let passed = false;

    try {
      // Evaluate the condition
      const check = new Function('value', 'candidate', `return ${rule.condition}`);
      passed = check(value, candidate);
    } catch (e) {
      console.error(`Error evaluating rule ${rule.id}:`, e);
      passed = false;
    }

    // Special check for unique email (R2)
    if (rule.id === 'R2' && passed) {
      if (existingEmails.includes(candidate.email)) {
        passed = false;
        // We don't overwrite the error message here, but we could
      }
    }

    if (!passed) {
      const isOverridden = !!candidate.overrides[rule.id];
      let rationaleError: string | undefined;

      if (rule.category === RuleCategory.SOFT) {
        if (isOverridden) {
          const rationale = candidate.overrides[rule.id];
          rationaleError = validateRationale(rationale);
          if (!rationaleError) {
            exceptionCount++;
          }
        }
      }

      errors.push({
        ruleId: rule.id,
        field: rule.field,
        message: rule.errorMessage,
        category: rule.category,
        isOverridden: rule.category === RuleCategory.SOFT && isOverridden && !rationaleError,
        rationaleError
      });
    }
  });

  // Check if any STRICT rules failed (and are not overridden, though STRICT can't be)
  const hasStrictFailure = errors.some(
    (e) => e.category === RuleCategory.STRICT && !e.isOverridden
  );
  
  // Check if any SOFT rules failed and are NOT overridden correctly
  const hasUnresolvedSoftFailure = errors.some(
    (e) => e.category === RuleCategory.SOFT && !e.isOverridden
  );

  return {
    isValid: !hasStrictFailure && !hasUnresolvedSoftFailure,
    errors,
    exceptionCount
  };
};

/**
 * Validates the rationale for a soft rule exception.
 * Must be >= 30 chars and contain at least one keyword.
 */
export const validateRationale = (rationale: string): string | undefined => {
  if (!rationale || rationale.trim().length < 30) {
    return 'Rationale must be at least 30 characters long.';
  }
  
  const hasKeyword = RATIONALE_KEYWORDS.some((keyword) =>
    rationale.toLowerCase().includes(keyword.toLowerCase())
  );

  if (!hasKeyword) {
    return `Rationale must contain one of: ${RATIONALE_KEYWORDS.join(', ')}.`;
  }

  return undefined;
};
