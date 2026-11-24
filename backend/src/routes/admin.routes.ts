
import { Router } from "express";

import {
  authenticate,
  requireAdmin,
} from "../middleware/auth.middleware";

import {
  getAdminDashboard,
} from "../controllers/admin.controller";

import {
  getAdminUsers,
  getAdminUserById,
  updateCustomerStatus,
} from "../controllers/adminUser.controller";

const router = Router();

// Admin dashboard with analytics
router.get(
  "/dashboard",
  authenticate,
  requireAdmin,
  getAdminDashboard
);

// Get all users with search, filters and pagination
router.get(
  "/users",
  authenticate,
  requireAdmin,
  getAdminUsers
);

// Get single user details
router.get(
  "/users/:userId",
  authenticate,
  requireAdmin,
  getAdminUserById
);

// Block or unblock customer account
router.patch(
  "/users/:userId/status",
  authenticate,
  requireAdmin,
  updateCustomerStatus
);

export default router;
