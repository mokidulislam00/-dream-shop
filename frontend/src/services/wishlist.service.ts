import { api } from "./api";
import type { WishlistResponse } from "@/types/api";
import type { Wishlist } from "@/types/models";

export const wishlistService = {
  async get(): Promise<Wishlist> {
    const { data } = await api.get<WishlistResponse>("/wishlist");
    return data.wishlist;
  },

  async add(productId: string): Promise<Wishlist> {
    const { data } = await api.post<WishlistResponse>("/wishlist", {
      productId,
    });
    return data.wishlist;
  },

  async remove(productId: string): Promise<Wishlist> {
    const { data } = await api.delete<WishlistResponse>(
      `/wishlist/${productId}`
    );
    return data.wishlist;
  },
};
