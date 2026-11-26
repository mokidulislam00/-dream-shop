
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

import {
  getAdminProducts,
  getAdminProductById,
  getAdminCategories,
  getAdminCategoryById,
} from "../controllers/adminCatalog.controller";

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

// Get all products (every status) with search, filters and pagination
router.get(
  "/products",
  authenticate,
  requireAdmin,
  getAdminProducts
);

// Get a single product of any status
router.get(
  "/products/:id",
  authenticate,
  requireAdmin,
  getAdminProductById
);

// Get all categories (every status) with search, filter and pagination
router.get(
  "/categories",
  authenticate,
  requireAdmin,
  getAdminCategories
);

// Get a single category of any status
router.get(
  "/categories/:id",
  authenticate,
  requireAdmin,
  getAdminCategoryById
);

export default router;
