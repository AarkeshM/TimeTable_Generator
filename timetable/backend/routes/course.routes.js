import express from "express";
import { addCourse, getCourse } from "../controllers/course.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getCourse);
router.post("/add", protect, addCourse);

export default router; 