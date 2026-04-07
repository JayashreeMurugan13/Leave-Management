import { Rule, LeaveRequestData, RuleResult } from './RuleInterface';
import { prisma } from '../utils/prismaClient';

function countDays(start: Date, end: Date): number {
  return Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export class BalanceRule implements Rule {
  name = 'BalanceRule';

  async evaluate(data: LeaveRequestData): Promise<RuleResult> {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { leaveBalance: true }
    });

    if (!user) return { passed: false, message: 'User not found' };

    // Sum days from approved leaves only
    const approvedLeaves = await prisma.leave.findMany({
      where: { userId: data.userId, status: 'APPROVED' },
      select: { startDate: true, endDate: true },
    });

    const usedDays = approvedLeaves.reduce((sum, l) => sum + countDays(l.startDate, l.endDate), 0);
    const availableBalance = user.leaveBalance - usedDays;
    const requestedDays = countDays(data.startDate, data.endDate);

    if (availableBalance < requestedDays) {
      return {
        passed: false,
        message: `Insufficient leave balance. You have ${availableBalance} days left, but requested ${requestedDays} days.`,
        overrideAllowed: true,
      };
    }

    return { passed: true };
  }
}
