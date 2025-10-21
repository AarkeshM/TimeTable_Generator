import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const signToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET || "default_secret",
    { expiresIn: "7d" }
  );
};

export const register = async (req, res) => {
  try {
    const { name, mobile, email, department, role, gender, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      mobile,
      email,
      department,
      role: role || "staff",
      gender,
      password: hashedPassword,
    });

    await user.save();

    const token = signToken(user);

    const userSafe = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    console.log("✅ Registered User:", userSafe);
    return res.status(201).json({ message: "Registered", token, user: userSafe });
  } catch (err) {
    console.error("❌ Register error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);

    const userSafe = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return res.status(200).json({ message: "Login successful", token, user: userSafe });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};
