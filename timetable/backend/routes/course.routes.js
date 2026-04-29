import express from "express";
import {
  addCourse,
  getCourse,
  updateCourse,
  deleteCourse,
  updateCourseStatus
} from "../controllers/course.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// ================= STAFF ROUTES =================
router.get("/", protect, getCourse);
router.post("/add", protect, addCourse);
router.put("/:id", protect, updateCourse);
router.delete("/:id", protect, deleteCourse);

// ================= ADMIN ROUTE =================
// Approve / Reject course
router.put("/status/:id", protect, updateCourseStatus);

export default router;