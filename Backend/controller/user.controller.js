// ...existing imports...
import userModel from "../models/user.model.js";
import * as services from "../services/user.service.js";
import { validationResult } from "express-validator";
import redisClient from "../services/redis.service.js";
import crypto from 'crypto';
import nodemailer from 'nodemailer';

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
      secure: true, // set to true in production (HTTPS)
      sameSite: "none", // or "none" if cross-origin
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
      secure: true, // true in production
      sameSite: "none",
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

// ===================== FORGOT PASSWORD CONTROLLER =====================
export const forgotPasswordController = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Please provide an email" });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "There is no user with that email" });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset url 
    // Fallback order: req.headers.origin -> process.env.FRONTEND_URL -> https://aicollaborator-1.onrender.com
    const frontendUrl = req.headers.origin || process.env.FRONTEND_URL || 'https://aicollaborator-1.onrender.com';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please open this link to reset your password: \n\n ${resetUrl}`;

    // Setup nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'vikasmadhukar1430@gmail.com',
        pass: process.env.APP_PASSWORD
      }
    });

    const mailOptions = {
      from: 'vikasmadhukar1430@gmail.com',
      to: user.email,
      subject: 'Password Reset Token',
      text: message
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: 'Email sent' });

  } catch (error) {
    console.error("Forgot password error: ", error);
    // Remove token fields if email fails
    const user = await userModel.findOne({ email });
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
    }
    return res.status(500).json({ success: false, message: 'Email could not be sent' });
  }
};

// ===================== RESET PASSWORD CONTROLLER =====================
export const resetPasswordController = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await userModel.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    // Set new password
    if (!req.body.password || req.body.password.length < 3) {
      return res.status(400).json({ success: false, message: 'Password is required and should be at least 3 characters long' });
    }

    user.password = await userModel.Hashpassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });

  } catch (error) {
    console.error("Reset password error: ", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
