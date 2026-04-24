import Projectmodel from "../models/project.model.js";
import Invitation from "../models/invitation.model.js";

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

export const sendInvitation = async (projectId, senderId, receiverId) => {
  if (!projectId || !senderId || !receiverId) {
    throw new Error("Project ID, Sender ID, and Receiver ID are required");
  }

  try {
    const project = await Projectmodel.findById(projectId);
    if (!project) throw new Error("Project not found");

    if (project.Users.includes(receiverId)) {
      throw new Error("User is already a member of this project");
    }

    const existingInvite = await Invitation.findOne({
      project: projectId,
      receiver: receiverId,
      status: "pending",
    });

    if (existingInvite) {
      throw new Error("Invitation already sent");
    }

    const invitation = await Invitation.create({
      project: projectId,
      sender: senderId,
      receiver: receiverId,
    });

    return invitation;
  } catch (err) {
    throw err;
  }
};

export const getPendingInvitations = async (userId) => {
  if (!userId) throw new Error("User ID is required");
  try {
    const invitations = await Invitation.find({ receiver: userId, status: "pending" })
      .populate("project", "name description")
      .populate("sender", "name email");
    return invitations;
  } catch (err) {
    throw err;
  }
};

export const acceptInvitation = async (invitationId, userId) => {
  if (!invitationId || !userId) throw new Error("Invitation ID and User ID are required");
  try {
    const invitation = await Invitation.findOne({ _id: invitationId, receiver: userId, status: "pending" });
    if (!invitation) throw new Error("Invitation not found or already processed");

    invitation.status = "accepted";
    await invitation.save();

    const project = await Projectmodel.findById(invitation.project);
    if (project && !project.Users.includes(userId)) {
      project.Users.push(userId);
      await project.save();
    }

    return { invitation, project };
  } catch (err) {
    throw err;
  }
};

export const rejectInvitation = async (invitationId, userId) => {
  if (!invitationId || !userId) throw new Error("Invitation ID and User ID are required");
  try {
    const invitation = await Invitation.findOne({ _id: invitationId, receiver: userId, status: "pending" });
    if (!invitation) throw new Error("Invitation not found or already processed");

    invitation.status = "rejected";
    await invitation.save();

    return invitation;
  } catch (err) {
    throw err;
  }
};
