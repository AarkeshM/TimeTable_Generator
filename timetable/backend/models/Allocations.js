import mongoose from "mongoose";

const AllocationSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Links to the Faculty Member
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course", // Links to the Course
    required: true,
  },
  year: {
    type: String, // I, II, III, IV
    required: true,
  },
  section: {
    type: String, // A, B, C
    required: true,
  },
  periods: {
    type: Number, // e.g., 5 hours
    required: true,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Links to the Admin who did this
    required: true,
  }
}, { timestamps: true });

// Prevent duplicate assignment: Same Staff, Same Course, Same Section, Same Year
AllocationSchema.index({ staffId: 1, courseId: 1, section: 1, year: 1 }, { unique: true });

export default mongoose.model("Allocation", AllocationSchema);