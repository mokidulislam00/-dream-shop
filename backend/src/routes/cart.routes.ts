import { Router } from "express";

import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cart.controller";

import {
  authenticate,
} from "../middleware/auth.middleware";

import validate from "../middleware/validate";

import {
  addToCartSchema,
  updateCartItemSchema,
} from "../utils/cart.validation";

const router = Router();

// All cart routes require authentication
router.use(authenticate);

// Get logged-in user's cart
router.get("/", getCart);

// Add product to cart
router.post(
  "/",
  validate(addToCartSchema),
  addToCart
);

// Update product quantity
router.patch(
  "/:id",
  validate(updateCartItemSchema),
  updateCartItem
);

// Remove product from cart
router.delete("/:id", removeFromCart);

// Clear entire cart
router.delete("/", clearCart);

export default router;