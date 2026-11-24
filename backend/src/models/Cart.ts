
import mongoose, { Document, Schema, Types } from "mongoose";

// Cart item interface
export interface ICartItem {
  product: Types.ObjectId;
  quantity: number;
  priceAtAdd: number;
}

// Cart interface
export interface ICart extends Document {
  user: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Cart item schema
const cartItemSchema = new Schema<ICartItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
    },

    quantity: {
      type: Number,
      required: [true, "Product quantity is required"],
      min: [1, "Quantity must be at least 1"],
      default: 1,
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number",
      },
    },

    priceAtAdd: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Product price cannot be negative"],
    },
  },
  {
    _id: false,
  }
);

// Cart schema
const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },

    items: {
  type: [cartItemSchema],
  default: [],
  validate: {
    validator: (items: ICartItem[]) => {
      const productIds = items.map((item) => item.product.toString());
      return new Set(productIds).size === productIds.length;
    },
    message: "A product cannot appear more than once in the cart",
  },
},
  },
  {
    timestamps: true,
  }
);

// Each user can have only one cart
cartSchema.index({ user: 1 }, { unique: true });

// Index for product lookup inside cart items
cartSchema.index({ "items.product": 1 });

// Cart model
const Cart = mongoose.model<ICart>("Cart", cartSchema);

export default Cart;
