import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import { LeaveService } from '../services/LeaveService';
import { sendResponse } from '../middlewares/responseHandler';
import { prisma } from '../utils/prismaClient';
import { checkHodOnLeave } from '../utils/approvalFlow';
import { AppError } from '../utils/AppError';

export const markStaffLeave = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const { startDate, endDate, reason } = req.body;
  const user = req.user;

  if (!startDate || !endDate) {
    return next(new AppError('Please provide start and end date', 400));
  }

  const leave = await prisma.leave.create({
    data: {
      userId: user.id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      leaveType: 'CL',
      reason: reason || 'Staff leave',
      status: 'APPROVED',
      currentApproverRole: null,
    },
  });

  sendResponse(res, 201, 'Leave marked. Pending requests will be forwarded automatically.', { leave });
});

export const applyLeave = asyncHandler(async (req: any, res: Response) => {
  const { startDate, endDate, type, reason, documentUrl } = req.body;
  const user = req.user;

  const { leave, hodAbsent } = await LeaveService.applyForLeave(
    user.id, user.role, user.department,
    new Date(startDate), new Date(endDate),
    type, reason, documentUrl
  );

  const message = hodAbsent && user.role !== 'HOD'
    ? 'Leave applied. HOD is currently on leave — request escalated to Principal.'
    : 'Leave applied successfully.';

  sendResponse(res, 201, message, { leave, hodAbsent });
});

export const getMyLeaves = asyncHandler(async (req: any, res: Response) => {
  const leaves = await prisma.leave.findMany({
    where: { userId: req.user.id },
    include: {
      approvals: {
        include: { approver: { select: { name: true, role: true } } },
        orderBy: { timestamp: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  sendResponse(res, 200, 'Leaves retrieved', { leaves });
});

export const getPendingApprovals = asyncHandler(async (req: any, res: Response) => {
  const user = req.user;

  const flowOrder = ['PROFESSOR', 'HOD', 'PRINCIPAL'];
  const myIndex = flowOrder.indexOf(user.role);
  const visibleRoles = flowOrder.filter((_, idx) => idx <= myIndex);

  let where: any = {
    status: 'PENDING',
    currentApproverRole: { in: visibleRoles },
  };

  if (user.role === 'PROFESSOR' || user.role === 'HOD') {
    where.user = { department: user.department };
  }

  const leaves = await prisma.leave.findMany({
    where,
    include: {
      user: { select: { name: true, email: true, role: true, department: true } },
      approvals: {
        include: { approver: { select: { name: true, role: true } } },
        orderBy: { timestamp: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // For each leave, check if the assigned approver is absent on the leave dates
  const leavesWithPermission = await Promise.all(leaves.map(async (leave: any) => {
    if (leave.currentApproverRole === user.role) {
      return { ...leave, canAct: true };
    }

    // Check if assigned approver has approved leave overlapping with this student's leave dates
    const assignedApproverAbsent = await prisma.leave.findFirst({
      where: {
        status: 'APPROVED',
        startDate: { lte: leave.endDate },
        endDate: { gte: leave.startDate },
        user: { role: leave.currentApproverRole },
      },
    });

    const assignedIndex = flowOrder.indexOf(leave.currentApproverRole);
    const canAct = !!assignedApproverAbsent && assignedIndex < myIndex;

    return { ...leave, canAct };
  }));

  sendResponse(res, 200, 'Pending approvals retrieved', { leaves: leavesWithPermission });
});

export const getAllLeavesForPrincipal = asyncHandler(async (req: any, res: Response) => {
  const leaves = await prisma.leave.findMany({
    include: {
      user: { select: { name: true, email: true, role: true, department: true } },
      approvals: {
        include: { approver: { select: { name: true, role: true } } },
        orderBy: { timestamp: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  sendResponse(res, 200, 'All leaves retrieved', { leaves });
});

export const approveLeaveRequest = asyncHandler(async (req: any, res: Response) => {
  const leave = await LeaveService.approveLeave(req.params.id, req.user.id, req.user.role, req.body.comments);
  sendResponse(res, 200, 'Leave approved', { leave });
});

export const rejectLeaveRequest = asyncHandler(async (req: any, res: Response) => {
  const leave = await LeaveService.rejectLeave(req.params.id, req.user.id, req.user.role, req.body.comments);
  sendResponse(res, 200, 'Leave rejected', { leave });
});

export const getLeaveStats = asyncHandler(async (req: any, res: Response) => {
  const user = req.user;
  const hodAbsent = await checkHodOnLeave();

  if (user.role === 'STUDENT') {
    const freshUser = await prisma.user.findUnique({ where: { id: user.id }, select: { leaveBalance: true } });
    const [approvedLeaves, myPending, myApproved, myRejected] = await Promise.all([
      prisma.leave.findMany({ where: { userId: user.id, status: 'APPROVED' }, select: { startDate: true, endDate: true } }),
      prisma.leave.count({ where: { userId: user.id, status: 'PENDING' } }),
      prisma.leave.count({ where: { userId: user.id, status: 'APPROVED' } }),
      prisma.leave.count({ where: { userId: user.id, status: 'REJECTED' } }),
    ]);
    const usedDays = approvedLeaves.reduce((sum: number, l: any) =>
      sum + Math.ceil(Math.abs(l.endDate.getTime() - l.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1, 0);
    return sendResponse(res, 200, 'Stats retrieved', {
      myPending, myApproved, myRejected, hodAbsent,
      leaveBalance: Math.max(0, freshUser!.leaveBalance - usedDays),
    });
  }

  const whereApprover: any = { status: 'PENDING', currentApproverRole: user.role };
  if (user.role !== 'PRINCIPAL' && user.department) {
    whereApprover.user = { department: user.department };
  }

  const [pending, totalApproved, totalRejected, escalated] = await Promise.all([
    prisma.leave.count({ where: whereApprover }),
    prisma.leave.count({ where: { status: 'APPROVED' } }),
    prisma.leave.count({ where: { status: 'REJECTED' } }),
    user.role === 'PRINCIPAL'
      ? prisma.leave.count({
          where: { status: 'PENDING', currentApproverRole: 'PRINCIPAL', reason: { contains: 'HOD_ESCALATED' } },
        })
      : Promise.resolve(0),
  ]);

  sendResponse(res, 200, 'Stats retrieved', {
    pending, totalApproved, totalRejected, escalated, hodAbsent,
  });
});
