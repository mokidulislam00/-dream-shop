import { Router } from "express";

import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage,
} from "../controllers/product.controller";

import {
  authenticate,
  requireAdmin,
} from "../middleware/auth.middleware";

import validate from "../middleware/validate";
import upload, { validateImageSignatures } from "../middleware/upload.middleware";

import {
  createProductSchema,
  updateProductSchema,
} from "../utils/product.validation";

const router = Router();

// Public routes
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Admin-only: Upload product images
router.post(
  "/:id/images",
  authenticate,
  requireAdmin,
  upload.array("images", 5),
  validateImageSignatures,
  uploadProductImages
);

// Admin-only: Delete a specific product image
router.delete(
  "/:id/images/:imageIndex",
  authenticate,
  requireAdmin,
  deleteProductImage
);

// Admin-only: Create product
router.post(
  "/",
  authenticate,
  requireAdmin,
  validate(createProductSchema),
  createProduct
);

// Admin-only: Update product
router.patch(
  "/:id",
  authenticate,
  requireAdmin,
  validate(updateProductSchema),
  updateProduct
);

// Admin-only: Delete product and its Cloudinary images
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  deleteProduct
);

export default router;
