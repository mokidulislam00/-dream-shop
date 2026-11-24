
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import User, { IUser } from "../models/User";

// Admin user filter type
type AdminUserFilter = {
  $or?: Array<{
    fullName?: RegExp;
    email?: RegExp;
  }>;
  role?: "customer" | "admin";
  accountStatus?: "active" | "blocked";
};

// Parse positive integer query parameters
const parsePositiveInteger = (
  value: unknown,
  fallback: number
): number => {
  if (typeof value !== "string") {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : fallback;
};

// Escape special regex characters for safe searching
const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Validate user ID
const isValidUserId = (userId: unknown): userId is string => {
  return (
    typeof userId === "string" &&
    mongoose.isValidObjectId(userId)
  );
};

// Get All Users with Search, Filter and Pagination
export const getAdminUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parsePositiveInteger(req.query.page, 1);

    const requestedLimit = parsePositiveInteger(
      req.query.limit,
      10
    );

    const limit = Math.min(requestedLimit, 50);
    const skip = (page - 1) * limit;

    const filter: AdminUserFilter = {};

    // Search by full name or email
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim().slice(0, 100)
        : "";

    if (search) {
      const searchRegex = new RegExp(
        escapeRegex(search),
        "i"
      );

      filter.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
      ];
    }

    // Filter by user role
    const role = req.query.role;

    if (typeof role === "string" && role.length > 0) {
      if (role !== "customer" && role !== "admin") {
        res.status(400).json({
          success: false,
          message: "Invalid user role filter",
        });
        return;
      }

      filter.role = role;
    }

    // Filter by account status
    const accountStatus = req.query.accountStatus;

    if (
      typeof accountStatus === "string" &&
      accountStatus.length > 0
    ) {
      if (
        accountStatus !== "active" &&
        accountStatus !== "blocked"
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid account status filter",
        });
        return;
      }

      filter.accountStatus = accountStatus;
    }

    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      pagination: {
        totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        pageSize: limit,
      },
      users,
    });
  } catch (error) {
    next(error);
  }
};

// Get Single User Details
export const getAdminUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.userId;

    if (!isValidUserId(userId)) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
      return;
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Block or Unblock Customer Account
export const updateCustomerStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const accountStatus: unknown = req.body?.accountStatus;

    if (!isValidUserId(userId)) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
      return;
    }

    if (
      accountStatus !== "active" &&
      accountStatus !== "blocked"
    ) {
      res.status(400).json({
        success: false,
        message: "Account status must be active or blocked",
      });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Prevent changing admin accounts
    if (user.role !== "customer") {
      res.status(403).json({
        success: false,
        message: "Admin accounts cannot be modified here",
      });
      return;
    }

    user.accountStatus = accountStatus;

    await user.save();

    res.status(200).json({
      success: true,
      message:
        accountStatus === "blocked"
          ? "Customer account blocked successfully"
          : "Customer account unblocked successfully",
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};
