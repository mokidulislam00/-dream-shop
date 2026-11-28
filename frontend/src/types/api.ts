import type {
  AdminUser,
  Cart,
  CartSummary,
  Category,
  Dashboard,
  Order,
  Product,
  Review,
  User,
  Wishlist,
} from "./models";

// ---------------- Generic ----------------

export interface MessageResponse {
  success: boolean;
  message: string;
}

export interface PageMeta {
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

// ---------------- Auth / users ----------------

export interface UserResponse extends MessageResponse {
  user: User;
}

// ---------------- Products ----------------

export type ProductSort =
  | "newest"
  | "oldest"
  | "price_low"
  | "price_high"
  | "name_asc"
  | "name_desc";

export type AdminProductSort = ProductSort | "stock_low" | "stock_high";

export interface ProductListResponse {
  success: boolean;
  count: number;
  pagination: PageMeta & { totalProducts: number };
  products: Product[];
}

export interface ProductResponse extends MessageResponse {
  product: Product;
}

// Single-product GET responses carry no message
export interface ProductDetailResponse {
  success: boolean;
  product: Product;
}

export interface ProductImageUploadResponse extends ProductResponse {
  uploadedCount: number;
  images: Array<{ url: string; publicId: string }>;
}

export interface ProductImageDeleteResponse extends ProductResponse {
  cloudinaryDeleted: boolean;
}

export interface ProductDeleteResponse extends MessageResponse {
  imageCleanup: { attempted: number; deleted: number; failed: number };
}

// ---------------- Categories ----------------

export interface CategoryListResponse {
  success: boolean;
  count: number;
  pagination: PageMeta & { totalCategories: number };
  categories: Category[];
}

export interface CategoryResponse extends MessageResponse {
  category: Category;
}

export interface CategoryDetailResponse {
  success: boolean;
  category: Category;
}

// ---------------- Cart / wishlist ----------------

export interface CartResponse extends MessageResponse {
  cart: Cart;
  // Only returned by GET /cart
  summary?: CartSummary;
  // GET /cart removes items whose product was deleted and reports how many
  removedItems?: number;
}

export interface WishlistResponse extends MessageResponse {
  wishlist: Wishlist;
}

// ---------------- Orders ----------------

export interface OrderListResponse {
  success: boolean;
  count: number;
  pagination: PageMeta & { totalOrders: number };
  orders: Order[];
}

export interface OrderResponse extends MessageResponse {
  order: Order;
}

export interface OrderDetailResponse {
  success: boolean;
  order: Order;
}

// ---------------- Reviews ----------------

export interface ReviewListResponse {
  success: boolean;
  totalReviews: number;
  averageRating: number;
  pagination: PageMeta;
  reviews: Review[];
}

export interface ReviewResponse extends MessageResponse {
  review: Review;
}

// ---------------- Admin ----------------

export interface DashboardResponse extends MessageResponse {
  admin: { id: string; fullName: string; email: string; role: string };
  dashboard: Dashboard;
}

export interface AdminUserListResponse {
  success: boolean;
  count: number;
  pagination: PageMeta & { totalUsers: number };
  users: AdminUser[];
}

export interface AdminUserResponse {
  success: boolean;
  user: AdminUser;
}

export interface AdminUserStatusResponse extends MessageResponse {
  user: User;
}
