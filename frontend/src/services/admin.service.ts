import { api, cleanParams } from "./api";
import type {
  AdminProductSort,
  AdminUserListResponse,
  AdminUserResponse,
  AdminUserStatusResponse,
  CategoryDetailResponse,
  CategoryListResponse,
  DashboardResponse,
  ProductDetailResponse,
  ProductListResponse,
} from "@/types/api";
import type {
  AccountStatus,
  AdminUser,
  Category,
  CategoryStatus,
  Product,
  ProductStatus,
  User,
  UserRole,
} from "@/types/models";

export interface AdminUserListParams {
  search?: string;
  role?: UserRole;
  accountStatus?: AccountStatus;
  page?: number;
  limit?: number;
}

export interface AdminProductListParams {
  search?: string;
  status?: ProductStatus;
  category?: string;
  featured?: boolean;
  lowStock?: boolean;
  sort?: AdminProductSort;
  page?: number;
  limit?: number;
}

export interface AdminCategoryListParams {
  search?: string;
  status?: CategoryStatus;
  page?: number;
  limit?: number;
}

export const adminService = {
  async dashboard(): Promise<DashboardResponse> {
    const { data } = await api.get<DashboardResponse>("/admin/dashboard");
    return data;
  },

  // ---- users ----
  async listUsers(
    params: AdminUserListParams = {}
  ): Promise<AdminUserListResponse> {
    const { data } = await api.get<AdminUserListResponse>("/admin/users", {
      params: cleanParams(params),
    });
    return data;
  },

  async getUser(userId: string): Promise<AdminUser> {
    const { data } = await api.get<AdminUserResponse>(
      `/admin/users/${userId}`
    );
    return data.user;
  },

  // Only customer accounts can be blocked or unblocked.
  async setUserStatus(
    userId: string,
    accountStatus: AccountStatus
  ): Promise<User> {
    const { data } = await api.patch<AdminUserStatusResponse>(
      `/admin/users/${userId}/status`,
      { accountStatus }
    );
    return data.user;
  },

  // ---- catalog (every status, unlike the public endpoints) ----
  async listProducts(
    params: AdminProductListParams = {}
  ): Promise<ProductListResponse> {
    const { data } = await api.get<ProductListResponse>("/admin/products", {
      params: cleanParams(params),
    });
    return data;
  },

  async getProduct(id: string): Promise<Product> {
    const { data } = await api.get<ProductDetailResponse>(
      `/admin/products/${id}`
    );
    return data.product;
  },

  async listCategories(
    params: AdminCategoryListParams = {}
  ): Promise<CategoryListResponse> {
    const { data } = await api.get<CategoryListResponse>(
      "/admin/categories",
      { params: cleanParams(params) }
    );
    return data;
  },

  async getCategory(id: string): Promise<Category> {
    const { data } = await api.get<CategoryDetailResponse>(
      `/admin/categories/${id}`
    );
    return data.category;
  },
};
