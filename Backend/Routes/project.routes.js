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

export default router;
