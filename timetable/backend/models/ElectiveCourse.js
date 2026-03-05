import mongoose from "mongoose";

const electiveCourseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  acronym: { type: String, required: true },
  year: { type: String, required: true }, // e.g., "III" or "IV"
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Optional initial assignment
  CreatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // If staff creates it
}, { timestamps: true });

export default mongoose.model("ElectiveCourse", electiveCourseSchema);