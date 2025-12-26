import express from 'express';
import { 
  saveTimetable, 
  getTimetable, 
  getHistory, 
  deleteTimetable 
} from '../controllers/timetable.controller.js'; 

import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// --- DEFINING THE PATHS ---

// GET /api/timetable/history -> Get list of saved versions
router.get('/history', protect, getHistory);

// POST /api/timetable -> Save new timetable
router.post('/', protect, saveTimetable);

// GET /api/timetable -> Get latest or specific timetable
router.get('/', protect, getTimetable);

// DELETE /api/timetable -> Clear all (Optional)
router.delete('/', protect, deleteTimetable);

export default router;