import express from "express";
import { createAllocation, getAllocations, deleteAllocation } from "../controllers/allocations.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require login (protect)
router.post("/", protect, createAllocation);
router.get("/", protect, getAllocations);
router.delete("/:id", protect, deleteAllocation);

export default router;