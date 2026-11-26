import { useState } from "react";
import { BadgeCheck, MessageSquareText } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Rating } from "@/components/products/Rating";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { useProductReviews } from "@/hooks/useCatalog";
import { formatDate } from "@/utils/format";

const PAGE_SIZE = 5;

export function ReviewList({ productId }: { productId: string }) {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch } = useProductReviews(
    productId,
    { page, limit: PAGE_SIZE }
  );

  return (
    <section aria-labelledby="reviews-heading" className="border-t border-line pt-10">
      <h2 id="reviews-heading" className="text-2xl">
        Customer reviews
      </h2>

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
          description="This product hasn't been reviewed."
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
            {data.reviews.map((review) => (
              <li key={review._id} className="py-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Rating value={review.rating} />
                  <span className="text-sm font-medium">
                    {review.user?.fullName ?? "Customer"}
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
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <Pagination
              page={page}
              totalPages={data.pagination.totalPages}
              onChange={setPage}
            />
          </div>
        </>
      )}
    </section>
  );
}
