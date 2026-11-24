
import { Router } from "express";

import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
} from "../controllers/review.controller";

import { authenticate } from "../middleware/auth.middleware";
import validate from "../middleware/validate";

import {
  createReviewSchema,
  updateReviewSchema,
} from "../utils/review.validation";

const router = Router();

// Public: Get reviews for a product
router.get(
  "/product/:productId",
  getProductReviews
);

// Authenticated: Create a review
router.post(
  "/",
  authenticate,
  validate(createReviewSchema),
  createReview
);

// Authenticated: Update own review
router.patch(
  "/:reviewId",
  authenticate,
  validate(updateReviewSchema),
  updateReview
);

// Authenticated: Delete own review
router.delete(
  "/:reviewId",
  authenticate,
  deleteReview
);

export default router;
