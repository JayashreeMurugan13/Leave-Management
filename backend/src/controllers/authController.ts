import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prismaClient';
import { AppError } from '../utils/AppError';
import { config } from '../config/env';
import { sendResponse } from '../middlewares/responseHandler';
import asyncHandler from 'express-async-handler';

const signToken = (id: string) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });
};

const createSendToken = (user: any, statusCode: number, res: Response, message: string) => {
  const token = signToken(user.id);

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    expires: new Date(Date.now() + config.jwtCookieExpiresIn * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  sendResponse(res, statusCode, message, {
    user,
    token // we also send it so mobile clients could use it if cookies are tricky, but our frontend will use cookies
  });
};

export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password, role, department } = req.body;

  if (!name || !email || !password || !role) {
    return next(new AppError('Name, email, password and role are required', 400));
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return next(new AppError('Email already in use', 400));

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role, department },
  });

  createSendToken(user, 201, res, 'Registration successful');
});

export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  console.log(`Login attempt: ${email} as ${role || 'unknown'}`);

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return next(new AppError('Invalid credentials or role mismatch', 401));
  }

  if (role && user.role !== role.toUpperCase()) {
    return next(new AppError('Invalid credentials or role mismatch', 401));
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return next(new AppError('Invalid credentials or role mismatch', 401));
  }

  if (user.status === 'INACTIVE') {
    return next(new AppError('Account deactivated. Contact HR.', 401));
  }

  createSendToken(user, 200, res, 'Login successful');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return next(new AppError('Please provide email and new password', 400));
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return next(new AppError('No account found with that email', 404));
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { email }, data: { password: hashedPassword } });

  sendResponse(res, 200, 'Password reset successfully. Please login.');
});

export const logout = (req: Request, res: Response) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  sendResponse(res, 200, 'Logged out successfully');
};

export const getMe = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      leaveBalance: true,
      status: true,
      createdAt: true,
    }
  });

  sendResponse(res, 200, 'User details retrieved', { user });
});
