import User from "../models/User.js"; // your Mongoose User model

export const getStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: "staff" }).select("_id name email");
    res.json({ staff });
  } catch (err) {
    console.error("Failed to fetch staff:", err);
    res.status(500).json({ message: "Failed to fetch staff" });
  }
};
