import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    mobile: { type: String },
    email: { type: String, required: true, unique: true },
    department: { type: String },
    role: { type: String, enum: ["admin", "staff"], default: "staff" },
    gender: { type: String },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
