import Course from "../models/Course.js";
import mongoose from "mongoose";


// ================= ADD COURSE =================
export const addCourse = async (req, res) => {
    try {
        const { courseName, code, acronym, year, type } = req.body;

        // 1. Validation
        if (!courseName || !code || !acronym || !year || !type) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // 2. Check duplicate (per user)
        const existing = await Course.findOne({
            code,
            createdBy: req.user.id
        });

        if (existing) {
            return res.status(400).json({ message: "You already added this course code." });
        }

        // 3. Create course
        const course = await Course.create({
            courseName,
            code,
            acronym,
            year,
            type,
            status: "Pending", // default
            staffId: req.user.id,
            createdBy: req.user.id
        });

        res.status(201).json({
            message: "Course added successfully",
            course
        });

    } catch (error) {
        console.error("❌ Add Course Error:", error);
        res.status(500).json({ message: "Server error while adding course." });
    }
};



// ================= GET COURSES =================
export const getCourse = async (req, res) => {
    try {
        let query = {};

        // Staff → only their courses
        if (req.user.role !== "admin") {
            query = { createdBy: req.user.id };
        }

        const courses = await Course.find(query)
            .populate("createdBy", "name email")
            .populate("staffId", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: courses.length,
            courses
        });

    } catch (error) {
        console.error("Get Courses Error:", error);
        res.status(500).json({ message: "Server error while fetching courses" });
    }
};



// ================= UPDATE COURSE =================
export const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { courseName, code, acronym, year, type } = req.body;

        // 1. Validate ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid Course ID." });
        }

        // 2. Find course
        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }

        // 3. Authorization
        if (req.user.role !== "admin" && course.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to update." });
        }

        // 4. Duplicate check (if code changed)
        if (code && code !== course.code) {
            const existing = await Course.findOne({
                code,
                createdBy: req.user.id
            });

            if (existing) {
                return res.status(400).json({ message: "Duplicate course code." });
            }
        }

        // 5. Update
        const updatedCourse = await Course.findByIdAndUpdate(
            id,
            { courseName, code, acronym, year, type },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: "Course updated successfully",
            course: updatedCourse
        });

    } catch (error) {
        console.error("❌ Update Course Error:", error);
        res.status(500).json({ message: "Server error while updating course." });
    }
};



// ================= DELETE COURSE =================
export const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid Course ID." });
        }

        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }

        // Authorization
        if (req.user.role !== "admin" && course.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to delete." });
        }

        await Course.findByIdAndDelete(id);

        res.status(200).json({
            message: "Course deleted successfully."
        });

    } catch (error) {
        console.error("Delete Course Error:", error);
        res.status(500).json({ message: "Server error while deleting course." });
    }
};



// ================= ADMIN: UPDATE STATUS =================
export const updateCourseStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        if (!["Pending", "Approved", "Rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value." });
        }

        const course = await Course.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }

        res.status(200).json({
            message: `Course ${status.toLowerCase()} successfully`,
            course
        });

    } catch (error) {
        console.error("Status Update Error:", error);
        res.status(500).json({ message: "Failed to update status." });
    }
};