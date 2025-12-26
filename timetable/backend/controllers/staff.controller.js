import User from "../models/User.js"; 
import StaffAllocation from "../models/StaffAllocation.js";
import bcrypt from "bcryptjs";
// ---------------------------------------------------
// GET ALL STAFF (YOUR EXISTING FUNCTION)
// ---------------------------------------------------
export const getStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: "staff" }).select("-password");
    res.json({ staff });
  } catch (err) {
    console.error("Failed to fetch staff:", err);
    res.status(500).json({ message: "Failed to fetch staff" });
  }
};

// ---------------------------------------------------
// GET LOGGED-IN STAFF PROFILE
// ---------------------------------------------------
export const getStaffProfile = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware

    const user = await User.findById(userId).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json(user);
  } catch (error) {
    console.error("Failed to fetch staff profile:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ---------------------------------------------------
// UPDATE STAFF PROFILE
// ---------------------------------------------------
export const updateStaffProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const updated = await User.findByIdAndUpdate(
      userId,
      {
        name: req.body.name,
        mobile: req.body.mobile,
        email: req.body.email,
        department: req.body.department,
        gender: req.body.gender,
      },
      { new: true }
    ).select("-password");

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updated,
    });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ---------------------------------------------------
// REGISTER NEW STAFF (ADD FACULTY)
// ---------------------------------------------------
export const registerStaff = async (req, res) => {
  try {
    const { name, email, mobile, department } = req.body;

    // Basic validation
    if (!name || !email || !mobile || !department) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if staff already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Faculty already exists" });
    }

    // Default password
    const defaultPassword = "123456";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create new staff user
    const staff = await User.create({
      name,
      email,
      mobile,
      department,
      role: "staff",
      password: hashedPassword,
    });

    // Remove password before sending response
    const response = staff.toObject();
    delete response.password;

    return res.status(201).json(response);

  } catch (error) {
    console.error("Failed to register staff:", error);
    return res.status(500).json({ message: "Failed to register faculty" });
  }
};

// ---------------------------------------------------
// ASSIGN STAFF TO COURSE
// ---------------------------------------------------
export const assignStaff = async (req, res) => {
  try {
    const { staffId, courseId, department, year, semester } = req.body;

    if (!staffId || !courseId || !department || !year || !semester) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Prevent duplicate allocation
    const exists = await StaffAllocation.findOne({
      staff: staffId,
      course: courseId,
      year,
      semester,
    });

    if (exists) {
      return res.status(400).json({ message: "Allocation already exists" });
    }

    const allocation = await StaffAllocation.create({
      staff: staffId,
      course: courseId,
      department,
      year,
      semester,
    });

    res.status(201).json(allocation);

  } catch (error) {
    console.error("Staff allocation error:", error);
    res.status(500).json({ message: "Failed to allocate staff" });
  }
};

// ---------------------------------------------------
// GET ALLOCATIONS BY STAFF
// ---------------------------------------------------
export const getAllocationsByStaff = async (req, res) => {
  try {
    const { staffId } = req.params;

    const allocations = await StaffAllocation.find({ staff: staffId })
      .populate("course", "name code")
      .populate("staff", "name email");

    res.json({ allocations });
  } catch (error) {
    console.error("Fetch allocations error:", error);
    res.status(500).json({ message: "Failed to fetch allocations" });
  }
};

// ---------------------------------------------------
// DELETE ALLOCATION
// ---------------------------------------------------
export const deleteAllocation = async (req, res) => {
  try {
    await StaffAllocation.findByIdAndDelete(req.params.id);
    res.json({ message: "Allocation removed" });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove allocation" });
  }
};
