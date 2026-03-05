import Course from "../models/Course.js";
import mongoose from "mongoose";

// --- ADD COURSE ---
export const addCourse = async (req, res) => {
    try {
        const { name, code, acronym, year, staffId } = req.body;

        // 1. Basic Validation
        if (!name || !code || !acronym || !year) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // 2. CHECK DUPLICATES (Scoped to User)
        // This ensures the LOGGED IN user hasn't already added this code.
        const existing = await Course.findOne({ 
            code: code, 
            CreatedBy: req.user.id 
        });

        if (existing) {
            return res.status(400).json({ message: "You have already added this course code." });
        }

        console.log("Creating course for User:", req.user?.id);

        // 3. Create Course
        const course = await Course.create({
            name,
            code,
            acronym,
            year,
            // Use staffId passed from frontend, or fallback to the logged-in user ID
            staffId: staffId || req.user.id, 
            CreatedBy: req.user.id 
        });

        res.status(201).json({ message: "Course added successfully", course });

    } catch (error) {
        console.error("❌ Add Course Error:", error);
        
        // Specific handling for MongoDB Duplicate Key Error (Just in case)
        if (error.code === 11000) {
             return res.status(400).json({ message: "A technical duplicate error occurred. Please check your database indexes." });
        }

        res.status(500).json({ message: "Server error while adding course." });
    }
};

// --- GET COURSES ---
export const getCourse = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        let query = {};
        // If not admin, only show courses created by this user
        if (req.user.role !== "admin") {
            query = { CreatedBy: req.user.id };
        }

        const courses = await Course.find(query)
            .populate("CreatedBy", "name email")
            .populate("staffId", "name email");

        res.status(200).json({
            count: courses.length,
            courses,
        });
    } catch (error) {
        console.error("Get Courses Error:", error);
        res.status(500).json({ message: "Server error while fetching courses" });
    }
};

// --- UPDATE COURSE ---
export const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, acronym, year } = req.body;

        // 1. Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid Course ID format." });
        }

        // 2. Find the existing course
        const course = await Course.findById(id);

        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }

        // 3. Authorization Check
        // Only the Creator or an Admin can update
        const loggedUserId = req.user.id.toString();
        const courseCreatorId = course.CreatedBy?.toString();

        if (req.user.role !== 'admin' && courseCreatorId !== loggedUserId) {
            return res.status(403).json({ message: "You are not authorized to update this course." });
        }

        // 4. Check for Duplicate Code (Only if the code is being changed)
        // If the user is changing "CS101" to "CS102", make sure they don't ALREADY have "CS102".
        if (code && code !== course.code) {
            const existing = await Course.findOne({ 
                code: code, 
                CreatedBy: req.user.id 
            });

            if (existing) {
                return res.status(400).json({ message: "You already have another course with this code." });
            }
        }

        // 5. Perform Update
        const updatedCourse = await Course.findByIdAndUpdate(
            id,
            {
                name, 
                code, 
                acronym, 
                year
            },
            { new: true, runValidators: true } // Return the new document & run schema validations
        );

        res.status(200).json({ 
            message: "Course updated successfully", 
            course: updatedCourse 
        });

    } catch (error) {
        console.error("❌ Update Course Error:", error);
        
        if (error.code === 11000) {
             return res.status(400).json({ message: "Duplicate error: This course code might already exist." });
        }

        res.status(500).json({ message: "Server error while updating course." });
    }
};

// --- DELETE COURSE ---
export const deleteCourse = async (req, res) => {
    try {
        const courseId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ message: "Invalid Course ID format." });
        }

        const course = await Course.findById(courseId);
        
        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }

        const loggedUserId = req.user.id.toString(); 
        const courseCreatorId = course.CreatedBy?.toString();

        if (req.user.role !== 'admin' && courseCreatorId !== loggedUserId) {
            return res.status(403).json({ message: "You are not allowed to delete this course." });
        }

        await Course.findByIdAndDelete(courseId);

        return res.status(200).json({ message: "Course deleted successfully." });

    } catch (error) {
        console.error("Delete Course Error:", error);
        return res.status(500).json({ message: "Server error while deleting course." });
    }
};