import userModel from "../models/user.model.js";
import * as projectService from "../services/project.service.js";
import { validationResult } from "express-validator";

export const createProjectController = async (req, res) => {
  // Fix validation variable name
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: errors.array(),
    });
  }

  try {
    const { name } = req.body;
    const loggedInUser = await userModel.findOne({ email: req.user.email });

    if (!loggedInUser) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const newProject = await projectService.createProject(
      name,
      loggedInUser._id
    );

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project: newProject,
    });
  } catch (err) {
    console.error("Create project error:", err);
    if (err.status === 409) {
      return res.status(409).json({
        success: false,
        message: err.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const getAllProjects = async (req, res) => {
  try {
    const loggedInUser = await userModel.findOne({ email: req.user.email });
    if (!loggedInUser) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const alluserproject = await projectService.getAllProjectsbyuserID(
      loggedInUser._id
    );
    res.status(200).json({
      success: true,
      message: "Projects fetched successfully",
      projects: alluserproject,
    });
  } catch (err) {
    console.error("Get all projects error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const addusertoProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: errors.array(),
    });
  }

  try {
    const { projectId, users } = req.body;

    const updatedProject = await projectService.addUsertoProject(
      projectId,
      users
    );
    res.status(200).json({
      success: true,
      message: "Users added to project successfully",
      project: updatedProject,
    });
  } catch (err) {
    console.error("Add user to project error:", err);
    res.status(400).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await projectService.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Project fetched successfully",
      project,
    });
  } catch (err) {
    console.error("Get project by ID error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
