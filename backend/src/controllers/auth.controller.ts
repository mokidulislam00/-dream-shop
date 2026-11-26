import { Request, Response } from "express";
import bcrypt from "bcryptjs";

import User from "../models/User";
import { RegisterInput, LoginInput } from "../utils/validation";
import {
  sendAuthCookie,
  clearAuthCookie,
  formatUserResponse,
} from "../utils/user.helpers";
import { sendEmail } from "../utils/email.helpers";
import { welcomeEmailTemplate } from "../templates/email.templates";

// Register new customer
export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { fullName, email, password } = req.body as RegisterInput;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: "customer",
    });

    // Send the Welcome Email without allowing email delivery failure
    // to roll back a successfully created customer account.
    try {
      await sendEmail({
        to: user.email,
        subject: "Welcome to Dream Shop!",
        html: welcomeEmailTemplate(user.fullName),
        text: `Hi ${user.fullName},

Welcome to Dream Shop!

Your account has been created successfully.

Thank you for joining our shopping community.

Best Regards,
Dream Shop Team`,
      });

      console.log(`[EMAIL] Welcome email sent to ${user.email}`);
    } catch (emailError) {
      console.error("[EMAIL] Welcome email delivery failed:", emailError);
    }

    // Send authentication cookie using the shared cookie configuration.
    sendAuthCookie(
      res,
      user._id.toString(),
      user.tokenVersion
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully",
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

    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create account",
    });
  }
};

// Login user
export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body as LoginInput;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    if (user.accountStatus !== "active") {
      res.status(403).json({
        success: false,
        message: "Your account is blocked",
      });
      return;
    }

    sendAuthCookie(
      res,
      user._id.toString(),
      user.tokenVersion
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to login",
    });
  }
};

// Logout user
export const logout = (
  _req: Request,
  res: Response
): void => {
  clearAuthCookie(res);

  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

// Get current authenticated user
export const getMe = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = res.locals.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error("Get current user error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve user information",
    });
  }
};
