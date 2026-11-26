
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import Review from "../models/Review";
import Product from "../models/Product";
import Order from "../models/Order";

// Safely get authenticated user ID from res.locals
const getAuthenticatedUserId = (res: Response): string | null => {
  const user = res.locals.user as
    | {
        _id?: mongoose.Types.ObjectId | string;
        id?: string;
      }
    | undefined;

  const userId = user?._id ?? user?.id;

  if (!userId) {
    return null;
  }

  const normalizedUserId = String(userId);

  return mongoose.isValidObjectId(normalizedUserId)
    ? normalizedUserId
    : null;
};

// Create Review
export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(res);
    const { productId, rating, comment } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    if (
      typeof productId !== "string" ||
      !mongoose.isValidObjectId(productId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const product = await Product.findOne({
      _id: productId,
      status: "active",
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found or inactive",
      });
      return;
    }

    const existingReview = await Review.findOne({
      user: userId,
      product: productId,
    });

    if (existingReview) {
      res.status(409).json({
        success: false,
        message: "You have already reviewed this product",
      });
      return;
    }

    // Verify delivered and paid purchase
    const verifiedPurchase = await Order.exists({
      user: userId,
      "items.product": new mongoose.Types.ObjectId(productId),
      orderStatus: "delivered",
      paymentStatus: "paid",
    });

    await Review.create({
      user: userId,
      product: productId,
      rating,
      comment,
      isVerifiedPurchase: Boolean(verifiedPurchase),
    });

    const review = await Review.findOne({
      user: userId,
      product: productId,
    }).populate("user", "fullName");

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      res.status(409).json({
        success: false,
        message: "You have already reviewed this product",
      });
      return;
    }

    next(error);
  }
};

// Get Product Reviews
export const getProductReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const productId = req.params.productId;

    if (
      typeof productId !== "string" ||
      !mongoose.isValidObjectId(productId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const page = Math.max(1, Number(req.query.page) || 1);

    const limit = Math.min(
      50,
      Math.max(1, Number(req.query.limit) || 10)
    );

    const skip = (page - 1) * limit;

    const product = await Product.findById(productId);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    const [reviews, totalReviews, ratingStats] = await Promise.all([
      Review.find({ product: productId })
        .populate("user", "fullName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Review.countDocuments({ product: productId }),

      Review.aggregate([
        {
          $match: {
            product: new mongoose.Types.ObjectId(productId),
          },
        },
        {
          $group: {
            _id: null,
            averageRating: {
              $avg: "$rating",
            },
            totalReviews: {
              $sum: 1,
            },
          },
        },
      ]),
    ]);

    const averageRating = ratingStats[0]?.averageRating ?? 0;

    res.status(200).json({
      success: true,
      totalReviews,
      averageRating: Number(averageRating.toFixed(1)),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        pageSize: limit,
      },
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// Update Own Review
export const updateReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(res);
    const reviewId = req.params.reviewId;
    const { rating, comment } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    if (
      typeof reviewId !== "string" ||
      !mongoose.isValidObjectId(reviewId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
      return;
    }

    if (rating === undefined && comment === undefined) {
      res.status(400).json({
        success: false,
        message: "Provide rating or comment to update",
      });
      return;
    }

    const updateData: {
      rating?: number;
      comment?: string;
    } = {};

    if (rating !== undefined) {
      updateData.rating = rating;
    }

    if (comment !== undefined) {
      updateData.comment = comment;
    }

    const review = await Review.findOneAndUpdate(
      {
        _id: reviewId,
        user: userId,
      },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("user", "fullName");

    if (!review) {
      res.status(404).json({
        success: false,
        message: "Review not found or you are not authorized",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Own Review
export const deleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(res);
    const reviewId = req.params.reviewId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    if (
      typeof reviewId !== "string" ||
      !mongoose.isValidObjectId(reviewId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
      return;
    }

    const review = await Review.findOneAndDelete({
      _id: reviewId,
      user: userId,
    });

    if (!review) {
      res.status(404).json({
        success: false,
        message: "Review not found or you are not authorized",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
