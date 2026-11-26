import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { queryKeys } from "@/lib/queryKeys";
import { wishlistService } from "@/services/wishlist.service";
import { getErrorMessage } from "@/utils/errors";

export function useWishlist() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.wishlist,
    queryFn: () => wishlistService.get(),
    enabled: isAuthenticated,
  });
}

// Wishlist membership and a toggle that handles guests.
export function useWishlistToggle() {
  const queryClient = useQueryClient();
  const requireAuth = useRequireAuth();
  const { data } = useWishlist();

  const ids = useMemo(
    () => new Set((data?.products ?? []).map((product) => product._id)),
    [data]
  );

  const mutation = useMutation({
    mutationFn: ({ productId, add }: { productId: string; add: boolean }) =>
      add ? wishlistService.add(productId) : wishlistService.remove(productId),
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.wishlist });
      toast.success(
        variables.add ? "Saved to your wishlist" : "Removed from your wishlist"
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const toggle = (productId: string) => {
    if (!requireAuth("Sign in to save products to your wishlist")) {
      return;
    }

    mutation.mutate({ productId, add: !ids.has(productId) });
  };

  return {
    isWishlisted: (productId: string) => ids.has(productId),
    toggle,
    pendingProductId: mutation.isPending
      ? mutation.variables?.productId
      : undefined,
  };
}
