import express from 'express';
import { createEvent, getEvents, deleteEvent } from '../controllers/eventController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { Role } from '../types';

const router = express.Router();
router.use(protect);

router.get('/',    getEvents);
router.post('/',   restrictTo(Role.HOD, Role.PRINCIPAL), createEvent);
router.delete('/:id', restrictTo(Role.HOD, Role.PRINCIPAL), deleteEvent);

export default router;
