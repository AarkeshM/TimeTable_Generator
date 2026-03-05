import mongoose from "mongoose";

const ElectiveAllocationSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    // CRITICAL UPDATE: Must match the model name of your elective course file
    ref: "ElectiveCourse", 
    required: true,
  },
  year: {
    type: String, 
    required: true,
  },
  section: {
    type: String, 
    required: true,
  },
  periods: {
    type: Number, 
    required: true,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true,
  }
}, { timestamps: true });

// Prevent duplicate assignment
ElectiveAllocationSchema.index({ staffId: 1, courseId: 1, section: 1, year: 1 }, { unique: true });

export default mongoose.model("ElectiveAllocation", ElectiveAllocationSchema); 