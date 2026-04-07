import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { prisma } from '../utils/prismaClient';
import { sendResponse } from '../middlewares/responseHandler';
import { AppError } from '../utils/AppError';

// Create event and auto-cancel overlapping leaves
export const createEvent = asyncHandler(async (req: any, res: Response) => {
  const { title, date, type } = req.body;

  if (!title || !date || !type) {
    throw new AppError('title, date and type are required', 400);
  }

  const eventDate = new Date(date);

  const event = await prisma.event.create({
    data: { title, date: eventDate, type },
  });

  // Auto-cancel PENDING and APPROVED leaves that overlap this event date
  // only for EXAM and RESTRICTED events
  let cancelledCount = 0;
  if (type === 'EXAM' || type === 'RESTRICTED') {
    const overlapping = await prisma.leave.findMany({
      where: {
        status: { in: ['PENDING', 'APPROVED'] },
        startDate: { lte: eventDate },
        endDate:   { gte: eventDate },
      },
      include: { user: { select: { name: true, email: true } } },
    });

    if (overlapping.length > 0) {
      await prisma.leave.updateMany({
        where: { id: { in: overlapping.map((l) => l.id) } },
        data: {
          status: 'REJECTED',
          currentApproverRole: null,
        },
      });

      // Log audit entries for each cancelled leave
      await prisma.auditLog.createMany({
        data: overlapping.map((l) => ({
          userId: req.user.id,
          action: `AUTO_CANCELLED`,
          metadata: {
            leaveId: l.id,
            reason: `Cancelled due to ${type}: ${title} on ${eventDate.toDateString()}`,
            affectedUser: l.user.name,
          },
        })),
      });

      cancelledCount = overlapping.length;
    }
  }

  sendResponse(res, 201, `Event created. ${cancelledCount} leave(s) auto-cancelled.`, {
    event,
    cancelledCount,
  });
});

export const getEvents = asyncHandler(async (req: any, res: Response) => {
  const events = await prisma.event.findMany({
    orderBy: { date: 'asc' },
  });
  sendResponse(res, 200, 'Events retrieved', { events });
});

export const deleteEvent = asyncHandler(async (req: any, res: Response) => {
  await prisma.event.delete({ where: { id: req.params.id } });
  sendResponse(res, 200, 'Event deleted', {});
});
