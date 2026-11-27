import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, ClipboardList } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Container } from "@/components/layout/Container";
import { orderItemCount } from "@/components/orders/OrderParts";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { buttonStyles } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useMyOrders } from "@/hooks/useOrders";
import { formatDate, formatPrice, orderCode } from "@/utils/format";

const PAGE_SIZE = 10;

export default function OrdersPage() {
  useDocumentTitle("My orders");

  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = Number(searchParams.get("page"));
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  const { data, isPending, isError, error, refetch, isFetching } = useMyOrders({
    page,
    limit: PAGE_SIZE,
  });

  return (
    <Container className="py-10">
      <h1 className="mb-8 text-3xl sm:text-4xl">My orders</h1>

      {isPending ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Your orders couldn't be loaded"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : data.orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No orders yet"
          description="Orders you place will appear here."
          action={
            <Link to="/products" className={buttonStyles("primary")}>
              Browse products
            </Link>
          }
        />
      ) : (
        <>
          <ul className={`space-y-4 ${isFetching ? "opacity-60" : ""}`}>
            {data.orders.map((order) => {
              const first = order.items[0];
              const more = order.items.length - 1;

              return (
                <li key={order._id}>
                  <Link
                    to={`/orders/${order._id}`}
                    className="flex items-center gap-4 rounded border border-line bg-surface p-4 hover:border-ink/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{orderCode(order._id)}</span>
                        <OrderStatusBadge status={order.orderStatus} />
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </div>
                      <p className="mt-1 truncate text-sm text-muted">
                        {first ? first.name : "Order"}
                        {more > 0 ? ` and ${more} more` : ""} ·{" "}
                        {orderItemCount(order)}{" "}
                        {orderItemCount(order) === 1 ? "item" : "items"}
                      </p>
                      <p className="mt-0.5 text-sm text-muted">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold">
                      {formatPrice(order.totalAmount)}
                    </p>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-8">
            <Pagination
              page={data.pagination.currentPage}
              totalPages={data.pagination.totalPages}
              onChange={(next) => {
                const params = new URLSearchParams(searchParams);
                params.set("page", String(next));
                setSearchParams(params);
              }}
            />
          </div>
        </>
      )}
    </Container>
  );
}
