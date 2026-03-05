import express from "express";
import { 
  addElectiveCourse, 
  getElectiveCourses, 
  updateElectiveCourse, 
  deleteElectiveCourse 
} from "../controllers/electivecourse.controller.js";
import { protect as authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// Protected Routes
router.post("/add", authMiddleware, addElectiveCourse);
router.get("/", authMiddleware, getElectiveCourses);
router.put("/:id", authMiddleware, updateElectiveCourse);
router.delete("/:id", authMiddleware, deleteElectiveCourse);

export default router;