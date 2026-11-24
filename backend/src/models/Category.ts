
import mongoose, { Document, Schema, Types } from "mongoose";

// Category status
export type CategoryStatus = "active" | "inactive";

// Category interface
export interface ICategory extends Document {
  name: string;
  description?: string;
  image?: string;
  slug: string;
  parentCategory?: Types.ObjectId | null;
  status: CategoryStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Category schema
const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      minlength: [2, "Category name must be at least 2 characters"],
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

   image: {
  type: String,
  trim: true,
  validate: {
    validator: (value: string | undefined) =>
      !value || /^https?:\/\/.+/i.test(value),
    message: "Please provide a valid image URL",
  },
},

    slug: {
      type: String,
      required: [true, "Category slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug can only contain lowercase letters, numbers, and hyphens",
      ],
    },

   parentCategory: {
  type: Schema.Types.ObjectId,
  ref: "Category",
  default: null,
},
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Database indexes
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ status: 1 });
categorySchema.index({ createdAt: -1 });

// Category model
const Category = mongoose.model<ICategory>(
  "Category",
  categorySchema
);

export default Category;
