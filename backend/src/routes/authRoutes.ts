import express from 'express';
import { login, logout, getMe, resetPassword } from '../controllers/authController';
import { createUser } from '../controllers/userController';
import { protect } from '../middlewares/authMiddleware';
import { authLimiter, registerLimiter } from '../middlewares/rateLimiter';

const router = express.Router();

router.post('/register', registerLimiter, createUser);
router.post('/login', authLimiter, login);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/logout', logout);
router.get('/me', protect, getMe);

export default router;
