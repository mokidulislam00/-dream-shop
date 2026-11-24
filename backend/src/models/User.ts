
import mongoose, { Document, Schema } from "mongoose";

// User roles
export type UserRole = "customer" | "admin";

// Account status
export type AccountStatus = "active" | "blocked";

// User interface
export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  accountStatus: AccountStatus;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

// User schema
const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      maxlength: 128,
      select: false,
    },

    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },

    accountStatus: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },

    // Incremented after password changes to invalidate old JWTs
    tokenVersion: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Database indexes
userSchema.index({ role: 1 });
userSchema.index({ accountStatus: 1 });

// User model
const User = mongoose.model<IUser>("User", userSchema);

export default User;
