import express from "express";
import { addCourse, getCourse, deleteCourse } from "../controllers/course.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getCourse);
router.post("/add", protect, addCourse);
router.delete("/:id", protect, deleteCourse);    

export default router; 