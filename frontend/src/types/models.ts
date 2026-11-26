// Types mirror the backend Mongoose models and controller responses.
// Passwords and token versions are intentionally never modelled.

export type UserRole = "customer" | "admin";
export type AccountStatus = "active" | "blocked";

// Returned by /auth/* and /users/* endpoints
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
}

// Returned by /admin/users endpoints (raw documents, so `_id`)
export interface AdminUser {
  _id: string;
  fullName: string;
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export type CategoryStatus = "active" | "inactive";

export interface CategoryRef {
  _id: string;
  name: string;
  slug: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  slug: string;
  parentCategory?: CategoryRef | string | null;
  status: CategoryStatus;
  createdAt: string;
  updatedAt: string;
}

export type ProductStatus = "active" | "inactive" | "out_of_stock";

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: CategoryRef;
  images: string[];
  // Present on admin and raw responses; not needed by the storefront
  imagePublicIds?: string[];
  brand?: string;
  sku: string;
  stock: number;
  status: ProductStatus;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

// Product fields populated inside cart items
export interface CartProduct {
  _id: string;
  name: string;
  price: number;
  discountPrice?: number;
  images: string[];
  stock: number;
  status: ProductStatus;
}

export interface CartItem {
  // null when the product was deleted after being added
  product: CartProduct | null;
  quantity: number;
  priceAtAdd: number;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CartSummary {
  totalItems: number;
  subtotal: number;
}

export interface Wishlist {
  user: string;
  products: Product[];
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "cod" | "online";
export type PaymentProvider =
  | "sslcommerz"
  | "bkash"
  | "nagad"
  | "stripe"
  | "other";

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  district: string;
  postalCode?: string;
  country: string;
}

export interface OrderItem {
  product: string;
  name: string;
  image?: string;
  sku: string;
  quantity: number;
  price: number;
  subtotal: number;
}

// Populated on the admin orders list
export interface OrderUser {
  _id: string;
  fullName: string;
  email: string;
}

export interface Order {
  _id: string;
  user: string | OrderUser;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  paymentProvider?: PaymentProvider;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  transactionId?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewUser {
  _id: string;
  fullName: string;
}

export interface Review {
  _id: string;
  user: ReviewUser;
  product: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------- Admin dashboard ----------------

export interface DashboardOrderPreview {
  _id: string;
  user: OrderUser | null;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  shippingAddress: ShippingAddress;
  orderStatus?: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  createdAt: string;
}

export interface LowStockProduct {
  _id: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
  discountPrice?: number;
  category: CategoryRef | null;
  status: ProductStatus;
  updatedAt: string;
}

export interface SalesPoint {
  totalRevenue: number;
  totalOrders: number;
}

export interface Dashboard {
  users: {
    total: number;
    customers: number;
    admins: number;
    active: number;
    blocked: number;
  };
  products: {
    total: number;
    active: number;
    inactive: number;
    outOfStock: number;
  };
  orders: {
    total: number;
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    paid: number;
  };
  revenue: {
    total: number;
    paidOrders: number;
    averageOrderValue: number;
  };
  inventory: {
    totalStockUnits: number;
    lowStockThreshold: number;
    lowStockCount: number;
    lowStockProducts: LowStockProduct[];
    outOfStockProducts: number;
    estimatedRetailValue: number;
    valuationBasis: string;
  };
  sales: {
    timezone: string;
    revenueBasis: string;
    dateBasis: string;
    periods: { daily: string; weekly: string; monthly: string };
    daily: Array<SalesPoint & { date: string }>;
    weekly: Array<SalesPoint & { week: string }>;
    monthly: Array<SalesPoint & { month: string }>;
    byPaymentMethod: Array<SalesPoint & { paymentMethod: PaymentMethod }>;
  };
  recentOrders: DashboardOrderPreview[];
  pendingOrders: DashboardOrderPreview[];
  bestSellingProducts: Array<{
    productId: string;
    productName: string;
    totalSold: number;
    totalRevenue: number;
  }>;
}
