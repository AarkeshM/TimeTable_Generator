import express from "express";
import { 
  getStaff, 
  getStaffProfile, 
  updateStaffProfile,
  registerStaff,
  assignStaff,
  getAllocationsByStaff,
  deleteAllocation
} from "../controllers/staff.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";

const router = express.Router();

router.get("/", protect, getStaff);
router.get("/profile", protect, getStaffProfile);
router.put("/profile", protect, updateStaffProfile);
router.post("/register", protect, registerStaff);
router.post("/", protect, isAdmin, assignStaff);
router.get("/staff/:staffId", protect, getAllocationsByStaff);
router.delete("/:id", protect, isAdmin, deleteAllocation);
export default router;
