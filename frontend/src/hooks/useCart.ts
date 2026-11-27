import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { queryKeys } from "@/lib/queryKeys";
import { cartService } from "@/services/cart.service";
import { getErrorMessage } from "@/utils/errors";

const refreshCart = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({ queryKey: queryKeys.cart });

export function useCart() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.cart,
    queryFn: () => cartService.get(),
    enabled: isAuthenticated,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => cartService.add(productId, quantity),
    onSuccess: async () => {
      await refreshCart(queryClient);
      toast.success("Added to cart", {
        action: { label: "View cart", onClick: () => navigate("/cart") },
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useSetCartQuantity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => cartService.setQuantity(productId, quantity),
    onSuccess: () => refreshCart(queryClient),
    onError: (error) => {
      toast.error(getErrorMessage(error));
      void refreshCart(queryClient);
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => cartService.remove(productId),
    onSuccess: async () => {
      await refreshCart(queryClient);
      toast.success("Removed from your cart");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cartService.clear(),
    onSuccess: async () => {
      await refreshCart(queryClient);
      toast.success("Your cart is empty");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
