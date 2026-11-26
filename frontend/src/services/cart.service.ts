import { api } from "./api";
import type { CartResponse } from "@/types/api";

// Note: in the backend, the `:id` in cart routes is the PRODUCT id.
export const cartService = {
  async get(): Promise<CartResponse> {
    const { data } = await api.get<CartResponse>("/cart");
    return data;
  },

  async add(productId: string, quantity = 1): Promise<CartResponse> {
    const { data } = await api.post<CartResponse>("/cart", {
      productId,
      quantity,
    });
    return data;
  },

  // `quantity` is the final quantity, not an increment.
  async setQuantity(
    productId: string,
    quantity: number
  ): Promise<CartResponse> {
    const { data } = await api.patch<CartResponse>(`/cart/${productId}`, {
      quantity,
    });
    return data;
  },

  async remove(productId: string): Promise<CartResponse> {
    const { data } = await api.delete<CartResponse>(`/cart/${productId}`);
    return data;
  },

  async clear(): Promise<CartResponse> {
    const { data } = await api.delete<CartResponse>("/cart");
    return data;
  },
};
