import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { queryKeys } from "@/lib/queryKeys";
import {
  reviewService,
  type UpdateReviewInput,
} from "@/services/review.service";

// Create, edit and delete reviews for one product. Every change refreshes
// that product's review list.
export function useReviewMutations(productId: string) {
  const queryClient = useQueryClient();

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.reviews.product(productId),
    });

  const create = useMutation({
    mutationFn: (input: { rating: number; comment: string }) =>
      reviewService.create({ productId, ...input }),
    onSuccess: async () => {
      await refresh();
      toast.success("Thanks, your review has been posted");
    },
  });

  const update = useMutation({
    mutationFn: ({
      reviewId,
      input,
    }: {
      reviewId: string;
      input: UpdateReviewInput;
    }) => reviewService.update(reviewId, input),
    onSuccess: async () => {
      await refresh();
      toast.success("Your review has been updated");
    },
  });

  const remove = useMutation({
    mutationFn: (reviewId: string) => reviewService.remove(reviewId),
    onSuccess: async () => {
      await refresh();
      toast.success("Your review has been deleted");
    },
  });

  return { create, update, remove };
}
