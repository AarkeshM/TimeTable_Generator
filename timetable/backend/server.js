import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// Import Routes
import authRoutes from "./routes/auth.routes.js";
import courseRoutes from "./routes/course.routes.js";
import staffRoutes from "./routes/staff.routes.js";

dotenv.config();
const app = express();

// --- Middleware ---
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// --- MongoDB Connection ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/staff", staffRoutes);

// --- Test Route ---
app.get("/", (req, res) => res.send("API Running"));

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
