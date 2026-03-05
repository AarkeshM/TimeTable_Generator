import mongoose from "mongoose";

const manualAllocationSchema = new mongoose.Schema({
  year: {
    type: String,
    required: true,
    enum: ["I", "II", "III", "IV"]
  },
  section: {
    type: String,
    required: true,
    enum: ["A", "B", "C", "D"]
  },
  day: {
    type: String,
    required: true,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  },
  period: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course", // Links to the Course
    required: true,
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });

// Constraint 1: A specific Class (Year-Sec) cannot have two subjects at the exact same time.
manualAllocationSchema.index({ year: 1, section: 1, day: 1, period: 1 }, { unique: true });

// Constraint 2: A Staff member cannot be in two places at once (Optional, handled in controller usually, but good for DB safety)
// manualAllocationSchema.index({ staffId: 1, day: 1, period: 1 }, { unique: true });

export default mongoose.model("ManualAllocation", manualAllocationSchema);