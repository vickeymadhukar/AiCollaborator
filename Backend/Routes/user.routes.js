import { Router } from "express";
import * as userController from "../controller/user.controller.js";
import { body } from "express-validator";
import { authUser } from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/register",
  body("email").isEmail(),
  body("password").isLength({ min: 3 }),
  userController.createUsercontroller
);

router.post(
  "/login",
  body("email").isEmail(),
  body("password").isLength({ min: 3 }),
  userController.loginuserController
);

router.get("/profile", authUser, userController.ProfileController);
router.get("/logout", authUser, userController.logoutController);
router.get("/all", authUser, userController.getalluser);
export default router;
