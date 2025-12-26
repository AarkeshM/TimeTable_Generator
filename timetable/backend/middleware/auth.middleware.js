// middleware.js - UPDATED WITH DEBUGGING
import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  console.log("🔐 PROTECT MIDDLEWARE TRIGGERED");
  console.log("📨 Request Method:", req.method);
  console.log("🔗 Request URL:", req.originalUrl);
  console.log("📋 Headers:", req.headers);

  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    console.log("❌ No authorization header or invalid format");
    return res.status(401).json({ message: "Not authorized" });
  }

  const token = auth.split(" ")[1];
  console.log("✅ Token found:", token ? "Yes" : "No");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔓 Token decoded successfully:", decoded);

   
    req.user = {
      id: decoded.id,
      role: decoded.role || null
    };

    console.log("👤 User set in request:", req.user);
    next();
  } catch (err) {
    console.log("❌ Token verification failed:", err.message);
    return res.status(401).json({ message: "Token invalid" });
  }
};