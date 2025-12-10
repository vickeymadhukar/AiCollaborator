import Projectmodel from "../models/project.model.js";

export const createProject = async (name, userId) => {
  if (!name) {
    throw new Error("Project name is required");
  }
  if (!userId) {
    throw new Error("User ID is required to create a project");
  }

  try {
    const existing = await Projectmodel.findOne({ name, Users: userId });
    if (existing) {
      const err = new Error(
        "Project with this name already exists for this user"
      );
      err.status = 409;
      throw err;
    }

    const project = await Projectmodel.create({ name, Users: [userId] });
    return project;
  } catch (err) {
    // handle Mongo duplicate-key as a conflict
    if (err && err.code === 11000) {
      const e = new Error("Project with this name already exists");
      e.status = 409;
      throw e;
    }
    // rethrow other errors
    throw err;
  }
};

export const getAllProjectsbyuserID = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required to fetch projects");
  }
  try {
    const projects = await Projectmodel.find({ Users: userId });
    return projects;
  } catch (err) {
    throw err;
  }
};

export const addUsertoProject = async (projectId, userIds) => {
  if (!projectId) {
    throw new Error("Project ID is required");
  }
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new Error("At least one User ID is required to add to the project");
  }
  try {
    const project = await Projectmodel.findById(projectId);
    if (!project) {
      const err = new Error("Project not found");
      err.status = 404;
      throw err;
    }

    // Add only unique user IDs
    userIds.forEach((userId) => {
      if (!project.Users.includes(userId)) {
        project.Users.push(userId);
      }
    });

    await project.save();
    return project;
  } catch (err) {
    throw err;
  }
};

export const getProjectById = async (projectId) => {
  if (!projectId) {
    throw new Error("Project ID is required");
  }
  try {
    const project = await Projectmodel.findById(projectId).populate(
      "Users",
      "email"
    );
    return project;
  } catch (err) {
    throw err;
  }
};
