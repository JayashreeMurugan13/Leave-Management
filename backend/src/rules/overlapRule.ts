import { Rule, LeaveRequestData, RuleResult } from './RuleInterface';
import { prisma } from '../utils/prismaClient';

export class OverlapRule implements Rule {
  name = 'OverlapRule';

  async evaluate(data: LeaveRequestData): Promise<RuleResult> {
    const overlappingLeaves = await prisma.leave.findFirst({
      where: {
        userId: data.userId,
        status: { in: ['APPROVED', 'PENDING'] },
        OR: [
          {
            startDate: { lte: data.endDate },
            endDate: { gte: data.startDate }
          }
        ]
      }
    });

    if (overlappingLeaves) {
      return {
        passed: false,
        message: 'Leave request overlaps with an existing leave application.',
        overrideAllowed: false
      };
    }

    return { passed: true };
  }
}
