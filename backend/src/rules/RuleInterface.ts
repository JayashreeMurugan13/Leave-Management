import { LeaveType } from '../types';

export interface LeaveRequestData {
  userId: string;
  department: string;
  role: string;
  startDate: Date;
  endDate: Date;
  leaveType: LeaveType;
}

export interface RuleResult {
  passed: boolean;
  message?: string;
  overrideAllowed?: boolean;
}

export interface Rule {
  name: string;
  evaluate(data: LeaveRequestData): Promise<RuleResult>;
}
