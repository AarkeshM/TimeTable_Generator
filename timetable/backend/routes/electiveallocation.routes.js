import express from "express";
// 1. Ensure this file exists and is named exactly "auth.middleware.js"
import { protect } from "../middleware/auth.middleware.js"; 

// 2. Ensure your controller file is named exactly "electiveallocation.controller.js"
import {
    createElectiveAllocation,
    getElectiveAllocations,
    updateElectiveAllocation,
    deleteElectiveAllocation
} from "../controllers/electiveallocation.controller.js";

const router = express.Router();

// --- GLOBAL PROTECTION ---
// This applies 'protect' to ALL routes below automatically.
// You do NOT need to add it again inside .post() or .get()
router.use(protect);

router.route("/")
  .post(createElectiveAllocation) // protected by router.use above
  .get(getElectiveAllocations);

router.route("/:id")
  .put(updateElectiveAllocation)
  .delete(deleteElectiveAllocation);

export default router;