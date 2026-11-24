
import mongoose, { Document, Schema, Types } from "mongoose";

// Order item interface
export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  image?: string;
  sku: string;
  quantity: number;
  price: number;
  subtotal: number;
}

// Shipping address interface
export interface IShippingAddress {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  district: string;
  postalCode?: string;
  country: string;
}

// Order interface
export interface IOrder extends Document {
  user: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;

  paymentMethod: "cod" | "online";

  paymentProvider?:
    | "sslcommerz"
    | "bkash"
    | "nagad"
    | "stripe"
    | "other";

  paymentStatus:
    | "pending"
    | "paid"
    | "failed"
    | "refunded";

  orderStatus:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";

  subtotal: number;
  shippingCost: number;
  totalAmount: number;

  transactionId?: string;
  cancellationReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

// Order item schema
const orderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
    },

    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },

    image: {
      type: String,
    },

    sku: {
      type: String,
      required: [true, "Product SKU is required"],
      trim: true,
    },

    quantity: {
      type: Number,
      required: [true, "Product quantity is required"],
      min: [1, "Quantity must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number",
      },
    },

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Product price cannot be negative"],
      validate: {
        validator: Number.isFinite,
        message: "Product price must be a valid number",
      },
    },

    subtotal: {
      type: Number,
      required: [true, "Product subtotal is required"],
      min: [0, "Product subtotal cannot be negative"],
      validate: {
        validator: Number.isFinite,
        message: "Product subtotal must be a valid number",
      },
    },
  },
  {
    _id: false,
  }
);

// Shipping address schema
const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      minlength: 8,
      maxlength: 20,
    },

    addressLine: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      minlength: 5,
      maxlength: 250,
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    district: {
      type: String,
      required: [true, "District is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    postalCode: {
      type: String,
      trim: true,
      maxlength: 15,
    },

    country: {
      type: String,
      required: true,
      default: "Bangladesh",
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
  },
  {
    _id: false,
  }
);

// Main order schema
const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]) => items.length > 0,
        message: "An order must contain at least one item",
      },
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, "Shipping address is required"],
    },

    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
      required: true,
    },

    paymentProvider: {
      type: String,
      enum: ["sslcommerz", "bkash", "nagad", "stripe", "other"],
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },

    subtotal: {
      type: Number,
      required: true,
      min: [0, "Subtotal cannot be negative"],
      validate: {
        validator: Number.isFinite,
        message: "Subtotal must be a valid number",
      },
    },

    shippingCost: {
      type: Number,
      required: true,
      min: [0, "Shipping cost cannot be negative"],
      default: 0,
      validate: {
        validator: Number.isFinite,
        message: "Shipping cost must be a valid number",
      },
    },

    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
      validate: {
        validator: Number.isFinite,
        message: "Total amount must be a valid number",
      },
    },

    transactionId: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    // Cancellation reason
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [
        500,
        "Cancellation reason cannot exceed 500 characters",
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Database indexes
orderSchema.index({
  user: 1,
  createdAt: -1,
});

orderSchema.index({
  orderStatus: 1,
});

orderSchema.index({
  paymentStatus: 1,
});

// Create Order model
const Order = mongoose.model<IOrder>(
  "Order",
  orderSchema
);

export default Order;
