import User from "../models/User.js";
import TimeTable from "../models/TimeTable.js"; // Using your TimeTable model
import Course from "../models/Course.js";     // Using your Course model

// @desc    Get List of all Staff/Faculty
// @route   GET /api/faculty-timetable/staff-list
export const getAllStaff = async (req, res) => {
  try {
    // Adjust 'role' based on your User model (e.g., 'staff', 'faculty', 'teacher')
    const staffMembers = await User.find({ role: { $in: ["staff", "faculty"] } })
      .select("name email department")
      .sort({ name: 1 });

    res.status(200).json(staffMembers);
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ message: "Server Error fetching staff list" });
  }
};

export const getFacultySchedule = async (req, res) => {
  try {
    const { staffId } = req.params;

    // Fetch entries where this staff member is assigned
    const schedule = await TimeTable.find({ staffId: staffId })
      .populate("courseId", "name code") // Get Course Name & Code
      .select("day period year section room courseId") // Ensure we get Year & Section
      .sort({ day: 1, period: 1 });

    res.status(200).json(schedule);
  } catch (error) {
    console.error("Error fetching faculty schedule:", error);
    res.status(500).json({ message: "Server Error fetching schedule" });
  }
};