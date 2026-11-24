
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import Wishlist from "../models/Wishlist";
import Product from "../models/Product";

// Get logged-in user's wishlist
export const getWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = res.locals.user.id;

    const wishlist = await Wishlist.findOne({
      user: userId,
    }).populate({
      path: "products",
      match: { status: "active" },
      populate: {
        path: "category",
        select: "name slug",
      },
    });

    res.status(200).json({
      success: true,
      wishlist: wishlist || {
        user: userId,
        products: [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add product to wishlist
export const addToWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = res.locals.user.id;
    const { productId } = req.body;

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

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: userId },
      {
        $addToSet: {
          products: product._id,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    ).populate({
      path: "products",
      match: { status: "active" },
      populate: {
        path: "category",
        select: "name slug",
      },
    });

    res.status(200).json({
      success: true,
      message: "Product added to wishlist successfully",
      wishlist,
    });
  } catch (error) {
    next(error);
  }
};

// Remove product from wishlist
export const removeFromWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = res.locals.user.id;
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

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: userId },
      {
        $pull: {
          products: new mongoose.Types.ObjectId(productId),
        },
      },
      {
        new: true,
      }
    ).populate({
      path: "products",
      match: { status: "active" },
      populate: {
        path: "category",
        select: "name slug",
      },
    });

    if (!wishlist) {
      res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist successfully",
      wishlist,
    });
  } catch (error) {
    next(error);
  }
};
