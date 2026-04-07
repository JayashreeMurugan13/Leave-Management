import { Rule, LeaveRequestData, RuleResult } from './RuleInterface';

export class PolicyEngine {
  private rules: Rule[] = [];

  addRule(rule: Rule) {
    this.rules.push(rule);
  }

  async evaluateAll(data: LeaveRequestData): Promise<{ isValid: boolean; messages: string[] }> {
    const messages: string[] = [];
    let isValid = true;

    for (const rule of this.rules) {
      const result = await rule.evaluate(data);
      if (!result.passed) {
        isValid = false;
        if (result.message) messages.push(`[${rule.name}] ${result.message}`);
      }
    }

    return { isValid, messages };
  }
}
