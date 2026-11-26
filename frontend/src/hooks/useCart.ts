import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { queryKeys } from "@/lib/queryKeys";
import { cartService } from "@/services/cart.service";
import { getErrorMessage } from "@/utils/errors";

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
      await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      toast.success("Added to cart", {
        action: { label: "View cart", onClick: () => navigate("/cart") },
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
