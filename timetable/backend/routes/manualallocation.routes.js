import express from "express";
import { 
  createManualAllocation, 
  getManualAllocations, 
  deleteManualAllocation
} from "../controllers/manualallocation.controller.js"; 
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// --- FIXED ROUTES ---

// 1. POST: Create a new allocation
// matches: POST /api/manualallocations
router.post("/", protect, createManualAllocation); 

// 2. GET: Get all allocations
// matches: GET /api/manualallocations  <-- This fixes your 404 error
router.get("/", protect, getManualAllocations);

// 3. DELETE: Delete an allocation
// matches: DELETE /api/manualallocations/:id
router.delete("/:id", protect, deleteManualAllocation);

export default router;