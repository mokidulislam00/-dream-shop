import { api, cleanParams } from "./api";
import type {
  ProductDeleteResponse,
  ProductDetailResponse,
  ProductImageDeleteResponse,
  ProductImageUploadResponse,
  ProductListResponse,
  ProductResponse,
  ProductSort,
} from "@/types/api";
import type { Product, ProductStatus } from "@/types/models";

export interface ProductListParams {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  inStock?: boolean;
  page?: number;
  limit?: number;
  sort?: ProductSort;
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  // Required by the backend; real images are added through the upload endpoint
  images: string[];
  brand?: string;
  sku: string;
  stock: number;
  status?: ProductStatus;
  isFeatured?: boolean;
}

// `images` is deliberately excluded: images are managed through the
// dedicated upload and delete endpoints. `discountPrice: null` removes
// an existing discount.
export type UpdateProductInput = Partial<
  Omit<CreateProductInput, "images" | "discountPrice">
> & {
  discountPrice?: number | null;
};

export const productService = {
  async list(params: ProductListParams = {}): Promise<ProductListResponse> {
    const { data } = await api.get<ProductListResponse>("/products", {
      params: cleanParams(params),
    });
    return data;
  },

  async getById(id: string): Promise<Product> {
    const { data } = await api.get<ProductDetailResponse>(`/products/${id}`);
    return data.product;
  },

  async create(input: CreateProductInput): Promise<Product> {
    const { data } = await api.post<ProductResponse>("/products", input);
    return data.product;
  },

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    const { data } = await api.patch<ProductResponse>(
      `/products/${id}`,
      input
    );
    return data.product;
  },

  async remove(id: string): Promise<ProductDeleteResponse> {
    const { data } = await api.delete<ProductDeleteResponse>(
      `/products/${id}`
    );
    return data;
  },

  // Multipart field name must be "images" (max 5 files, 5 MB each).
  async uploadImages(
    id: string,
    files: File[]
  ): Promise<ProductImageUploadResponse> {
    const formData = new FormData();

    for (const file of files) {
      formData.append("images", file);
    }

    const { data } = await api.post<ProductImageUploadResponse>(
      `/products/${id}/images`,
      formData
    );
    return data;
  },

  async deleteImage(
    id: string,
    imageIndex: number
  ): Promise<ProductImageDeleteResponse> {
    const { data } = await api.delete<ProductImageDeleteResponse>(
      `/products/${id}/images/${imageIndex}`
    );
    return data;
  },
};
