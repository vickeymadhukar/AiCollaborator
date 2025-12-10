// ...existing imports...
import userModel from "../models/user.model.js";
import * as services from "../services/user.service.js";
import { validationResult } from "express-validator";
import redisClient from "../services/redis.service.js";

// ===================== REGISTER CONTROLLER =====================
export const createUsercontroller = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: errors.array(),
    });
  }

  try {
    const userData = req.body;
    const existingUser = await userModel.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists. Please log in or use another email.",
      });
    }

    const newUser = await services.createUser(userData);

    const token =
      typeof newUser?.Jwttoken === "function" ? await newUser.Jwttoken() : null;

    const userObj = newUser?.toObject ? newUser.toObject() : { ...newUser };
    if (userObj?.password) delete userObj.password;

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // set to true in production (HTTPS)
      sameSite: "lax", // or "none" if cross-origin
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: userObj,
      token,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// ===================== LOGIN CONTROLLER =====================
export const loginuserController = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: errors.array(),
    });
  }

  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      return res
        .status(401)
        .json({ success: false, errors: "Invalid credentials" });
    }

    const isMatch = await user.isValidpassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, errors: "Invalid credentials" });
    }

    // Generate JWT token
    const token =
      typeof user?.Jwttoken === "function" ? await user.Jwttoken() : null;

    const userObj = user.toObject ? user.toObject() : { ...user };
    if (userObj.password) delete userObj.password;

    // ✅ Store token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // true in production
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: userObj,
      token,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// ===================== PROFILE CONTROLLER =====================
export const ProfileController = async (req, res) => {
  res.status(200).json({
    user: req.user,
  });
};

// ===================== LOGOUT CONTROLLER =====================
export const logoutController = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token)
      return res
        .status(400)
        .json({ success: false, message: "No token provided" });

    // blacklist token in redis
    if (redisClient.set && redisClient.set.length) {
      await redisClient.set(token, "logout", "EX", 60 * 60 * 24);
    } else {
      redisClient.set(token, "logout", "EX", 60 * 60 * 24);
    }

    // ✅ clear cookie on logout
    res.clearCookie("token");

    return res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(400).send(err.message);
  }
};

export const getalluser = async (req, res) => {
  try {
    const loggedInUser = await userModel.findOne({ email: req.user.email });
    const alluser = await services.getallusers({ userId: loggedInUser._id });
    res.status(200).json({
      success: true,
      users: alluser,
    });
  } catch (err) {
    console.error("Get all users error:", err);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
