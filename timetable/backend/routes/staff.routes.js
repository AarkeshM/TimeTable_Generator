import express from "express";
import { getStaff } from "../controllers/staff.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getStaff);

export default router;