import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BadgeCheck, MessageSquareText } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Rating } from "@/components/products/Rating";
import { ReviewForm } from "@/components/products/ReviewForm";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useProductReviews } from "@/hooks/useCatalog";
import { useReviewMutations } from "@/hooks/useReviews";
import type { Review } from "@/types/models";
import { ApiError } from "@/utils/errors";
import { formatDate } from "@/utils/format";

const PAGE_SIZE = 5;

export function ReviewList({ productId }: { productId: string }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [writing, setWriting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Review | null>(null);

  const { data, isPending, isError, error, refetch } = useProductReviews(
    productId,
    { page, limit: PAGE_SIZE }
  );
  const { create, update, remove } = useReviewMutations(productId);

  return (
    <section aria-labelledby="reviews-heading" className="border-t border-line pt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="reviews-heading" className="text-2xl">
          Customer reviews
        </h2>
        {isAuthenticated && !writing ? (
          <Button variant="secondary" onClick={() => setWriting(true)}>
            Write a review
          </Button>
        ) : null}
      </div>

      {!isAuthenticated ? (
        <p className="mt-3 text-sm text-muted">
          <Link
            to="/login"
            state={{ from: location.pathname }}
            className="font-medium text-accent hover:underline"
          >
            Sign in
          </Link>{" "}
          to write a review.
        </p>
      ) : null}

      {writing ? (
        <div className="mt-6 max-w-xl rounded border border-line bg-surface p-5">
          <ReviewForm
            submitLabel="Post review"
            onCancel={() => setWriting(false)}
            onSubmit={async (values) => {
              try {
                await create.mutateAsync(values);
                setWriting(false);
                setPage(1);
              } catch (submitError) {
                if (submitError instanceof ApiError && submitError.status === 409) {
                  throw new Error(
                    "You have already reviewed this product. You can edit your review from the list below."
                  );
                }

                throw submitError;
              }
            }}
          />
        </div>
      ) : null}

      {isPending ? (
        <div className="mt-6 space-y-6">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index}>
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-3 h-4 w-full max-w-lg" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Reviews couldn't be loaded"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : data.totalReviews === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title="No reviews yet"
          description="Be the first to review this product."
        />
      ) : (
        <>
          <div className="mt-4 flex items-center gap-3">
            <Rating value={data.averageRating} />
            <p className="text-sm text-muted">
              {data.averageRating.toFixed(1)} average from {data.totalReviews}{" "}
              {data.totalReviews === 1 ? "review" : "reviews"}
            </p>
          </div>

          <ul className="mt-6 divide-y divide-line">
            {data.reviews.map((review) => {
              const mine = Boolean(user) && review.user?._id === user?.id;

              return (
                <li key={review._id} className="py-5">
                  {editingId === review._id ? (
                    <div className="max-w-xl rounded border border-line bg-surface p-5">
                      <ReviewForm
                        defaultValues={{
                          rating: review.rating,
                          comment: review.comment,
                        }}
                        submitLabel="Save changes"
                        onCancel={() => setEditingId(null)}
                        onSubmit={async (values) => {
                          await update.mutateAsync({
                            reviewId: review._id,
                            input: values,
                          });
                          setEditingId(null);
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Rating value={review.rating} />
                        <span className="text-sm font-medium">
                          {review.user?.fullName ?? "Customer"}
                          {mine ? " (you)" : ""}
                        </span>
                        {review.isVerifiedPurchase ? (
                          <span className="inline-flex items-center gap-1 text-xs text-moss">
                            <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                            Verified purchase
                          </span>
                        ) : null}
                        <time className="text-xs text-muted" dateTime={review.createdAt}>
                          {formatDate(review.createdAt)}
                        </time>
                      </div>
                      <p className="mt-2 max-w-2xl whitespace-pre-line text-ink/90">
                        {review.comment}
                      </p>
                      {mine ? (
                        <div className="mt-3 flex gap-4 text-sm">
                          <button
                            type="button"
                            className="font-medium text-accent hover:underline"
                            onClick={() => setEditingId(review._id)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="font-medium text-danger hover:underline"
                            onClick={() => setDeleting(review)}
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="mt-6">
            <Pagination
              page={data.pagination.currentPage}
              totalPages={data.pagination.totalPages}
              onChange={setPage}
            />
          </div>
        </>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete your review?"
        description="This can't be undone."
        confirmLabel="Delete review"
        loading={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            remove.mutate(deleting._id, {
              onSuccess: () => setDeleting(null),
            });
          }
        }}
      />
    </section>
  );
}
