import ElectiveCourse from "../models/ElectiveCourse.js"; // <--- CHECK THIS IMPORT
import Staff from "../models/User.js"

// GET All Electives
export const getElectiveCourses = async (req, res) => {
  try {
    // We populate staffId to get the name of the faculty if assigned
    const electives = await ElectiveCourse.find().populate("staffId", "name email");
    
    // Debug log to see if data is actually being fetched
    console.log(`Fetched ${electives.length} elective courses`);
    
    res.status(200).json({ electives });
  } catch (error) {
    console.error("Error fetching electives:", error); // <--- This prints to your terminal
    res.status(500).json({ message: "Failed to fetch electives", error: error.message });
  }
};

// ADD Elective
export const addElectiveCourse = async (req, res) => {
  try {
    const { name, code, acronym, year, staffId } = req.body;

    const existing = await ElectiveCourse.findOne({ code });
    if (existing) {
      return res.status(400).json({ message: "Elective code already exists" });
    }

    const newElective = new ElectiveCourse({
      name,
      code,
      acronym,
      year,
      staffId: staffId || null,
      CreatedBy: req.user.id // Assuming middleware adds user to req
    });

    await newElective.save();
    res.status(201).json({ message: "Elective added successfully", elective: newElective });
  } catch (error) {
    console.error("Error adding elective:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
// --- UPDATE: Modify an existing Elective ---
export const updateElectiveCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;

    const course = await ElectiveCourse.findById(id);

    if (!course) {
      return res.status(404).json({ message: "Elective course not found." });
    }

    // Authorization check: Allow if Admin OR if Owner
    if (userRole !== "admin" && course.staffId.toString() !== userId.toString()) {
      return res.status(401).json({ message: "Not authorized to update this course." });
    }

    // Check duplicate code if code is being updated
    if (updates.code && updates.code !== course.code) {
        const duplicate = await ElectiveCourse.findOne({ code: updates.code });
        if (duplicate) {
            return res.status(400).json({ message: "Course code already in use." });
        }
    }

    const updatedCourse = await ElectiveCourse.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({ message: "Elective updated successfully", course: updatedCourse });
  } catch (error) {
    console.error("Error updating elective:", error);
    res.status(500).json({ message: "Server error while updating elective." });
  }
};

// --- DELETE: Remove an Elective ---
export const deleteElectiveCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;

    const course = await ElectiveCourse.findById(id);

    if (!course) {
      return res.status(404).json({ message: "Elective course not found." });
    }

    // Authorization check: Allow if Admin OR if Owner
    if (userRole !== "admin" && course.staffId.toString() !== userId.toString()) {
      return res.status(401).json({ message: "Not authorized to delete this course." });
    }

    await ElectiveCourse.findByIdAndDelete(id);
    res.status(200).json({ message: "Elective deleted successfully", id });
  } catch (error) {
    console.error("Error deleting elective:", error);
    res.status(500).json({ message: "Server error while deleting elective." });
  }
};