import ElectiveAllocation from "../models/ElectiveAllocations.js";
import ElectiveCourse from "../models/ElectiveCourse.js"; // Using your specific model
import User from "../models/User.js";

// @desc    Create a new elective allocation
// @route   POST /api/elective-allocations
// @access  Admin
export const createElectiveAllocation = async (req, res) => {
  try {
    // Debugging Log: See exactly what the frontend sent
    console.log("Incoming Allocation Data:", req.body);

    
    const userId = req.user.id || req.user._id;

    if (!userId) {
      console.error("Auth Failed: No user found in request object.");
      return res.status(401).json({ message: "Not authorized. Please log in again." });
    }

    const { staffId, courseId, year, section, periods } = req.body;

    // 2. VALIDATION: Check for missing fields
    if (!staffId || !courseId || !year || !section || !periods) {
      return res.status(400).json({ message: "Please fill all fields (Staff, Course, Year, Section, Periods)" });
    }

    // 3. EXISTENCE CHECK: Ensure Staff & Course exist in DB
    const staff = await User.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    // Checking against your specific ELECTIVE COURSE model
    const course = await ElectiveCourse.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Elective Course not found. Invalid Course ID." });
    }

    // 4. DUPLICATE CHECK: Prevent double booking
    const existing = await ElectiveAllocation.findOne({
      staffId,
      courseId,
      section,
      year,
    });

    if (existing) {
      return res.status(400).json({ message: "This elective is already allocated to this staff for this section." });
    }

    // 5. CREATE: Save to Database
    const newAllocation = new ElectiveAllocation({
      staffId,
      courseId,
      year,
      section,
      periods,
      assignedBy: req.user.id, // Requires authMiddleware
    });

    const savedAllocation = await newAllocation.save();

    // 6. POPULATE: Fetch names for the frontend
    // This works because your Schema refs are correct now
    const populatedAllocation = await ElectiveAllocation.findById(savedAllocation._id)
      .populate("staffId", "name email")
      .populate("courseId", "name code acronym"); // Added 'acronym' since it's in your schema

    res.status(201).json({ 
      success: true, 
      allocation: populatedAllocation,
      message: "Elective Allocated Successfully" 
    });

  } catch (error) {
    // Log the ACTUAL error to your terminal so you can see it
    console.error("SERVER ERROR in createElectiveAllocation:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get all elective allocations
// @route   GET /api/elective-allocations
export const getElectiveAllocations = async (req, res) => {
  try {
    const allocations = await ElectiveAllocation.find()
      .populate("staffId", "name")
      .populate("courseId", "name code acronym") // Populates from ElectiveCourse collection
      .populate("assignedBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(allocations);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Delete allocation
// @route   DELETE /api/elective-allocations/:id
export const deleteElectiveAllocation = async (req, res) => {
  try {
    const allocation = await ElectiveAllocation.findById(req.params.id);
    if (!allocation) return res.status(404).json({ message: "Allocation not found" });

    await allocation.deleteOne();
    res.status(200).json({ message: "Elective Allocation removed" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Update allocation
// @route   PUT /api/elective-allocations/:id
export const updateElectiveAllocation = async (req, res) => {
    try {
        const { periods, section, year } = req.body;
        const updatedAllocation = await ElectiveAllocation.findByIdAndUpdate(
            req.params.id,
            { periods, section, year },
            { new: true }
        ).populate("staffId", "name").populate("courseId", "name code acronym");

        if(!updatedAllocation) return res.status(404).json({message: "Not found"});

        res.status(200).json({ success: true, allocation: updatedAllocation });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}