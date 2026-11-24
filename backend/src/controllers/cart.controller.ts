
import { Request, Response, NextFunction } from "express";

import Cart from "../models/Cart";
import Product from "../models/Product";

// Authenticated user type
type AuthenticatedUser = {
  _id?: unknown;
};

// Populated cart item type
type PopulatedCartItem = {
  product: {
    price: number;
    discountPrice?: number | null;
    status?: string;
  } | null;
  quantity: number;
};

// Validate MongoDB ObjectId
const isValidObjectId = (value: unknown): value is string => {
  return (
    typeof value === "string" &&
    /^[0-9a-fA-F]{24}$/.test(value)
  );
};

// Validate cart quantity
const isValidQuantity = (value: unknown): value is number => {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 1
  );
};

// Get authenticated user ID
const getAuthenticatedUserId = (
  res: Response
): string | null => {
  const user = res.locals.user as
    | AuthenticatedUser
    | undefined;

  if (!user?._id) {
    return null;
  }

  const userId = String(user._id);

  return isValidObjectId(userId) ? userId : null;
};

// Check duplicate MongoDB key error
const isDuplicateKeyError = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
};

// Get existing cart or create a new one
// Handles concurrent cart creation for the same user
const getOrCreateCart = async (userId: string) => {
  let cart = await Cart.findOne({ user: userId });

  if (cart) {
    return cart;
  }

  try {
    cart = await Cart.create({
      user: userId,
      items: [],
    });

    return cart;
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    // Another request may have created the cart simultaneously
    const existingCart = await Cart.findOne({
      user: userId,
    });

    if (!existingCart) {
      throw error;
    }

    return existingCart;
  }
};

// Populate product information in cart
const populateCart = async (cart: Awaited<ReturnType<typeof getOrCreateCart>>) => {
  await cart.populate({
    path: "items.product",
    select: "name price discountPrice images stock status slug",
  });

  return cart;
};

// Get logged-in user's cart
export const getCart = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(res);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const cart = await getOrCreateCart(userId);

    await populateCart(cart);

    // Ignore deleted or inactive products in cart summary
    const items = cart.items as unknown as PopulatedCartItem[];

    const availableItems = items.filter(
      (item) =>
        item.product !== null &&
        item.product.status === "active"
    );

    const totalItems = availableItems.reduce(
      (total, item) => total + item.quantity,
      0
    );

    const subtotal = availableItems.reduce(
      (total, item) => {
        const product = item.product;

        if (!product) {
          return total;
        }

        const price =
          product.discountPrice ?? product.price;

        if (!Number.isFinite(price)) {
          return total;
        }

        return total + price * item.quantity;
      },
      0
    );

    res.status(200).json({
      success: true,
      cart,
      summary: {
        totalItems,
        subtotal,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add product to cart
export const addToCart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(res);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { productId, quantity } = req.body as {
      productId?: unknown;
      quantity?: unknown;
    };

    // Validate product ID
    if (!isValidObjectId(productId)) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    // Validate quantity
    if (!isValidQuantity(quantity)) {
      res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
      return;
    }

    const normalizedProductId = productId.toLowerCase();

    // Find active product
    const product = await Product.findOne({
      _id: normalizedProductId,
      status: "active",
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Active product not found",
      });
      return;
    }

    // Check available stock
    if (quantity > product.stock) {
      res.status(400).json({
        success: false,
        message: "Insufficient product stock",
      });
      return;
    }

    const cart = await getOrCreateCart(userId);

    // Find existing cart item
    const existingItem = cart.items.find(
      (item) =>
        String(item.product).toLowerCase() ===
        normalizedProductId
    );

    const newQuantity =
      (existingItem?.quantity ?? 0) + quantity;

    if (!Number.isSafeInteger(newQuantity)) {
      res.status(400).json({
        success: false,
        message: "Invalid requested quantity",
      });
      return;
    }

    // Prevent quantity from exceeding stock
    if (newQuantity > product.stock) {
      res.status(400).json({
        success: false,
        message: "Requested quantity exceeds available stock",
      });
      return;
    }

    // Always calculate price on the server
    const currentPrice =
      product.discountPrice ?? product.price;

    if (!Number.isFinite(currentPrice) || currentPrice < 0) {
      res.status(400).json({
        success: false,
        message: "Invalid product price",
      });
      return;
    }

    if (existingItem) {
      existingItem.quantity = newQuantity;
      existingItem.priceAtAdd = currentPrice;
    } else {
      cart.items.push({
        product: product._id,
        quantity,
        priceAtAdd: currentPrice,
      });
    }

    await cart.save();

    await populateCart(cart);

    res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      cart,
    });
  } catch (error) {
    next(error);
  }
};

// Update cart item quantity
export const updateCartItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(res);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const productId = req.params.id;

    const { quantity } = req.body as {
      quantity?: unknown;
    };

    // Validate product ID
    if (!isValidObjectId(productId)) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    // Validate quantity
    if (!isValidQuantity(quantity)) {
      res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
      return;
    }

    const normalizedProductId = productId.toLowerCase();

    // Only access the logged-in user's cart
    const cart = await Cart.findOne({
      user: userId,
    });

    if (!cart) {
      res.status(404).json({
        success: false,
        message: "Cart not found",
      });
      return;
    }

    const item = cart.items.find(
      (cartItem) =>
        String(cartItem.product).toLowerCase() ===
        normalizedProductId
    );

    if (!item) {
      res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
      return;
    }

    const product = await Product.findOne({
      _id: normalizedProductId,
      status: "active",
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Active product not found",
      });
      return;
    }

    // Validate available stock
    if (quantity > product.stock) {
      res.status(400).json({
        success: false,
        message: "Requested quantity exceeds available stock",
      });
      return;
    }

    const currentPrice =
      product.discountPrice ?? product.price;

    if (!Number.isFinite(currentPrice) || currentPrice < 0) {
      res.status(400).json({
        success: false,
        message: "Invalid product price",
      });
      return;
    }

    // Update quantity and server-side price
    item.quantity = quantity;
    item.priceAtAdd = currentPrice;

    await cart.save();

    await populateCart(cart);

    res.status(200).json({
      success: true,
      message: "Cart quantity updated successfully",
      cart,
    });
  } catch (error) {
    next(error);
  }
};

// Remove product from cart
export const removeFromCart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(res);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const productId = req.params.id;

    // Validate product ID
    if (!isValidObjectId(productId)) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const normalizedProductId = productId.toLowerCase();

    const cart = await Cart.findOne({
      user: userId,
    });

    if (!cart) {
      res.status(404).json({
        success: false,
        message: "Cart not found",
      });
      return;
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        String(item.product).toLowerCase() ===
        normalizedProductId
    );

    if (itemIndex === -1) {
      res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
      return;
    }

    cart.items.splice(itemIndex, 1);

    await cart.save();

    await populateCart(cart);

    res.status(200).json({
      success: true,
      message: "Product removed from cart successfully",
      cart,
    });
  } catch (error) {
    next(error);
  }
};

// Clear entire cart
export const clearCart = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(res);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const cart = await Cart.findOne({
      user: userId,
    });

    if (!cart) {
      res.status(404).json({
        success: false,
        message: "Cart not found",
      });
      return;
    }

    cart.items = [];

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    next(error);
  }
};
