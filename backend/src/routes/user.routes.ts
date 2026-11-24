
import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware";
import validate from "../middleware/validate";

import {
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/user.controller";

import {
  updateProfileSchema,
  changePasswordSchema,
} from "../utils/user.validation";

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Get own profile
router.get("/profile", getProfile);

// Update own profile
router.patch(
  "/profile",
  validate(updateProfileSchema),
  updateProfile
);

// Change own password
router.patch(
  "/change-password",
  validate(changePasswordSchema),
  changePassword
);

export default router;
