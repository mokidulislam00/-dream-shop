
import mongoose, { Document, Schema, Types } from "mongoose";

// Product status
export type ProductStatus = "active" | "inactive" | "out_of_stock";

// Product interface
export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: Types.ObjectId;
  images: string[];
  imagePublicIds: string[];
  brand?: string;
  sku: string;
  stock: number;
  status: ProductStatus;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Product schema
const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters"],
      maxlength: [150, "Product name cannot exceed 150 characters"],
    },

    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },

    discountPrice: {
      type: Number,
      min: [0, "Discount price cannot be negative"],
      validate: {
        validator: function (
          this: mongoose.HydratedDocument<IProduct>,
          value: number | undefined
        ) {
          if (value === undefined || value === null) return true;
          return value < this.price;
        },
        message: "Discount price must be lower than regular price",
      },
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required"],
    },

    // Product image URLs
    images: {
      type: [
        {
          type: String,
          trim: true,
        },
      ],
      default: [],
      validate: {
        validator: (images: string[]) =>
          images.every((image) => image.length > 0),
        message: "Product images cannot contain empty values",
      },
    },

    // Cloudinary public IDs (aligned with images array)
    imagePublicIds: {
      type: [
        {
          type: String,
          trim: true,
        },
      ],
      default: [],
    },

    brand: {
      type: String,
      trim: true,
      maxlength: [100, "Brand name cannot exceed 100 characters"],
    },

    sku: {
      type: String,
      required: [true, "Product SKU is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },

    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number",
      },
    },

    status: {
      type: String,
      enum: ["active", "inactive", "out_of_stock"],
      default: "active",
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Database indexes
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ createdAt: -1 });

// Product model
const Product = mongoose.model<IProduct>("Product", productSchema);

export default Product;
