import { prisma } from '../utils/prismaClient';
import { PolicyEngine } from '../rules/policyEngine';
import { BalanceRule } from '../rules/balanceRule';
import { OverlapRule } from '../rules/overlapRule';
import { ExamEventRule } from '../rules/examEventRule';
import { checkHodOnLeave, getNextApproverDynamic } from '../utils/approvalFlow';
import { AppError } from '../utils/AppError';
import { LeaveType, Role } from '../types';

const engine = new PolicyEngine();
engine.addRule(new BalanceRule());
engine.addRule(new OverlapRule());
engine.addRule(new ExamEventRule());

export class LeaveService {
  static async applyForLeave(
    userId: string, role: Role, department: string,
    startDate: Date, endDate: Date, type: LeaveType,
    reason: string, documentUrl?: string
  ) {
    const { isValid, messages } = await engine.evaluateAll({
      userId, role, department, startDate, endDate, leaveType: type,
    });
    if (!isValid) throw new AppError(`Policy check failed: ${messages.join(' ')}`, 400);

    const hodAbsent = await checkHodOnLeave();
    const firstApproverRole = await getNextApproverDynamic(role);
    const status = firstApproverRole ? 'PENDING' : 'APPROVED';

    const leave = await prisma.leave.create({
      data: {
        userId, startDate, endDate, leaveType: type, reason, documentUrl,
        status,
        currentApproverRole: firstApproverRole,
        // store escalation flag in reason suffix for UI to read
        ...(hodAbsent && firstApproverRole === Role.PRINCIPAL && role !== Role.HOD
          ? { reason: reason + ' [HOD_ESCALATED]' }
          : {}),
      },
    });

    return { leave, hodAbsent };
  }

  static async approveLeave(leaveId: string, approverId: string, approverRole: Role, comments?: string) {
    const leave = await prisma.leave.findUnique({ where: { id: leaveId } });
    if (!leave) throw new AppError('Leave not found', 404);
    if (leave.status !== 'PENDING') throw new AppError(`Leave is already ${leave.status}`, 400);

    const flowOrder = ['PROFESSOR', 'HOD', 'PRINCIPAL'];
    const myIndex = flowOrder.indexOf(approverRole);
    const assignedIndex = flowOrder.indexOf(leave.currentApproverRole!);

    let canAct = leave.currentApproverRole === approverRole;

    if (!canAct && assignedIndex < myIndex) {
      const absent = await prisma.leave.findFirst({
        where: {
          status: 'APPROVED',
          startDate: { lte: leave.endDate },
          endDate: { gte: leave.startDate },
          user: { role: leave.currentApproverRole! },
        },
      });
      canAct = !!absent;
    }

    if (!canAct) throw new AppError('You do not have permission to approve this stage.', 403);

    const applicant = await prisma.user.findUnique({ where: { id: leave.userId } });
    const nextApproverRole = await getNextApproverDynamic(applicant!.role as Role, approverRole);
    const isFinal = nextApproverRole === null;

    const result = await prisma.$transaction(async (tx: any) => {
      await tx.leaveApproval.create({
        data: { leaveId, approverId, action: 'APPROVED', comments },
      });
      return tx.leave.update({
        where: { id: leaveId },
        data: {
          status: isFinal ? 'APPROVED' : 'PENDING',
          currentApproverRole: nextApproverRole,
        },
      });
    });

    return result;
  }

  static async rejectLeave(leaveId: string, approverId: string, approverRole: Role, comments?: string) {
    const leave = await prisma.leave.findUnique({ where: { id: leaveId } });
    if (!leave) throw new AppError('Leave not found', 404);
    if (leave.status !== 'PENDING') throw new AppError(`Leave is already ${leave.status}`, 400);

    const flowOrder = ['PROFESSOR', 'HOD', 'PRINCIPAL'];
    const myIndex = flowOrder.indexOf(approverRole);
    const assignedIndex = flowOrder.indexOf(leave.currentApproverRole!);

    let canAct = leave.currentApproverRole === approverRole;

    if (!canAct && assignedIndex < myIndex) {
      const absent = await prisma.leave.findFirst({
        where: {
          status: 'APPROVED',
          startDate: { lte: leave.endDate },
          endDate: { gte: leave.startDate },
          user: { role: leave.currentApproverRole! },
        },
      });
      canAct = !!absent;
    }

    if (!canAct) throw new AppError('You do not have permission to reject this leave.', 403);

    const result = await prisma.$transaction([
      prisma.leaveApproval.create({
        data: { leaveId, approverId, action: 'REJECTED', comments },
      }),
      prisma.leave.update({
        where: { id: leaveId },
        data: { status: 'REJECTED', currentApproverRole: null },
      }),
    ]);

    return result[1];
  }

  static async getStats(role: string, department?: string) {
    const hodAbsent = await checkHodOnLeave();

    if (role === 'STUDENT') {
      // handled per-user in controller
      return { hodAbsent };
    }

    const whereApprover: any = { status: 'PENDING', currentApproverRole: role };
    if (role !== 'PRINCIPAL' && department) {
      whereApprover.user = { department };
    }

    const [pending, approved, rejected, total] = await Promise.all([
      prisma.leave.count({ where: whereApprover }),
      prisma.leave.count({ where: { ...whereApprover, status: 'APPROVED', currentApproverRole: undefined } }),
      prisma.leave.count({ where: { status: 'REJECTED' } }),
      prisma.leave.count(),
    ]);

    return { pending, approved, rejected, total, hodAbsent };
  }
}
