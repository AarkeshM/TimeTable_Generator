import Allocation from "../models/Allocations.js";

// --- CREATE ALLOCATION ---
export const createAllocation = async (req, res) => {
  try {
    const { staffId, courseId, year, section, periods } = req.body;

    // 1. Validation
    if (!staffId || !courseId || !year || !section || !periods) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Create Entry
    const newAllocation = await Allocation.create({
      staffId,
      courseId,
      year,
      section,
      periods,
      assignedBy: req.user.id // Taken from the Admin's token
    });

    // 3. Populate immediately so Frontend table can show names
    await newAllocation.populate([
      { path: "staffId", select: "name email" },
      { path: "courseId", select: "name code" }
    ]);

    res.status(201).json({ 
      success: true, 
      message: "Faculty assigned successfully", 
      allocation: newAllocation 
    });

  } catch (error) {
    // Handle Duplicate Entry Error (MongoDB error code 11000)
    if (error.code === 11000) {
      return res.status(400).json({ message: "This faculty is already assigned to this course/section." });
    }
    console.error("Create Allocation Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// --- GET ALL ALLOCATIONS ---
export const getAllocations = async (req, res) => {
  try {
    // Fetch all allocations and join with User and Course data
    const allocations = await Allocation.find()
      .populate("staffId", "name email")
      .populate("courseId", "name code acronym")
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({ 
      success: true, 
      allocations 
    });
  } catch (error) {
    console.error("Get Allocations Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// --- DELETE ALLOCATION ---
export const deleteAllocation = async (req, res) => {
  try {
    await Allocation.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Allocation removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};