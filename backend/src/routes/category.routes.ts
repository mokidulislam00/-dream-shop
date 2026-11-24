import { Router } from "express";

import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";

import {
  authenticate,
  requireAdmin,
} from "../middleware/auth.middleware";

import validate from "../middleware/validate";

import {
  createCategorySchema,
  updateCategorySchema,
} from "../utils/category.validation";

const router = Router();

// Public routes
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

// Admin-only routes
router.post(
  "/",
  authenticate,
  requireAdmin,
  validate(createCategorySchema),
  createCategory
);

router.patch(
  "/:id",
  authenticate,
  requireAdmin,
  validate(updateCategorySchema),
  updateCategory
);

router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  deleteCategory
);

export default router;