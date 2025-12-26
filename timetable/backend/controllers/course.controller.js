import Course from "../models/Course.js";
import mongoose from "mongoose";

// --- ADD COURSE ---
export const addCourse = async (req, res) => {
    try {
        const { name, code, acronym, year } = req.body;

        if (!name || !code || !acronym || !year) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Check if course code already exists
        const existing = await Course.findOne({ code });
        if (existing) {
            return res.status(400).json({ message: "Course code already exists." });
        }

        console.log("Creating course for User:", req.user?.id);

        const course = await Course.create({
            name,
            code,
            acronym,
            year,
            // ✅ CHANGED: Uses req.user.id now
            CreatedBy: req.user.id 
        });

        res.status(201).json({ message: "Course added successfully", course });
    } catch (error) {
        console.error("Add Course Error:", error);
        res.status(500).json({ message: "Server error while adding course." });
    }
};

// --- GET COURSES (UPDATED FOR ADMIN ACCESS) ---
export const getCourse = async (req, res) => {
    try {
        // 1. Security Check
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized. User information missing." });
        }

        console.log(`Fetching courses. User: ${req.user.name}, Role: ${req.user.role}`);

        // 2. DEFINE QUERY BASED ON ROLE
        let query = {};

        // If the user is NOT an admin, restrict them to their own courses.
        // If the user IS an admin, 'query' remains empty {}, which fetches ALL courses.
        if (req.user.role !== "admin") {
            query = { CreatedBy: req.user.id };
        }

        // 3. Fetch courses
        // .populate("CreatedBy", "name") is important so the Admin sees WHO created the course
        const courses = await Course.find(query).populate("CreatedBy", "name email");

        if (!courses || courses.length === 0) {
            return res.status(200).json({ message: "No courses found.", courses: [] });
        }

        res.status(200).json({ 
            count: courses.length,
            courses 
        });
        
    } catch (error) {
        console.error("Get Courses Error:", error);
        res.status(500).json({ message: "Server error while fetching courses." });
    }
};

// --- DELETE COURSE ---
export const deleteCourse = async (req, res) => {
    console.log("🗑️ DELETE COURSE ENDPOINT HIT");
    console.log("👤 User from middleware:", req.user);
    console.log("🎯 Course ID to delete:", req.params.id);

    try {
        const courseId = req.params.id;

        // 1. INPUT VALIDATION
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            console.log("❌ Invalid course ID format");
            return res.status(400).json({ message: "Invalid Course ID format." });
        }

        // 2. AUTHENTICATION CHECK
        // ✅ CHANGED: Checks for req.user.id
        if (!req.user || !req.user.id) {
            console.log("❌ Authentication failed - no user found");
            return res.status(401).json({ message: "Authentication required." });
        }

        // Get the course to check existence and creator
        const course = await Course.findById(courseId);
        
        // 3. EXISTENCE CHECK
        if (!course) {
            console.log("❌ Course not found in database");
            return res.status(404).json({ message: "Course not found." });
        }

        // 4. AUTHORIZATION CHECK (Ownership)
        // ✅ CHANGED: Uses req.user.id
        const loggedUserId = req.user.id.toString(); 
        const courseCreatorId = course.CreatedBy?.toString();

        console.log(`Checking ownership: User ${loggedUserId} vs Creator ${courseCreatorId}`);

        if (courseCreatorId !== loggedUserId) {
            console.log("❌ Authorization failed - user doesn't own this course");
            return res.status(403).json({ message: "You are not allowed to delete this course." });
        }

        // 5. DELETE OPERATION
        await Course.findByIdAndDelete(courseId);

        console.log("✅ Course deleted successfully");
        return res.status(200).json({ message: "Course deleted successfully." });

    } catch (error) {
        console.error("❌ Delete Course Error:", error);
        return res.status(500).json({ message: "Server error while deleting course." });
    }
};