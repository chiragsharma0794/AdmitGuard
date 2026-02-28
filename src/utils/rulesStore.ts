import { Rule, RuleCategory } from '../types';
import { RULE_CONFIG } from '../config/constants';

const OVERRIDES_KEY = 'admitguard_rule_overrides_v1';

export interface RuleOverride {
  id: string;
  condition?: string;
  errorMessage?: string;
  description?: string;
  disabled?: boolean;
}

export function loadRuleOverrides(): Record<string, RuleOverride> {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveRuleOverrides(overrides: Record<string, RuleOverride>): void {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
}

export function resetRuleOverrides(): void {
  localStorage.removeItem(OVERRIDES_KEY);
}

export function getEffectiveRules(overrides: Record<string, RuleOverride> = loadRuleOverrides()): Rule[] {
  return RULE_CONFIG
    .filter(rule => {
      if (rule.category !== RuleCategory.SOFT) return true;
      const override = overrides[rule.id];
      return !override?.disabled;
    })
    .map(rule => {
      if (rule.category !== RuleCategory.SOFT) return rule;
      const override = overrides[rule.id];
      if (!override) return rule;
      return {
        ...rule,
        condition: override.condition ?? rule.condition,
        errorMessage: override.errorMessage ?? rule.errorMessage,
        description: override.description ?? rule.description,
      };
    });
}

export function validateConditionSyntax(condition: string): string | null {
  try {
    new Function('value', 'candidate', `return ${condition}`);
    return null;
  } catch (e: any) {
    return e.message || 'Invalid condition syntax';
  }
}

export function exportRulesToJson(rules: Rule[]): void {
  const softRules = rules.filter(r => r.category === RuleCategory.SOFT);
  const blob = new Blob([JSON.stringify(softRules, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `admitguard-soft-rules-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
