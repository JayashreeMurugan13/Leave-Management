import express from 'express';
import { createUser, getAllUsers, deactivateUser } from '../controllers/userController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { Role } from '../types';

const router = express.Router();

router.use(protect);

// Only Principals/HR can create or deactivate users
router.post('/', restrictTo(Role.PRINCIPAL), createUser);
router.get('/', restrictTo(Role.PRINCIPAL, Role.HOD), getAllUsers);
router.delete('/:id', restrictTo(Role.PRINCIPAL), deactivateUser);

export default router;
