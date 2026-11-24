
import { Router } from "express";

import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../controllers/wishlist.controller";

import { authenticate } from "../middleware/auth.middleware";
import validate from "../middleware/validate";

import { addToWishlistSchema } from "../utils/wishlist.validation";

const router = Router();

// All wishlist routes require authentication
router.use(authenticate);

// Get logged-in user's wishlist
router.get("/", getWishlist);

// Add product to wishlist
router.post(
  "/",
  validate(addToWishlistSchema),
  addToWishlist
);

// Remove product from wishlist
router.delete("/:productId", removeFromWishlist);

export default router;
