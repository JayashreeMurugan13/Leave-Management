import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import { prisma } from '../utils/prismaClient';
import { sendResponse } from '../middlewares/responseHandler';
import { AppError } from '../utils/AppError';

export const createUser = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const { name, email, password, role, department } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return next(new AppError('Email already in use', 400));
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      department,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
    }
  });

  sendResponse(res, 201, 'User created successfully', { user: newUser });
});

export const getAllUsers = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      status: true,
      leaveBalance: true,
      createdAt: true,
    }
  });

  sendResponse(res, 200, 'Users retrieved successfully', { users });
});

export const deactivateUser = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const user = await prisma.user.update({
    where: { id },
    data: { status: 'INACTIVE' },
    select: { id: true, email: true, status: true }
  });

  sendResponse(res, 200, 'User deactivated (soft deleted)', { user });
});
