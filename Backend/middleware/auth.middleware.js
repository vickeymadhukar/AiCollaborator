import jwt from "jsonwebtoken";
import redisClient from "../services/redis.service.js";

export const authUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No authentication token provided",
      });
    }

    // Check if token is blacklisted
    const isBlacklisted = await redisClient.get(token);
    if (isBlacklisted) {
      if (req.cookies?.token) {
        res.clearCookie("token");
      }
      return res.status(401).json({
        success: false,
        error: "Token is no longer valid",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.SECRET_KEY || process.env.SCERECT_KEY
    );
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }

    // Add user info to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      error: "Authentication failed",
    });
  }
};
