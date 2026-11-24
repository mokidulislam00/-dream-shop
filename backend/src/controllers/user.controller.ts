import { Request, Response } from "express";
import bcrypt from "bcryptjs";

import User, { IUser } from "../models/User";

import {
  UpdateProfileInput,
  ChangePasswordInput,
} from "../utils/user.validation";

import { sendAuthCookie } from "../utils/user.helpers";

// ==========================================
// SAFE USER RESPONSE
// ==========================================

const formatUserResponse = (user: IUser) => ({
  id: user._id.toString(),
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  accountStatus: user.accountStatus,
});

// ==========================================
// GET CUSTOMER PROFILE
// GET /api/users/profile
// ==========================================

export const getProfile = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = res.locals.user as IUser;

    const user = await User.findById(authenticatedUser._id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve profile",
    });
  }
};

// ==========================================
// UPDATE CUSTOMER PROFILE
// PATCH /api/users/profile
// ==========================================

export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = res.locals.user as IUser;

    const { fullName, email } =
      req.body as UpdateProfileInput;

    const user = await User.findById(authenticatedUser._id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Check duplicate email
    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: "An account with this email already exists",
        });
        return;
      }

      user.email = email;
    }

    // Update full name
    if (fullName !== undefined) {
      user.fullName = fullName;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: formatUserResponse(user),
    });
  } catch (error) {
    const mongoError = error as { code?: number };

    if (mongoError.code === 11000) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
      return;
    }

    console.error("Update profile error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update profile",
    });
  }
};

// ==========================================
// CHANGE CUSTOMER PASSWORD
// PATCH /api/users/change-password
// ==========================================

export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = res.locals.user as IUser;

    const { currentPassword, newPassword } =
      req.body as ChangePasswordInput;

    const user = await User.findById(
      authenticatedUser._id
    ).select("+password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
      return;
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 12);

    // Invalidate previously issued JWT tokens
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    await user.save();

    // Issue a new token for the current device using shared cookie settings.
    sendAuthCookie(
      res,
      user._id.toString(),
      user.tokenVersion
    );

    res.status(200).json({
      success: true,
      message:
        "Password changed successfully. Other active sessions have been logged out.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to change password",
    });
  }
};
