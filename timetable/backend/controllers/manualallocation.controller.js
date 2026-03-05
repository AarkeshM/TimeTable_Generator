import ManualAllocation from "../models/ManualAllocation.js";
import User from "../models/User.js";

// @route   POST /api/manualallocations/manual
export const createManualAllocation = async (req, res) => {
  try {
    console.log("Incoming Manual Allocation:", req.body); // DEBUG LOG

    // CHANGED: Destructure 'courseId' instead of 'subject' to match Schema and Frontend
    const { staffId, day, period, courseId, section, year } = req.body;

    // 1. Validate All Fields are Present
    // CHANGED: Check for courseId
    if (!staffId || !day || !period || !courseId || !section || !year) {
      console.log("Missing Fields:", { staffId, day, period, courseId, section, year });
      return res.status(400).json({ message: "Please fill in all fields (Staff, Day, Period, Subject/Course, Section, Year)" });
    }

    // 2. Check if Staff Exists
    const staff = await User.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    // 3. Conflict Check: Is Staff already busy?
    const staffConflict = await ManualAllocation.findOne({
      staffId,
      day,
      period
    });

    if (staffConflict) {
      console.log("Conflict Found:", staffConflict);
      return res.status(400).json({ message: `Staff is already assigned to ${staffConflict.section} during ${day} period ${period}` });
    }

    // 4. Conflict Check: Is Section already occupied?
    const classConflict = await ManualAllocation.findOne({
      year,
      section,
      day,
      period
    });

    if (classConflict) {
       // Note: classConflict.courseId might be an ID here, not a name, unless populated. 
       // Keeping message generic to avoid errors.
       return res.status(400).json({ message: `Class ${year}-${section} already has a session during this period.` });
    }

    // 5. Create Allocation
    const newAllocation = new ManualAllocation({
      staffId,
      day,
      period,
      courseId, // CHANGED: Passing the valid courseId
      section,
      year,
      // CHANGED: Safer check for req.user
      assignedBy: req.user?._id || null 
    });

    await newAllocation.save();

    res.status(201).json({ success: true, message: "Manual Allocation Successful", allocation: newAllocation });

  } catch (error) {
    console.error("Manual Allocation Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get all manual allocations
export const getManualAllocations = async (req, res) => {
  try {
    const manuals = await ManualAllocation.find()
      .populate("courseId", "name code acronym") // Ensure 'courseId' matches your Schema ref name
      .populate("staffId", "name email")
      .sort({ day: 1, period: 1 }); 
      
    res.status(200).json({ manualAllocations: manuals });
  } catch (error) {
    console.error("Get Manuals Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Delete a manual allocation
export const deleteManualAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ManualAllocation.findByIdAndDelete(id);

    if (!deleted) {
        return res.status(404).json({ message: "Allocation not found" });
    }

    res.status(200).json({ message: "Manual allocation removed successfully" });
  } catch (error) {
    console.error("Delete Manual Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

