import { api, cleanParams } from "./api";
import type {
  MessageResponse,
  ReviewListResponse,
  ReviewResponse,
} from "@/types/api";
import type { Review } from "@/types/models";

export interface ReviewListParams {
  page?: number;
  limit?: number;
}

export interface CreateReviewInput {
  productId: string;
  rating: number;
  comment: string;
}

export interface UpdateReviewInput {
  rating?: number;
  comment?: string;
}

export const reviewService = {
  async listForProduct(
    productId: string,
    params: ReviewListParams = {}
  ): Promise<ReviewListResponse> {
    const { data } = await api.get<ReviewListResponse>(
      `/reviews/product/${productId}`,
      { params: cleanParams(params) }
    );
    return data;
  },

  async create(input: CreateReviewInput): Promise<Review> {
    const { data } = await api.post<ReviewResponse>("/reviews", input);
    return data.review;
  },

  async update(reviewId: string, input: UpdateReviewInput): Promise<Review> {
    const { data } = await api.patch<ReviewResponse>(
      `/reviews/${reviewId}`,
      input
    );
    return data.review;
  },

  async remove(reviewId: string): Promise<string> {
    const { data } = await api.delete<MessageResponse>(
      `/reviews/${reviewId}`
    );
    return data.message;
  },
};
