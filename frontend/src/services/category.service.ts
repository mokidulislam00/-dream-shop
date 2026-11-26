import { api, cleanParams } from "./api";
import type {
  CategoryDetailResponse,
  CategoryListResponse,
  CategoryResponse,
  MessageResponse,
} from "@/types/api";
import type { Category, CategoryStatus } from "@/types/models";

export interface CategoryListParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string;
  // Must be an http(s) URL; there is no category image upload endpoint
  image?: string;
  parentCategory?: string | null;
  status?: CategoryStatus;
}

export const categoryService = {
  async list(params: CategoryListParams = {}): Promise<CategoryListResponse> {
    const { data } = await api.get<CategoryListResponse>("/categories", {
      params: cleanParams(params),
    });
    return data;
  },

  async getById(id: string): Promise<Category> {
    const { data } = await api.get<CategoryDetailResponse>(
      `/categories/${id}`
    );
    return data.category;
  },

  async create(input: CategoryInput): Promise<Category> {
    const { data } = await api.post<CategoryResponse>("/categories", input);
    return data.category;
  },

  async update(id: string, input: Partial<CategoryInput>): Promise<Category> {
    const { data } = await api.patch<CategoryResponse>(
      `/categories/${id}`,
      input
    );
    return data.category;
  },

  async remove(id: string): Promise<string> {
    const { data } = await api.delete<MessageResponse>(`/categories/${id}`);
    return data.message;
  },
};
