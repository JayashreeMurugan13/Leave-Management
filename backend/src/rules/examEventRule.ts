import { Rule, LeaveRequestData, RuleResult } from './RuleInterface';
import { prisma } from '../utils/prismaClient';

export class ExamEventRule implements Rule {
  name = 'ExamEventRule';

  async evaluate(data: LeaveRequestData): Promise<RuleResult> {
    // Check for critical events during the requested leave period
    const overlappingEvents = await prisma.event.findMany({
      where: {
        date: {
          gte: data.startDate,
          lte: data.endDate
        },
        type: {
          in: ['EXAM', 'RESTRICTED']
        }
      }
    });

    if (overlappingEvents.length > 0) {
      const eventNames = overlappingEvents.map(e => e.title).join(', ');
      return {
        passed: false,
        message: `Leave period conflicts with restricted events: ${eventNames}.`,
        overrideAllowed: true // Higher authority can override
      };
    }

    return { passed: true };
  }
}
