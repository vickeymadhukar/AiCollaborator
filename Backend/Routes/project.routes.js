import * as projectController from "../controller/project.controller.js";
import { body } from "express-validator";
import { Router } from "express";
import { authUser } from "../middleware/auth.middleware.js";
const router = Router();

router.post(
  "/create",
  authUser,
  body("name").isString().notEmpty().withMessage("Project name is required"),
  projectController.createProjectController
);

router.get("/all", authUser, projectController.getAllProjects);

router.put(
  "/add-user",
  authUser,
  body("projectId").isMongoId().withMessage("Valid project ID is required"),
  body("users")
    .optional()
    .isArray()
    .withMessage("Users must be an array of strings"),

  projectController.addusertoProject
);

router.get(
  "/get-project/:projectId",
  authUser,
  projectController.getProjectById
);

router.post(
  "/invite",
  authUser,
  body("projectId").isMongoId().withMessage("Valid project ID is required"),
  body("receiverId").isMongoId().withMessage("Valid receiver ID is required"),
  projectController.inviteUser
);

router.get(
  "/invitations",
  authUser,
  projectController.getInvitations
);

router.post(
  "/invitations/:invitationId/accept",
  authUser,
  projectController.acceptInvite
);

router.post(
  "/invitations/:invitationId/reject",
  authUser,
  projectController.rejectInvite
);

export default router;
