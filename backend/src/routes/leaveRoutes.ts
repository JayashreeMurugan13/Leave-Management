import express from 'express';
import {
  applyLeave, getMyLeaves, getPendingApprovals,
  approveLeaveRequest, rejectLeaveRequest, getLeaveStats,
  getAllLeavesForPrincipal, markStaffLeave,
} from '../controllers/LeaveController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { Role } from '../types';

const router = express.Router();
router.use(protect);

router.get('/stats', getLeaveStats);
router.post('/mark-leave', restrictTo(Role.PROFESSOR, Role.HOD), markStaffLeave);
router.post('/apply', applyLeave);
router.get('/my', getMyLeaves);
router.get('/all', restrictTo(Role.PRINCIPAL), getAllLeavesForPrincipal);
router.get('/pending', restrictTo(Role.PROFESSOR, Role.HOD, Role.PRINCIPAL), getPendingApprovals);
router.put('/:id/approve', restrictTo(Role.PROFESSOR, Role.HOD, Role.PRINCIPAL), approveLeaveRequest);
router.put('/:id/reject', restrictTo(Role.PROFESSOR, Role.HOD, Role.PRINCIPAL), rejectLeaveRequest);

export default router;
