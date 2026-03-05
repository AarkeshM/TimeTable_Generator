import express from "express";
import { getAllStaff, getFacultySchedule } from "../controllers/facultytimetable.controller.js";
import { protect } from "../middleware/auth.middleware.js"; // Ensure user is logged in

const router = express.Router();

router.get("/staff-list", protect, getAllStaff);
router.get("/schedule/:staffId", protect, getFacultySchedule);

export default router;